import { Resource } from '../../services/api';

// 员工资源接口 - 扩展API Resource类型
export interface StaffResource extends Omit<Resource, 'type' | 'status' | 'capacity'> {
    type: 'STAFF';
    status: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE' | 'VACATION' | 'DELETED';
    // 员工特有属性
    phone?: string;
    email?: string;
    position?: string;
    skills?: string;
    startDate?: string;
    // 前端扩展字段
    skillsArray?: string[];
}

// 房间资源接口 - 扩展API Resource类型
export interface RoomResource extends Omit<Resource, 'type'> {
    type: 'ROOM';
    capacity: number;
    // 前端扩展字段
    equipmentArray?: string[];
}

// 类型转换工具函数
export const convertToStaffResource = (resource: Resource): StaffResource => {
    const { capacity, specialties, ...resourceWithoutCapacity } = resource;
    return {
        ...resourceWithoutCapacity,
        type: 'STAFF' as const,
        status: resource.status as StaffResource['status'],
        // 将specialties映射到skills字段
        skills: specialties,
        // 确保员工特有字段正确映射
        phone: resource.phone,
        email: resource.email,
        position: resource.position,
        startDate: resource.startDate
    };
};

export const convertToRoomResource = (resource: Resource): RoomResource => ({
    ...resource,
    type: 'ROOM' as const,
    capacity: resource.capacity || 1
});

// 转换为API Resource类型的工具函数
export const convertStaffToResource = (staff: Partial<StaffResource>): Partial<Resource> => {
    const { skillsArray, skills, ...resourceData } = staff;
    return {
        ...resourceData,
        type: 'STAFF' as const,
        // 将skills映射到specialties字段
        specialties: skills,
        // 确保员工特有字段正确传递
        phone: staff.phone,
        email: staff.email,
        position: staff.position,
        startDate: staff.startDate,
        // 确保status符合API期望的类型
        status: staff.status as Resource['status']
    };
};

export const convertRoomToResource = (room: Partial<RoomResource>): Partial<Resource> => {
    const { equipmentArray, ...resourceData } = room;
    return {
        ...resourceData,
        type: 'ROOM' as const
    };
};