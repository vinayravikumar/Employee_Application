'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import {
  Container,
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Grid,
  InputAdornment,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import WorkIcon from '@mui/icons-material/Work';
import BusinessIcon from '@mui/icons-material/Business';
import PersonIcon from '@mui/icons-material/Person';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';

interface Employee {
  _id: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  position: string;
  salary: number;
  createdAt?: Date;
  updatedAt?: Date;
}

const emptyEmployee: Employee = {
  _id: '',
  name: '',
  email: '',
  phone: '',
  department: '',
  position: '',
  salary: 0
};

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [currentEmployee, setCurrentEmployee] = useState<Employee>(emptyEmployee);
  const [error, setError] = useState('');
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof Employee, string>>>({});
  const router = useRouter();
  const { isAuthenticated, isAdmin, user, logout } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    fetchEmployees();
  }, [isAuthenticated, router]);

  const fetchEmployees = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/employees', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch employees');
      const data = await response.json();
      setEmployees(data);
    } catch (err) {
      setError('Failed to load employees');
    }
  };

  const validateForm = (): boolean => {
    const errors: Partial<Record<keyof Employee, string>> = {};
    
    if (!currentEmployee.name.trim()) errors.name = 'Name is required';
    if (!currentEmployee.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(currentEmployee.email)) {
      errors.email = 'Invalid email format';
    }
    if (!currentEmployee.phone.trim()) {
      errors.phone = 'Phone is required';
    } else if (!/^\+?[\d\s-]{10,}$/.test(currentEmployee.phone)) {
      errors.phone = 'Invalid phone format';
    }
    if (!currentEmployee.department.trim()) errors.department = 'Department is required';
    if (!currentEmployee.position.trim()) errors.position = 'Position is required';
    if (!currentEmployee.salary || currentEmployee.salary <= 0) {
      errors.salary = 'Valid salary is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleOpenDialog = (employee?: Employee) => {
    setCurrentEmployee(employee || emptyEmployee);
    setFormErrors({});
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCurrentEmployee(emptyEmployee);
    setFormErrors({});
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    try {
        const token = localStorage.getItem('token');
        const url = currentEmployee._id
            ? `http://localhost:5000/api/employees/${currentEmployee._id}`
            : 'http://localhost:5000/api/employees';
        
        // Create a clean payload without _id for new employees
        const payload = currentEmployee._id 
            ? currentEmployee 
            : {
                name: currentEmployee.name,
                email: currentEmployee.email,
                phone: currentEmployee.phone,
                department: currentEmployee.department,
                position: currentEmployee.position,
                salary: currentEmployee.salary
            };
        
        const response = await fetch(url, {
            method: currentEmployee._id ? 'PUT' : 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(payload),
        });

        const data = await response.json();
        
        if (!response.ok) {
            if (data.fields) {
                // Handle missing fields error
                setFormErrors(
                    data.fields.reduce((acc: any, field: string) => {
                        acc[field] = `${field} is required`;
                        return acc;
                    }, {})
                );
                throw new Error('Please fill in all required fields');
            } else if (data.errors) {
                // Handle validation errors
                setFormErrors(
                    data.errors.reduce((acc: any, error: string) => {
                        const field = error.split(' ')[0].toLowerCase();
                        acc[field] = error;
                        return acc;
                    }, {})
                );
                throw new Error('Please correct the validation errors');
            } else {
                throw new Error(data.message || 'Failed to save employee');
            }
        }
        
        handleCloseDialog();
        fetchEmployees();
    } catch (err: any) {
        console.error('Save error:', err);
        setError(err.message || 'Failed to save employee');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this employee?')) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/employees/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to delete employee');
      
      fetchEmployees();
    } catch (err) {
      setError('Failed to delete employee');
    }
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (!isAuthenticated) return null;

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h4">Employees</Typography>
          <Box>
            {isAdmin && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => handleOpenDialog()}
                sx={{ mr: 2 }}
              >
                Add Employee
              </Button>
            )}
            <Button variant="outlined" onClick={logout}>
              Logout
            </Button>
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Phone</TableCell>
                <TableCell>Department</TableCell>
                <TableCell>Position</TableCell>
                <TableCell>Salary</TableCell>
                <TableCell>Created</TableCell>
                {isAdmin && <TableCell>Actions</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {employees.map((employee) => (
                <TableRow key={employee._id}>
                  <TableCell>{employee.name}</TableCell>
                  <TableCell>{employee.email}</TableCell>
                  <TableCell>{employee.phone}</TableCell>
                  <TableCell>{employee.department}</TableCell>
                  <TableCell>{employee.position}</TableCell>
                  <TableCell>${employee.salary.toLocaleString()}</TableCell>
                  <TableCell>{employee.createdAt && formatDate(employee.createdAt)}</TableCell>
                  {isAdmin && (
                    <TableCell>
                      <IconButton 
                        onClick={() => handleOpenDialog(employee)}
                        color="primary"
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton 
                        onClick={() => handleDelete(employee._id)}
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {currentEmployee._id ? 'Edit Employee' : 'Add Employee'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Name"
                value={currentEmployee.name}
                onChange={(e) =>
                  setCurrentEmployee({ ...currentEmployee, name: e.target.value })
                }
                error={!!formErrors.name}
                helperText={formErrors.name}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={currentEmployee.email}
                onChange={(e) =>
                  setCurrentEmployee({ ...currentEmployee, email: e.target.value })
                }
                error={!!formErrors.email}
                helperText={formErrors.email}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Phone"
                value={currentEmployee.phone}
                onChange={(e) =>
                  setCurrentEmployee({ ...currentEmployee, phone: e.target.value })
                }
                error={!!formErrors.phone}
                helperText={formErrors.phone}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PhoneIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Department"
                value={currentEmployee.department}
                onChange={(e) =>
                  setCurrentEmployee({ ...currentEmployee, department: e.target.value })
                }
                error={!!formErrors.department}
                helperText={formErrors.department}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <BusinessIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Position"
                value={currentEmployee.position}
                onChange={(e) =>
                  setCurrentEmployee({ ...currentEmployee, position: e.target.value })
                }
                error={!!formErrors.position}
                helperText={formErrors.position}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <WorkIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Salary"
                type="number"
                value={currentEmployee.salary}
                onChange={(e) =>
                  setCurrentEmployee({
                    ...currentEmployee,
                    salary: parseFloat(e.target.value) || 0,
                  })
                }
                error={!!formErrors.salary}
                helperText={formErrors.salary}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <AttachMoneyIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSave} variant="contained" color="primary">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
} 