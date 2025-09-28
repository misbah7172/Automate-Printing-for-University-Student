import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Container,
  CircularProgress,
  Alert,
  Grid,
  Tab,
  Tabs,
  Divider,
  IconButton,
  InputAdornment,
} from '@mui/material';
import {
  PersonAdd as PersonAddIcon,
  Google as GoogleIcon,
  Facebook as FacebookIcon,
  Visibility,
  VisibilityOff,
} from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import { useAuth } from '../contexts/AuthContextWithFirebase';

const RegisterWithFirebase = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [authTab, setAuthTab] = useState(0); // 0: Traditional, 1: Firebase
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register: registerUser,
    registerWithFirebase,
    loginWithGoogle,
    loginWithFacebook,
    isAuthenticated,
  } = useAuth();
  
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset,
  } = useForm();

  const watchPassword = watch('password', '');

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleTabChange = (event, newValue) => {
    setAuthTab(newValue);
    setError('');
    setSuccess('');
    reset();
  };

  const onTraditionalSubmit = async (data) => {
    setIsLoading(true);
    setError('');
    setSuccess('');

    const result = await registerUser({
      name: data.name,
      email: data.email,
      password: data.password,
      upid: data.upid,
      phone: data.phone,
    });

    if (result.success) {
      setSuccess('Registration successful! Redirecting...');
      setTimeout(() => navigate('/'), 2000);
    } else {
      setError(result.error);
    }

    setIsLoading(false);
  };

  const onFirebaseSubmit = async (data) => {
    setIsLoading(true);
    setError('');
    setSuccess('');

    const result = await registerWithFirebase(data.email, data.password, {
      name: data.name,
      upid: data.upid,
      phone: data.phone,
    });

    if (result.success) {
      setSuccess('Registration successful! Redirecting...');
      setTimeout(() => navigate('/'), 2000);
    } else {
      setError(result.error);
    }

    setIsLoading(false);
  };

  const handleGoogleSignUp = async () => {
    setIsLoading(true);
    setError('');
    setSuccess('');

    const result = await loginWithGoogle();

    if (result.success) {
      setSuccess('Google sign-up successful! Redirecting...');
      setTimeout(() => navigate('/'), 2000);
    } else {
      setError(result.error);
    }

    setIsLoading(false);
  };

  const handleFacebookSignUp = async () => {
    setIsLoading(true);
    setError('');
    setSuccess('');

    const result = await loginWithFacebook();

    if (result.success) {
      setSuccess('Facebook sign-up successful! Redirecting...');
      setTimeout(() => navigate('/'), 2000);
    } else {
      setError(result.error);
    }

    setIsLoading(false);
  };

  return (
    <Container component="main" maxWidth="md">
      <Box
        sx={{
          marginTop: 4,
          marginBottom: 4,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper
          elevation={3}
          sx={{
            padding: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%',
          }}
        >
          <PersonAddIcon sx={{ fontSize: 40, color: 'primary.main', mb: 2 }} />
          <Typography component="h1" variant="h4" gutterBottom>
            Student Registration
          </Typography>
          <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
            Create your AutoPrint student account
          </Typography>

          {/* Authentication Method Tabs */}
          <Box sx={{ width: '100%', mb: 2 }}>
            <Tabs
              value={authTab}
              onChange={handleTabChange}
              variant="fullWidth"
              sx={{ borderBottom: 1, borderColor: 'divider' }}
            >
              <Tab label="Traditional Registration" />
              <Tab label="Firebase Registration" />
            </Tabs>
          </Box>

          {error && (
            <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ width: '100%', mb: 2 }}>
              {success}
            </Alert>
          )}

          {/* Traditional Registration Form */}
          {authTab === 0 && (
            <Box
              component="form"
              onSubmit={handleSubmit(onTraditionalSubmit)}
              sx={{ width: '100%' }}
            >
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    required
                    fullWidth
                    id="name"
                    label="Full Name"
                    name="name"
                    autoComplete="name"
                    autoFocus
                    {...register('name', {
                      required: 'Full name is required',
                      minLength: {
                        value: 2,
                        message: 'Name must be at least 2 characters',
                      },
                    })}
                    error={!!errors.name}
                    helperText={errors.name?.message}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    required
                    fullWidth
                    id="upid"
                    label="University ID (UPID)"
                    name="upid"
                    {...register('upid', {
                      required: 'University ID is required',
                      pattern: {
                        value: /^UP\d{3}$/,
                        message: 'UPID must be in format UP001',
                      },
                    })}
                    error={!!errors.upid}
                    helperText={errors.upid?.message || 'Format: UP001'}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    required
                    fullWidth
                    id="email"
                    label="Email Address"
                    name="email"
                    autoComplete="email"
                    {...register('email', {
                      required: 'Email is required',
                      pattern: {
                        value: /^\S+@\S+$/i,
                        message: 'Invalid email address',
                      },
                    })}
                    error={!!errors.email}
                    helperText={errors.email?.message}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    id="phone"
                    label="Phone Number"
                    name="phone"
                    autoComplete="tel"
                    {...register('phone', {
                      pattern: {
                        value: /^\+?[\d\s-()]+$/,
                        message: 'Invalid phone number',
                      },
                    })}
                    error={!!errors.phone}
                    helperText={errors.phone?.message}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    required
                    fullWidth
                    name="password"
                    label="Password"
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    autoComplete="new-password"
                    {...register('password', {
                      required: 'Password is required',
                      minLength: {
                        value: 6,
                        message: 'Password must be at least 6 characters',
                      },
                    })}
                    error={!!errors.password}
                    helperText={errors.password?.message}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowPassword(!showPassword)}
                            edge="end"
                          >
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    required
                    fullWidth
                    name="confirmPassword"
                    label="Confirm Password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="confirmPassword"
                    {...register('confirmPassword', {
                      required: 'Please confirm your password',
                      validate: (value) =>
                        value === watchPassword || 'Passwords do not match',
                    })}
                    error={!!errors.confirmPassword}
                    helperText={errors.confirmPassword?.message}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            edge="end"
                          >
                            {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
              </Grid>

              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2, py: 1.5 }}
                disabled={isLoading}
              >
                {isLoading ? <CircularProgress size={24} /> : 'Create Account'}
              </Button>
            </Box>
          )}

          {/* Firebase Registration Form */}
          {authTab === 1 && (
            <>
              {/* Social Sign-Up Options */}
              <Grid container spacing={2} sx={{ width: '100%', mb: 3 }}>
                <Grid item xs={12} sm={6}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<GoogleIcon />}
                    onClick={handleGoogleSignUp}
                    disabled={isLoading}
                    sx={{
                      py: 1.5,
                      borderColor: '#db4437',
                      color: '#db4437',
                      '&:hover': {
                        borderColor: '#c23321',
                        backgroundColor: '#f5f5f5',
                      },
                    }}
                  >
                    Sign up with Google
                  </Button>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<FacebookIcon />}
                    onClick={handleFacebookSignUp}
                    disabled={isLoading}
                    sx={{
                      py: 1.5,
                      borderColor: '#3b5998',
                      color: '#3b5998',
                      '&:hover': {
                        borderColor: '#2d4373',
                        backgroundColor: '#f5f5f5',
                      },
                    }}
                  >
                    Sign up with Facebook
                  </Button>
                </Grid>
              </Grid>

              <Divider sx={{ width: '100%', my: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Or sign up with email
                </Typography>
              </Divider>

              {/* Email Registration Form */}
              <Box
                component="form"
                onSubmit={handleSubmit(onFirebaseSubmit)}
                sx={{ width: '100%' }}
              >
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      required
                      fullWidth
                      id="name"
                      label="Full Name"
                      name="name"
                      autoComplete="name"
                      {...register('name', {
                        required: 'Full name is required',
                        minLength: {
                          value: 2,
                          message: 'Name must be at least 2 characters',
                        },
                      })}
                      error={!!errors.name}
                      helperText={errors.name?.message}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      required
                      fullWidth
                      id="upid"
                      label="University ID (UPID)"
                      name="upid"
                      {...register('upid', {
                        required: 'University ID is required',
                        pattern: {
                          value: /^UP\d{3}$/,
                          message: 'UPID must be in format UP001',
                        },
                      })}
                      error={!!errors.upid}
                      helperText={errors.upid?.message || 'Format: UP001'}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      required
                      fullWidth
                      id="email"
                      label="Email Address"
                      name="email"
                      autoComplete="email"
                      {...register('email', {
                        required: 'Email is required',
                        pattern: {
                          value: /^\S+@\S+$/i,
                          message: 'Invalid email address',
                        },
                      })}
                      error={!!errors.email}
                      helperText={errors.email?.message}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      id="phone"
                      label="Phone Number"
                      name="phone"
                      autoComplete="tel"
                      {...register('phone', {
                        pattern: {
                          value: /^\+?[\d\s-()]+$/,
                          message: 'Invalid phone number',
                        },
                      })}
                      error={!!errors.phone}
                      helperText={errors.phone?.message}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      required
                      fullWidth
                      name="password"
                      label="Password"
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      autoComplete="new-password"
                      {...register('password', {
                        required: 'Password is required',
                        minLength: {
                          value: 6,
                          message: 'Password must be at least 6 characters',
                        },
                      })}
                      error={!!errors.password}
                      helperText={errors.password?.message}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              onClick={() => setShowPassword(!showPassword)}
                              edge="end"
                            >
                              {showPassword ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      required
                      fullWidth
                      name="confirmPassword"
                      label="Confirm Password"
                      type={showConfirmPassword ? 'text' : 'password'}
                      id="confirmPassword"
                      {...register('confirmPassword', {
                        required: 'Please confirm your password',
                        validate: (value) =>
                          value === watchPassword || 'Passwords do not match',
                      })}
                      error={!!errors.confirmPassword}
                      helperText={errors.confirmPassword?.message}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              edge="end"
                            >
                              {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                </Grid>

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  sx={{ mt: 3, mb: 2, py: 1.5 }}
                  disabled={isLoading}
                >
                  {isLoading ? <CircularProgress size={24} /> : 'Create Account with Firebase'}
                </Button>
              </Box>
            </>
          )}

          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Already have an account?{' '}
              <Link 
                to="/login" 
                style={{ 
                  color: '#1976d2', 
                  textDecoration: 'none' 
                }}
              >
                Sign in here
              </Link>
            </Typography>
          </Box>

          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary">
              {authTab === 0 
                ? "Traditional registration stores data in our database"
                : "Firebase registration provides enhanced security and social login options"
              }
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default RegisterWithFirebase;