import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  Grid,
  Tooltip,
  Alert,
  CircularProgress,
  Checkbox,
  Avatar,
  FormHelperText,
  OutlinedInput,
  InputAdornment,
} from "@mui/material";
import {
  Search,
  Add,
  Edit,
  Delete,
  Download,
  Block,
  CheckCircle,
  VpnKey,
  Person,
  AdminPanelSettings,
  Clear,
  Warning,
  Visibility,
  VisibilityOff,
} from "@mui/icons-material";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import { format } from "date-fns";
import api from "../../services/api";
import { capitalize } from "@mui/material/utils";

// Constants for roles and departments
// eslint-disable-next-line no-unused-vars
const ROLES = ["admin", "lecturer", "student"];
// eslint-disable-next-line no-unused-vars

// eslint-disable-next-line no-unused-vars
const STATUS_COLORS = {
  active: "success",
  inactive: "error",
  pending: "warning",
  suspended: "error",
};

const UserManagement = () => {
  // eslint-disable-next-line no-unused-vars
  const dispatch = useSelector((state) => state.auth);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [mainDepartmentFilter, setMainDepartmentFilter] = useState("");
  const [subDepartmentFilter, setSubDepartmentFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedUsers, setSelectedUsers] = useState([]);
  // eslint-disable-next-line no-unused-vars
  const [anchorEl, setAnchorEl] = useState(null);
  const [actionUser, setActionUser] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogType, setDialogType] = useState(null);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    role: "student",
    mainDepartment: "",
    subDepartment: "",
    status: "active",
  });
  const [totalUsers, setTotalUsers] = useState(0);
  const [exporting, setExporting] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [departments, setDepartments] = useState({});
  const [autoRefreshInterval, setAutoRefreshInterval] = useState(30000); // 30 seconds default
  const [isAutoRefreshEnabled, setIsAutoRefreshEnabled] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  // Fetch users with filters and pagination
  const fetchUsers = useCallback(
    async (retryCount = 0) => {
      try {
        setLoading(true);
        setError(null);

        // Construct query parameters
        const params = new URLSearchParams({
          page: page + 1,
          limit: rowsPerPage,
          ...(searchQuery && { search: searchQuery }),
          ...(roleFilter && { role: roleFilter }),
          ...(mainDepartmentFilter && { mainDepartment: mainDepartmentFilter }),
          ...(subDepartmentFilter && { subDepartment: subDepartmentFilter }),
          ...(statusFilter && { status: statusFilter }),
          // Add a timestamp to prevent caching
          _t: Date.now(),
        });

        console.log("Fetching users with params:", params.toString());

        // Use the users endpoint
        const response = await api.get(`/api/users?${params}`, {
          timeout: 15000, // 15 second timeout
        });

        // Process the response
        if (response.data && response.data.success) {
          const userData = response.data.data || [];
          console.log(`Received ${userData.length} users`);

          // MongoDB should return data with _id fields
          // Make sure all users have their ids properly extracted
          const processedUsers = userData.map((user) => ({
            ...user,
            // Ensure _id is accessible in both formats for compatibility
            id: getUserId(user),
          }));

          // Update state with the received data
          setUsers(processedUsers);
          setTotalUsers(response.data.count || userData.length || 0);

          // Clear any previous errors
          setError(null);
        } else {
          console.error("Invalid API response format:", response.data);
          const errorMsg = response.data?.message || "Invalid response format";
          setError(errorMsg);
          toast.error(`Failed to fetch users: ${errorMsg}`);
        }
      } catch (err) {
        console.error("Error fetching users:", err);

        // If we got a network error or server error and have retries left
        if (
          (err.code === "ECONNABORTED" || err.response?.status >= 500) &&
          retryCount < 2
        ) {
          console.log(`Retrying fetch (attempt ${retryCount + 1}/2)...`);
          // Wait a moment before retrying (increasing delay with each retry)
          setTimeout(() => {
            fetchUsers(retryCount + 1);
          }, 1000 * (retryCount + 1));
          return;
        }

        // Set error state
        const errorMsg =
          err.response?.data?.message || err.message || "Error fetching users";
        setError(errorMsg);
        toast.error(`Failed to fetch users: ${errorMsg}`);

        // If no users were loaded previously, set an empty array
        if (users.length === 0) {
          setUsers([]);
          setTotalUsers(0);
        }
      } finally {
        setLoading(false);
      }
    },
    [
      page,
      rowsPerPage,
      searchQuery,
      roleFilter,
      mainDepartmentFilter,
      subDepartmentFilter,
      statusFilter,
      users.length,
    ]
  );

  // Initial data fetch
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Set up auto-refresh
  useEffect(() => {
    let intervalId;

    if (isAutoRefreshEnabled && autoRefreshInterval > 0) {
      console.log(
        `Setting up auto-refresh every ${autoRefreshInterval / 1000} seconds`
      );
      intervalId = setInterval(() => {
        console.log("Auto-refreshing user data...");
        fetchUsers();
      }, autoRefreshInterval);
    }

    // Clean up interval on component unmount or when dependencies change
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [fetchUsers, isAutoRefreshEnabled, autoRefreshInterval]);

  // Toggle auto-refresh
  const toggleAutoRefresh = useCallback(() => {
    setIsAutoRefreshEnabled((prev) => !prev);
  }, []);

  // Change auto-refresh interval
  const changeRefreshInterval = useCallback((newInterval) => {
    setAutoRefreshInterval(newInterval);
  }, []);

  // Filtered users based on search and filters
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const searchMatch =
        searchQuery === "" ||
        user.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase());

      const roleMatch = !roleFilter || user.role === roleFilter;
      const mainDeptMatch =
        !mainDepartmentFilter || user.mainDepartment === mainDepartmentFilter;
      const subDeptMatch =
        !subDepartmentFilter || user.subDepartment === subDepartmentFilter;
      const statusMatch = !statusFilter || user.status === statusFilter;

      return (
        searchMatch && roleMatch && mainDeptMatch && subDeptMatch && statusMatch
      );
    });
  }, [
    users,
    searchQuery,
    roleFilter,
    mainDepartmentFilter,
    subDepartmentFilter,
    statusFilter,
  ]);

  // Use filteredUsers in the table
  const displayUsers = useMemo(() => {
    const start = page * rowsPerPage;
    const end = start + rowsPerPage;
    return filteredUsers.slice(start, end);
  }, [filteredUsers, page, rowsPerPage]);

  // Fetch departments with error handling
  const fetchDepartments = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get("/api/departments");
      if (response.data.success) {
        setDepartments(response.data.data);
        console.log("Departments loaded:", response.data.data);
      } else {
        console.error("Failed to fetch departments:", response.data.message);
        toast.error("Failed to load departments: " + response.data.message);
      }
    } catch (error) {
      console.error("Error fetching departments:", error);
      toast.error(
        "Failed to fetch departments: " +
          (error.response?.data?.message || error.message)
      );
      // Set a default department structure if fetching fails
      setDepartments({
        "School of Engineering": [
          "Computer Engineering",
          "Electrical Engineering",
          "Mechanical Engineering",
        ],
        "School of Business": [
          "Business Administration",
          "Accounting",
          "Marketing",
        ],
        "School of Science": ["Computer Science", "Mathematics", "Physics"],
        Administration: ["Administration"],
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  // Handle main department change with improved subDepartment handling
  const handleMainDepartmentChange = (e) => {
    const { value } = e.target;

    // Get available sub-departments for selected main department
    const subDepts = departments[value] || [];

    // Update form data
    setFormData((prev) => {
      // Determine the sub-department value
      let newSubDept = "";

      // If there's only one sub-department, select it automatically
      if (subDepts.length === 1) {
        newSubDept = subDepts[0];
      }
      // If current sub-department is in the new list, keep it
      else if (prev.subDepartment && subDepts.includes(prev.subDepartment)) {
        newSubDept = prev.subDepartment;
      }

      return {
        ...prev,
        mainDepartment: value,
        subDepartment: newSubDept,
      };
    });

    // Clear validation errors for main department
    if (validationErrors.mainDepartment) {
      setValidationErrors((prev) => ({
        ...prev,
        mainDepartment: undefined,
      }));
    }
  };

  // Helper function to get the user ID
  const getUserId = (user) => {
    if (!user) return "";
    // MongoDB uses _id, but our code might have id in some places
    return user._id || user.id || "";
  };

  // Handle user actions
  const handleAction = async (action, userData = null) => {
    try {
      setActionLoading(true);
      const actionUser = userData || formData;
      const userId = getUserId(actionUser);

      if (
        (action === "update" ||
          action === "delete" ||
          action === "change-status" ||
          action === "reset-password") &&
        !userId
      ) {
        throw new Error(`Cannot perform ${action}: User ID is missing`);
      }

      // Perform the action
      switch (action) {
        case "create":
          // Create a new user
          const createResponse = await api.post("/api/users", userData);
          if (createResponse.data.success) {
            toast.success("User created successfully");
            await fetchUsers(); // Refresh user list
            handleCloseDialog();
          } else {
            throw new Error(
              createResponse.data.message || "Failed to create user"
            );
          }
          break;

        case "update":
          // Update an existing user - ensure we use MongoDB _id
          const updateResponse = await api.put(
            `/api/users/${userId}`,
            userData
          );
          if (updateResponse.data.success) {
            toast.success("User updated successfully");
            handleCloseDialog();

            // Immediately update the user in the local state
            if (updateResponse.data.data) {
              setUsers((prevUsers) =>
                prevUsers.map((user) =>
                  getUserId(user) === userId ? updateResponse.data.data : user
                )
              );
            } else {
              // If no data returned, update with the sent data
              setUsers((prevUsers) =>
                prevUsers.map((user) =>
                  getUserId(user) === userId ? { ...user, ...userData } : user
                )
              );
            }

            // Also refresh from the server to ensure consistency
            setTimeout(() => fetchUsers(), 500);
          } else {
            throw new Error(
              updateResponse.data.message || "Failed to update user"
            );
          }
          break;

        case "delete":
          // Delete a user - ensure we use MongoDB _id
          const deleteResponse = await api.delete(`/api/users/${userId}`);
          if (deleteResponse.data.success) {
            toast.success("User deleted successfully");
            handleCloseDialog();

            // Immediately remove the user from the local state
            setUsers((prevUsers) =>
              prevUsers.filter((user) => getUserId(user) !== userId)
            );
            setTotalUsers((prevTotal) => prevTotal - 1);

            // Also refresh from the server to ensure consistency
            setTimeout(() => fetchUsers(), 500);
          } else {
            throw new Error(
              deleteResponse.data.message || "Failed to delete user"
            );
          }
          break;

        case "change-status":
          // Change user status (active/inactive) - ensure we use MongoDB _id
          const statusResponse = await api.patch(
            `/api/users/${userId}/status`,
            { status: userData.status }
          );
          if (statusResponse.data.success) {
            toast.success(
              `User ${
                userData.status === "active" ? "activated" : "deactivated"
              } successfully`
            );
            handleCloseDialog();

            // Immediately update the user's status in the local state
            setUsers((prevUsers) =>
              prevUsers.map((user) =>
                getUserId(user) === userId
                  ? { ...user, status: userData.status }
                  : user
              )
            );

            // Also refresh from the server to ensure consistency
            setTimeout(() => fetchUsers(), 500);
          } else {
            throw new Error(
              statusResponse.data.message || "Failed to update user status"
            );
          }
          break;

        case "reset-password":
          // Reset user password - ensure we use MongoDB _id
          const resetResponse = await api.post(
            `/api/users/${userId}/reset-password`
          );
          if (resetResponse.data.success) {
            toast.success(
              resetResponse.data.message ||
                "Password has been reset to system default"
            );
            handleCloseDialog();
          } else {
            throw new Error(
              resetResponse.data.message || "Failed to reset password"
            );
          }
          break;

        case "bulk-update":
          // Bulk update users - ensure we use MongoDB _ids
          if (!selectedUsers || selectedUsers.length === 0) {
            throw new Error("No users selected for bulk update");
          }

          const bulkResponse = await api.patch("/api/users/bulk", {
            userIds: selectedUsers, // These should be MongoDB _ids
            updates: userData,
          });

          if (bulkResponse.data.success) {
            toast.success("Users updated successfully");

            // Immediately update the selected users in the local state
            setUsers((prevUsers) =>
              prevUsers.map((user) =>
                selectedUsers.includes(getUserId(user))
                  ? { ...user, ...userData }
                  : user
              )
            );

            setSelectedUsers([]);
            handleCloseDialog();

            // Also refresh from the server to ensure consistency
            setTimeout(() => fetchUsers(), 500);
          } else {
            throw new Error(
              bulkResponse.data.message || "Failed to update users in bulk"
            );
          }
          break;

        default:
          throw new Error("Unknown action");
      }
    } catch (error) {
      console.error(`Error in ${action} action:`, error);
      toast.error(
        error.response?.data?.message ||
          error.message ||
          `Failed to ${action} user`
      );
    } finally {
      setActionLoading(false);
    }
  };

  // Dialog handlers
  const handleOpenDialog = (type, user = null) => {
    setDialogType(type);
    setActionUser(user);

    // Initialize form data based on action type
    if (type === "create") {
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        role: "student",
        mainDepartment: "",
        subDepartment: "",
        status: "active",
        password: "",
      });
    } else if (type === "update" && user) {
      // For MongoDB-stored users, ensure we get all fields
      setFormData({
        _id: getUserId(user), // Ensure we store the MongoDB _id
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
        role: user.role || "student",
        mainDepartment: user.mainDepartment || "",
        subDepartment: user.subDepartment || "",
        status: user.status || "active",
      });
    } else if (type === "change-status" && user) {
      setFormData({
        _id: getUserId(user), // Ensure we store the MongoDB _id
        status: user.status === "active" ? "inactive" : "active",
      });
    } else if (type === "delete" || type === "reset-password") {
      // Just ensure we have the ID
      setFormData({
        _id: getUserId(user),
      });
    }

    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setDialogType(null);
    setActionUser(null);
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      role: "student",
      mainDepartment: "",
      subDepartment: "",
      password: "",
    });
    setValidationErrors({});
  };

  // Handle form input changes
  const handleFormChange = (e) => {
    const { name, value } = e.target;

    // Special handling for role changes
    if (name === "role") {
      if (value === "admin") {
        // Set departments to Administration for admin role
        setFormData((prev) => ({
          ...prev,
          [name]: value,
          mainDepartment: "Administration",
          subDepartment: "Administration",
        }));
      } else {
        // Clear departments for non-admin roles
        setFormData((prev) => ({
          ...prev,
          [name]: value,
          mainDepartment: "",
          subDepartment: "",
        }));
      }
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }

    // Clear validation errors for the changed field
    if (validationErrors[name]) {
      setValidationErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  // Validate form data
  const validateForm = (data) => {
    const errors = {};

    // Validate first name
    if (!data.firstName || !data.firstName.trim()) {
      errors.firstName = "First name is required";
    } else if (data.firstName.length > 50) {
      errors.firstName = "First name is too long (max 50 characters)";
    }

    // Validate last name
    if (!data.lastName || !data.lastName.trim()) {
      errors.lastName = "Last name is required";
    } else if (data.lastName.length > 50) {
      errors.lastName = "Last name is too long (max 50 characters)";
    }

    // Validate email
    if (!data.email || !data.email.trim()) {
      errors.email = "Email is required";
    } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(data.email)) {
      errors.email = "Please enter a valid email address";
    }

    // Validate role
    if (!data.role) {
      errors.role = "Role is required";
    } else if (!["admin", "lecturer", "student"].includes(data.role)) {
      errors.role = "Invalid role selected";
    }

    // Only validate departments for non-admin roles
    if (data.role !== "admin") {
      // Validate main department
      if (!data.mainDepartment) {
        errors.mainDepartment = "Main department is required";
      }

      // Validate sub-department (only if main department is selected)
      if (data.mainDepartment && !data.subDepartment) {
        errors.subDepartment = "Sub department is required";
      }
    }

    // Validate password for new users
    if (
      dialogType === "create" &&
      (!data.password || data.password.length < 6)
    ) {
      errors.password = "Password must be at least 6 characters long";
    }

    return errors;
  };

  // Handle form submission
  const handleDialogSubmit = async (e) => {
    if (e) e.preventDefault();

    // Only validate create/update forms
    if (dialogType === "create" || dialogType === "update") {
      // Validate form
      const errors = validateForm(formData);
      if (Object.keys(errors).length > 0) {
        setValidationErrors(errors);
        toast.error("Please fix the form errors");
        return;
      }
    }

    setValidationErrors({});

    try {
      // For admin users, ensure departments are set to Administration
      const userData = { ...formData };
      if (
        (dialogType === "create" || dialogType === "update") &&
        userData.role === "admin"
      ) {
        userData.mainDepartment = "Administration";
        userData.subDepartment = "Administration";
      }

      // Submit form
      await handleAction(dialogType, userData);
    } catch (error) {
      console.error(`Error in form submission (${dialogType}):`, error);
      toast.error(
        error.response?.data?.message ||
          error.message ||
          `Failed to ${dialogType} user`
      );
    }
  };

  // Render dialog content based on type
  const renderDialogContent = () => {
    switch (dialogType) {
      case "create":
      case "update":
        const isAdmin = formData.role === "admin";
        return (
          <form onSubmit={handleDialogSubmit}>
            <Box sx={{ pt: 1, pb: 2 }}>
              <Typography
                variant="subtitle1"
                color="primary.dark"
                sx={{
                  mb: 3,
                  fontWeight: 600,
                  pb: 1.5,
                  borderBottom: "1px solid rgba(25, 118, 210, 0.1)",
                }}
              >
                {dialogType === "create"
                  ? "Enter User Details"
                  : "Update User Information"}
              </Typography>

              <Box sx={{ mb: 3 }}>
                <Typography
                  variant="subtitle2"
                  sx={{ mb: 1.5, color: "text.secondary", fontWeight: 600 }}
                >
                  Personal Information
                </Typography>
                <Grid container spacing={2.5}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="First Name"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleFormChange}
                      error={!!validationErrors.firstName}
                      helperText={validationErrors.firstName}
                      required
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          borderRadius: 1.5,
                          transition: "all 0.2s",
                          "&:hover .MuiOutlinedInput-notchedOutline": {
                            borderColor: "primary.main",
                          },
                        },
                        "& .MuiInputLabel-asterisk": {
                          color: "error.main",
                        },
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Last Name"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleFormChange}
                      error={!!validationErrors.lastName}
                      helperText={validationErrors.lastName}
                      required
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          borderRadius: 1.5,
                          transition: "all 0.2s",
                          "&:hover .MuiOutlinedInput-notchedOutline": {
                            borderColor: "primary.main",
                          },
                        },
                        "& .MuiInputLabel-asterisk": {
                          color: "error.main",
                        },
                      }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleFormChange}
                      error={!!validationErrors.email}
                      helperText={validationErrors.email}
                      required
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          borderRadius: 1.5,
                          transition: "all 0.2s",
                          "&:hover .MuiOutlinedInput-notchedOutline": {
                            borderColor: "primary.main",
                          },
                        },
                        "& .MuiInputLabel-asterisk": {
                          color: "error.main",
                        },
                      }}
                    />
                  </Grid>
                </Grid>
              </Box>

              <Box sx={{ mb: 3 }}>
                <Typography
                  variant="subtitle2"
                  sx={{ mb: 1.5, color: "text.secondary", fontWeight: 600 }}
                >
                  Role & Department
                </Typography>
                <Grid container spacing={2.5}>
                  <Grid item xs={12} sm={isAdmin ? 12 : 6}>
                    <FormControl
                      fullWidth
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          borderRadius: 1.5,
                          transition: "all 0.2s",
                          "&:hover .MuiOutlinedInput-notchedOutline": {
                            borderColor: "primary.main",
                          },
                        },
                      }}
                    >
                      <InputLabel
                        required
                        sx={{
                          "& .MuiInputLabel-asterisk": { color: "error.main" },
                        }}
                      >
                        Role
                      </InputLabel>
                      <Select
                        name="role"
                        value={formData.role}
                        onChange={handleFormChange}
                        sx={{
                          "& .MuiSelect-select": {
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                          },
                        }}
                      >
                        <MenuItem
                          value="admin"
                          sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
                          <AdminPanelSettings
                            fontSize="small"
                            sx={{ color: "primary.main", opacity: 0.9 }}
                          />
                          Admin
                        </MenuItem>
                        <MenuItem
                          value="lecturer"
                          sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
                          <Person
                            fontSize="small"
                            sx={{ color: "warning.main", opacity: 0.9 }}
                          />
                          Lecturer
                        </MenuItem>
                        <MenuItem
                          value="student"
                          sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
                          <Person
                            fontSize="small"
                            sx={{ color: "secondary.main", opacity: 0.9 }}
                          />
                          Student
                        </MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  {!isAdmin && (
                    <>
                      <Grid item xs={12} sm={6}>
                        <FormControl
                          fullWidth
                          sx={{
                            "& .MuiOutlinedInput-root": {
                              borderRadius: 1.5,
                              transition: "all 0.2s",
                              "&:hover .MuiOutlinedInput-notchedOutline": {
                                borderColor: "primary.main",
                              },
                            },
                          }}
                        >
                          <InputLabel
                            required
                            sx={{
                              "& .MuiInputLabel-asterisk": {
                                color: "error.main",
                              },
                            }}
                          >
                            Main Department
                          </InputLabel>
                          <Select
                            name="mainDepartment"
                            value={formData.mainDepartment}
                            onChange={handleMainDepartmentChange}
                            required={!isAdmin}
                            error={!!validationErrors.mainDepartment}
                          >
                            {Object.keys(departments).map((dept) => (
                              <MenuItem key={dept} value={dept}>
                                {dept}
                              </MenuItem>
                            ))}
                          </Select>
                          {validationErrors.mainDepartment && (
                            <FormHelperText error>
                              {validationErrors.mainDepartment}
                            </FormHelperText>
                          )}
                        </FormControl>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <FormControl
                          fullWidth
                          sx={{
                            "& .MuiOutlinedInput-root": {
                              borderRadius: 1.5,
                              transition: "all 0.2s",
                              "&:hover .MuiOutlinedInput-notchedOutline": {
                                borderColor: "primary.main",
                              },
                            },
                          }}
                        >
                          <InputLabel
                            required
                            sx={{
                              "& .MuiInputLabel-asterisk": {
                                color: "error.main",
                              },
                            }}
                          >
                            Sub Department
                          </InputLabel>
                          <Select
                            name="subDepartment"
                            value={formData.subDepartment}
                            onChange={handleFormChange}
                            disabled={!formData.mainDepartment}
                            required={!isAdmin}
                            error={!!validationErrors.subDepartment}
                          >
                            {formData.mainDepartment &&
                              departments[formData.mainDepartment]?.map(
                                (subDept) => (
                                  <MenuItem key={subDept} value={subDept}>
                                    {subDept}
                                  </MenuItem>
                                )
                              )}
                          </Select>
                          {validationErrors.subDepartment && (
                            <FormHelperText error>
                              {validationErrors.subDepartment}
                            </FormHelperText>
                          )}
                        </FormControl>
                      </Grid>
                    </>
                  )}
                </Grid>
              </Box>

              {dialogType === "create" && (
                <Box sx={{ mb: 1 }}>
                  <Typography
                    variant="subtitle2"
                    sx={{ mb: 1.5, color: "text.secondary", fontWeight: 600 }}
                  >
                    Security
                  </Typography>
                  <Grid container spacing={2.5}>
                    <Grid item xs={12}>
                      <FormControl
                        variant="outlined"
                        fullWidth
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            borderRadius: 1.5,
                            transition: "all 0.2s",
                            "&:hover .MuiOutlinedInput-notchedOutline": {
                              borderColor: "primary.main",
                            },
                          },
                        }}
                      >
                        <InputLabel
                          htmlFor="password-input"
                          required
                          error={!!validationErrors.password}
                          sx={{
                            "& .MuiInputLabel-asterisk": {
                              color: "error.main",
                            },
                          }}
                        >
                          Password
                        </InputLabel>
                        <OutlinedInput
                          id="password-input"
                          name="password"
                          type={showPassword ? "text" : "password"}
                          value={formData.password}
                          onChange={handleFormChange}
                          error={!!validationErrors.password}
                          endAdornment={
                            <InputAdornment position="end">
                              <IconButton
                                onClick={() => setShowPassword(!showPassword)}
                                edge="end"
                              >
                                {showPassword ? (
                                  <VisibilityOff />
                                ) : (
                                  <Visibility />
                                )}
                              </IconButton>
                            </InputAdornment>
                          }
                          label="Password"
                        />
                        {validationErrors.password && (
                          <FormHelperText error id="password-error">
                            {validationErrors.password}
                          </FormHelperText>
                        )}
                      </FormControl>
                    </Grid>
                  </Grid>
                </Box>
              )}
            </Box>
          </form>
        );

      case "delete":
        return (
          <Box sx={{ pt: 1, pb: 2, textAlign: "center" }}>
            <Box
              sx={{
                width: 56,
                height: 56,
                borderRadius: "50%",
                bgcolor: "error.light",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                mx: "auto",
                mb: 2,
              }}
            >
              <Warning sx={{ color: "error.main", fontSize: 32 }} />
            </Box>
            <Typography variant="h6" gutterBottom>
              Delete User
            </Typography>
            <Typography color="text.secondary">
              Are you sure you want to delete {actionUser?.firstName}{" "}
              {actionUser?.lastName}? This action cannot be undone.
            </Typography>
          </Box>
        );

      case "change-status":
        return (
          <Box sx={{ pt: 1, pb: 2, textAlign: "center" }}>
            <Box
              sx={{
                width: 56,
                height: 56,
                borderRadius: "50%",
                bgcolor:
                  formData.status === "active"
                    ? "success.light"
                    : "warning.light",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                mx: "auto",
                mb: 2,
              }}
            >
              {formData.status === "active" ? (
                <CheckCircle sx={{ color: "success.main", fontSize: 32 }} />
              ) : (
                <Block sx={{ color: "warning.main", fontSize: 32 }} />
              )}
            </Box>
            <Typography variant="h6" gutterBottom>
              {formData.status === "active" ? "Activate" : "Deactivate"} User
            </Typography>
            <Typography color="text.secondary">
              Are you sure you want to{" "}
              {formData.status === "active" ? "activate" : "deactivate"}{" "}
              {actionUser?.firstName} {actionUser?.lastName}?
            </Typography>
          </Box>
        );

      case "reset-password":
        return (
          <Box sx={{ pt: 1, pb: 2, textAlign: "center" }}>
            <Box
              sx={{
                width: 56,
                height: 56,
                borderRadius: "50%",
                bgcolor: "primary.light",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                mx: "auto",
                mb: 2,
              }}
            >
              <VpnKey sx={{ color: "primary.main", fontSize: 32 }} />
            </Box>
            <Typography variant="h6" gutterBottom>
              Reset Password
            </Typography>
            <Typography color="text.secondary">
              Are you sure you want to reset the password for{" "}
              {actionUser?.firstName} {actionUser?.lastName}? Their password
              will be changed to the system default.
            </Typography>
          </Box>
        );

      default:
        return null;
    }
  };

  // Export users
  const handleExportUsers = async () => {
    try {
      setExporting(true);
      console.log("Exporting users for download...");

      // Use the existing users endpoint with a large limit instead of a specific export endpoint
      const response = await api.get(`/api/users?limit=1000&_t=${Date.now()}`);

      if (!response.data || !response.data.success) {
        throw new Error(
          response.data?.message || "Failed to retrieve users data for export"
        );
      }

      // Get users from the response
      const data = response.data.data || [];

      if (data.length === 0) {
        toast.info("No users available to export");
        return;
      }

      console.log(`Exporting ${data.length} users to CSV...`);

      // Convert to CSV
      const headers = [
        "First Name",
        "Last Name",
        "Email",
        "Role",
        "Department",
        "Status",
        "Registration Date",
      ];

      const csv = [
        headers.join(","),
        ...data.map((user) =>
          [
            user.firstName ? `"${user.firstName.replace(/"/g, '""')}"` : "",
            user.lastName ? `"${user.lastName.replace(/"/g, '""')}"` : "",
            user.email ? `"${user.email.replace(/"/g, '""')}"` : "",
            user.role ? `"${user.role}"` : "",
            user.mainDepartment
              ? `"${user.mainDepartment}${
                  user.subDepartment ? ` - ${user.subDepartment}` : ""
                }"`
              : `"Not Assigned"`,
            user.status ? `"${user.status}"` : `"active"`,
            user.createdAt
              ? `"${new Date(user.createdAt).toLocaleDateString()}"`
              : "",
          ].join(",")
        ),
      ].join("\n");

      // Download file
      const blob = new Blob([csv], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `users-export-${format(new Date(), "yyyy-MM-dd")}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success(`Successfully exported ${data.length} users`);
    } catch (err) {
      console.error("Error exporting users:", err);
      toast.error(
        err.response?.data?.message || err.message || "Failed to export users"
      );
    } finally {
      setExporting(false);
    }
  };

  // Bulk update users
  const handleBulkAction = async (action) => {
    try {
      if (selectedUsers.length === 0) {
        toast.warn("No users selected");
        return;
      }

      setActionLoading(true);
      const status = action === "activate" ? "active" : "inactive";

      // Check if all IDs are valid MongoDB ObjectIds
      if (selectedUsers.some((id) => !id || id.length !== 24)) {
        toast.error("Some selected user IDs are invalid");
        return;
      }

      const response = await api.patch("/api/users/bulk", {
        userIds: selectedUsers,
        updates: { status },
      });

      if (!response.data || !response.data.success) {
        throw new Error(response.data?.message || `Failed to ${action} users`);
      }

      toast.success(`${selectedUsers.length} users ${action}d successfully`);

      // Update local state immediately
      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          selectedUsers.includes(getUserId(user)) ? { ...user, status } : user
        )
      );

      // Clear selection
      setSelectedUsers([]);

      // Refresh data
      await fetchUsers();
    } catch (error) {
      console.error(`Error ${action}ing users:`, error);
      let errorMessage = `Failed to ${action} users`;

      if (error.response?.data?.message) {
        errorMessage += `: ${error.response.data.message}`;
      } else if (error.message.includes("ObjectId")) {
        errorMessage += ": Invalid MongoDB ID format";
      } else if (error.message) {
        errorMessage += `: ${error.message}`;
      }

      toast.error(errorMessage);
    } finally {
      setActionLoading(false);
    }
  };

  // Render the table actions section without the duplicate Add User button
  const renderTableActions = () => {
    return (
      <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2, mb: 2 }}>
        {selectedUsers.length > 0 ? (
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button
              variant="outlined"
              color="primary"
              onClick={() => handleBulkAction("activate")}
              disabled={actionLoading}
            >
              Activate Selected
            </Button>
            <Button
              variant="outlined"
              color="secondary"
              onClick={() => handleBulkAction("deactivate")}
              disabled={actionLoading}
            >
              Deactivate Selected
            </Button>
          </Box>
        ) : null}
      </Box>
    );
  };

  // Handle selecting all users
  const handleSelectAllClick = (event) => {
    if (event.target.checked) {
      // Select all users using MongoDB _id
      const newSelected = users.map((user) => getUserId(user));
      setSelectedUsers(newSelected);
    } else {
      // Deselect all users
      setSelectedUsers([]);
    }
  };

  // Handle selecting a single user
  const handleSelectUser = (event, userId) => {
    if (event.target.checked) {
      // Add user to selected (MongoDB _id)
      setSelectedUsers((prev) => [...prev, userId]);
    } else {
      // Remove user from selected
      setSelectedUsers((prev) => prev.filter((id) => id !== userId));
    }
  };

  // Handle page change
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  // Handle rows per page change
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <Box
      p={3}
      sx={{
        background:
          "linear-gradient(to bottom, rgba(25, 118, 210, 0.03), rgba(255, 255, 255, 0))",
        minHeight: "calc(100vh - 88px)",
      }}
    >
      <Paper
        elevation={0}
        sx={{
          p: 3,
          borderRadius: 3,
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
          overflow: "hidden",
          border: "1px solid rgba(25, 118, 210, 0.1)",
        }}
      >
        {/* Header with Stats Summary */}
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            justifyContent: "space-between",
            alignItems: { xs: "flex-start", md: "center" },
            mb: 4,
            gap: 2,
          }}
        >
          <Box>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                background: "linear-gradient(90deg, #1976d2, #0d47a1)",
                backgroundClip: "text",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                textShadow: "0 1px 2px rgba(0,0,0,0.05)",
                mb: 1,
              }}
            >
              User Management
            </Typography>
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{ fontWeight: 500 }}
            >
              Manage all registered users and their roles in the system
            </Typography>
          </Box>

          {/* Stats Cards */}
          <Box
            sx={{
              display: "flex",
              gap: 2,
              flexWrap: "wrap",
            }}
          >
            <Paper
              sx={{
                px: 2.5,
                py: 1.5,
                display: "flex",
                alignItems: "center",
                borderRadius: 2,
                boxShadow: "0 4px 12px rgba(25, 118, 210, 0.1)",
                background:
                  "linear-gradient(135deg, rgba(25, 118, 210, 0.05), rgba(13, 71, 161, 0.08))",
                border: "1px solid rgba(25, 118, 210, 0.1)",
                minWidth: 170,
              }}
            >
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  mr: 1.5,
                  background: "linear-gradient(135deg, #1976d2, #0d47a1)",
                  boxShadow: "0 4px 8px rgba(25, 118, 210, 0.25)",
                }}
              >
                <Person sx={{ color: "white", fontSize: 22 }} />
              </Box>
              <Box>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ fontWeight: 500 }}
                >
                  Total Users
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  {users.length}
                </Typography>
              </Box>
            </Paper>

            <Paper
              sx={{
                px: 2.5,
                py: 1.5,
                display: "flex",
                alignItems: "center",
                borderRadius: 2,
                boxShadow: "0 4px 12px rgba(25, 118, 210, 0.1)",
                background:
                  "linear-gradient(135deg, rgba(25, 118, 210, 0.05), rgba(13, 71, 161, 0.08))",
                border: "1px solid rgba(25, 118, 210, 0.1)",
                minWidth: 170,
              }}
            >
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  mr: 1.5,
                  background: "linear-gradient(135deg, #0288d1, #01579b)",
                  boxShadow: "0 4px 8px rgba(2, 136, 209, 0.25)",
                }}
              >
                <AdminPanelSettings sx={{ color: "white", fontSize: 22 }} />
              </Box>
              <Box>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ fontWeight: 500 }}
                >
                  Admins
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  {users.filter((user) => user.role === "admin").length}
                </Typography>
              </Box>
            </Paper>
          </Box>
        </Box>

        {/* Action Buttons + Search */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 3,
            flexDirection: { xs: "column", sm: "row" },
            gap: 2,
          }}
        >
          <Box sx={{ display: "flex", gap: 2 }}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<Add />}
              onClick={() => handleOpenDialog("create")}
              sx={{
                borderRadius: 2,
                px: 2.5,
                py: 1.1,
                boxShadow: "0 4px 10px rgba(25, 118, 210, 0.3)",
                transition: "all 0.2s",
                "&:hover": {
                  transform: "translateY(-2px)",
                  boxShadow: "0 6px 15px rgba(25, 118, 210, 0.4)",
                },
              }}
            >
              Add User
            </Button>

            <Button
              variant="outlined"
              color="primary"
              startIcon={<Download />}
              onClick={handleExportUsers}
              disabled={exporting}
              sx={{
                borderRadius: 2,
                px: 2.5,
                py: 1.1,
                borderColor: "primary.main",
                borderWidth: "1.5px",
                transition: "all 0.2s",
                "&:hover": {
                  borderColor: "primary.dark",
                  backgroundColor: "rgba(25, 118, 210, 0.04)",
                },
                position: "relative",
                "&::after": exporting
                  ? {
                      content: '""',
                      position: "absolute",
                      inset: 0,
                      borderRadius: "inherit",
                      background: "rgba(25, 118, 210, 0.1)",
                      animation: "pulse 1.5s infinite",
                    }
                  : {},
                "@keyframes pulse": {
                  "0%": { opacity: 0.6 },
                  "50%": { opacity: 0.3 },
                  "100%": { opacity: 0.6 },
                },
              }}
            >
              {exporting ? "Exporting..." : "Export"}
            </Button>
          </Box>

          <Box sx={{ width: { xs: "100%", sm: "auto", minWidth: 250 } }}>
            <TextField
              fullWidth
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: <Search color="action" sx={{ mr: 1 }} />,
                sx: { borderRadius: 2 },
              }}
              variant="outlined"
              size="small"
              sx={{
                "& .MuiOutlinedInput-root": {
                  transition: "all 0.3s",
                  borderRadius: 2,
                  "&:hover .MuiOutlinedInput-notchedOutline": {
                    borderColor: "primary.main",
                    borderWidth: "1px",
                  },
                  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                    borderColor: "primary.main",
                  },
                },
              }}
            />
          </Box>
        </Box>

        {/* Filter Toolbar */}
        <Box
          sx={{
            mb: 3,
            p: 2,
            borderRadius: 2,
            backgroundColor: "rgba(25, 118, 210, 0.04)",
            border: "1px solid rgba(25, 118, 210, 0.08)",
            display: "flex",
            flexWrap: "wrap",
            gap: 2,
            alignItems: "center",
          }}
        >
          <Typography
            variant="subtitle2"
            sx={{ color: "text.secondary", mr: 1 }}
          >
            Filter by:
          </Typography>

          <FormControl sx={{ minWidth: 150 }} size="small">
            <InputLabel>Role</InputLabel>
            <Select
              value={roleFilter}
              label="Role"
              onChange={(e) => setRoleFilter(e.target.value)}
              sx={{ borderRadius: 2 }}
            >
              <MenuItem value="">All Roles</MenuItem>
              <MenuItem value="admin">Admin</MenuItem>
              <MenuItem value="student">Student</MenuItem>
              <MenuItem value="faculty">Faculty</MenuItem>
              <MenuItem value="staff">Staff</MenuItem>
            </Select>
          </FormControl>

          <FormControl sx={{ minWidth: 150 }} size="small">
            <InputLabel>Status</InputLabel>
            <Select
              value={statusFilter}
              label="Status"
              onChange={(e) => setStatusFilter(e.target.value)}
              sx={{ borderRadius: 2 }}
            >
              <MenuItem value="">All Status</MenuItem>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="inactive">Inactive</MenuItem>
              <MenuItem value="pending">Pending</MenuItem>
            </Select>
          </FormControl>

          {(roleFilter || statusFilter) && (
            <Button
              size="small"
              variant="text"
              color="primary"
              onClick={() => {
                setRoleFilter("");
                setStatusFilter("");
              }}
              startIcon={<Clear />}
              sx={{ ml: "auto" }}
            >
              Clear Filters
            </Button>
          )}
        </Box>

        {/* Users Table */}
        <Paper
          sx={{
            width: "100%",
            overflow: "hidden",
            borderRadius: 2,
            boxShadow: "0 2px 15px rgba(0, 0, 0, 0.05)",
            border: "1px solid rgba(25, 118, 210, 0.08)",
          }}
        >
          {loading ? (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                flexDirection: "column",
                py: 4,
              }}
            >
              <CircularProgress
                sx={{
                  color: "primary.main",
                  "& .MuiCircularProgress-circle": {
                    strokeLinecap: "round",
                  },
                }}
              />
              <Typography sx={{ mt: 2, color: "text.secondary" }}>
                Loading users...
              </Typography>
            </Box>
          ) : error ? (
            <Alert
              severity="error"
              sx={{
                m: 2,
                borderRadius: 2,
                animation: "shake 0.5s",
                "@keyframes shake": {
                  "0%, 100%": { transform: "translateX(0)" },
                  "10%, 30%, 50%, 70%, 90%": { transform: "translateX(-5px)" },
                  "20%, 40%, 60%, 80%": { transform: "translateX(5px)" },
                },
              }}
            >
              {error}
            </Alert>
          ) : filteredUsers.length === 0 ? (
            <Box sx={{ p: 4, textAlign: "center" }}>
              <Box
                sx={{
                  width: 60,
                  height: 60,
                  borderRadius: "50%",
                  backgroundColor: "rgba(25, 118, 210, 0.08)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto",
                  mb: 2,
                }}
              >
                <Search color="text.secondary" sx={{ fontSize: 30 }} />
              </Box>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No users found
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Try adjusting your search or filter criteria
              </Typography>
            </Box>
          ) : (
            <>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow
                      sx={{
                        "& .MuiTableCell-root": {
                          fontWeight: 600,
                          backgroundColor: "rgba(25, 118, 210, 0.08)",
                          borderBottom: "2px solid rgba(25, 118, 210, 0.2)",
                          py: 1.5,
                        },
                      }}
                    >
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={
                            filteredUsers.length > 0 &&
                            selectedUsers.length === filteredUsers.length
                          }
                          onChange={handleSelectAllClick}
                          sx={{
                            "&.Mui-checked": {
                              color: "primary.main",
                            },
                          }}
                        />
                      </TableCell>
                      <TableCell>Name</TableCell>
                      <TableCell>Email</TableCell>
                      <TableCell>Role</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Registration Date</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow
                        key={user._id}
                        sx={{
                          "&:nth-of-type(odd)": {
                            backgroundColor: "rgba(25, 118, 210, 0.02)",
                          },
                          transition: "background-color 0.2s",
                          "&:hover": {
                            backgroundColor: "rgba(25, 118, 210, 0.08)",
                          },
                        }}
                      >
                        <TableCell padding="checkbox">
                          <Checkbox
                            checked={selectedUsers.includes(user._id)}
                            onChange={(e) => handleSelectUser(e, user._id)}
                            sx={{
                              "&.Mui-checked": {
                                color: "primary.main",
                              },
                            }}
                          />
                        </TableCell>
                        <TableCell
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1.5,
                          }}
                        >
                          <Avatar
                            sx={{
                              width: 38,
                              height: 38,
                              bgcolor: `${
                                user.role === "admin"
                                  ? "primary.main"
                                  : user.role === "faculty"
                                  ? "warning.main"
                                  : user.role === "staff"
                                  ? "success.main"
                                  : "secondary.main"
                              }`,
                              fontSize: "1rem",
                              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                            }}
                          >
                            {user.firstName ? user.firstName[0] : ""}
                            {user.lastName ? user.lastName[0] : ""}
                          </Avatar>
                          <Box>
                            <Typography
                              variant="body1"
                              sx={{
                                fontWeight: 600,
                                color: "text.primary",
                                fontSize: "0.95rem",
                              }}
                            >
                              {user.firstName} {user.lastName}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {user.studentId ||
                                user.employeeId ||
                                user._id.substring(0, 8)}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Chip
                            label={capitalize(user.role)}
                            size="small"
                            color={
                              user.role === "admin"
                                ? "primary"
                                : user.role === "faculty"
                                ? "warning"
                                : user.role === "staff"
                                ? "success"
                                : "secondary"
                            }
                            sx={{
                              fontWeight: 600,
                              boxShadow: "0 2px 5px rgba(0,0,0,0.08)",
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={capitalize(user.status || "active")}
                            size="small"
                            color={
                              user.status === "inactive"
                                ? "error"
                                : user.status === "pending"
                                ? "warning"
                                : "success"
                            }
                            sx={{
                              fontWeight: 600,
                              boxShadow: "0 2px 5px rgba(0,0,0,0.08)",
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          {user.createdAt
                            ? new Date(user.createdAt).toLocaleDateString()
                            : "N/A"}
                        </TableCell>
                        <TableCell align="right">
                          <IconButton
                            color="primary"
                            onClick={() => handleOpenDialog("update", user)}
                            sx={{
                              transition: "transform 0.2s",
                              "&:hover": { transform: "scale(1.15)" },
                            }}
                          >
                            <Edit fontSize="small" />
                          </IconButton>
                          <IconButton
                            color="error"
                            onClick={() => handleOpenDialog("delete", user)}
                            sx={{
                              transition: "transform 0.2s",
                              "&:hover": { transform: "scale(1.15)" },
                            }}
                          >
                            <Delete fontSize="small" />
                          </IconButton>
                          <IconButton
                            color="info"
                            onClick={() =>
                              handleOpenDialog("reset-password", user)
                            }
                            sx={{
                              transition: "transform 0.2s",
                              "&:hover": { transform: "scale(1.15)" },
                            }}
                          >
                            <VpnKey fontSize="small" />
                          </IconButton>
                          <IconButton
                            color={
                              user.status === "active" ? "warning" : "success"
                            }
                            onClick={() =>
                              handleOpenDialog("change-status", user)
                            }
                            sx={{
                              transition: "transform 0.2s",
                              "&:hover": { transform: "scale(1.15)" },
                            }}
                          >
                            {user.status === "active" ? (
                              <Block fontSize="small" />
                            ) : (
                              <CheckCircle fontSize="small" />
                            )}
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  p: 2,
                  borderTop: "1px solid rgba(25, 118, 210, 0.1)",
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  {selectedUsers.length > 0
                    ? `${selectedUsers.length} selected`
                    : `Showing ${filteredUsers.length} of ${users.length} users`}
                </Typography>

                {selectedUsers.length > 0 && (
                  <Box sx={{ display: "flex", gap: 1.5 }}>
                    <Button
                      size="small"
                      variant="outlined"
                      color="primary"
                      startIcon={<Edit />}
                      onClick={() => handleBulkAction("update")}
                      sx={{
                        borderRadius: 2,
                        fontSize: "0.75rem",
                        borderWidth: "1.5px",
                      }}
                    >
                      Edit Selected
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      color="error"
                      startIcon={<Delete />}
                      onClick={() => handleBulkAction("delete")}
                      sx={{
                        borderRadius: 2,
                        fontSize: "0.75rem",
                        borderWidth: "1.5px",
                      }}
                    >
                      Delete Selected
                    </Button>
                  </Box>
                )}
              </Box>
            </>
          )}
        </Paper>

        {/* Add/Edit User Dialog */}
        <Dialog
          open={openDialog}
          onClose={actionLoading ? undefined : handleCloseDialog}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            {dialogType === "create"
              ? "Add New User"
              : dialogType === "update"
              ? "Edit User"
              : dialogType === "delete"
              ? "Delete User"
              : dialogType === "change-status"
              ? `${
                  formData.status === "active" ? "Activate" : "Deactivate"
                } User`
              : "Reset Password"}
          </DialogTitle>
          <DialogContent>{renderDialogContent()}</DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog} disabled={actionLoading}>
              Cancel
            </Button>
            <Button
              onClick={handleDialogSubmit}
              variant="contained"
              color={dialogType === "delete" ? "error" : "primary"}
              disabled={actionLoading}
              startIcon={actionLoading ? <CircularProgress size={20} /> : null}
            >
              {actionLoading
                ? "Processing..."
                : dialogType === "create"
                ? "Create"
                : dialogType === "update"
                ? "Update"
                : dialogType === "delete"
                ? "Delete"
                : dialogType === "change-status"
                ? formData.status === "active"
                  ? "Activate"
                  : "Deactivate"
                : "Reset Password"}
            </Button>
          </DialogActions>
        </Dialog>
      </Paper>
    </Box>
  );
};

export default UserManagement;
