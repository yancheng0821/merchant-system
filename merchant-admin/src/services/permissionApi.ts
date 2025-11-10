/**
 * 权限管理 API 服务
 */

// 导入API基础URL
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080';

// 创建带认证的请求
const createAuthRequest = async (url: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('token');

  const defaultHeaders = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
  };

  const config: RequestInit = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
    mode: 'cors',
    credentials: 'include',
  };

  const response = await fetch(`${API_BASE_URL}${url}`, config);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  return response.json();
};

export interface Permission {
  id: number;
  permissionCode: string;
  permissionName: string;
  displayName: string;
  description?: string;
  resource: string;
  action: string;
  scope: 'all' | 'own' | 'department' | string;
  resourceType?: string;
  module?: string; // 所属模块（如access_control, settings）
  resourcePath?: string;
  httpMethod?: string;
  parentId?: number;
  dependsOn?: number;
  metadata?: Record<string, any>;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt?: string;
  updatedAt?: string;
}

export interface Role {
  id: number;
  tenantId: number;
  roleName: string;
  roleCode: string;
  displayName: string;
  description?: string;
  level: number;
  isSystem: boolean;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt?: string;
  updatedAt?: string;
}

export interface AssignPermissionsRequest {
  permissionIds: number[];
}

export interface AssignRoleRequest {
  userId: number;
  tenantId: number;
  roleIds: number[];
  primaryRoleId?: number;
  effectiveFrom?: string;
  effectiveTo?: string;
}

/**
 * 权限 API
 */
export const permissionApi = {
  /**
   * 获取所有激活的权限
   */
  getAllPermissions: () => {
    return createAuthRequest('/api/auth/permissions');
  },

  /**
   * 根据ID获取权限
   */
  getPermissionById: (id: number) => {
    return createAuthRequest(`/api/auth/permissions/${id}`);
  },

  /**
   * 根据资源模块获取权限列表
   */
  getPermissionsByResource: (resource: string) => {
    return createAuthRequest(`/api/auth/permissions/resource/${resource}`);
  },

  /**
   * 根据角色ID获取权限列表
   */
  getPermissionsByRoleId: (roleId: number) => {
    return createAuthRequest(`/api/auth/permissions/role/${roleId}`);
  },

  /**
   * 创建权限
   */
  createPermission: (permission: Partial<Permission>) => {
    return createAuthRequest('/api/auth/permissions', {
      method: 'POST',
      body: JSON.stringify(permission),
    });
  },

  /**
   * 更新权限
   */
  updatePermission: (id: number, permission: Partial<Permission>) => {
    return createAuthRequest(`/api/auth/permissions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(permission),
    });
  },

  /**
   * 删除权限
   */
  deletePermission: (id: number) => {
    return createAuthRequest(`/api/auth/permissions/${id}`, {
      method: 'DELETE',
    });
  },

  /**
   * 分页获取权限
   */
  getPermissionsPage: (page: number, size: number) => {
    return createAuthRequest(`/api/auth/permissions/page?page=${page}&size=${size}`);
  },
};

/**
 * 角色 API
 */
export const roleApi = {
  /**
   * 获取所有角色
   */
  getAllRoles: (tenantId?: number) => {
    const url = tenantId ? `/api/auth/roles?tenantId=${tenantId}` : '/api/auth/roles';
    return createAuthRequest(url);
  },

  /**
   * 根据ID获取角色
   */
  getRoleById: (id: number) => {
    return createAuthRequest(`/api/auth/roles/${id}`);
  },

  /**
   * 获取系统角色
   */
  getSystemRoles: () => {
    return createAuthRequest('/api/auth/roles/system');
  },

  /**
   * 根据用户ID获取角色列表
   */
  getRolesByUserId: (userId: number) => {
    return createAuthRequest(`/api/auth/roles/user/${userId}`);
  },

  /**
   * 获取可分配的角色列表（用于分配角色功能）
   * 只需要 users:assign_roles 权限
   */
  getAssignableRoles: (tenantId?: number) => {
    const url = tenantId ? `/api/auth/roles/assignable?tenantId=${tenantId}` : '/api/auth/roles/assignable';
    return createAuthRequest(url);
  },

  /**
   * 创建角色
   */
  createRole: (role: Partial<Role>) => {
    return createAuthRequest('/api/auth/roles', {
      method: 'POST',
      body: JSON.stringify(role),
    });
  },

  /**
   * 更新角色
   */
  updateRole: (id: number, role: Partial<Role>) => {
    return createAuthRequest(`/api/auth/roles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(role),
    });
  },

  /**
   * 删除角色
   */
  deleteRole: (id: number) => {
    return createAuthRequest(`/api/auth/roles/${id}`, {
      method: 'DELETE',
    });
  },

  /**
   * 为角色分配权限
   */
  assignPermissionsToRole: (roleId: number, permissionIds: number[]) => {
    return createAuthRequest(`/api/auth/roles/${roleId}/permissions`, {
      method: 'POST',
      body: JSON.stringify({ permissionIds }),
    });
  },

  /**
   * 获取角色的权限ID列表
   */
  getRolePermissionIds: (roleId: number) => {
    return createAuthRequest(`/api/auth/roles/${roleId}/permission-ids`);
  },

  /**
   * 为用户分配角色
   */
  assignRolesToUser: (request: AssignRoleRequest) => {
    return createAuthRequest('/api/auth/roles/assign', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  },
};

/**
 * 用户 API
 */
export const userApi = {
  /**
   * 获取所有用户
   */
  getAllUsers: () => {
    return createAuthRequest('/api/auth/users');
  },

  /**
   * 根据用户ID获取用户角色
   */
  getUserRoles: (userId: number) => {
    return createAuthRequest(`/api/auth/users/${userId}/roles`);
  },

  /**
   * 为用户分配角色
   */
  assignRolesToUser: (userId: number, roleIds: number[]) => {
    return createAuthRequest(`/api/auth/users/${userId}/roles`, {
      method: 'POST',
      body: JSON.stringify({ roleIds }),
    });
  },

  /**
   * 更新用户状态
   */
  updateUserStatus: (userId: number, status: 'ACTIVE' | 'INACTIVE') => {
    return createAuthRequest(`/api/auth/users/${userId}/status?status=${status}`, {
      method: 'PUT',
    });
  },
};
