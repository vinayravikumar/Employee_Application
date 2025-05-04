const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Employee = require('../models/Employee');

// Middleware to verify JWT token
const auth = (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: 'No token provided' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Invalid token' });
    }
};

// Middleware to check admin role
const isAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied' });
    }
    next();
};

// Get all employees
router.get('/', auth, async (req, res) => {
    try {
        const employees = await Employee.find();
        res.json(employees);
    } catch (error) {
        console.error('Error fetching employees:', error);
        res.status(500).json({ message: 'Error fetching employees' });
    }
});

// Get single employee
router.get('/:id', auth, async (req, res) => {
    try {
        const employee = await Employee.findById(req.params.id);
        if (!employee) {
            return res.status(404).json({ message: 'Employee not found' });
        }
        res.json(employee);
    } catch (error) {
        console.error('Error fetching employee:', error);
        res.status(500).json({ message: 'Error fetching employee' });
    }
});

// Create new employee (admin only)
router.post('/', [auth, isAdmin], async (req, res) => {
    try {
        console.log('Creating employee with data:', req.body);
        
        // Validate required fields
        const requiredFields = ['name', 'email', 'phone', 'department', 'position', 'salary'];
        const missingFields = requiredFields.filter(field => !req.body[field]);
        
        if (missingFields.length > 0) {
            console.error('Missing required fields:', missingFields);
            return res.status(400).json({ 
                message: 'Missing required fields', 
                fields: missingFields 
            });
        }

        const employee = new Employee(req.body);
        const savedEmployee = await employee.save();
        console.log('Employee created successfully:', savedEmployee);
        res.status(201).json(savedEmployee);
    } catch (error) {
        console.error('Error creating employee:', error);
        // Send more detailed error message
        if (error.code === 11000) {
            res.status(400).json({ message: 'Email already exists' });
        } else if (error.name === 'ValidationError') {
            const validationErrors = Object.values(error.errors).map(err => err.message);
            res.status(400).json({ 
                message: 'Validation error', 
                errors: validationErrors 
            });
        } else {
            res.status(400).json({ 
                message: 'Error creating employee',
                error: error.message 
            });
        }
    }
});

// Update employee (admin only)
router.put('/:id', [auth, isAdmin], async (req, res) => {
    try {
        const employee = await Employee.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        if (!employee) {
            return res.status(404).json({ message: 'Employee not found' });
        }
        res.json(employee);
    } catch (error) {
        console.error('Error updating employee:', error);
        res.status(400).json({ message: 'Error updating employee' });
    }
});

// Delete employee (admin only)
router.delete('/:id', [auth, isAdmin], async (req, res) => {
    try {
        const employee = await Employee.findByIdAndDelete(req.params.id);
        if (!employee) {
            return res.status(404).json({ message: 'Employee not found' });
        }
        res.json({ message: 'Employee deleted successfully' });
    } catch (error) {
        console.error('Error deleting employee:', error);
        res.status(400).json({ message: 'Error deleting employee' });
    }
});

module.exports = router; 