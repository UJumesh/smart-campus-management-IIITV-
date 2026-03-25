import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  Box,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  IconButton,
  Button,
  Chip,
  Divider,
  Alert,
  Menu,
  MenuItem,
  CircularProgress,
} from "@mui/material";
import {
  Notifications as NotificationsIcon,
  Event as EventIcon,
  School as SchoolIcon,
  Assignment as AssignmentIcon,
  Announcement as AnnouncementIcon,
  MoreVert as MoreVertIcon,
  Done as DoneIcon,
  Message as MessageIcon,
  DeleteOutline as DeleteIcon,
} from "@mui/icons-material";
import useAuth from "../../hooks/useAuth";
import { getPermissions } from "../../utils/permissions";
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllNotifications,
  reset,
} from "../../services/slices/notificationSlice";
import api from "../../services/api";

const Notifications = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { user } = useAuth({
    redirectIfNotAuth: true,
    redirectTo: "/login",
  });

  const permissions = getPermissions(user?.role || "student");
  const {
    notifications = [],
    isLoading = false,
    isError = false,
    message = "",
    unreadCount = 0,
  } = useSelector((state) => state.notification) || {};

  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedNotification, setSelectedNotification] = useState(null);

  useEffect(() => {
    dispatch(getNotifications());

    return () => {
      dispatch(reset());
    };
  }, [dispatch]);

  const handleMarkAsRead = async (notification) => {
    await dispatch(markAsRead(notification._id));
    setAnchorEl(null);
  };

  const handleDelete = async (notification) => {
    await dispatch(deleteNotification(notification._id));
    setAnchorEl(null);
  };

  const handleMarkAllAsRead = async () => {
    await dispatch(markAllAsRead());
  };

  const handleDeleteAll = async () => {
    if (window.confirm("Are you sure you want to delete all notifications?")) {
      await dispatch(deleteAllNotifications());
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case "event_invitation":
      case "event_reminder":
        return <EventIcon />;
      case "schedule_change":
        return <SchoolIcon />;
      case "message":
        return <MessageIcon />;
      case "announcement":
      case "system":
        return <AnnouncementIcon />;
      default:
        return <NotificationsIcon />;
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else if (days === 1) {
      return "Yesterday";
    } else if (days < 7) {
      return date.toLocaleDateString("en-US", { weekday: "long" });
    } else {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ p: 3, display: "flex", justifyContent: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (isError) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{message}</Alert>
      </Box>
    );
  }

  if (notifications.length === 0) {
    return (
      <Box sx={{ p: 3 }}>
        <Paper elevation={2} sx={{ borderRadius: 2, p: 3 }}>
          <Box sx={{ textAlign: "center", mb: 4 }}>
            <NotificationsIcon
              sx={{ fontSize: 64, color: "text.disabled", mb: 2 }}
            />
            <Typography color="textSecondary" gutterBottom>
              No notifications to display
            </Typography>
            <Typography color="textSecondary" variant="body2" sx={{ mb: 3 }}>
              You don't have any notifications at the moment.
            </Typography>

            <Button
              variant="contained"
              color="primary"
              onClick={async () => {
                try {
                  await api.post("/api/notifications/generate-samples");
                  dispatch(getNotifications());
                } catch (error) {
                  console.error("Error generating samples:", error);
                }
              }}
            >
              Generate Sample Notifications
            </Button>
          </Box>
        </Paper>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Paper elevation={2} sx={{ borderRadius: 2 }}>
        <Box
          sx={{
            p: 2,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography variant="h6">Notifications</Typography>
            {unreadCount > 0 && (
              <Chip
                label={`${unreadCount} unread`}
                color="primary"
                size="small"
              />
            )}
          </Box>
          <Box sx={{ display: "flex", gap: 1 }}>
            {unreadCount > 0 && (
              <Button
                startIcon={<DoneIcon />}
                onClick={handleMarkAllAsRead}
                size="small"
              >
                Mark all as read
              </Button>
            )}
            {notifications.length > 0 && (
              <Button
                color="error"
                onClick={handleDeleteAll}
                startIcon={<DeleteIcon />}
                variant="outlined"
                size="small"
              >
                Delete All
              </Button>
            )}
          </Box>
        </Box>
        <Divider />
        <List sx={{ py: 0 }}>
          {notifications.map((notification) => (
            <React.Fragment key={notification._id}>
              <ListItem
                sx={{
                  bgcolor: !notification.read ? "action.hover" : "inherit",
                  p: 2,
                }}
              >
                <ListItemAvatar>
                  <Avatar
                    sx={{
                      bgcolor: !notification.read
                        ? "primary.main"
                        : "action.disabledBackground",
                    }}
                  >
                    {getNotificationIcon(notification.type)}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Typography
                      variant="subtitle2"
                      color={!notification.read ? "primary" : "textPrimary"}
                      fontWeight={!notification.read ? 600 : 400}
                    >
                      {notification.title}
                    </Typography>
                  }
                  secondary={
                    <>
                      <Typography variant="body2" color="textSecondary">
                        {notification.content}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {formatTime(notification.createdAt)}
                      </Typography>
                    </>
                  }
                  sx={{ pr: 2 }}
                />
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  {notification.link && (
                    <Button
                      size="small"
                      onClick={() => navigate(notification.link)}
                      sx={{ mr: 1 }}
                    >
                      View
                    </Button>
                  )}
                  <IconButton
                    size="small"
                    onClick={(event) => {
                      setSelectedNotification(notification);
                      setAnchorEl(event.currentTarget);
                    }}
                  >
                    <MoreVertIcon />
                  </IconButton>
                </Box>
              </ListItem>
              <Divider component="li" />
            </React.Fragment>
          ))}
        </List>
      </Paper>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
      >
        {selectedNotification && !selectedNotification.read && (
          <MenuItem onClick={() => handleMarkAsRead(selectedNotification)}>
            Mark as read
          </MenuItem>
        )}
        {selectedNotification && (
          <MenuItem onClick={() => handleDelete(selectedNotification)}>
            Delete
          </MenuItem>
        )}
      </Menu>
    </Box>
  );
};

export default Notifications;
