import React, { useState, useRef } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardActions,
  Typography,
  Grid,
  TextField,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Switch,
  Paper,
  Alert,
  LinearProgress,
  IconButton,
  Tooltip,
  Divider,
  Chip,
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Delete as DeleteIcon,
  Visibility as PreviewIcon,
  Print as PrintIcon,
  Description as DocumentIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { printJobService } from '../services/api';
import toast from 'react-hot-toast';

const Upload = () => {
  const [files, setFiles] = useState([]);
  const [printOptions, setPrintOptions] = useState({
    copies: 1,
    color: 'grayscale',
    duplex: false,
    paperSize: 'A4',
  });
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'image/jpeg',
    'image/png',
    'text/plain',
  ];

  const maxFileSize = 50 * 1024 * 1024; // 50MB
  const maxFiles = 10;

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    handleFiles(droppedFiles);
  };

  const handleFileInput = (e) => {
    const selectedFiles = Array.from(e.target.files);
    handleFiles(selectedFiles);
  };

  const handleFiles = (newFiles) => {
    const validFiles = [];
    const errors = [];

    newFiles.forEach((file) => {
      if (files.length + validFiles.length >= maxFiles) {
        errors.push(`Maximum ${maxFiles} files allowed`);
        return;
      }

      if (file.size > maxFileSize) {
        errors.push(`${file.name} is too large (max 50MB)`);
        return;
      }

      if (!allowedTypes.includes(file.type)) {
        errors.push(`${file.name} is not a supported file type`);
        return;
      }

      // Check for duplicate files
      if (files.find(f => f.name === file.name && f.size === file.size)) {
        errors.push(`${file.name} is already added`);
        return;
      }

      validFiles.push({
        file,
        id: Date.now() + Math.random(),
        name: file.name,
        size: file.size,
        type: file.type,
      });
    });

    if (errors.length > 0) {
      errors.forEach(error => toast.error(error));
    }

    if (validFiles.length > 0) {
      setFiles(prev => [...prev, ...validFiles]);
      toast.success(`${validFiles.length} file(s) added`);
    }
  };

  const removeFile = (fileId) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (type) => {
    if (type.includes('pdf')) return '📄';
    if (type.includes('word')) return '📝';
    if (type.includes('powerpoint') || type.includes('presentation')) return '📊';
    if (type.includes('image')) return '🖼️';
    if (type.includes('text')) return '📋';
    return '📄';
  };

  const calculateTotalCost = () => {
    const totalPages = files.length * printOptions.copies; // Simplified calculation
    const costPerPage = printOptions.color === 'color' ? 3 : 1; // 3 BDT for color, 1 BDT for grayscale
    return totalPages * costPerPage;
  };

  const handleSubmit = async () => {
    if (files.length === 0) {
      toast.error('Please select at least one file');
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      files.forEach((fileObj) => {
        formData.append('files', fileObj.file);
      });
      
      formData.append('printOptions', JSON.stringify(printOptions));

      const response = await printJobService.create(formData);
      
      if (response.success) {
        toast.success('Files uploaded successfully!');
        // Navigate to payment page with job ID
        navigate('/payment-submit', { 
          state: { 
            jobId: response.data.id,
            totalCost: calculateTotalCost(),
            files: files.map(f => ({ name: f.name, size: f.size })),
            printOptions 
          } 
        });
      } else {
        toast.error(response.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h4" gutterBottom>
        Upload & Print
      </Typography>
      
      <Typography variant="body1" color="text.secondary" gutterBottom>
        Select your documents and configure print settings
      </Typography>

      <Grid container spacing={3}>
        {/* File Upload Area */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Box
                sx={{
                  border: 2,
                  borderColor: dragActive ? 'primary.main' : 'grey.300',
                  borderStyle: 'dashed',
                  borderRadius: 2,
                  p: 4,
                  textAlign: 'center',
                  backgroundColor: dragActive ? 'primary.50' : 'background.paper',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    borderColor: 'primary.main',
                    backgroundColor: 'primary.50',
                  },
                }}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <UploadIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Drop files here or click to browse
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Supported: PDF, Word, PowerPoint, Images, Text files
                </Typography>
                <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                  Maximum {maxFiles} files, 50MB each
                </Typography>
              </Box>
              
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png,.txt"
                onChange={handleFileInput}
                style={{ display: 'none' }}
              />

              {/* File List */}
              {files.length > 0 && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Selected Files ({files.length})
                  </Typography>
                  {files.map((fileObj) => (
                    <Paper
                      key={fileObj.id}
                      variant="outlined"
                      sx={{ p: 2, mb: 1, display: 'flex', alignItems: 'center' }}
                    >
                      <Typography sx={{ mr: 1 }}>{getFileIcon(fileObj.type)}</Typography>
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="subtitle2" noWrap>
                          {fileObj.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatFileSize(fileObj.size)}
                        </Typography>
                      </Box>
                      <Tooltip title="Preview">
                        <IconButton size="small" color="primary">
                          <PreviewIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Remove">
                        <IconButton 
                          size="small" 
                          color="error"
                          onClick={() => removeFile(fileObj.id)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </Paper>
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Print Options */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Print Options
              </Typography>

              <TextField
                fullWidth
                label="Number of Copies"
                type="number"
                value={printOptions.copies}
                onChange={(e) => setPrintOptions(prev => ({ 
                  ...prev, 
                  copies: Math.max(1, Math.min(100, parseInt(e.target.value) || 1))
                }))}
                inputProps={{ min: 1, max: 100 }}
                sx={{ mb: 3 }}
              />

              <FormControl component="fieldset" sx={{ mb: 3, width: '100%' }}>
                <FormLabel component="legend">Color Mode</FormLabel>
                <RadioGroup
                  value={printOptions.color}
                  onChange={(e) => setPrintOptions(prev => ({ ...prev, color: e.target.value }))}
                >
                  <FormControlLabel 
                    value="grayscale" 
                    control={<Radio />} 
                    label={
                      <Box>
                        <Typography>Grayscale</Typography>
                        <Typography variant="caption" color="text.secondary">
                          1 BDT per page
                        </Typography>
                      </Box>
                    }
                  />
                  <FormControlLabel 
                    value="color" 
                    control={<Radio />} 
                    label={
                      <Box>
                        <Typography>Color</Typography>
                        <Typography variant="caption" color="text.secondary">
                          3 BDT per page
                        </Typography>
                      </Box>
                    }
                  />
                </RadioGroup>
              </FormControl>

              <FormControl component="fieldset" sx={{ mb: 3, width: '100%' }}>
                <FormLabel component="legend">Paper Size</FormLabel>
                <RadioGroup
                  value={printOptions.paperSize}
                  onChange={(e) => setPrintOptions(prev => ({ ...prev, paperSize: e.target.value }))}
                >
                  <FormControlLabel value="A4" control={<Radio />} label="A4" />
                  <FormControlLabel value="Letter" control={<Radio />} label="Letter" />
                </RadioGroup>
              </FormControl>

              <FormControlLabel
                control={
                  <Switch
                    checked={printOptions.duplex}
                    onChange={(e) => setPrintOptions(prev => ({ ...prev, duplex: e.target.checked }))}
                  />
                }
                label="Double-sided printing"
                sx={{ mb: 2 }}
              />

              <Divider sx={{ my: 2 }} />

              {/* Cost Summary */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Cost Summary
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Files:</Typography>
                  <Typography variant="body2">{files.length}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Copies:</Typography>
                  <Typography variant="body2">{printOptions.copies}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Color mode:</Typography>
                  <Chip 
                    label={printOptions.color} 
                    size="small" 
                    color={printOptions.color === 'color' ? 'primary' : 'default'}
                  />
                </Box>
                <Divider sx={{ my: 1 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="h6">Total:</Typography>
                  <Typography variant="h6" color="primary">
                    ৳{calculateTotalCost()}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
            
            <CardActions>
              <Button
                fullWidth
                variant="contained"
                size="large"
                startIcon={isUploading ? <LinearProgress /> : <PrintIcon />}
                onClick={handleSubmit}
                disabled={files.length === 0 || isUploading}
              >
                {isUploading ? 'Uploading...' : 'Upload & Continue to Payment'}
              </Button>
            </CardActions>
          </Card>
        </Grid>
      </Grid>

      {/* Upload Progress */}
      {isUploading && (
        <Box sx={{ position: 'fixed', bottom: 16, right: 16, zIndex: 1000 }}>
          <Alert severity="info" sx={{ minWidth: 300 }}>
            <Typography variant="body2">Uploading files...</Typography>
            <LinearProgress sx={{ mt: 1 }} />
          </Alert>
        </Box>
      )}
    </Box>
  );
};

export default Upload;