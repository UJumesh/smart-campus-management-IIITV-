import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Avatar,
  CircularProgress,
  Alert,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tab,
  Tabs,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { updateUserProfile } from '../../store/slices/userSlice';
import { format } from 'date-fns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';

const Profile = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { loading, error, success } = useSelector((state) => state.users);

  const [editMode, setEditMode] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [departments, setDepartments] = useState({});
  const [departmentsLoading, setDepartmentsLoading] = useState(false);
  
  // Form data state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    mobilePhone: '',
    landlinePhone: '',
    dateOfBirth: null,
    gender: '',
    enrollmentYear: '',
    programName: '',
    designation: '',
    address: {
      street: '',
      city: '',
      state: '',
      country: '',
      zipCode: '',
    },
    emergencyContact: {
      name: '',
      relationship: '',
      phone: '',
    },
    mainDepartment: '',
    subDepartment: '',
  });

  // Validation errors
  const [validationErrors, setValidationErrors] = useState({});

  // Initialize form data from user object
  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        mobilePhone: user.mobilePhone || '',
        landlinePhone: user.landlinePhone || '',
        dateOfBirth: user.dateOfBirth ? new Date(user.dateOfBirth) : null,
        gender: user.gender || '',
        enrollmentYear: user.enrollmentYear || '',
        programName: user.programName || '',
        designation: user.designation || '',
        address: {
          street: user.address?.street || '',
          city: user.address?.city || '',
          state: user.address?.state || '',
          country: user.address?.country || '',
          zipCode: user.address?.zipCode || '',
        },
        emergencyContact: {
          name: user.emergencyContact?.name || '',
          relationship: user.emergencyContact?.relationship || '',
          phone: user.emergencyContact?.phone || '',
        },
        mainDepartment: user.mainDepartment || '',
        subDepartment: user.subDepartment || '',
      });
    }
  }, [user]);

  // Fetch departments
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        setDepartmentsLoading(true);
        const response = await fetch('/api/departments');
        if (!response.ok) {
          throw new Error('Failed to fetch departments');
        }
        const data = await response.json();
        if (data.success && data.data) {
          setDepartments(data.data);
        }
      } catch (error) {
        console.error('Error fetching departments:', error);
      } finally {
        setDepartmentsLoading(false);
      }
    };

    fetchDepartments();
  }, []);

  // Get available sub-departments for selected main department
  const getAvailableSubDepartments = () => {
    if (!formData.mainDepartment || !departments[formData.mainDepartment]) {
      return [];
    }
    return departments[formData.mainDepartment] || [];
  };

  // Handle main department change
  const handleMainDepartmentChange = (e) => {
    const mainDept = e.target.value;
    
    // Update mainDepartment in formData
    setFormData(prev => ({
      ...prev,
      mainDepartment: mainDept,
      // Reset subDepartment when main department changes
      subDepartment: ''
    }));

    // Clear validation error
    if (validationErrors.mainDepartment) {
      setValidationErrors(prev => ({
        ...prev,
        mainDepartment: undefined
      }));
    }
  };

  // Handle form field changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData((prev) => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
    
    // Clear validation error when field is edited
    if (validationErrors[name]) {
      setValidationErrors({
        ...validationErrors,
        [name]: undefined
      });
    }
  };

  // Handle date change
  const handleDateChange = (date) => {
    setFormData((prev) => ({
      ...prev,
      dateOfBirth: date,
    }));
  };

  // Toggle edit mode
  const toggleEditMode = () => {
    if (editMode) {
      // Reset form data if canceling
      if (user) {
        setFormData({
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          email: user.email || '',
          mobilePhone: user.mobilePhone || '',
          landlinePhone: user.landlinePhone || '',
          dateOfBirth: user.dateOfBirth ? new Date(user.dateOfBirth) : null,
          gender: user.gender || '',
          enrollmentYear: user.enrollmentYear || '',
          programName: user.programName || '',
          designation: user.designation || '',
          address: {
            street: user.address?.street || '',
            city: user.address?.city || '',
            state: user.address?.state || '',
            country: user.address?.country || '',
            zipCode: user.address?.zipCode || '',
          },
          emergencyContact: {
            name: user.emergencyContact?.name || '',
            relationship: user.emergencyContact?.relationship || '',
            phone: user.emergencyContact?.phone || '',
          },
          mainDepartment: user.mainDepartment || '',
          subDepartment: user.subDepartment || '',
        });
      }
      setValidationErrors({});
    }
    setEditMode(!editMode);
  };

  // Validate form before submission
  const validateForm = () => {
    const errors = {};
    
    if (!formData.firstName.trim()) {
      errors.firstName = 'First name is required';
    }
    
    if (!formData.lastName.trim()) {
      errors.lastName = 'Last name is required';
    }
    
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email is invalid';
    }
    
    // Add more validations as needed
    
    return errors;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }
    
    // Format the date before sending to API
    const formattedData = {
      ...formData,
      dateOfBirth: formData.dateOfBirth ? format(formData.dateOfBirth, 'yyyy-MM-dd') : null,
    };
    
    await dispatch(updateUserProfile(formattedData));
    
    if (!error) {
      setEditMode(false);
    }
  };

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Get appropriate label based on user role
  const getRoleSpecificLabel = (fieldName) => {
    if (fieldName === 'enrollmentYear') {
      return user?.role === 'student' ? 'Enrollment Year' : 'Joining Year';
    }
    if (fieldName === 'programName') {
      return user?.role === 'student' ? 'Program/Course' : 'Specialization';
    }
    return fieldName;
  };

  // Check if user is an admin
  const isAdmin = user && user.role === 'admin';

  // Render personal information tab
  const renderPersonalInfoTab = () => (
    <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="First Name"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
          disabled={!editMode}
                required
          error={!!validationErrors.firstName}
          helperText={validationErrors.firstName}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Last Name"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
          disabled={!editMode}
                required
          error={!!validationErrors.lastName}
          helperText={validationErrors.lastName}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Email"
                name="email"
                value={formData.email}
                onChange={handleChange}
          disabled={!editMode}
                required
                type="email"
          error={!!validationErrors.email}
          helperText={validationErrors.email}
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <FormControl fullWidth>
          <InputLabel id="gender-label">Gender</InputLabel>
          <Select
            labelId="gender-label"
            name="gender"
            value={formData.gender}
            onChange={handleChange}
            disabled={!editMode}
            label="Gender"
          >
            <MenuItem value="">
              <em>Select Gender</em>
            </MenuItem>
            <MenuItem value="male">Male</MenuItem>
            <MenuItem value="female">Female</MenuItem>
            <MenuItem value="other">Other</MenuItem>
            <MenuItem value="prefer-not-to-say">Prefer not to say</MenuItem>
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs={12} md={6}>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <DatePicker
            label="Date of Birth"
            value={formData.dateOfBirth}
            onChange={handleDateChange}
            disabled={!editMode}
            renderInput={(params) => (
              <TextField {...params} fullWidth name="dateOfBirth" />
            )}
          />
        </LocalizationProvider>
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="Mobile Phone"
          name="mobilePhone"
          value={formData.mobilePhone}
          onChange={handleChange}
          disabled={!editMode}
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="Landline Phone"
          name="landlinePhone"
          value={formData.landlinePhone}
          onChange={handleChange}
          disabled={!editMode}
        />
      </Grid>
    </Grid>
  );

  // Render academic information tab
  const renderAcademicInfoTab = () => (
    <Grid container spacing={3} sx={{ mt: 1 }}>
      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label={getRoleSpecificLabel('enrollmentYear')}
          name="enrollmentYear"
          value={formData.enrollmentYear}
          onChange={handleChange}
          disabled={!editMode}
          type="number"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
          label={getRoleSpecificLabel('programName')}
          name="programName"
          value={formData.programName}
                onChange={handleChange}
          disabled={!editMode}
              />
            </Grid>
      {user?.role !== 'student' && (
            <Grid item xs={12}>
              <TextField
                fullWidth
            label="Designation"
            name="designation"
            value={formData.designation}
                onChange={handleChange}
            disabled={!editMode}
              />
            </Grid>
      )}
      <Grid item xs={12} md={6}>
        <FormControl fullWidth disabled={!editMode || !isAdmin}>
          <InputLabel id="main-department-label">Main Department</InputLabel>
          <Select
            labelId="main-department-label"
            name="mainDepartment"
            value={formData.mainDepartment}
            onChange={handleMainDepartmentChange}
            label="Main Department"
          >
            <MenuItem value="">
              <em>Select Department</em>
            </MenuItem>
            {Object.keys(departments).map((dept) => (
              <MenuItem key={dept} value={dept}>
                {dept}
              </MenuItem>
            ))}
          </Select>
          {!isAdmin && editMode && (
            <FormHelperText>Only administrators can change departments</FormHelperText>
          )}
          {departmentsLoading && (
            <FormHelperText>Loading departments...</FormHelperText>
          )}
        </FormControl>
      </Grid>
      <Grid item xs={12} md={6}>
        <FormControl fullWidth disabled={!editMode || !isAdmin || !formData.mainDepartment}>
          <InputLabel id="sub-department-label">Sub Department</InputLabel>
          <Select
            labelId="sub-department-label"
            name="subDepartment"
            value={formData.subDepartment}
            onChange={handleChange}
            label="Sub Department"
          >
            <MenuItem value="">
              <em>Select Sub Department</em>
            </MenuItem>
            {getAvailableSubDepartments().map((subDept) => (
              <MenuItem key={subDept} value={subDept}>
                {subDept}
              </MenuItem>
            ))}
          </Select>
          {!isAdmin && editMode && (
            <FormHelperText>Only administrators can change departments</FormHelperText>
          )}
          {!formData.mainDepartment && (
            <FormHelperText>Select a main department first</FormHelperText>
          )}
        </FormControl>
      </Grid>
            </Grid>
  );

  // Render address tab
  const renderAddressTab = () => (
    <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Street Address"
                name="address.street"
                value={formData.address.street}
                onChange={handleChange}
          disabled={!editMode}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="City"
                name="address.city"
                value={formData.address.city}
                onChange={handleChange}
          disabled={!editMode}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="State/Province"
                name="address.state"
                value={formData.address.state}
                onChange={handleChange}
          disabled={!editMode}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Country"
                name="address.country"
                value={formData.address.country}
                onChange={handleChange}
          disabled={!editMode}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="ZIP/Postal Code"
                name="address.zipCode"
                value={formData.address.zipCode}
                onChange={handleChange}
          disabled={!editMode}
        />
      </Grid>
    </Grid>
  );

  // Render emergency contact tab
  const renderEmergencyContactTab = () => (
    <Grid container spacing={3} sx={{ mt: 1 }}>
      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="Contact Name"
          name="emergencyContact.name"
          value={formData.emergencyContact.name}
          onChange={handleChange}
          disabled={!editMode}
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="Relationship"
          name="emergencyContact.relationship"
          value={formData.emergencyContact.relationship}
          onChange={handleChange}
          disabled={!editMode}
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="Contact Phone"
          name="emergencyContact.phone"
          value={formData.emergencyContact.phone}
          onChange={handleChange}
          disabled={!editMode}
              />
            </Grid>
          </Grid>
  );

  return (
    <Box p={3}>
      <Paper elevation={2} sx={{ p: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Box display="flex" alignItems="center">
            <Avatar
              src={user?.profileImage}
              sx={{ width: 80, height: 80, mr: 3 }}
            >
              <PersonIcon fontSize="large" />
            </Avatar>
            <Box>
              <Typography variant="h5" gutterBottom>
                Profile Settings
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {editMode ? "Edit your personal information" : "View your personal information"}
              </Typography>
            </Box>
          </Box>
          <Box>
            {editMode ? (
              <>
                <Tooltip title="Cancel">
                  <IconButton onClick={toggleEditMode} color="default" sx={{ mr: 1 }}>
                    <CancelIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Save">
                  <IconButton onClick={handleSubmit} color="primary" disabled={loading}>
                    {loading ? <CircularProgress size={24} /> : <SaveIcon />}
                  </IconButton>
                </Tooltip>
              </>
            ) : (
              <Button
                startIcon={<EditIcon />}
                variant="contained"
                color="primary"
                onClick={toggleEditMode}
              >
                Edit Profile
              </Button>
            )}
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            Profile updated successfully
          </Alert>
        )}

        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={activeTab} 
            onChange={handleTabChange} 
            aria-label="profile tabs"
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab label="Personal Info" />
            <Tab label="Academic/Professional" />
            <Tab label="Address" />
            <Tab label="Emergency Contact" />
          </Tabs>
        </Box>

        <Box p={1}>
          {activeTab === 0 && renderPersonalInfoTab()}
          {activeTab === 1 && renderAcademicInfoTab()}
          {activeTab === 2 && renderAddressTab()}
          {activeTab === 3 && renderEmergencyContactTab()}
        </Box>

        {editMode && (
          <Box mt={3} display="flex" justifyContent="flex-end">
            <Button
              type="submit"
              variant="contained"
              color="primary"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                'Save Changes'
              )}
            </Button>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default Profile; 