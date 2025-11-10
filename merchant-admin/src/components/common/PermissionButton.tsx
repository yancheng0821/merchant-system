/**
 * 权限按钮组件
 * 根据用户权限自动显示/隐藏按钮
 */

import React from 'react';
import { Button, ButtonProps, Tooltip } from '@mui/material';
import { usePermission } from '../../hooks/usePermission';
import { PermissionCode } from '../../config/permissions';

export interface PermissionButtonProps extends Omit<ButtonProps, 'children' | 'action'> {
  /** 所需权限代码 */
  permission?: PermissionCode;
  /** 所需资源 */
  resource?: string;
  /** 所需操作（权限相关） */
  permissionAction?: string;
  /** 无权限时的提示文本 */
  noPermissionTooltip?: string;
  /** 无权限时是否显示禁用状态（false则完全隐藏） */
  showDisabled?: boolean;
  /** 按钮内容 */
  children: React.ReactNode;
}

/**
 * 权限按钮组件
 * 使用示例:
 * <PermissionButton permission="products:create">新增服务</PermissionButton>
 * 或
 * <PermissionButton resource="products" permissionAction="create">新增服务</PermissionButton>
 */
export const PermissionButton: React.FC<PermissionButtonProps> = ({
  permission,
  resource,
  permissionAction,
  noPermissionTooltip = '您没有权限执行此操作',
  showDisabled = false,
  children,
  ...buttonProps
}) => {
  const { hasPermission, hasResourcePermission } = usePermission();

  // 检查权限
  const allowed = React.useMemo(() => {
    if (permission) {
      return hasPermission(permission);
    }
    if (resource && permissionAction) {
      return hasResourcePermission(resource, permissionAction);
    }
    // 如果没有指定权限要求，默认允许
    return true;
  }, [permission, resource, permissionAction, hasPermission, hasResourcePermission]);

  // 如果无权限且不显示禁用状态，则完全隐藏
  if (!allowed && !showDisabled) {
    return null;
  }

  // 如果无权限且显示禁用状态，则显示为禁用并添加提示
  if (!allowed && showDisabled) {
    return (
      <Tooltip title={noPermissionTooltip} arrow>
        <span>
          <Button {...buttonProps} disabled>
            {children}
          </Button>
        </span>
      </Tooltip>
    );
  }

  // 有权限，正常显示
  return <Button {...buttonProps}>{children}</Button>;
};

export default PermissionButton;
