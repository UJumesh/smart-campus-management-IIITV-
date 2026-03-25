import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Grid,
  Paper,
  Typography,
  Button,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
} from "@mui/material";
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  Event as EventIcon,
  School as SchoolIcon,
} from "@mui/icons-material";
import useAuth from "../../hooks/useAuth";
import { getPermissions } from "../../utils/permissions";

const CourseDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth({
    redirectIfNotAuth: true,
    redirectTo: "/login",
  });

  const permissions = getPermissions(user?.role || "student");

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openEdit, setOpenEdit] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    description: "",
    schedule: "",
    capacity: "",
  });

  useEffect(() => {
    const fetchCourseDetails = async () => {
      try {
        setLoading(true);
        // TODO: Replace with actual API call to get course details
        setError("Course not found");
        setLoading(false);
      } catch (err) {
        setError("Failed to fetch course details");
        setLoading(false);
      }
    };

    fetchCourseDetails();
  }, [id]);

  const handleEdit = async () => {
    try {
      // TODO: Implement actual API call
      console.log("Updating course:", formData);
      setOpenEdit(false);
      // Refresh course data
    } catch (err) {
      setError("Failed to update course");
    }
  };

  const handleDelete = async () => {
    try {
      // TODO: Implement actual API call
      console.log("Deleting course:", id);
      setOpenDelete(false);
      navigate("/courses");
    } catch (err) {
      setError("Failed to delete course");
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Loading course details...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="info">
          <Box sx={{ textAlign: "center", p: 2 }}>
            <Typography
              variant="h5"
              sx={{ mb: 2, fontWeight: 600, color: "primary.main" }}
            >
              Course Details Coming Soon!
            </Typography>
            <Typography variant="body1" sx={{ mb: 3 }}>
              The Courses module is currently under development and will be
              available soon.
            </Typography>
            <Button
              variant="contained"
              onClick={() => navigate("/courses")}
              sx={{ mt: 2 }}
            >
              Back to Courses
            </Button>
          </Box>
        </Alert>
      </Box>
    );
  }

  if (!course) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="info">Course not found</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
        <Typography variant="h4">{course.name}</Typography>
        {permissions.canManageCourses && (
          <Box>
            <IconButton onClick={() => setOpenEdit(true)}>
              <EditIcon />
            </IconButton>
            <IconButton color="error" onClick={() => setOpenDelete(true)}>
              <DeleteIcon />
            </IconButton>
          </Box>
        )}
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2, mb: 2 }}>
            <Typography variant="h6" gutterBottom>
              Course Information
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2">Course Code</Typography>
                <Typography>{course.code}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2">Department</Typography>
                <Typography>{course.department}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2">Description</Typography>
                <Typography>{course.description}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2">Schedule</Typography>
                <Typography>{course.schedule}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2">Status</Typography>
                <Chip
                  label={course.status}
                  color={course.status === "active" ? "success" : "default"}
                  size="small"
                />
              </Grid>
            </Grid>
          </Paper>

          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Course Sessions
            </Typography>
            <List>
              {course.sessions.map((session) => (
                <ListItem key={session.id}>
                  <ListItemAvatar>
                    <Avatar>
                      <EventIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={session.topic}
                    secondary={new Date(session.date).toLocaleDateString()}
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, mb: 2 }}>
            <Typography variant="h6" gutterBottom>
              Instructor
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
              <Avatar sx={{ mr: 2 }}>
                <PersonIcon />
              </Avatar>
              <Box>
                <Typography>{course.lecturer}</Typography>
                <Typography variant="body2" color="textSecondary">
                  Course Instructor
                </Typography>
              </Box>
            </Box>
          </Paper>

          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Enrolled Students ({course.enrolledStudents}/{course.capacity})
            </Typography>
            <List>
              {course.students.map((student) => (
                <ListItem key={student.id}>
                  <ListItemAvatar>
                    <Avatar>
                      <SchoolIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={student.name}
                    secondary={student.email}
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>
      </Grid>

      {/* Edit Dialog */}
      <Dialog
        open={openEdit}
        onClose={() => setOpenEdit(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Edit Course</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Course Name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Course Code"
                  value={formData.code}
                  onChange={(e) =>
                    setFormData({ ...formData, code: e.target.value })
                  }
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Schedule"
                  value={formData.schedule}
                  onChange={(e) =>
                    setFormData({ ...formData, schedule: e.target.value })
                  }
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label="Description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Capacity"
                  value={formData.capacity}
                  onChange={(e) =>
                    setFormData({ ...formData, capacity: e.target.value })
                  }
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEdit(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleEdit}>
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={openDelete} onClose={() => setOpenDelete(false)}>
        <DialogTitle>Delete Course</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this course? This action cannot be
            undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDelete(false)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDelete}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CourseDetails;
