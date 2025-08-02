import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Tooltip,
  Alert,
} from '@mui/material';
import {
  Add as AddIcon,
  ContentCopy as CopyIcon,
  Block as BlockIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';

interface TenantInvitation {
  id: number;
  tenantId: number;
  invitationCode: string;
  createdBy: number;
  maxUses: number;
  usedCount: number;
  expiresAt?: string;
  status: 'ACTIVE' | 'EXPIRED' | 'DISABLED';
  createdAt: string;
  updatedAt: string;
}

const InvitationManagement: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  
  const [invitations, setInvitations] = useState<TenantInvitation[]>([]);
  const [loading, setLoading] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newInvitation, setNewInvitation] = useState({
    maxUses: 1,
    expiresAt: '',
  });
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadInvitations = async () => {
    if (!user?.tenantId) return;
    
    setLoading(true);
    try {
      // 这里需要实现API调用
      // const response = await invitationApi.getByTenant(user.tenantId);
      // setInvitations(response.data);
      
      // 临时模拟数据
      setInvitations([
        {
          id: 1,
          tenantId: user.tenantId,
          invitationCode: 'TEST2024',
          createdBy: user.id,
          maxUses: 10,
          usedCount: 3,
          expiresAt: '2024-12-31T23:59:59',
          status: 'ACTIVE',
          createdAt: '2024-01-01T00:00:00',
          updatedAt: '2024-01-01T00:00:00',
        },
      ]);
    } catch (error) {
      setMessage({ type: 'error', text: '加载邀请码失败' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateInvitation = async () => {
    if (!user?.tenantId) return;
    
    try {
      // 这里需要实现API调用
      // const response = await invitationApi.create({
      //   tenantId: user.tenantId,
      //   maxUses: newInvitation.maxUses,
      //   expiresAt: newInvitation.expiresAt || null,
      // });
      
      setMessage({ type: 'success', text: '邀请码创建成功' });
      setCreateDialogOpen(false);
      setNewInvitation({ maxUses: 1, expiresAt: '' });
      loadInvitations();
    } catch (error) {
      setMessage({ type: 'error', text: '创建邀请码失败' });
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setMessage({ type: 'success', text: '邀请码已复制到剪贴板' });
  };

  const handleDisableInvitation = async (id: number) => {
    try {
      // 这里需要实现API调用
      // await invitationApi.disable(id);
      
      setMessage({ type: 'success', text: '邀请码已禁用' });
      loadInvitations();
    } catch (error) {
      setMessage({ type: 'error', text: '禁用邀请码失败' });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'success';
      case 'EXPIRED': return 'warning';
      case 'DISABLED': return 'error';
      default: return 'default';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'ACTIVE': return '有效';
      case 'EXPIRED': return '已过期';
      case 'DISABLED': return '已禁用';
      default: return status;
    }
  };

  useEffect(() => {
    loadInvitations();
  }, [user?.tenantId]);

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h6">邀请码管理</Typography>
        <Box>
          <Button
            startIcon={<RefreshIcon />}
            onClick={loadInvitations}
            sx={{ mr: 1 }}
          >
            刷新
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setCreateDialogOpen(true)}
          >
            创建邀请码
          </Button>
        </Box>
      </Box>

      {message && (
        <Alert 
          severity={message.type} 
          onClose={() => setMessage(null)}
          sx={{ mb: 2 }}
        >
          {message.text}
        </Alert>
      )}

      <Card>
        <CardContent>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>邀请码</TableCell>
                  <TableCell>状态</TableCell>
                  <TableCell>使用情况</TableCell>
                  <TableCell>过期时间</TableCell>
                  <TableCell>创建时间</TableCell>
                  <TableCell>操作</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {invitations.map((invitation) => (
                  <TableRow key={invitation.id}>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <Typography variant="body2" fontFamily="monospace">
                          {invitation.invitationCode}
                        </Typography>
                        <Tooltip title="复制邀请码">
                          <IconButton
                            size="small"
                            onClick={() => handleCopyCode(invitation.invitationCode)}
                            sx={{ ml: 1 }}
                          >
                            <CopyIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getStatusText(invitation.status)}
                        color={getStatusColor(invitation.status) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {invitation.usedCount} / {invitation.maxUses}
                    </TableCell>
                    <TableCell>
                      {invitation.expiresAt 
                        ? new Date(invitation.expiresAt).toLocaleDateString()
                        : '永不过期'
                      }
                    </TableCell>
                    <TableCell>
                      {new Date(invitation.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {invitation.status === 'ACTIVE' && (
                        <Tooltip title="禁用邀请码">
                          <IconButton
                            size="small"
                            onClick={() => handleDisableInvitation(invitation.id)}
                          >
                            <BlockIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* 创建邀请码对话框 */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)}>
        <DialogTitle>创建邀请码</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="最大使用次数"
            type="number"
            value={newInvitation.maxUses}
            onChange={(e) => setNewInvitation({
              ...newInvitation,
              maxUses: parseInt(e.target.value) || 1
            })}
            margin="normal"
            inputProps={{ min: 1 }}
          />
          <TextField
            fullWidth
            label="过期时间"
            type="datetime-local"
            value={newInvitation.expiresAt}
            onChange={(e) => setNewInvitation({
              ...newInvitation,
              expiresAt: e.target.value
            })}
            margin="normal"
            helperText="留空表示永不过期"
            InputLabelProps={{
              shrink: true,
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>
            取消
          </Button>
          <Button onClick={handleCreateInvitation} variant="contained">
            创建
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default InvitationManagement;