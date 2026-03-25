import React from "react";
import { Box, Grid, Paper, Skeleton, Divider } from "@mui/material";

const DashboardSkeleton = () => {
  // Helper function to create skeleton list items
  const renderSkeletonList = (count) => {
    return Array(count)
      .fill()
      .map((_, index) => (
        <Box key={index} sx={{ mb: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
            <Skeleton
              variant="circular"
              width={40}
              height={40}
              sx={{ mr: 2 }}
            />
            <Box sx={{ width: "100%" }}>
              <Skeleton width="80%" height={24} />
              <Skeleton width="60%" height={20} />
            </Box>
          </Box>
          {index < count - 1 && <Divider sx={{ mt: 2 }} />}
        </Box>
      ));
  };

  return (
    <Box>
      {/* Header skeleton */}
      <Skeleton variant="text" width={300} height={60} sx={{ mb: 3 }} />

      <Grid container spacing={3}>
        {/* Quick actions skeleton */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Skeleton variant="text" width={200} height={32} sx={{ mb: 2 }} />
            <Grid container spacing={2}>
              {Array(5)
                .fill()
                .map((_, index) => (
                  <Grid item xs={6} sm={4} md={2} key={index}>
                    <Paper sx={{ p: 2, textAlign: "center" }}>
                      <Skeleton
                        variant="circular"
                        width={40}
                        height={40}
                        sx={{ mx: "auto" }}
                      />
                      <Skeleton
                        variant="text"
                        width="80%"
                        height={24}
                        sx={{ mx: "auto", mt: 1 }}
                      />
                      <Skeleton
                        variant="rectangular"
                        width={60}
                        height={30}
                        sx={{ mx: "auto", mt: 1 }}
                      />
                    </Paper>
                  </Grid>
                ))}
            </Grid>
          </Paper>
        </Grid>

        {/* Recent activities skeleton */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: "100%" }}>
            <Skeleton variant="text" width={200} height={32} sx={{ mb: 2 }} />
            {renderSkeletonList(3)}
            <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
              <Skeleton variant="rectangular" width={120} height={36} />
            </Box>
          </Paper>
        </Grid>

        {/* Upcoming events skeleton */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: "100%" }}>
            <Skeleton variant="text" width={200} height={32} sx={{ mb: 2 }} />
            {renderSkeletonList(3)}
            <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
              <Skeleton variant="rectangular" width={120} height={36} />
            </Box>
          </Paper>
        </Grid>

        {/* Notifications skeleton */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Skeleton variant="text" width={200} height={32} sx={{ mb: 2 }} />
            {renderSkeletonList(3)}
            <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
              <Skeleton variant="rectangular" width={120} height={36} />
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DashboardSkeleton;
