# 预约系统表结构直接修改方案

## 方案：直接修改appointments表 + 创建appointment_resources关联表

### 1. 数据库表修改

```sql
-- 1. 创建预约资源关联表
CREATE TABLE IF NOT EXISTS `appointment_resources` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `appointment_id` bigint NOT NULL COMMENT '预约ID',
  `resource_id` bigint NOT NULL COMMENT '资源ID',
  `resource_type` enum('STAFF','ROOM') NOT NULL COMMENT '资源类型',
  `is_primary` tinyint(1) DEFAULT 0 COMMENT '是否主要资源',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_appointment_resource` (`appointment_id`, `resource_id`),
  KEY `idx_appointment_id` (`appointment_id`),
  KEY `idx_resource_id` (`resource_id`),
  KEY `idx_resource_type` (`resource_type`),
  CONSTRAINT `appointment_resources_ibfk_1` FOREIGN KEY (`appointment_id`) REFERENCES `appointments` (`id`) ON DELETE CASCADE,
  CONSTRAINT `appointment_resources_ibfk_2` FOREIGN KEY (`resource_id`) REFERENCES `resource` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='预约资源关联表';

-- 2. 迁移现有数据到新表
INSERT INTO appointment_resources (appointment_id, resource_id, resource_type, is_primary)
SELECT id, resource_id, resource_type, 1
FROM appointments
WHERE resource_id IS NOT NULL;

-- 3. 修改appointments表，移除resource相关字段（可选，建议保留作为冗余）
-- 如果要彻底清理：
-- ALTER TABLE appointments 
-- DROP FOREIGN KEY appointments_ibfk_2,
-- DROP COLUMN resource_id,
-- DROP COLUMN resource_type;

-- 建议：保留这两个字段作为主要资源的快速访问，但改为可空
ALTER TABLE appointments 
MODIFY COLUMN `resource_id` bigint DEFAULT NULL COMMENT '主要资源ID（冗余字段，用于快速查询）',
MODIFY COLUMN `resource_type` enum('STAFF','ROOM') DEFAULT NULL COMMENT '主要资源类型（冗余字段）';
```

### 2. 后端代码修改

#### 2.1 创建新的Entity

```java
// AppointmentResource.java
package com.merchant.server.businessservice.entity;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class AppointmentResource {
    private Long id;
    private Long appointmentId;
    private Long resourceId;
    private ResourceType resourceType;
    private Boolean isPrimary;
    private LocalDateTime createdAt;
    
    // 关联对象
    private Resource resource;
    private Staff staff;  // 当resourceType=STAFF时
    private Room room;    // 当resourceType=ROOM时
    
    public enum ResourceType {
        STAFF, ROOM
    }
}
```

#### 2.2 修改Appointment实体

```java
// Appointment.java
@Data
public class Appointment {
    // ... 现有字段保持不变
    
    private Long resourceId;  // 保留，存储主要资源
    private ResourceType resourceType;  // 保留，存储主要资源类型
    
    // 新增：所有关联的资源
    private List<AppointmentResource> appointmentResources;
    
    // 便捷方法：获取员工资源
    public AppointmentResource getStaffResource() {
        if (appointmentResources == null) return null;
        return appointmentResources.stream()
            .filter(r -> r.getResourceType() == ResourceType.STAFF)
            .findFirst()
            .orElse(null);
    }
    
    // 便捷方法：获取房间资源
    public AppointmentResource getRoomResource() {
        if (appointmentResources == null) return null;
        return appointmentResources.stream()
            .filter(r -> r.getResourceType() == ResourceType.ROOM)
            .findFirst()
            .orElse(null);
    }
}
```

#### 2.3 创建Mapper

```java
// AppointmentResourceMapper.java
package com.merchant.server.businessservice.mapper;

import com.merchant.server.businessservice.entity.AppointmentResource;
import org.apache.ibatis.annotations.*;
import java.util.List;

@Mapper
public interface AppointmentResourceMapper {
    
    @Insert("INSERT INTO appointment_resources (appointment_id, resource_id, resource_type, is_primary) " +
            "VALUES (#{appointmentId}, #{resourceId}, #{resourceType}, #{isPrimary})")
    @Options(useGeneratedKeys = true, keyProperty = "id")
    int insert(AppointmentResource resource);
    
    @Insert({
        "<script>",
        "INSERT INTO appointment_resources (appointment_id, resource_id, resource_type, is_primary) VALUES ",
        "<foreach collection='list' item='item' separator=','>",
        "(#{item.appointmentId}, #{item.resourceId}, #{item.resourceType}, #{item.isPrimary})",
        "</foreach>",
        "</script>"
    })
    int batchInsert(@Param("list") List<AppointmentResource> resources);
    
