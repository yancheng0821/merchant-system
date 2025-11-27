import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Typography,
  Chip,
  CircularProgress,
  Alert,
  Button,
  Divider,
  Checkbox,
  FormControlLabel,
  Snackbar,
  Collapse,
  IconButton,
  alpha,
} from '@mui/material';
import {
  ExpandMore,
  ChevronRight,
  Save as SaveIcon,
  Security as SecurityIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { roleApi, permissionApi, Permission, Role } from '../../services/permissionApi';
import { useAuth } from '../../contexts/AuthContext';
import { PERMISSION_MODULE_STRUCTURE } from '../../config/permissionModules';
import { useTheme } from '../../contexts/ThemeContext';

interface PermissionSubModuleGroup {
  subModuleName: string;
  subModuleDisplayName: string;
  permissions: Permission[];
}

interface PermissionModuleGroup {
  moduleName: string;
  moduleDisplayName: string;
  subModules?: PermissionSubModuleGroup[];
  permissions?: Permission[];
}

const RolePermissionManagement: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { themeMode } = useTheme();

  // 根据主题模式动态设置主题色
  const isMonochrome = themeMode === 'monochrome';
  const THEME_COLOR = isMonochrome ? '#1a1a1a' : '#6366F1';
  const THEME_COLOR_DARK = isMonochrome ? '#333' : '#4F46E5';
  const THEME_COLOR_LIGHT = isMonochrome ? '#f5f5f5' : '#EEF2FF';
  const THEME_BORDER_COLOR = isMonochrome ? '#e0e0e0' : '#C7D2FE';
  const SECONDARY_COLOR = isMonochrome ? '#1a1a1a' : '#8B5CF6';

  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    loadRoles();
    loadPermissions();
  }, []);

  // 初始化所有模块为折叠状态
  useEffect(() => {
    if (permissions.length > 0) {
      const initialExpanded: Record<string, boolean> = {};
      PERMISSION_MODULE_STRUCTURE.forEach(module => {
        initialExpanded[module.name] = false;
        if (module.subModules) {
          module.subModules.forEach(subModule => {
            initialExpanded[`${module.name}.${subModule.name}`] = false;
          });
        }
      });
      setExpandedModules(initialExpanded);
    }
  }, [permissions]);

  useEffect(() => {
    if (selectedRole) {
      loadRolePermissions(selectedRole.id);
    }
  }, [selectedRole]);

  const loadRoles = async () => {
    try {
      const response = await roleApi.getAllRoles(user?.tenantId);
      if (response.success && response.data) {
        const rolesData = Array.isArray(response.data) ? response.data : [];
        setRoles(rolesData);
        if (rolesData.length > 0 && !selectedRole) {
          setSelectedRole(rolesData[0]);
        }
      } else {
        setRoles([]);
      }
    } catch (err: any) {
      showSnackbar(err.message || t('rbac.loadError'), 'error');
      setRoles([]);
    }
  };

  const loadPermissions = async () => {
    try {
      setLoading(true);
      const response = await permissionApi.getAllPermissions();
      if (response.success && response.data) {
        const permissionsData = Array.isArray(response.data) ? response.data : [];
        setPermissions(permissionsData);
      } else {
        setPermissions([]);
      }
    } catch (err: any) {
      showSnackbar(err.message || t('rbac.loadError'), 'error');
      setPermissions([]);
    } finally {
      setLoading(false);
    }
  };

  const loadRolePermissions = async (roleId: number) => {
    try {
      const response = await roleApi.getRolePermissionIds(roleId);
      if (response.success && response.data) {
        const permissionIds = Array.isArray(response.data) ? response.data : [];
        setSelectedPermissionIds(permissionIds);
      } else {
        setSelectedPermissionIds([]);
      }
    } catch (err: any) {
      console.error('加载角色权限失败:', err);
      setSelectedPermissionIds([]);
    }
  };

  const groupPermissionsByModule = (): PermissionModuleGroup[] => {
    const result: PermissionModuleGroup[] = [];

    // 遍历模块配置
    PERMISSION_MODULE_STRUCTURE.forEach(moduleConfig => {
      const moduleName = moduleConfig.name;
      const moduleDisplayName = t(`rbac.permissionModules.${moduleName}`);

      // 如果有子模块
      if (moduleConfig.subModules && moduleConfig.subModules.length > 0) {
        const subModules: PermissionSubModuleGroup[] = [];

        moduleConfig.subModules.forEach(subModuleConfig => {
          const subModuleName = subModuleConfig.name;
          const subModuleDisplayName = t(`rbac.permissionModules.${moduleName}.${subModuleName}`);

          // 收集该子模块的所有权限
          // 优先匹配resourceType字段，如果没有则匹配resource字段
          const subModulePermissions = permissions.filter(p =>
            subModuleConfig.resourceTypes.includes(p.resourceType || p.resource || '')
          );

          if (subModulePermissions.length > 0) {
            subModules.push({
              subModuleName,
              subModuleDisplayName,
              permissions: subModulePermissions,
            });
          }
        });

        if (subModules.length > 0) {
          result.push({
            moduleName,
            moduleDisplayName,
            subModules,
          });
        }
      }
      // 如果没有子模块，直接收集权限
      else if (moduleConfig.resourceTypes) {
        // 优先匹配resourceType字段，如果没有则匹配resource字段
        const modulePermissions = permissions.filter(p =>
          moduleConfig.resourceTypes!.includes(p.resourceType || p.resource || '')
        );

        if (modulePermissions.length > 0) {
          result.push({
            moduleName,
            moduleDisplayName,
            permissions: modulePermissions,
          });
        }
      }
    });

    return result;
  };

  const handlePermissionToggle = (permissionId: number) => {
    setSelectedPermissionIds(prev => {
      if (prev.includes(permissionId)) {
        return prev.filter(id => id !== permissionId);
      } else {
        return [...prev, permissionId];
      }
    });
  };

  const handleModuleToggle = (modulePermissions: Permission[]) => {
    const modulePermissionIds = modulePermissions.map(p => p.id);
    const allSelected = modulePermissionIds.every(id => selectedPermissionIds.includes(id));

    if (allSelected) {
      setSelectedPermissionIds(prev => prev.filter(id => !modulePermissionIds.includes(id)));
    } else {
      setSelectedPermissionIds(prev => {
        const newIds = modulePermissionIds.filter(id => !prev.includes(id));
        return [...prev, ...newIds];
      });
    }
  };

  const toggleModuleExpansion = (moduleId: string) => {
    setExpandedModules(prev => ({
      ...prev,
      [moduleId]: !prev[moduleId],
    }));
  };

  // 模块图标 - 统一使用盾牌图标
  const getModuleIcon = () => {
    return <SecurityIcon sx={{ mr: 1.5, color: THEME_COLOR, fontSize: '1.1rem' }} />;
  };

  // 渲染权限列表（复用组件）
  const renderPermissionList = (perms: Permission[]) => (
    <List dense>
      {perms.map(permission => (
        <ListItem key={permission.id} disablePadding>
          <FormControlLabel
            control={
              <Checkbox
                checked={selectedPermissionIds.includes(permission.id)}
                onChange={() => handlePermissionToggle(permission.id)}
                sx={{
                  color: '#ccc',
                  '&.Mui-checked': { color: THEME_COLOR },
                }}
              />
            }
            label={
              <Box>
                <Typography sx={{ fontSize: '0.8125rem', fontWeight: 500, color: '#1a1a1a' }}>
                  {translatePermissionName(permission.permissionName)}
                </Typography>
                {translatePermissionDescription(permission.permissionName) && (
                  <Typography sx={{ fontSize: '0.75rem', color: '#888' }}>
                    {translatePermissionDescription(permission.permissionName)}
                  </Typography>
                )}
              </Box>
            }
            sx={{ width: '100%', my: 0.25 }}
          />
        </ListItem>
      ))}
    </List>
  );

  const handleSave = async () => {
    if (!selectedRole) return;

    try {
      setSaving(true);
      await roleApi.assignPermissionsToRole(selectedRole.id, selectedPermissionIds);
      showSnackbar(t('rbac.saveSuccess'), 'success');
    } catch (err: any) {
      showSnackbar(err.message || t('rbac.saveError'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  // 翻译角色名称
  const translateRoleName = (roleName: string): string => {
    const translationKey = `rbac.roleNames.${roleName}`;
    const translated = t(translationKey);
    return translated === translationKey ? roleName : translated;
  };

  // 翻译权限名称
  const translatePermissionName = (permissionName: string): string => {
    const translationKey = `rbac.permissionNames.${permissionName}`;
    const translated = t(translationKey);
    return translated === translationKey ? permissionName : translated;
  };

  // 翻译权限描述
  const translatePermissionDescription = (permissionName: string): string => {
    const translationKey = `rbac.permissionDescriptions.${permissionName}`;
    const translated = t(translationKey);
    return translated === translationKey ? '' : translated;
  };

  const permissionModules = groupPermissionsByModule();

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
        <CircularProgress sx={{ color: THEME_COLOR }} />
      </Box>
    );
  }

  return (
    <Box>
      <Grid container spacing={3}>
        {/* 左侧：角色列表 - 简约风格 */}
        <Grid item xs={12} md={3}>
          <Card
            sx={{
              borderRadius: 2.5,
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
              border: '1px solid rgba(0,0,0,0.06)',
            }}
          >
            <CardContent sx={{ p: 2.5 }}>
              <Typography sx={{ mb: 2, fontSize: '0.875rem', fontWeight: 600, color: '#1a1a1a' }}>
                {t('rbac.selectRole')}
              </Typography>
              {roles.length === 0 ? (
                <Box display="flex" flexDirection="column" alignItems="center" py={4}>
                  <SecurityIcon sx={{ fontSize: 40, color: '#ccc', mb: 1 }} />
                  <Typography sx={{ fontSize: '0.8125rem', color: '#888' }}>
                    {t('rbac.noRoles')}
                  </Typography>
                </Box>
              ) : (
                <List disablePadding>
                  {roles.map(role => (
                    <ListItem key={role.id} disablePadding sx={{ mb: 0.5 }}>
                      <ListItemButton
                        selected={selectedRole?.id === role.id}
                        onClick={() => setSelectedRole(role)}
                        sx={{
                          borderRadius: 1.5,
                          py: 1,
                          px: 1.5,
                          '&.Mui-selected': {
                            backgroundColor: alpha(THEME_COLOR, 0.1),
                            color: THEME_COLOR,
                            '&:hover': {
                              backgroundColor: alpha(THEME_COLOR, 0.15),
                            },
                          },
                          '&:hover': {
                            backgroundColor: 'rgba(0,0,0,0.04)',
                          },
                        }}
                      >
                        <Box sx={{ width: '100%' }}>
                          <Typography sx={{ fontSize: '0.8125rem', fontWeight: 500 }}>
                            {translateRoleName(role.roleName)}
                          </Typography>
                          {role.isSystem && (
                            <Chip
                              label={t('rbac.systemRole')}
                              size="small"
                              sx={{
                                mt: 0.5,
                                height: 18,
                                fontSize: '0.6875rem',
                                backgroundColor: alpha(SECONDARY_COLOR, 0.1),
                                color: SECONDARY_COLOR,
                              }}
                            />
                          )}
                        </Box>
                      </ListItemButton>
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* 右侧：权限树 - 简约风格 */}
        <Grid item xs={12} md={9}>
          <Card
            sx={{
              borderRadius: 2.5,
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
              border: '1px solid rgba(0,0,0,0.06)',
            }}
          >
            <CardContent sx={{ p: 2.5 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2.5}>
                <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: '#1a1a1a' }}>
                  {selectedRole ? t('rbac.rolePermissions', { roleName: translateRoleName(selectedRole.roleName) }) : t('rbac.selectRoleToManagePermissions')}
                </Typography>
                {selectedRole && (
                  <Button
                    size="small"
                    variant="contained"
                    startIcon={saving ? <CircularProgress size={14} sx={{ color: 'white' }} /> : <SaveIcon sx={{ fontSize: 16 }} />}
                    onClick={handleSave}
                    disabled={saving}
                    sx={{
                      borderRadius: 1.5,
                      px: 2,
                      py: 0.75,
                      fontSize: '0.8125rem',
                      fontWeight: 500,
                      bgcolor: THEME_COLOR,
                      boxShadow: 'none',
                      textTransform: 'none',
                      '&:hover': {
                        bgcolor: THEME_COLOR_DARK,
                        boxShadow: 'none',
                      },
                      '&:disabled': {
                        backgroundColor: '#e5e7eb',
                        color: '#9ca3af',
                      },
                    }}
                  >
                    {saving ? t('rbac.saving') : t('rbac.save')}
                  </Button>
                )}
              </Box>

              <Divider sx={{ mb: 2.5, borderColor: 'rgba(0,0,0,0.06)' }} />

              {selectedRole ? (
                <Box>
                  {permissionModules.map(module => {
                    // 如果模块有子模块（多级结构）
                    if (module.subModules && module.subModules.length > 0) {
                      // 计算模块总权限数
                      const allModulePermissions = module.subModules.flatMap(sm => sm.permissions);
                      const modulePermissionIds = allModulePermissions.map(p => p.id);
                      const moduleSelectedCount = modulePermissionIds.filter(id =>
                        selectedPermissionIds.includes(id)
                      ).length;
                      const isExpanded = expandedModules[module.moduleName];

                      return (
                        <Box key={module.moduleName} sx={{ mb: 2 }}>
                          {/* 模块标题行 */}
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              backgroundColor: THEME_COLOR_LIGHT,
                              borderRadius: 1.5,
                              p: 1.5,
                              cursor: 'pointer',
                              border: `1px solid ${THEME_BORDER_COLOR}`,
                              '&:hover': {
                                backgroundColor: isMonochrome ? '#f0f0f0' : '#E0E7FF',
                              },
                            }}
                            onClick={() => toggleModuleExpansion(module.moduleName)}
                          >
                            <IconButton size="small" sx={{ mr: 0.5, p: 0.5 }}>
                              {isExpanded ? <ExpandMore sx={{ fontSize: 18 }} /> : <ChevronRight sx={{ fontSize: 18 }} />}
                            </IconButton>
                            {getModuleIcon()}
                            <Typography sx={{ fontWeight: 600, flex: 1, fontSize: '0.875rem', color: THEME_COLOR }}>
                              {module.moduleDisplayName}
                            </Typography>
                            <Chip
                              label={`${moduleSelectedCount}/${modulePermissionIds.length}`}
                              size="small"
                              sx={{
                                fontSize: '0.7rem',
                                fontWeight: 600,
                                mr: 1,
                                height: 20,
                                bgcolor: moduleSelectedCount > 0 ? alpha(THEME_COLOR, 0.2) : '#e5e7eb',
                                color: moduleSelectedCount > 0 ? THEME_COLOR : '#666',
                              }}
                            />
                            <Button
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleModuleToggle(allModulePermissions);
                              }}
                              sx={{
                                minWidth: 'auto',
                                color: THEME_COLOR,
                                fontSize: '0.7rem',
                                fontWeight: 600,
                                px: 1,
                                py: 0.25,
                                textTransform: 'none',
                                '&:hover': {
                                  backgroundColor: alpha(THEME_COLOR, 0.08),
                                },
                              }}
                            >
                              {moduleSelectedCount === modulePermissionIds.length ? t('rbac.unselectAll') : t('rbac.selectAll')}
                            </Button>
                          </Box>

                          {/* 子模块列表 */}
                          <Collapse in={isExpanded} timeout="auto">
                            <Box sx={{ ml: 4, mt: 1, pl: 2, borderLeft: `2px solid ${THEME_BORDER_COLOR}` }}>
                              {module.subModules.map(subModule => {
                                const subModulePermissionIds = subModule.permissions.map(p => p.id);
                                const subSelectedCount = subModulePermissionIds.filter(id =>
                                  selectedPermissionIds.includes(id)
                                ).length;
                                const allSelected = subSelectedCount === subModule.permissions.length;
                                const subModuleId = `${module.moduleName}.${subModule.subModuleName}`;
                                const isSubExpanded = expandedModules[subModuleId];

                                return (
                                  <Box key={subModule.subModuleName} sx={{ mb: 1 }}>
                                    {/* 子模块标题行 */}
                                    <Box
                                      sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        backgroundColor: '#fafafa',
                                        border: '1px solid rgba(0,0,0,0.06)',
                                        borderRadius: 1,
                                        p: 1,
                                        cursor: 'pointer',
                                        '&:hover': {
                                          backgroundColor: '#f5f5f5',
                                        },
                                      }}
                                      onClick={() => toggleModuleExpansion(subModuleId)}
                                    >
                                      <IconButton size="small" sx={{ mr: 0.5, p: 0.25 }}>
                                        {isSubExpanded ? <ExpandMore sx={{ fontSize: 16 }} /> : <ChevronRight sx={{ fontSize: 16 }} />}
                                      </IconButton>
                                      <Typography sx={{ fontWeight: 500, flex: 1, fontSize: '0.8125rem', color: '#1a1a1a' }}>
                                        {subModule.subModuleDisplayName}
                                      </Typography>
                                      <Chip
                                        label={`${subSelectedCount}/${subModule.permissions.length}`}
                                        size="small"
                                        sx={{
                                          fontSize: '0.65rem',
                                          mr: 1,
                                          height: 18,
                                          bgcolor: allSelected ? alpha(THEME_COLOR, 0.2) : subSelectedCount > 0 ? alpha('#F59E0B', 0.2) : '#e5e7eb',
                                          color: allSelected ? THEME_COLOR : subSelectedCount > 0 ? '#D97706' : '#666',
                                        }}
                                      />
                                      <Button
                                        size="small"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleModuleToggle(subModule.permissions);
                                        }}
                                        sx={{
                                          minWidth: 'auto',
                                          color: THEME_COLOR,
                                          fontSize: '0.65rem',
                                          fontWeight: 600,
                                          px: 0.75,
                                          py: 0.25,
                                          textTransform: 'none',
                                          '&:hover': {
                                            backgroundColor: alpha(THEME_COLOR, 0.08),
                                          },
                                        }}
                                      >
                                        {allSelected ? t('rbac.unselectAll') : t('rbac.selectAll')}
                                      </Button>
                                    </Box>

                                    {/* 权限列表 */}
                                    <Collapse in={isSubExpanded} timeout="auto">
                                      <Box sx={{ ml: 2.5, mt: 0.5, backgroundColor: '#fff', borderRadius: 1, p: 1, border: '1px solid rgba(0,0,0,0.04)' }}>
                                        {renderPermissionList(subModule.permissions)}
                                      </Box>
                                    </Collapse>
                                  </Box>
                                );
                              })}
                            </Box>
                          </Collapse>
                        </Box>
                      );
                    }
                    // 如果模块没有子模块（单级结构）
                    else if (module.permissions && module.permissions.length > 0) {
                      const modulePermissions = module.permissions;
                      const modulePermissionIds = modulePermissions.map(p => p.id);
                      const selectedCount = modulePermissionIds.filter(id =>
                        selectedPermissionIds.includes(id)
                      ).length;
                      const allSelected = selectedCount === modulePermissions.length;
                      const isExpanded = expandedModules[module.moduleName];

                      return (
                        <Box key={module.moduleName} sx={{ mb: 2 }}>
                          {/* 模块标题行 */}
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              backgroundColor: THEME_COLOR_LIGHT,
                              borderRadius: 1.5,
                              p: 1.5,
                              cursor: 'pointer',
                              border: `1px solid ${THEME_BORDER_COLOR}`,
                              '&:hover': {
                                backgroundColor: isMonochrome ? '#f0f0f0' : '#E0E7FF',
                              },
                            }}
                            onClick={() => toggleModuleExpansion(module.moduleName)}
                          >
                            <IconButton size="small" sx={{ mr: 0.5, p: 0.5 }}>
                              {isExpanded ? <ExpandMore sx={{ fontSize: 18 }} /> : <ChevronRight sx={{ fontSize: 18 }} />}
                            </IconButton>
                            {getModuleIcon()}
                            <Typography sx={{ fontWeight: 600, flex: 1, fontSize: '0.875rem', color: THEME_COLOR }}>
                              {module.moduleDisplayName}
                            </Typography>
                            <Chip
                              label={`${selectedCount}/${modulePermissions.length}`}
                              size="small"
                              sx={{
                                fontSize: '0.7rem',
                                fontWeight: 600,
                                mr: 1,
                                height: 20,
                                bgcolor: allSelected ? alpha(THEME_COLOR, 0.2) : selectedCount > 0 ? alpha('#F59E0B', 0.2) : '#e5e7eb',
                                color: allSelected ? THEME_COLOR : selectedCount > 0 ? '#D97706' : '#666',
                              }}
                            />
                            <Button
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleModuleToggle(modulePermissions);
                              }}
                              sx={{
                                minWidth: 'auto',
                                color: THEME_COLOR,
                                fontSize: '0.7rem',
                                fontWeight: 600,
                                px: 1,
                                py: 0.25,
                                textTransform: 'none',
                                '&:hover': {
                                  backgroundColor: alpha(THEME_COLOR, 0.08),
                                },
                              }}
                            >
                              {allSelected ? t('rbac.unselectAll') : t('rbac.selectAll')}
                            </Button>
                          </Box>

                          {/* 权限列表 */}
                          <Collapse in={isExpanded} timeout="auto">
                            <Box sx={{ ml: 5, mt: 1, backgroundColor: '#fff', borderRadius: 1, p: 1.5, border: '1px solid rgba(0,0,0,0.04)' }}>
                              {renderPermissionList(modulePermissions)}
                            </Box>
                          </Collapse>
                        </Box>
                      );
                    }
                    return null;
                  })}
                </Box>
              ) : (
                <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="200px">
                  <SecurityIcon sx={{ fontSize: 48, color: '#ccc', mb: 2 }} />
                  <Typography sx={{ fontSize: '0.875rem', color: '#888' }}>
                    {t('rbac.selectRoleToManagePermissions')}
                  </Typography>
                </Box>
              )}

              {/* 底部保存按钮 */}
              {selectedRole && (
                <>
                  <Divider sx={{ mt: 3, mb: 2, borderColor: 'rgba(0,0,0,0.06)' }} />
                  <Box display="flex" justifyContent="center" alignItems="center">
                    <Button
                      size="small"
                      variant="contained"
                      startIcon={saving ? <CircularProgress size={14} sx={{ color: 'white' }} /> : <SaveIcon sx={{ fontSize: 16 }} />}
                      onClick={handleSave}
                      disabled={saving}
                      sx={{
                        borderRadius: 1.5,
                        px: 2.5,
                        py: 0.75,
                        fontSize: '0.8125rem',
                        fontWeight: 500,
                        bgcolor: THEME_COLOR,
                        boxShadow: 'none',
                        textTransform: 'none',
                        '&:hover': {
                          bgcolor: THEME_COLOR_DARK,
                          boxShadow: 'none',
                        },
                        '&:disabled': {
                          backgroundColor: '#e5e7eb',
                          color: '#9ca3af',
                        },
                      }}
                    >
                      {saving ? t('rbac.saving') : t('rbac.save')}
                    </Button>
                  </Box>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* 通知 */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          severity={snackbar.severity}
          sx={{
            width: '100%',
            borderRadius: 2,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default RolePermissionManagement;
