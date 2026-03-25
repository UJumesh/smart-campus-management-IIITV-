import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Grid,
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  IconButton,
  Paper,
} from "@mui/material";
import {
  Search as SearchIcon,
  Add as AddIcon,
  Edit as EditIcon,
} from "@mui/icons-material";
import useAuth from "../../hooks/useAuth";
import { getPermissions } from "../../utils/permissions";

const Courses = () => {
  const navigate = useNavigate();
  const { user } = useAuth({
    redirectIfNotAuth: true,
    redirectTo: "/login",
  });

  const permissions = getPermissions(user?.role || "student");

  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        // TODO: Replace with actual API call
        const mockCourses = [];
        setCourses(mockCourses);
        setLoading(false);
      } catch (err) {
        setError("Failed to fetch courses");
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  const filteredCourses = courses.filter((course) => {
    const matchesSearch =
      course.name.toLowerCase().includes(search.toLowerCase()) ||
      course.code.toLowerCase().includes(search.toLowerCase()) ||
      course.lecturer.toLowerCase().includes(search.toLowerCase());

    if (filter === "all") return matchesSearch;
    return matchesSearch && course.status === filter;
  });

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Loading courses...</Typography>
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

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
        <Typography variant="h4">Courses</Typography>
        {permissions.canManageCourses && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate("/courses/new")}
          >
            Add Course
          </Button>
        )}
      </Box>

      <Paper
        sx={{
          p: 5,
          textAlign: "center",
          borderRadius: 2,
          mb: 3,
          background:
            "linear-gradient(135deg, rgba(0,105,192,0.08) 0%, rgba(25,118,210,0.03) 100%)",
        }}
      >
        <Typography
          variant="h4"
          sx={{ mb: 2, fontWeight: 600, color: "primary.main" }}
        >
          Coming Soon!
        </Typography>
        <Typography variant="h6" sx={{ mb: 4, color: "text.secondary" }}>
          The Courses module is under development and will be launched soon.
        </Typography>
        <Chip
          label="Stay Tuned"
          color="primary"
          variant="outlined"
          sx={{ px: 2, py: 2.5, fontSize: "1rem", borderRadius: 6 }}
        />
      </Paper>

      {/* Commented out existing search and filter UI that will be used when courses are available
      <Box sx={{ mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              placeholder="Search courses..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon color="action" />,
              }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={filter}
                label="Status"
                onChange={(e) => setFilter(e.target.value)}
              >
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
                <MenuItem value="upcoming">Upcoming</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Box>

      <Grid container spacing={3}>
        {filteredCourses.map((course) => (
          <Grid item xs={12} md={6} lg={4} key={course.id}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {course.name}
                </Typography>
                <Typography color="textSecondary" gutterBottom>
                  {course.code}
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    Lecturer: {course.lecturer}
                  </Typography>
                  <Typography variant="body2">
                    Department: {course.department}
                  </Typography>
                  <Typography variant="body2">
                    Schedule: {course.schedule}
                  </Typography>
                  <Typography variant="body2">
                    Enrolled: {course.enrolledStudents} students
                  </Typography>
                </Box>
                <Chip
                  label={course.status}
                  color={course.status === "active" ? "success" : "default"}
                  size="small"
                />
              </CardContent>
              <CardActions>
                <Button
                  size="small"
                  onClick={() => navigate(`/courses/${course.id}`)}
                >
                  View Details
                </Button>
                {permissions.canManageCourses && (
                  <IconButton
                    size="small"
                    onClick={() => navigate(`/courses/${course.id}/edit`)}
                  >
                    <EditIcon />
                  </IconButton>
                )}
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
      */}
    </Box>
  );
};

export default Courses;
