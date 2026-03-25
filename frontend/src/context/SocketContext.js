import React, { createContext, useContext, useEffect, useState } from "react";
import useAuth from "../hooks/useAuth";

// Create a context
const SocketContext = createContext(null);

// Create a dummy socket for when actual socket is not available
const createDummySocket = () => ({
  connected: false,
  on: () => {},
  off: () => {},
  emit: () => {},
  connect: () => {},
  disconnect: () => {},
});

export const useSocket = () => {
  const socket = useContext(SocketContext);
  // Return a dummy socket with no-op methods if the real socket is not available
  if (!socket) {
    return createDummySocket();
  }
  return socket;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [socketError, setSocketError] = useState(null);
  const [attemptingConnection, setAttemptingConnection] = useState(false);
  const { user, token } = useAuth();

  useEffect(() => {
    // Skip socket initialization if there was a previous error
    if (socketError || attemptingConnection) {
      return;
    }

    // Only attempt to create socket connection when user is logged in
    if (user && token) {
      try {
        setAttemptingConnection(true);

        // Import socket.io-client dynamically to prevent it from causing issues
        // during initial load if there are problems
        const socketImport = import("socket.io-client")
          .then(({ io }) => {
            console.log("Initializing socket connection");
            try {
              const socketConnection = io(process.env.REACT_APP_API_URL || "", {
                // Don't include auth token for now to simplify
                reconnection: true,
                reconnectionAttempts: 3,
                reconnectionDelay: 1000,
                timeout: 5000,
              });

              socketConnection.on("connect", () => {
                console.log("Socket connected");
              });

              socketConnection.on("connect_error", (error) => {
                console.error("Socket connection error:", error);
                setSocketError(error);
              });

              socketConnection.on("disconnect", (reason) => {
                console.log("Socket disconnected:", reason);
              });

              setSocket(socketConnection);
            } catch (innerError) {
              console.error("Error creating socket instance:", innerError);
              setSocketError(innerError);
            }
          })
          .catch((error) => {
            console.error("Error importing socket.io:", error);
            setSocketError(error);
          })
          .finally(() => {
            setAttemptingConnection(false);
          });

        // Set a timeout to prevent hanging if import takes too long
        const timeoutId = setTimeout(() => {
          if (attemptingConnection) {
            console.error("Socket connection attempt timed out");
            setSocketError(new Error("Socket connection timeout"));
            setAttemptingConnection(false);
          }
        }, 5000);

        return () => {
          clearTimeout(timeoutId);
          // Cancel the import promise if component unmounts
          if (socketImport && typeof socketImport.cancel === "function") {
            socketImport.cancel();
          }

          if (socket) {
            console.log("Disconnecting socket");
            socket.disconnect();
            setSocket(null);
          }
        };
      } catch (error) {
        console.error("Socket initialization error:", error);
        setSocketError(error);
        setAttemptingConnection(false);
      }
    }

    // Cleanup on unmount
    return () => {
      if (socket) {
        console.log("Disconnecting socket");
        socket.disconnect();
        setSocket(null);
      }
    };
  }, [user, token, socketError, attemptingConnection]);

  // If there's an error, we still render the children, but with a null socket
  // This ensures the app continues to work even if socket fails
  return (
    <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
  );
};

export default SocketProvider;
