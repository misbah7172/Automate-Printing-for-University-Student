import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  TextField,
  Button,
  Avatar,
  IconButton,
  Divider,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  PhotoCamera as PhotoCameraIcon,
  Lock as LockIcon,
  Email as EmailIcon,
  Person as PersonIcon,
  Notifications as NotificationsIcon,
  Security as SecurityIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import { useAuth } from '../contexts/AuthContext';
import { userService } from '../services/api';
import toast from 'react-hot-toast';

const Profile = () => {
  const { user, updateUser, logout } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);
  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    pushNotifications: true,
    printCompleteNotifications: true,
    queueUpdates: true,
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm({
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
    },
  });

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    formState: { errors: passwordErrors },
    reset: resetPassword,
  } = useForm();

  React.useEffect(() => {
    if (user) {
      setValue('name', user.name || '');
      setValue('email', user.email || '');
      setValue('phone', user.phone || '');
    }
  }, [user, setValue]);

  const onSubmit = async (data) => {
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append('name', data.name);
      formData.append('phone', data.phone);
      
      if (avatarFile) {
        formData.append('avatar', avatarFile);
      }

      const response = await userService.updateProfile(formData);
      
      if (response.success) {
        updateUser(response.data);
        toast.success('Profile updated successfully');
        setIsEditing(false);
        setAvatarFile(null);
      } else {
        toast.error(response.error || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Profile update error:', error);
      toast.error('Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const onPasswordSubmit = async (data) => {
    setIsLoading(true);

    try {
      const response = await userService.changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      
      if (response.success) {
        toast.success('Password changed successfully');
        setShowPasswordDialog(false);
        resetPassword();
      } else {
        toast.error(response.error || 'Failed to change password');
      }
    } catch (error) {
      console.error('Password change error:', error);
      toast.error('Failed to change password');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAvatarChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image must be less than 5MB');
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }
      
      setAvatarFile(file);
    }
  };

  const handlePreferenceChange = (key) => {
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleDeleteAccount = async () => {
    setIsLoading(true);

    try {
      const response = await userService.deleteAccount();
      
      if (response.success) {
        toast.success('Account deleted successfully');
        logout();
      } else {
        toast.error(response.error || 'Failed to delete account');
      }
    } catch (error) {
      console.error('Account deletion error:', error);
      toast.error('Failed to delete account');
    } finally {
      setIsLoading(false);
      setShowDeleteDialog(false);
    }
  };

  const cancelEdit = () => {
    reset();
    setIsEditing(false);
    setAvatarFile(null);
  };

  const getInitials = (name) => {
    return name
      ?.split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase() || '?';
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h4" gutterBottom>
        Profile
      </Typography>

      <Grid container spacing={3}>
        {/* Profile Information */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6">Personal Information</Typography>
                {!isEditing && (
                  <Button
                    startIcon={<EditIcon />}
                    onClick={() => setIsEditing(true)}
                  >
                    Edit Profile
                  </Button>
                )}
              </Box>

              <Box component="form" onSubmit={handleSubmit(onSubmit)}>
                <Grid container spacing={2}>
                  {/* Avatar */}
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar
                        sx={{ width: 80, height: 80, fontSize: 24 }}
                        src={avatarFile ? URL.createObjectURL(avatarFile) : user?.avatar}
                      >
                        {getInitials(user?.name)}
                      </Avatar>
                      
                      {isEditing && (
                        <Box>
                          <input
                            accept="image/*"
                            style={{ display: 'none' }}
                            id="avatar-upload"
                            type="file"
                            onChange={handleAvatarChange}
                          />
                          <label htmlFor="avatar-upload">
                            <IconButton color="primary" component="span">
                              <PhotoCameraIcon />
                            </IconButton>
                          </label>
                          <Typography variant="caption" display="block" color="text.secondary">
                            Upload photo (max 5MB)
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </Grid>

                  {/* Name */}
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Full Name"
                      disabled={!isEditing}
                      error={!!errors.name}
                      helperText={errors.name?.message}
                      {...register('name', {
                        required: 'Name is required',
                        minLength: {
                          value: 2,
                          message: 'Name must be at least 2 characters',
                        },
                      })}
                    />
                  </Grid>

                  {/* Email */}
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Email"
                      disabled
                      {...register('email')}
                      helperText="Email cannot be changed"
                    />
                  </Grid>

                  {/* Phone */}
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Phone Number"
                      disabled={!isEditing}
                      error={!!errors.phone}
                      helperText={errors.phone?.message}
                      {...register('phone', {
                        pattern: {
                          value: /^[0-9+\-\s()]*$/,
                          message: 'Please enter a valid phone number',
                        },
                      })}
                    />
                  </Grid>

                  {/* Join Date */}
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Member Since"
                      disabled
                      value={user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : ''}
                    />
                  </Grid>
                </Grid>

                {isEditing && (
                  <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                    <Button
                      type="submit"
                      variant="contained"
                      disabled={isLoading}
                      startIcon={isLoading ? <CircularProgress size={20} /> : <SaveIcon />}
                    >
                      Save Changes
                    </Button>
                    <Button
                      variant="outlined"
                      onClick={cancelEdit}
                      disabled={isLoading}
                      startIcon={<CancelIcon />}
                    >
                      Cancel
                    </Button>
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Account Settings */}
        <Grid item xs={12} md={4}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Account Settings
              </Typography>
              
              <List>
                <ListItem>
                  <ListItemIcon>
                    <LockIcon />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Change Password"
                    secondary="Update your account password"
                  />
                  <Button
                    size="small"
                    onClick={() => setShowPasswordDialog(true)}
                  >
                    Change
                  </Button>
                </ListItem>
                
                <Divider />
                
                <ListItem>
                  <ListItemIcon>
                    <SecurityIcon />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Two-Factor Auth"
                    secondary="Coming soon"
                  />
                  <Switch disabled />
                </ListItem>
              </List>
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Notification Preferences
              </Typography>
              
              <List>
                <ListItem>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={preferences.emailNotifications}
                        onChange={() => handlePreferenceChange('emailNotifications')}
                      />
                    }
                    label="Email notifications"
                  />
                </ListItem>
                
                <ListItem>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={preferences.printCompleteNotifications}
                        onChange={() => handlePreferenceChange('printCompleteNotifications')}
                      />
                    }
                    label="Print completion alerts"
                  />
                </ListItem>
                
                <ListItem>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={preferences.queueUpdates}
                        onChange={() => handlePreferenceChange('queueUpdates')}
                      />
                    }
                    label="Queue position updates"
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card>
            <CardContent>
              <Typography variant="h6" color="error" gutterBottom>
                Danger Zone
              </Typography>
              
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Permanently delete your account and all associated data.
              </Typography>
              
              <Button
                variant="outlined"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={() => setShowDeleteDialog(true)}
                sx={{ mt: 2 }}
              >
                Delete Account
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Password Change Dialog */}
      <Dialog 
        open={showPasswordDialog} 
        onClose={() => setShowPasswordDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Change Password</DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handlePasswordSubmit(onPasswordSubmit)}>
            <TextField
              fullWidth
              margin="normal"
              label="Current Password"
              type="password"
              error={!!passwordErrors.currentPassword}
              helperText={passwordErrors.currentPassword?.message}
              {...registerPassword('currentPassword', {
                required: 'Current password is required',
              })}
            />
            
            <TextField
              fullWidth
              margin="normal"
              label="New Password"
              type="password"
              error={!!passwordErrors.newPassword}
              helperText={passwordErrors.newPassword?.message}
              {...registerPassword('newPassword', {
                required: 'New password is required',
                minLength: {
                  value: 8,
                  message: 'Password must be at least 8 characters',
                },
              })}
            />
            
            <TextField
              fullWidth
              margin="normal"
              label="Confirm New Password"
              type="password"
              error={!!passwordErrors.confirmPassword}
              helperText={passwordErrors.confirmPassword?.message}
              {...registerPassword('confirmPassword', {
                required: 'Please confirm your password',
                validate: (value, { newPassword }) =>
                  value === newPassword || 'Passwords do not match',
              })}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowPasswordDialog(false)}>
            Cancel
          </Button>
          <Button 
            variant="contained" 
            onClick={handlePasswordSubmit(onPasswordSubmit)}
            disabled={isLoading}
          >
            Change Password
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Account Dialog */}
      <Dialog 
        open={showDeleteDialog} 
        onClose={() => setShowDeleteDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle color="error">Delete Account</DialogTitle>
        <DialogContent>
          <Alert severity="error" sx={{ mb: 2 }}>
            <Typography variant="body2">
              This action cannot be undone. All your print history and data will be permanently deleted.
            </Typography>
          </Alert>
          
          <Typography variant="body1">
            Are you sure you want to delete your account? This will:
          </Typography>
          
          <List dense sx={{ mt: 1 }}>
            <ListItem>• Delete all your print jobs and history</ListItem>
            <ListItem>• Remove your payment information</ListItem>
            <ListItem>• Cancel any pending print jobs</ListItem>
            <ListItem>• Permanently delete your profile</ListItem>
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDeleteDialog(false)}>
            Cancel
          </Button>
          <Button 
            variant="contained" 
            color="error"
            onClick={handleDeleteAccount}
            disabled={isLoading}
            startIcon={<DeleteIcon />}
          >
            Delete My Account
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Profile;