import React, { useState } from 'react';
import {
  Box,
  Card,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  alpha,
  Button,
  CircularProgress,
} from '@mui/material';
import {
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  Add as AddIcon,
  CardGiftcard as PackageIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { Package, PackageService } from '../../../services/api';
import { CurrencyUtils } from '../../../config/constants';
import { getPackageIconComponent } from '../utils/packageIcons';
import { usePermission } from '../../../hooks/usePermission';
import { useTheme } from '../../../contexts/ThemeContext';

interface Service {
  id: number;
  name: string;
  price: number;
}

interface PackageListProps {
  packages: Package[];
  services: Service[];
  loading: boolean;
  onEdit: (pkg: Package) => void;
  onDelete: (pkg: Package) => void;
  onView: (pkg: Package) => void;
  onCreate: () => void;
}

const PackageList: React.FC<PackageListProps> = ({
  packages,
  services,
  loading,
  onEdit,
  onDelete,
  onView,
  onCreate,
}) => {
  const { t } = useTranslation();
  const { hasPermission } = usePermission();
  const { themeMode } = useTheme();
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);

  // 根据主题模式动态设置主题色
  const isMonochrome = themeMode === 'monochrome';
  const THEME_COLOR = isMonochrome ? '#1a1a1a' : '#06B6D4';
  const THEME_COLOR_DARK = isMonochrome ? '#333' : '#0891B2';

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, pkg: Package) => {
    setMenuAnchorEl(event.currentTarget);
    setSelectedPackage(pkg);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    setSelectedPackage(null);
  };

  const getPackageServices = (pkg: Package): PackageService[] => {
    if (typeof pkg.services === 'string') {
      try {
        return JSON.parse(pkg.services);
      } catch {
        return [];
      }
    }
    return pkg.services || [];
  };

  const getServiceName = (serviceId: number): string => {
    const service = services.find(s => s.id === serviceId);
    return service ? service.name : t('packages.unknownService');
  };

  const getTotalServicesCount = (pkg: Package): number => {
    const packageServices = getPackageServices(pkg);
    return packageServices.reduce((sum, ps) => sum + ps.count, 0);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" py={8}>
        <CircularProgress />
      </Box>
    );
  }

  if (packages.length === 0) {
    return (
      <Box textAlign="center" py={8}>
        <PackageIcon sx={{ fontSize: 80, color: alpha(THEME_COLOR, 0.3), mb: 2 }} />
        <Typography variant="h6" color="text.secondary" mb={3}>
          {t('packages.noPackages')}
        </Typography>
        {hasPermission('packages:create') && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={onCreate}
            sx={{
              bgcolor: THEME_COLOR,
              boxShadow: 'none',
              textTransform: 'none',
              fontWeight: 500,
              '&:hover': {
                bgcolor: THEME_COLOR_DARK,
                boxShadow: 'none',
              },
            }}
          >
            {t('packages.createFirstPackage')}
          </Button>
        )}
      </Box>
    );
  }

  return (
    <>
      <Box
        sx={{
          borderRadius: 2,
          border: '1px solid rgba(0,0,0,0.08)',
          overflow: 'hidden',
          bgcolor: '#fff',
        }}
      >
        <TableContainer>
          <Table>
            <TableHead sx={{ backgroundColor: '#fafafa' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.8125rem', color: '#666', py: 1.5 }}>
                  {t('packages.packageName')}
                </TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.8125rem', color: '#666', py: 1.5 }}>
                  {t('packages.includedServices')}
                </TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.8125rem', color: '#666', py: 1.5, textAlign: 'right' }}>
                  {t('packages.originalPrice')}
                </TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.8125rem', color: '#666', py: 1.5, textAlign: 'right' }}>
                  {t('packages.packagePrice')}
                </TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.8125rem', color: '#666', py: 1.5, textAlign: 'center' }}>
                  {t('packages.discount')}
                </TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.8125rem', color: '#666', py: 1.5, textAlign: 'center' }}>
                  {t('packages.validity')}
                </TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.8125rem', color: '#666', py: 1.5, textAlign: 'center' }}>
                  {t('packages.statusLabel')}
                </TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.8125rem', color: '#666', py: 1.5, textAlign: 'center' }}>
                  {t('packages.actions')}
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {packages.map((pkg) => {
                const packageServices = getPackageServices(pkg);
                const totalServices = getTotalServicesCount(pkg);

                return (
                  <TableRow
                    key={pkg.id}
                    hover
                    sx={{
                      '&:hover': { bgcolor: 'rgba(0,0,0,0.02)' },
                      '& td': { py: 1.5, fontSize: '0.8125rem' },
                    }}
                  >
                    {/* Package Name with Icon */}
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1.5}>
                        <Box
                          sx={{
                            width: 28,
                            height: 28,
                            borderRadius: 1.5,
                            bgcolor: alpha(pkg.color || '#06B6D4', 0.1),
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: pkg.color || '#06B6D4',
                            flexShrink: 0,
                          }}
                        >
                          {getPackageIconComponent(pkg.icon)}
                        </Box>
                        <Box>
                          <Typography sx={{ fontWeight: 500, fontSize: '0.8125rem', color: '#1a1a1a' }}>
                            {pkg.name}
                          </Typography>
                          <Typography sx={{ fontSize: '0.75rem', color: '#888' }}>
                            ID: {pkg.id}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>

                    {/* Services */}
                    <TableCell>
                      <Box>
                        <Chip
                          label={`${totalServices} ${t('products.sessions')}`}
                          size="small"
                          sx={{
                            bgcolor: alpha(THEME_COLOR, 0.1),
                            color: THEME_COLOR,
                            fontWeight: 500,
                            height: 22,
                            fontSize: '0.75rem',
                          }}
                        />
                        <Box mt={0.5}>
                          {packageServices.slice(0, 2).map((ps, idx) => (
                            <Typography key={idx} sx={{ display: 'block', fontSize: '0.75rem', color: '#888' }}>
                              • {ps.count}x {getServiceName(ps.service_id)}
                            </Typography>
                          ))}
                          {packageServices.length > 2 && (
                            <Typography sx={{ fontSize: '0.75rem', color: '#888' }}>
                              +{packageServices.length - 2} {t('packages.moreServices')}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    </TableCell>

                    {/* Original Price */}
                    <TableCell sx={{ textAlign: 'right' }}>
                      <Typography
                        sx={{
                          textDecoration: 'line-through',
                          color: '#999',
                          fontSize: '0.8125rem',
                        }}
                      >
                        {CurrencyUtils.formatAmount(pkg.original_price)}
                      </Typography>
                    </TableCell>

                    {/* Package Price */}
                    <TableCell sx={{ textAlign: 'right' }}>
                      <Typography
                        sx={{
                          fontWeight: 600,
                          color: THEME_COLOR,
                          fontSize: '0.8125rem',
                        }}
                      >
                        {CurrencyUtils.formatAmount(pkg.package_price)}
                      </Typography>
                    </TableCell>

                    {/* Discount */}
                    <TableCell sx={{ textAlign: 'center' }}>
                      {pkg.discount_percentage && pkg.discount_percentage > 0 ? (
                        <Chip
                          label={`-${pkg.discount_percentage.toFixed(0)}%`}
                          size="small"
                          sx={{
                            bgcolor: isMonochrome ? 'rgba(26, 26, 26, 0.1)' : alpha('#10B981', 0.1),
                            color: isMonochrome ? '#1a1a1a' : '#10B981',
                            fontWeight: 600,
                            height: 24,
                            fontSize: '0.75rem',
                          }}
                        />
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          -
                        </Typography>
                      )}
                    </TableCell>

                    {/* Validity */}
                    <TableCell sx={{ textAlign: 'center' }}>
                      <Typography sx={{ fontSize: '0.8125rem', color: '#666' }}>
                        {pkg.validity_days} {t('packages.days')}
                      </Typography>
                    </TableCell>

                    {/* Status */}
                    <TableCell sx={{ textAlign: 'center' }}>
                      <Chip
                        label={pkg.status === 'ACTIVE' ? t('packages.active') : t('packages.inactive')}
                        size="small"
                        sx={{
                          bgcolor: pkg.status === 'ACTIVE' ? alpha('#10B981', 0.1) : alpha('#EF4444', 0.1),
                          color: pkg.status === 'ACTIVE' ? '#10B981' : '#EF4444',
                          fontWeight: 600,
                          height: 22,
                          fontSize: '0.75rem',
                        }}
                      />
                    </TableCell>

                    {/* Actions */}
                    <TableCell sx={{ textAlign: 'center' }}>
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMenuOpen(e, pkg);
                        }}
                        sx={{
                          color: '#999',
                          '&:hover': {
                            backgroundColor: 'rgba(0,0,0,0.04)',
                            color: '#666',
                          },
                        }}
                      >
                        <MoreVertIcon sx={{ fontSize: 18 }} />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {/* Action Menu */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
        slotProps={{
          paper: {
            sx: {
              borderRadius: 1.5,
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
              border: '1px solid rgba(0,0,0,0.06)',
              minWidth: 160,
              mt: 0.5,
            }
          }
        }}
      >
        <MenuItem
          onClick={() => {
            if (selectedPackage) onView(selectedPackage);
            handleMenuClose();
          }}
          sx={{
            fontSize: '0.8125rem',
            py: 1,
            '&:hover': { backgroundColor: 'rgba(0,0,0,0.04)' },
          }}
        >
          <VisibilityIcon sx={{ mr: 1.5, fontSize: 16, color: isMonochrome ? '#6a6a6a' : '#6366F1' }} />
          {t('packages.viewDetails')}
        </MenuItem>
        {hasPermission('packages:update') && (
          <MenuItem
            onClick={() => {
              if (selectedPackage) onEdit(selectedPackage);
              handleMenuClose();
            }}
            sx={{
              fontSize: '0.8125rem',
              py: 1,
              '&:hover': { backgroundColor: 'rgba(0,0,0,0.04)' },
            }}
          >
            <EditIcon sx={{ mr: 1.5, fontSize: 16, color: THEME_COLOR }} />
            {t('packages.editPackage')}
          </MenuItem>
        )}
        {hasPermission('packages:delete') && (
          <MenuItem
            onClick={() => {
              if (selectedPackage) onDelete(selectedPackage);
              handleMenuClose();
            }}
            sx={{
              fontSize: '0.8125rem',
              py: 1,
              '&:hover': { backgroundColor: alpha('#EF4444', 0.08) },
            }}
          >
            <DeleteIcon sx={{ mr: 1.5, fontSize: 16, color: '#EF4444' }} />
            {t('packages.deletePackage')}
          </MenuItem>
        )}
      </Menu>
    </>
  );
};

export default PackageList;