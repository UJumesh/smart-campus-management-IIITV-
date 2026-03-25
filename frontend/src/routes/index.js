import Dashboard from "../pages/dashboard/Dashboard";
import Schedule from "../pages/Schedule";
import Profile from "../pages/users/Profile";
import UserManagement from "../pages/admin/UserManagement";
import EventRegistrations from "../pages/admin/EventRegistrations";
import Login from "../pages/auth/Login";
import Register from "../pages/auth/Register";
import ForgotPassword from "../pages/auth/ForgotPassword";
import ResetPassword from "../pages/auth/ResetPassword";
import NotFound from "../pages/errors/NotFound";
import Courses from "../pages/courses/Courses";
import CourseDetails from "../pages/courses/CourseDetails";
import Events from "../pages/Events";
import EventPage from "../pages/Event";
import CreateEvent from "../pages/CreateEvent";
import EditEvent from "../pages/EditEvent";
import EventDetails from "../pages/EventDetails";
import Messages from "../pages/messages/Messages";
import Notifications from "../pages/notifications/Notifications";
import Analytics from "../pages/admin/Analytics";
import Settings from "../pages/admin/Settings";
import Resources from "../pages/resources/Resources";
import ResourceDetails from "../pages/resources/ResourceDetails";
import CreateResource from "../pages/resources/CreateResource";
import EditResource from "../pages/resources/EditResource";

// Route configurations with role-based access
export const publicRoutes = [
  {
    path: "/login",
    component: Login,
  },
  {
    path: "/register",
    component: Register,
  },
  {
    path: "/forgot-password",
    component: ForgotPassword,
  },
  {
    path: "/reset-password/:token",
    component: ResetPassword,
  },
];

export const privateRoutes = [
  // Common routes accessible by all authenticated users
  {
    path: "/dashboard",
    component: Dashboard,
    roles: ["admin", "lecturer", "student"],
  },
  {
    path: "/profile",
    component: Profile,
    roles: ["admin", "lecturer", "student"],
  },
  {
    path: "/notifications",
    component: Notifications,
    roles: ["admin", "lecturer", "student"],
  },
  {
    path: "/events",
    component: EventPage,
    roles: ["admin", "lecturer", "student"],
  },
  {
    path: "/events/create",
    component: CreateEvent,
    roles: ["admin", "lecturer"],
  },
  {
    path: "/events/edit/:id",
    component: EditEvent,
    roles: ["admin", "lecturer"],
  },

  // Resources Management
  {
    path: "/resources/create",
    component: CreateResource,
    roles: ["admin"],
  },
  {
    path: "/resources/edit/:id",
    component: EditResource,
    roles: ["admin"],
  },
  {
    path: "/resources/:id",
    component: ResourceDetails,
    roles: ["admin", "lecturer", "student"],
  },
  {
    path: "/resources",
    component: Resources,
    roles: ["admin", "lecturer", "student"],
  },

  // Routes for All Academic Users (Admin, Lecturer, and Student)
  {
    path: "/courses",
    component: Courses,
    roles: ["admin", "lecturer", "student"],
  },
  {
    path: "/courses/:id",
    component: CourseDetails,
    roles: ["admin", "lecturer", "student"],
  },
  {
    path: "/schedule",
    component: Schedule,
    roles: ["admin", "lecturer", "student"],
  },
  {
    path: "/messages",
    component: Messages,
    roles: ["admin", "lecturer", "student"],
  },

  // Admin-only routes
  {
    path: "/admin/analytics",
    component: Analytics,
    roles: ["admin"],
  },
  {
    path: "/admin/users",
    component: UserManagement,
    roles: ["admin"],
  },
  {
    path: "/admin/settings",
    component: Settings,
    roles: ["admin"],
  },
  {
    path: "/admin/event-registrations",
    component: EventRegistrations,
    roles: ["admin"],
  },
];

// Helper function to check if user has required role
export const hasRequiredRole = (userRole, allowedRoles) => {
  // If no roles are required, allow access
  if (!allowedRoles || allowedRoles.length === 0) {
    return true;
  }

  // No longer need to convert 'user' to 'student' since we're removing the 'user' role
  
  // Check if the user's role is in the allowed roles
  return allowedRoles.includes(userRole);
};

// Not found route
export const notFoundRoute = {
  path: "*",
  component: NotFound,
};
