import React from "react";
import { Box, CircularProgress, Typography, Paper } from "@mui/material";

const LoadingScreen = ({ message = "Loading...", submessage = null }) => {
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        bgcolor: "background.default",
      }}
    >
      <Paper
        elevation={3}
        sx={{
          p: 4,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          maxWidth: 400,
          width: "100%",
        }}
      >
        <CircularProgress size={60} thickness={4} color="primary" />
        <Typography variant="h6" sx={{ mt: 3, textAlign: "center" }}>
          {message}
        </Typography>
        {submessage && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mt: 1, textAlign: "center" }}
          >
            {submessage}
          </Typography>
        )}
      </Paper>
    </Box>
  );
};

export default LoadingScreen;