    @Select("SELECT ar.*, r.name as resource_name, r.type as actual_type " +
            "FROM appointment_resources ar " +
            "LEFT JOIN resource r ON ar.resource_id = r.id " +
            "WHERE ar.appointment_id = #{appointmentId}")
    @Results({
        @Result(property = "resource.name", column = "resource_name"),
        @Result(property = "resource.type", column = "actual_type")
    })
    List<AppointmentResource> selectByAppointmentId(@Param("appointmentId") Long appointmentId);
    
    @Delete("DELETE FROM appointment_resources WHERE appointment_id = #{appointmentId}")
    int deleteByAppointmentId(@Param("appointmentId") Long appointmentId);
    
    @Update("UPDATE appointment_resources SET is_primary = #{isPrimary} " +
            "WHERE appointment_id = #{appointmentId} AND resource_id = #{resourceId}")
    int updatePrimary(@Param("appointmentId") Long appointmentId, 
                     @Param("resourceId") Long resourceId, 
                     @Param("isPrimary") Boolean isPrimary);
}
```

#### 2.4 修改Service层

```java
// AppointmentServiceImpl.java
@Service
@Transactional
public class AppointmentServiceImpl implements AppointmentService {
    
    @Autowired
    private AppointmentResourceMapper appointmentResourceMapper;
    
    @Override
    public Appointment createAppointmentWithServices(AppointmentCreateDTO dto) {
        // 1. 创建预约主记录
        Appointment appointment = new Appointment();
        appointment.setTenantId(dto.getTenantId());
        appointment.setCustomerId(dto.getCustomerId());
        appointment.setAppointmentDate(dto.getAppointmentDate());
        appointment.setAppointmentTime(dto.getAppointmentTime());
        appointment.setDuration(dto.getDuration());
        appointment.setTotalAmount(dto.getTotalAmount());
        appointment.setStatus(dto.getStatus() != null ? dto.getStatus() : AppointmentStatus.CONFIRMED);
        appointment.setNotes(dto.getNotes());
        
        // 设置主要资源（用于快速查询，优先选择员工）
        if (dto.getSelectedResources() != null && !dto.getSelectedResources().isEmpty()) {
            SelectedResourceDTO primaryResource = dto.getSelectedResources().stream()
                .filter(r -> "STAFF".equals(r.getType()))
                .findFirst()
                .orElse(dto.getSelectedResources().get(0));
            
            appointment.setResourceId(primaryResource.getId());
            appointment.setResourceType(ResourceType.valueOf(primaryResource.getType()));
        }
        
        appointmentMapper.insert(appointment);
        
        // 2. 创建资源关联记录
        if (dto.getSelectedResources() != null && !dto.getSelectedResources().isEmpty()) {
            List<AppointmentResource> resources = new ArrayList<>();
            
            for (int i = 0; i < dto.getSelectedResources().size(); i++) {
                SelectedResourceDTO resourceDto = dto.getSelectedResources().get(i);
                AppointmentResource ar = new AppointmentResource();
                ar.setAppointmentId(appointment.getId());
                ar.setResourceId(resourceDto.getId());
                ar.setResourceType(ResourceType.valueOf(resourceDto.getType()));
                ar.setIsPrimary(i == 0 || "STAFF".equals(resourceDto.getType())); // 员工优先作为主要资源
                resources.add(ar);
                
                // 3. 创建资源占用时段
                ResourceBookingSlot slot = new ResourceBookingSlot();
                slot.setResourceId(resourceDto.getId());
                slot.setAppointmentId(appointment.getId());
                slot.setBookingDate(dto.getAppointmentDate());
                slot.setStartTime(dto.getAppointmentTime());
                slot.setEndTime(calculateEndTime(dto.getAppointmentTime(), dto.getDuration()));
                slot.setStatus("BOOKED");
                resourceBookingSlotMapper.insert(slot);
            }
            
            // 批量插入资源关联
            appointmentResourceMapper.batchInsert(resources);
        }
        
        // 4. 创建服务明细
        if (dto.getServices() != null && !dto.getServices().isEmpty()) {
            for (AppointmentServiceDTO serviceDTO : dto.getServices()) {
                AppointmentService service = new AppointmentService();
                service.setAppointmentId(appointment.getId());
                service.setServiceId(serviceDTO.getServiceId());
                service.setServiceName(serviceDTO.getServiceName());
                service.setPrice(serviceDTO.getPrice());
                service.setDuration(serviceDTO.getDuration());
                appointmentServiceMapper.insert(service);
            }
        }
        
        return appointment;
    }
    
    @Override
    public List<Appointment> getAllAppointmentsByTenantId(Long tenantId) {
        List<Appointment> appointments = appointmentMapper.selectByTenantId(tenantId);
        
        // 批量加载资源信息
        for (Appointment appointment : appointments) {
            List<AppointmentResource> resources = appointmentResourceMapper.selectByAppointmentId(appointment.getId());
            appointment.setAppointmentResources(resources);
        }
        
        return appointments;
    }
    
