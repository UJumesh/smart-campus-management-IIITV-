import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Provider } from "react-redux";
import store from "./store";
import { SocketProvider } from "./context/SocketContext";

// Components
import Layout from "./components/layout/Layout";
import PrivateRoute from "./components/auth/PrivateRoute";
import TokenRefreshHandler from "./components/auth/TokenRefreshHandler";

// Routes
import { publicRoutes, privateRoutes, notFoundRoute } from "./routes";

// Pages
import Register from "./pages/auth/Register";
import MyCalendar from "./pages/MyCalendar";

// Components
import EventNotification from "./components/EventNotification";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("App error caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 20, margin: 20, backgroundColor: "#ffdddd" }}>
          <h2>Something went wrong.</h2>
          <p>{this.state.error?.toString()}</p>
          <button onClick={() => window.location.reload()}>
            Reload Application
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

const theme = createTheme({
  palette: {
    primary: {
      main: "#1976d2",
    },
    secondary: {
      main: "#dc004e",
    },
    background: {
      default: "#f5f5f5",
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
});

function App() {
  return (
    <ErrorBoundary>
      <Provider store={store}>
        <ThemeProvider theme={theme}>
          <CssBaseline />

          <SocketProvider>
            <TokenRefreshHandler />

            <ToastContainer position="top-right" autoClose={5000} />

            <EventNotification />

            <div className="App">
              <Routes>

                {/* PUBLIC ROUTES */}
                {publicRoutes.map(({ path, component: Component }) => (
                  <Route key={path} path={path} element={<Component />} />
                ))}

                {/* SIGNUP / REGISTER ROUTE */}
                <Route path="/signup" element={<Register />} />

                {/* PRIVATE ROUTES */}
                <Route element={<Layout />}>

                  <Route
                    index
                    element={<Navigate to="/dashboard" replace />}
                  />

                  {privateRoutes.map(
                    ({ path, component: Component, roles }) => (
                      <Route
                        key={path}
                        path={path}
                        element={
                          <PrivateRoute roles={roles}>
                            <Component />
                          </PrivateRoute>
                        }
                      />
                    )
                  )}

                </Route>

                {/* CALENDAR */}
                <Route
                  path="/calendar"
                  element={
                    <PrivateRoute>
                      <MyCalendar />
                    </PrivateRoute>
                  }
                />

                {/* 404 */}
                {(() => {
                  const { path, component: NotFound } = notFoundRoute;
                  return <Route path={path} element={<NotFound />} />;
                })()}

              </Routes>
            </div>

          </SocketProvider>
        </ThemeProvider>
      </Provider>
    </ErrorBoundary>
  );
}

export default App;