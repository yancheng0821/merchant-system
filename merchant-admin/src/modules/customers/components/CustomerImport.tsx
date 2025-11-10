import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stepper,
  Step,
  StepLabel,
  Box,
  Typography,
  Alert,
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Grid,
  Card,
  CardContent,
  IconButton,
  LinearProgress,
  Fade,
  Slide,
  Zoom
} from '@mui/material';
import {
  CloudUpload,
  CheckCircle,
  Error,
  Download,
  Refresh,
  Upload as UploadIcon,
  Close,
  FileUpload,
  Visibility,
  PlayArrow,
  CheckCircleOutline,
  ErrorOutline,
  InfoOutlined,
  TrendingUp,
  Assessment,
  DataUsage
} from '@mui/icons-material';
import { useAuth } from '../../../contexts/AuthContext';
import { customerApi } from '../../../services/api';
import { useTranslation } from 'react-i18next';

interface CustomerImportProps {
  open: boolean;
  onClose: () => void;
  onImportComplete: () => void;
}

interface UploadResponse {
  importSessionId: string;
  fileName: string;
  totalRecords: number;
  detectedColumns: string[];
  sampleData: Record<string, any>[];
}

interface PreviewResponse {
  importSessionId: string;
  totalRecords: number;
  validRecords: number;
  invalidRecords: number;
  records: PreviewRecord[];
  errors: ValidationError[];
}

interface PreviewRecord {
  rowIndex: number;
  data: Record<string, any>;
  isValid: boolean;
  errors: string[];
}

interface ValidationError {
  rowIndex: number;
  field: string;
  message: string;
  value: any;
}

interface ImportResult {
  importSessionId: string;
  status: string;
  totalRecords: number;
  successRecords: number;
  failedRecords: number;
  message: string;
  completedAt: string;
}

const steps = ['uploadFile', 'fieldMapping', 'dataPreview', 'executeImport'];

const getSystemFields = (t: any) => ({
  firstName: t('customers.fields.firstName'),
  lastName: t('customers.fields.lastName'), 
  phone: t('customers.fields.phone'),
  email: t('customers.fields.email'),
  address: t('customers.fields.address'),
  dateOfBirth: t('customers.fields.dateOfBirth'),
  gender: t('customers.fields.gender'),
  notes: t('customers.fields.notes'),
  allergies: t('customers.fields.allergies')
});

