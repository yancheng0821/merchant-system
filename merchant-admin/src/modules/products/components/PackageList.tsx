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
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);

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
        <PackageIcon sx={{ fontSize: 80, color: alpha('#06B6D4', 0.3), mb: 2 }} />
        <Typography variant="h6" color="text.secondary" mb={3}>
          {t('packages.noPackages')}
        </Typography>
        {hasPermission('packages:create') && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={onCreate}
            sx={{
              background: 'linear-gradient(45deg, #67E8F9, #0891B2)',
              '&:hover': {
                background: 'linear-gradient(45deg, #0891B2, #0E7490)',
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
      <Card
        sx={{
          borderRadius: 3,
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          overflow: 'hidden',
        }}
      >
        <TableContainer>
          <Table>
            <TableHead sx={{ backgroundColor: '#f8fafc' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>
                  {t('packages.packageName')}
                </TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>
                  {t('packages.includedServices')}
                </TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'text.primary', textAlign: 'right' }}>
                  {t('packages.originalPrice')}
                </TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'text.primary', textAlign: 'right' }}>
                  {t('packages.packagePrice')}
                </TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'text.primary', textAlign: 'center' }}>
                  {t('packages.discount')}
                </TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'text.primary', textAlign: 'center' }}>
                  {t('packages.validity')}
                </TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'text.primary', textAlign: 'center' }}>
                  {t('packages.statusLabel')}
                </TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'text.primary', textAlign: 'center' }}>
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
                    sx={{
                      '&:hover': {
                        backgroundColor: alpha('#06B6D4', 0.04),
                      },
                      transition: 'background-color 0.2s ease',
                    }}
                  >
                    {/* Package Name with Icon */}
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1.5}>
                        <Box
                          sx={{
                            width: 32,
                            height: 32,
                            borderRadius: 2,
                            background: `linear-gradient(135deg, ${pkg.color || '#06B6D4'}, ${alpha(pkg.color || '#06B6D4', 0.7)})`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            flexShrink: 0,
                          }}
                        >
                          {getPackageIconComponent(pkg.icon)}
                        </Box>
                        <Box>
                          <Typography variant="body2" fontWeight={600}>
                            {pkg.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.7rem' }}>
                            ID: {pkg.id}
                          </Typography>
                          {pkg.description && (
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25 }}>
                              {pkg.description}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    </TableCell>

                    {/* Services */}
                    <TableCell>
                      <Box>
                        <Chip
                          label={`${totalServices} ${t('products.services')}`}
                          size="small"
                          sx={{
                            bgcolor: alpha('#06B6D4', 0.1),
                            color: '#0891B2',
                            fontWeight: 600,
                            height: 24,
                          }}
                        />
                        <Box mt={0.5}>
                          {packageServices.slice(0, 2).map((ps, idx) => (
                            <Typography key={idx} variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                              • {ps.count}x {getServiceName(ps.service_id)}
                            </Typography>
                          ))}
                          {packageServices.length > 2 && (
                            <Typography variant="caption" color="text.secondary">
                              +{packageServices.length - 2} {t('packages.moreServices')}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    </TableCell>

                    {/* Original Price */}
                    <TableCell sx={{ textAlign: 'right' }}>
                      <Typography
                        variant="body2"
                        sx={{
                          textDecoration: 'line-through',
                          color: 'text.secondary',
                        }}
                      >
                        {CurrencyUtils.formatAmount(pkg.original_price)}
                      </Typography>
                    </TableCell>

                    {/* Package Price */}
                    <TableCell sx={{ textAlign: 'right' }}>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 600,
                          color: '#0891B2',
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
                            bgcolor: alpha('#10B981', 0.1),
                            color: '#10B981',
                            fontWeight: 600,
                            height: 24,
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
                      <Typography variant="body2">
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
                          height: 24,
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
                      >
                        <MoreVertIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Action Menu */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
        slotProps={{
          paper: {
            sx: {
              borderRadius: 2,
              boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
              minWidth: 180,
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
            '&:hover': {
              backgroundColor: alpha('#06B6D4', 0.08),
            },
          }}
        >
          <VisibilityIcon sx={{ mr: 1.5, fontSize: 20, color: '#06B6D4' }} />
          <Typography sx={{ color: 'text.primary' }}>
            {t('packages.viewDetails')}
          </Typography>
        </MenuItem>
        {hasPermission('packages:update') && (
          <MenuItem
            onClick={() => {
              if (selectedPackage) onEdit(selectedPackage);
              handleMenuClose();
            }}
            sx={{
              '&:hover': {
                backgroundColor: alpha('#10B981', 0.08),
              },
            }}
          >
            <EditIcon sx={{ mr: 1.5, fontSize: 20, color: '#10B981' }} />
            <Typography sx={{ color: 'text.primary' }}>
              {t('packages.editPackage')}
            </Typography>
          </MenuItem>
        )}
        {hasPermission('packages:delete') && (
          <MenuItem
            onClick={() => {
              if (selectedPackage) onDelete(selectedPackage);
              handleMenuClose();
            }}
            sx={{ color: 'error.main' }}
          >
            <DeleteIcon sx={{ mr: 1.5, fontSize: 20 }} />
            {t('packages.deletePackage')}
          </MenuItem>
        )}
      </Menu>
    </>
  );
};

export default PackageList;