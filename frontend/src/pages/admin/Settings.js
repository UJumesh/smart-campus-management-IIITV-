import React, { useState, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  Divider,
  TextField,
  Switch,
  FormControlLabel,
  Button,
  Alert,
  Grid,
  Card,
  CardContent,
  CardActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import { Save as SaveIcon, Refresh as RefreshIcon } from "@mui/icons-material";
import useAuth from "../../hooks/useAuth";
import { getPermissions } from "../../utils/permissions";

const Settings = () => {
  const { user } = useAuth({
    redirectIfNotAuth: true,
    redirectTo: "/login",
    requiredRoles: ["admin"],
  });

  const permissions = getPermissions(user?.role || "admin");

  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [openConfirm, setOpenConfirm] = useState(false);
  const [pendingChanges, setPendingChanges] = useState({});

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        // TODO: Replace with actual API call
        const mockSettings = {
          general: {
            siteName: "Smart Campus",
            maintenanceMode: false,
            allowRegistration: true,
            defaultUserRole: "student",
          },
          email: {
            smtpHost: "smtp.example.com",
            smtpPort: "587",
            smtpUser: "notifications@example.com",
            emailFromName: "Smart Campus",
            enableEmailNotifications: true,
          },
          security: {
            sessionTimeout: "30",
            maxLoginAttempts: "5",
            passwordMinLength: "8",
            requireEmailVerification: true,
            twoFactorAuth: false,
          },
          notifications: {
            enablePushNotifications: true,
            defaultNotificationDuration: "7",
            notifyOnNewRegistration: true,
            notifyOnCourseEnrollment: true,
          },
        };
        setSettings(mockSettings);
        setLoading(false);
      } catch (err) {
        setError("Failed to fetch settings");
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleChange = (section, setting, value) => {
    setPendingChanges({
      ...pendingChanges,
      [section]: {
        ...pendingChanges[section],
        [setting]: value,
      },
    });
  };

  const handleSave = async () => {
    try {
      // TODO: Replace with actual API call
      setSettings({
        ...settings,
        ...Object.keys(pendingChanges).reduce(
          (acc, section) => ({
            ...acc,
            [section]: {
              ...settings[section],
              ...pendingChanges[section],
            },
          }),
          {}
        ),
      });
      setPendingChanges({});
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setError("Failed to save settings");
    }
  };

  const handleReset = () => {
    setOpenConfirm(true);
  };

  const confirmReset = async () => {
    try {
      // TODO: Replace with actual API call to reset settings
      setOpenConfirm(false);
      window.location.reload();
    } catch (err) {
      setError("Failed to reset settings");
    }
  };

  if (!permissions.canManageSettings) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          You don't have permission to manage settings
        </Alert>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Loading settings...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  const hasChanges = Object.keys(pendingChanges).length > 0;

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
        <Typography variant="h4">System Settings</Typography>
        <Box>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={handleReset}
            sx={{ mr: 1 }}
          >
            Reset All
          </Button>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSave}
            disabled={!hasChanges}
          >
            Save Changes
          </Button>
        </Box>
      </Box>

      {saveSuccess && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Settings saved successfully
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* General Settings */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                General Settings
              </Typography>
              <Box sx={{ mt: 2 }}>
                <TextField
                  fullWidth
                  label="Site Name"
                  value={
                    pendingChanges.general?.siteName ??
                    settings.general.siteName
                  }
                  onChange={(e) =>
                    handleChange("general", "siteName", e.target.value)
                  }
                  sx={{ mb: 2 }}
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={
                        pendingChanges.general?.maintenanceMode ??
                        settings.general.maintenanceMode
                      }
                      onChange={(e) =>
                        handleChange(
                          "general",
                          "maintenanceMode",
                          e.target.checked
                        )
                      }
                    />
                  }
                  label="Maintenance Mode"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={
                        pendingChanges.general?.allowRegistration ??
                        settings.general.allowRegistration
                      }
                      onChange={(e) =>
                        handleChange(
                          "general",
                          "allowRegistration",
                          e.target.checked
                        )
                      }
                    />
                  }
                  label="Allow Registration"
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Email Settings */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Email Settings
              </Typography>
              <Box sx={{ mt: 2 }}>
                <TextField
                  fullWidth
                  label="SMTP Host"
                  value={
                    pendingChanges.email?.smtpHost ?? settings.email.smtpHost
                  }
                  onChange={(e) =>
                    handleChange("email", "smtpHost", e.target.value)
                  }
                  sx={{ mb: 2 }}
                />
                <TextField
                  fullWidth
                  label="SMTP Port"
                  value={
                    pendingChanges.email?.smtpPort ?? settings.email.smtpPort
                  }
                  onChange={(e) =>
                    handleChange("email", "smtpPort", e.target.value)
                  }
                  sx={{ mb: 2 }}
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={
                        pendingChanges.email?.enableEmailNotifications ??
                        settings.email.enableEmailNotifications
                      }
                      onChange={(e) =>
                        handleChange(
                          "email",
                          "enableEmailNotifications",
                          e.target.checked
                        )
                      }
                    />
                  }
                  label="Enable Email Notifications"
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Security Settings */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Security Settings
              </Typography>
              <Box sx={{ mt: 2 }}>
                <TextField
                  fullWidth
                  label="Session Timeout (minutes)"
                  type="number"
                  value={
                    pendingChanges.security?.sessionTimeout ??
                    settings.security.sessionTimeout
                  }
                  onChange={(e) =>
                    handleChange("security", "sessionTimeout", e.target.value)
                  }
                  sx={{ mb: 2 }}
                />
                <TextField
                  fullWidth
                  label="Maximum Login Attempts"
                  type="number"
                  value={
                    pendingChanges.security?.maxLoginAttempts ??
                    settings.security.maxLoginAttempts
                  }
                  onChange={(e) =>
                    handleChange("security", "maxLoginAttempts", e.target.value)
                  }
                  sx={{ mb: 2 }}
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={
                        pendingChanges.security?.twoFactorAuth ??
                        settings.security.twoFactorAuth
                      }
                      onChange={(e) =>
                        handleChange(
                          "security",
                          "twoFactorAuth",
                          e.target.checked
                        )
                      }
                    />
                  }
                  label="Two-Factor Authentication"
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Notification Settings */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Notification Settings
              </Typography>
              <Box sx={{ mt: 2 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={
                        pendingChanges.notifications?.enablePushNotifications ??
                        settings.notifications.enablePushNotifications
                      }
                      onChange={(e) =>
                        handleChange(
                          "notifications",
                          "enablePushNotifications",
                          e.target.checked
                        )
                      }
                    />
                  }
                  label="Enable Push Notifications"
                />
                <TextField
                  fullWidth
                  label="Default Notification Duration (days)"
                  type="number"
                  value={
                    pendingChanges.notifications?.defaultNotificationDuration ??
                    settings.notifications.defaultNotificationDuration
                  }
                  onChange={(e) =>
                    handleChange(
                      "notifications",
                      "defaultNotificationDuration",
                      e.target.value
                    )
                  }
                  sx={{ mt: 2 }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Reset Confirmation Dialog */}
      <Dialog open={openConfirm} onClose={() => setOpenConfirm(false)}>
        <DialogTitle>Reset Settings</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to reset all settings to their default values?
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenConfirm(false)}>Cancel</Button>
          <Button onClick={confirmReset} color="error">
            Reset All
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Settings;