    @Override
    public Appointment getAppointmentById(Long id) {
        Appointment appointment = appointmentMapper.selectById(id);
        if (appointment != null) {
            // 加载所有关联资源
            List<AppointmentResource> resources = appointmentResourceMapper.selectByAppointmentId(id);
            appointment.setAppointmentResources(resources);
            
            // 加载服务明细
            List<AppointmentService> services = appointmentServiceMapper.selectByAppointmentId(id);
            appointment.setAppointmentServices(services);
        }
        return appointment;
    }
}
```

### 3. 前端修改

#### 3.1 修改预约列表展示

```typescript
// AppointmentList.tsx
const AppointmentList = () => {
  const renderResources = (appointment: Appointment) => {
    const resources = appointment.appointmentResources || [];
    const staff = resources.find(r => r.resourceType === 'STAFF');
    const room = resources.find(r => r.resourceType === 'ROOM');
    
    return (
      <Box display="flex" gap={1}>
        {staff && (
          <Chip
            icon={<PersonIcon />}
            label={staff.resource?.name || 'Unknown Staff'}
            size="small"
            color="primary"
            variant="outlined"
          />
        )}
        {room && (
          <Chip
            icon={<RoomIcon />}
            label={room.resource?.name || 'Unknown Room'}
            size="small"
            color="secondary"
            variant="outlined"
          />
        )}
      </Box>
    );
  };
  
  return (
    <TableContainer>
      <Table>
        <TableBody>
          {appointments.map(appointment => (
            <TableRow key={appointment.id}>
              <TableCell>{appointment.customerName}</TableCell>
              <TableCell>{appointment.serviceName}</TableCell>
              <TableCell>{renderResources(appointment)}</TableCell>
              <TableCell>{appointment.appointmentDate} {appointment.appointmentTime}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};
```

#### 3.2 修改创建预约的表单

```typescript
// CreateAppointment.tsx
const CreateAppointment = () => {
  const [selectedResources, setSelectedResources] = useState<SelectedResource[]>([]);
  
  const handleSubmit = async () => {
    const appointmentData = {
      tenantId,
      customerId,
      selectedResources: selectedResources.map(r => ({
        id: r.id,
        type: r.type
      })),
      appointmentDate,
      appointmentTime,
      duration,
      services,
      // ... 其他字段
    };
    
    await createAppointment(appointmentData);
  };
  
  return (
    <Form>
      {/* 资源选择 - 支持多选 */}
      <FormControl fullWidth>
        <InputLabel>选择员工</InputLabel>
        <Select
          value={selectedResources.filter(r => r.type === 'STAFF')[0]?.id || ''}
          onChange={(e) => {
            const staffId = e.target.value;
            setSelectedResources(prev => [
              ...prev.filter(r => r.type !== 'STAFF'),
              { id: staffId, type: 'STAFF' }
            ]);
          }}
        >
          {staffList.map(staff => (
            <MenuItem key={staff.id} value={staff.id}>
              {staff.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      
      <FormControl fullWidth>
        <InputLabel>选择房间（可选）</InputLabel>
        <Select
          value={selectedResources.filter(r => r.type === 'ROOM')[0]?.id || ''}
          onChange={(e) => {
            const roomId = e.target.value;
            if (roomId) {
              setSelectedResources(prev => [
                ...prev.filter(r => r.type !== 'ROOM'),
                { id: roomId, type: 'ROOM' }
              ]);
            } else {
              setSelectedResources(prev => prev.filter(r => r.type !== 'ROOM'));
            }
          }}
        >
          <MenuItem value="">无</MenuItem>
          {roomList.map(room => (
            <MenuItem key={room.id} value={room.id}>
              {room.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Form>
  );
};
```

### 4. 数据迁移脚本（如果有历史数据）

```sql
-- 备份数据
CREATE TABLE appointments_backup AS SELECT * FROM appointments;

-- 迁移数据到新结构
INSERT INTO appointment_resources (appointment_id, resource_id, resource_type, is_primary)
SELECT 
    id as appointment_id,
    resource_id,
    resource_type,
    1 as is_primary
FROM appointments
WHERE resource_id IS NOT NULL
AND NOT EXISTS (
    SELECT 1 FROM appointment_resources ar 
    WHERE ar.appointment_id = appointments.id 
    AND ar.resource_id = appointments.resource_id
);
```

### 5. 实施步骤

1. **第一步**：创建新表`appointment_resources`
2. **第二步**：添加后端Entity和Mapper
3. **第三步**：修改Service层逻辑，同时写入新旧表
4. **第四步**：迁移历史数据
5. **第五步**：更新前端展示
6. **第六步**：测试所有场景
7. **第七步**：（可选）清理旧字段

### 6. 优势

1. **清晰的数据结构**：一个预约可以关联多个资源
2. **灵活扩展**：未来可以轻松添加新的资源类型
3. **查询效率**：保留主要资源字段用于快速查询
4. **向后兼容**：旧代码仍然可以工作