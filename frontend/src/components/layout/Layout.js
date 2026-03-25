import React, { useState, useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { logout } from "../../store/slices/authSlice";
import { getNotifications } from "../../services/slices/notificationSlice";
import { toast } from "react-toastify";
import {
  AppBar,
  Box,
  CssBaseline,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Avatar,
  Menu,
  MenuItem,
  Badge,
  Tooltip,
} from "@mui/material";
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Event as EventIcon,
  CalendarMonth as CalendarIcon,
  MeetingRoom as ResourceIcon,
  Message as MessageIcon,
  Notifications as NotificationsIcon,
  Person as PersonIcon,
  Assessment as AnalyticsIcon,
  PeopleAlt as PeopleIcon,
  Logout as LogoutIcon,
} from "@mui/icons-material";

const drawerWidth = 240;

const Layout = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const { user } = useSelector((state) => state.auth);
  const { unreadCount = 0 } = useSelector((state) => state.notification) || {};
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Fetch notifications when component mounts
  useEffect(() => {
    if (user) {
      dispatch(getNotifications());
    }
  }, [dispatch, user]);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login", { replace: true });
  };

  const navigateToDashboard = () => {
    if (!user) {
      toast.info("Please log in to access your dashboard");
      navigate("/login");
      return;
    }

    navigate("/dashboard");

    let welcomeMessage = "Welcome to your Dashboard";
    if (user.role === "admin") {
      welcomeMessage = "Welcome to Admin Dashboard";
    } else if (user.role === "lecturer") {
      welcomeMessage = "Welcome to Lecturer Dashboard";
    } else if (user.role === "student") {
      welcomeMessage = "Welcome to Student Dashboard";
    }

    toast.success(welcomeMessage);

    if (mobileOpen) {
      setMobileOpen(false);
    }
  };

  const menuItems = [
    {
      text: "Dashboard",
      icon: <DashboardIcon />,
      path: "/dashboard",
      roles: ["student", "lecturer", "admin"],
    },
    {
      text: "Schedule",
      icon: <CalendarIcon />,
      path: "/schedule",
      roles: ["student", "lecturer", "admin"],
    },
    {
      text: "Resources",
      icon: <ResourceIcon />,
      path: "/resources",
      roles: ["student", "lecturer", "admin"],
    },
    {
      text: "Events",
      icon: <EventIcon />,
      path: "/events",
      roles: ["student", "lecturer", "admin"],
    },
    {
      text: "Messages",
      icon: <MessageIcon />,
      path: "/messages",
      roles: ["student", "lecturer", "admin"],
    },
    {
      text: "User Management",
      icon: <PeopleIcon />,
      path: "/admin/users",
      roles: ["admin"],
    },
    {
      text: "Event Registrations",
      icon: <EventIcon />,
      path: "/admin/event-registrations",
      roles: ["admin"],
    },
    {
      text: "Analytics",
      icon: <AnalyticsIcon />,
      path: "/admin/analytics",
      roles: ["admin"],
    },
  ];

  const drawer = (
    <div>
      <Toolbar>
        <Typography variant="h6" noWrap component="div"></Typography>
      </Toolbar>
      <Divider />
      <List>
        {menuItems.map(
          (item) =>
            item.roles.includes(user?.role) && (
              <ListItem key={item.text} disablePadding>
                <ListItemButton onClick={() => navigate(item.path)}>
                  <ListItemIcon>{item.icon}</ListItemIcon>
                  <ListItemText primary={item.text} />
                </ListItemButton>
              </ListItem>
            )
        )}
      </List>
      <Divider />
      <List>
        <ListItem disablePadding>
          <ListItemButton onClick={handleLogout}>
            <ListItemIcon>
              <LogoutIcon />
            </ListItemIcon>
            <ListItemText primary="Logout" />
          </ListItemButton>
        </ListItem>
      </List>
    </div>
  );

  return (
    <Box sx={{ display: "flex" }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: "none" } }}
          >
            <MenuIcon />
          </IconButton>
          <Tooltip title="Go to Dashboard">
            <Typography
              variant="h6"
              noWrap
              component="div"
              sx={{
                flexGrow: 1,
                cursor: "pointer",
                "&:hover": {
                  opacity: 0.85,
                  textDecoration: "underline",
                },
                transition: "all 0.2s ease-in-out",
                display: "flex",
                alignItems: "center",
              }}
              onClick={navigateToDashboard}
            >
              <DashboardIcon sx={{ mr: 1, fontSize: "1.2rem" }} />
              Smart Campus Management System
            </Typography>
          </Tooltip>

          {/* Quick Action Buttons - Added here */}
          <Box 
            sx={{ 
              display: 'flex', 
              gap: 1,
              mr: 1,
              '& .MuiIconButton-root': {
                color: 'white',
                transition: 'all 0.2s',
                '&:hover': {
                  transform: 'scale(1.1)',
                  backgroundColor: 'rgba(255, 255, 255, 0.15)',
                }
              }
            }}
          >
            <Tooltip title="Schedule">
              <IconButton
                size="medium"
                color="inherit"
                onClick={() => navigate('/schedule')}
              >
                <CalendarIcon />
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Events">
              <IconButton
                size="medium"
                color="inherit"
                onClick={() => navigate('/events')}
              >
                <EventIcon />
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Messages">
              <IconButton
                size="medium"
                color="inherit"
                onClick={() => navigate('/messages')}
              >
                <MessageIcon />
              </IconButton>
            </Tooltip>
          </Box>

          <IconButton
            size="large"
            color="inherit"
            onClick={() => navigate("/notifications")}
            sx={{
              animation: unreadCount > 0 ? "pulse 2s infinite" : "none",
              "@keyframes pulse": {
                "0%": {
                  transform: "scale(1)",
                },
                "50%": {
                  transform: "scale(1.1)",
                },
                "100%": {
                  transform: "scale(1)",
                },
              },
            }}
          >
            <Badge badgeContent={unreadCount} color="error">
              <NotificationsIcon />
            </Badge>
          </IconButton>
          <IconButton
            size="large"
            edge="end"
            aria-label="account of current user"
            aria-haspopup="true"
            onClick={handleProfileMenuOpen}
            color="inherit"
          >
            <Avatar alt={user?.firstName} src={user?.profileImage} />
          </IconButton>
          <Menu
            id="menu-appbar"
            anchorEl={anchorEl}
            anchorOrigin={{
              vertical: "bottom",
              horizontal: "right",
            }}
            keepMounted
            transformOrigin={{
              vertical: "top",
              horizontal: "right",
            }}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
          >
            <MenuItem
              onClick={() => {
                handleMenuClose();
                navigate("/profile");
              }}
            >
              <ListItemIcon>
                <PersonIcon fontSize="small" />
              </ListItemIcon>
              Profile
            </MenuItem>
            <MenuItem onClick={handleLogout}>
              <ListItemIcon>
                <LogoutIcon fontSize="small" />
              </ListItemIcon>
              Logout
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
        aria-label="mailbox folders"
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
          sx={{
            display: { xs: "block", sm: "none" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: drawerWidth,
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: "none", sm: "block" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: drawerWidth,
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
        }}
      >
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
};

export default Layout;