export const CustomerImport: React.FC<CustomerImportProps> = ({
  open,
  onClose,
  onImportComplete
}) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const systemFields = getSystemFields(t);
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // 步骤1: 文件上传
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadResponse, setUploadResponse] = useState<UploadResponse | null>(null);
  
  // 步骤2: 字段映射
  const [fieldMapping, setFieldMapping] = useState<Record<string, string>>({});
  
  // 步骤3: 数据预览
  const [previewResponse, setPreviewResponse] = useState<PreviewResponse | null>(null);
  
  // 步骤4: 导入结果
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  const handleReset = () => {
    setActiveStep(0);
    setSelectedFile(null);
    setUploadResponse(null);
    setFieldMapping({});
    setPreviewResponse(null);
    setImportResult(null);
    setError(null);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  // 步骤1: 文件上传
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setError(null);
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFile || !user?.tenantId) return;

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('tenantId', user.tenantId.toString());

      const response = await customerApi.uploadCustomerImportFile(user.tenantId.toString(), selectedFile);

      setUploadResponse(response);
      
      // 自动设置字段映射
      const autoMapping: Record<string, string> = {};
      response.detectedColumns.forEach((col: string) => {
        const lowerCol = col.toLowerCase();
        if (lowerCol === 'firstname' || lowerCol === 'first_name' || lowerCol === 'firstName' || lowerCol.includes('first') && lowerCol.includes('name')) {
          autoMapping[col] = 'firstName';
        } else if (lowerCol === 'lastname' || lowerCol === 'last_name' || lowerCol === 'lastName' || lowerCol.includes('last') && lowerCol.includes('name')) {
          autoMapping[col] = 'lastName';
        } else if (lowerCol.includes('phone') || lowerCol.includes('电话') || lowerCol.includes('手机')) {
          autoMapping[col] = 'phone';
        } else if (lowerCol.includes('email') || lowerCol.includes('邮箱')) {
          autoMapping[col] = 'email';
        } else if (lowerCol.includes('address') || lowerCol.includes('地址')) {
          autoMapping[col] = 'address';
        } else if (lowerCol.includes('dateofbirth') || lowerCol.includes('birth') || lowerCol.includes('生日') || lowerCol.includes('出生')) {
          autoMapping[col] = 'dateOfBirth';
        } else if (lowerCol.includes('gender') || lowerCol.includes('性别')) {
          autoMapping[col] = 'gender';
        } else if (lowerCol.includes('notes') || lowerCol.includes('备注')) {
          autoMapping[col] = 'notes';
        } else if (lowerCol.includes('allergies') || lowerCol.includes('过敏')) {
          autoMapping[col] = 'allergies';
        }
      });
      

      
      setFieldMapping(autoMapping);
      
      setActiveStep(1);
    } catch (err: any) {
      setError(err.responseData?.message || err.message || t('customers.import.uploadFailed'));
    } finally {
      setLoading(false);
    }
  };

  // 步骤2: 字段映射验证
  const handleMappingValidation = async () => {
    if (!uploadResponse || !user?.tenantId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await customerApi.validateCustomerImportMapping(user.tenantId.toString(), {
        importSessionId: uploadResponse.importSessionId,
        fieldMapping
      });

      setPreviewResponse(response);
      setActiveStep(2);
    } catch (err: any) {
      console.error('Validation error:', err);
      const errorMessage = err.responseData?.message || err.message || t('customers.import.validationFailed');
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // 步骤3: 执行导入
  const handleExecuteImport = async () => {
    if (!uploadResponse || !user?.tenantId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await customerApi.executeCustomerImport(user.tenantId.toString(), {
        importSessionId: uploadResponse.importSessionId,
        skipInvalidRecords: true
      });

      setImportResult(response);
      setActiveStep(3);
      
      if (response.successRecords > 0) {
        onImportComplete();
      }
    } catch (err: any) {
      console.error('Import error:', err);
      const errorMessage = err.responseData?.message || err.message || t('customers.import.executionFailed');
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              {t('customers.import.selectFile')}
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {t('customers.import.supportedFormats')}
            </Typography>
            
            <Box
              sx={{
                border: '2px dashed',
                borderColor: 'divider',
                borderRadius: 2,
                p: 6,
                textAlign: 'center',
                mt: 3,
                cursor: 'pointer',
                bgcolor: 'grey.50',
                '&:hover': {
                  borderColor: 'primary.main',
                  bgcolor: 'action.hover',
                }
              }}
              onClick={() => document.getElementById('file-input')?.click()}
            >
              <input
                id="file-input"
                type="file"
                accept=".csv,.xlsx,.xls"
                style={{ display: 'none' }}
                onChange={handleFileSelect}
              />
              <CloudUpload sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography variant="body1">
                {selectedFile ? selectedFile.name : t('customers.import.clickToSelect')}
              </Typography>
              {selectedFile && (
                <Typography variant="body2" color="text.secondary">
                  {t('customers.import.fileSize')}: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </Typography>
              )}
            </Box>

            {uploadResponse && (
              <Alert severity="success" sx={{ mt: 2 }}>
                {t('customers.import.uploadSuccess', { 
                  totalRecords: uploadResponse.totalRecords, 
                  detectedColumns: uploadResponse.detectedColumns.length 
                })}
              </Alert>
            )}
          </Box>
        );

      case 1:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              {t('customers.import.fieldMappingConfig')}
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {t('customers.import.mapFileFields')}
            </Typography>

            {uploadResponse && (
              <Grid container spacing={3} sx={{ mt: 3 }}>
                <Grid item xs={12} md={6}>
                  <Card sx={{ p: 2, height: 'fit-content' }}>
                    <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600, color: 'primary.main' }}>
                      {t('customers.import.fileFields')}
                    </Typography>
                    {uploadResponse.detectedColumns.map((column) => (
                      <Box key={column} sx={{ mb: 3 }}>
                        <Typography variant="body2" sx={{ mb: 1, fontWeight: 500, color: 'text.primary' }}>
                          {column}
                        </Typography>
                        <FormControl fullWidth size="small" sx={{ mt: 1 }}>
                          <InputLabel 
                            sx={{ 
                              backgroundColor: 'background.paper',
                              px: 0.5,
                              '&.Mui-focused': {
                                backgroundColor: 'background.paper',
                                px: 0.5
                              }
                            }}
                          >
                            {t('customers.import.mapToSystemField')}
                          </InputLabel>
                          <Select
                            value={fieldMapping[column] || ''}
                            onChange={(e) => setFieldMapping({
                              ...fieldMapping,
                              [column]: e.target.value
                            })}
                            sx={{
                              '& .MuiOutlinedInput-notchedOutline': {
                                borderColor: 'divider'
                              },
                              '&:hover .MuiOutlinedInput-notchedOutline': {
                                borderColor: 'primary.main'
                              },
                              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                borderColor: 'primary.main',
                                borderWidth: 2
                              }
                            }}
                          >
                            <MenuItem value="">{t('customers.import.noMapping')}</MenuItem>
                            {Object.entries(systemFields).map(([key, label]) => (
                              <MenuItem key={key} value={key}>
                                {String(label)}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Box>
                    ))}
                  </Card>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Card sx={{ p: 2, height: 'fit-content' }}>
                    <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600, color: 'primary.main' }}>
                      {t('customers.import.dataPreview')}
                    </Typography>
                    {uploadResponse.sampleData.slice(0, 3).map((row, index) => (
                      <Card key={index} sx={{ mb: 2, border: '1px solid', borderColor: 'divider' }}>
                        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                          <Typography variant="caption" sx={{ color: 'text.secondary', mb: 1, display: 'block' }}>
                            {t('customers.import.sampleRow', { index: index + 1 })}
                          </Typography>
                          {Object.entries(row).map(([key, value]) => (
                            <Typography key={key} variant="body2" sx={{ mb: 0.5 }}>
                              <Box component="span" sx={{ fontWeight: 600, color: 'text.primary' }}>
                                {key}:
                              </Box>{' '}
                              <Box component="span" sx={{ color: 'text.secondary' }}>
                                {String(value)}
                              </Box>
                            </Typography>
                          ))}
                        </CardContent>
                      </Card>
                    ))}
                  </Card>
                </Grid>
              </Grid>
            )}
          </Box>
        );

      case 2:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              {t('customers.import.dataPreviewTitle')}
            </Typography>
            
            {!previewResponse && !error && (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <CircularProgress size={40} sx={{ mb: 2 }} />
                <Typography variant="body1" color="text.secondary">
                  {t('customers.import.validating')}
                </Typography>
              </Box>
            )}
            
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            
            
            {previewResponse && (
              <>
                <Grid container spacing={3} sx={{ mb: 4 }}>
                  <Grid item xs={4}>
                    <Card variant="outlined">
                      <CardContent sx={{ textAlign: 'center' }}>
                        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1, color: 'primary.main' }}>
                          {previewResponse.totalRecords}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {t('customers.import.totalRecords')}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={4}>
                    <Card variant="outlined">
                      <CardContent sx={{ textAlign: 'center' }}>
                        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1, color: 'success.main' }}>
                          {previewResponse.validRecords}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {t('customers.import.validRecords')}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={4}>
                    <Card variant="outlined">
                      <CardContent sx={{ textAlign: 'center' }}>
                        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1, color: 'error.main' }}>
                          {previewResponse.invalidRecords}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {t('customers.import.invalidRecords')}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>

                {previewResponse.errors.length > 0 && (
                  <Alert severity="warning" sx={{ mb: 2 }}>
                    {t('customers.import.validationErrors', { errorCount: previewResponse.errors.length })}
                  </Alert>
                )}

                <Typography variant="subtitle2" gutterBottom>
                  {t('customers.import.dataPreviewLimit')}
                </Typography>
                <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
                  <Table stickyHeader size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>{t('customers.import.rowIndex')}</TableCell>
                        <TableCell>{t('customers.import.tableHeaders.status')}</TableCell>
                        {Object.values(systemFields).map((field) => (
                          <TableCell key={String(field)}>{String(field)}</TableCell>
                        ))}
                        <TableCell>{t('customers.import.errorMessage')}</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {previewResponse.records.map((record) => (
                        <TableRow key={record.rowIndex}>
                          <TableCell>{record.rowIndex}</TableCell>
                          <TableCell>
                            {record.isValid ? (
                              <Chip
                                icon={<CheckCircle />}
                                label={t('customers.import.valid')}
                                color="success"
                                size="small"
                              />
                            ) : (
                              <Chip
                                icon={<Error />}
                                label={t('customers.import.invalid')}
                                color="error"
                                size="small"
                              />
                            )}
                          </TableCell>
                          {Object.keys(systemFields).map((field) => (
                            <TableCell key={field}>
                              {record.data[field] || '-'}
                            </TableCell>
                          ))}
                          <TableCell>
                            {record.errors.length > 0 && (
                              <Typography variant="caption" color="error">
                                {record.errors.join('; ')}
                              </Typography>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </>
            )}
          </Box>
        );

      case 3:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              {t('customers.import.importComplete')}
            </Typography>
            
            {importResult && (
              <>
                <Alert 
                  severity={importResult.status === 'COMPLETED' ? 'success' : 'error'}
                  sx={{ mb: 3 }}
                >
                  {importResult.message}
                </Alert>

                <Grid container spacing={3}>
                  <Grid item xs={4}>
                    <Card variant="outlined">
                      <CardContent sx={{ textAlign: 'center' }}>
                        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1, color: 'primary.main' }}>
                          {importResult.totalRecords}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {t('customers.import.totalRecords')}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={4}>
                    <Card variant="outlined">
                      <CardContent sx={{ textAlign: 'center' }}>
                        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1, color: 'success.main' }}>
                          {importResult.successRecords}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {t('customers.import.successRecords')}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={4}>
                    <Card variant="outlined">
                      <CardContent sx={{ textAlign: 'center' }}>
                        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1, color: 'error.main' }}>
                          {importResult.failedRecords}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {t('customers.import.failedRecords')}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>

                {importResult.failedRecords > 0 && (
                  <Box sx={{ mt: 3, textAlign: 'center' }}>
                    <Button
                      variant="outlined"
                      color="error"
                      startIcon={<Download />}
                      onClick={() => {
                        if (uploadResponse && user?.tenantId) {
                          customerApi.downloadCustomerImportErrorReport(user.tenantId.toString(), uploadResponse.importSessionId);
                        }
                      }}
                    >
                      {t('customers.import.downloadErrorReport')}
                    </Button>
                  </Box>
                )}
              </>
            )}
          </Box>
        );

      default:
        return null;
    }
  };

  const getStepActions = () => {
    switch (activeStep) {
      case 0:
        return (
          <Button
            variant="contained"
            onClick={handleFileUpload}
            disabled={!selectedFile || loading}
            startIcon={loading ? <CircularProgress size={20} /> : <CloudUpload />}
          >
            {loading ? t('customers.import.uploading') : t('customers.import.uploadFile')}
          </Button>
        );

      case 1:
        return (
          <>
            <Button onClick={() => setActiveStep(0)}>
              {t('common.back')}
            </Button>
            <Button
              variant="contained"
              onClick={handleMappingValidation}
              disabled={Object.keys(fieldMapping).length === 0 || loading}
              startIcon={loading ? <CircularProgress size={20} /> : undefined}
            >
              {loading ? t('customers.import.validating') : t('customers.import.validateData')}
            </Button>
          </>
        );

      case 2:
        return (
          <>
            <Button onClick={() => setActiveStep(1)}>
              {t('common.back')}
            </Button>
            <Button
              variant="contained"
              onClick={handleExecuteImport}
              disabled={!previewResponse || previewResponse.validRecords === 0 || loading}
              startIcon={loading ? <CircularProgress size={20} /> : undefined}
            >
              {loading ? t('customers.import.importing') : t('customers.import.executeImport')}
            </Button>
          </>
        );

      case 3:
        return (
          <>
            <Button onClick={handleReset} startIcon={<Refresh />}>
              {t('customers.import.reimport')}
            </Button>
            <Button variant="contained" onClick={handleClose}>
              {t('common.confirm')}
            </Button>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          minHeight: '75vh',
          borderRadius: 3,
        }
      }}
    >
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6" sx={{ fontWeight: 600, color: '#EC4899' }}>
            {t('customers.import.title')}
          </Typography>
          <IconButton onClick={handleClose}>
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent dividers>
        <Box sx={{ mb: 4 }}>
          <Stepper activeStep={activeStep}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{t(`customers.import.steps.${label}`)}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </Box>

        <Box>
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {renderStepContent()}
        </Box>
      </DialogContent>

      <DialogActions>
        {getStepActions()}
      </DialogActions>
    </Dialog>
  );
};