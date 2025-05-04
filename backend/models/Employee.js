const mongoose = require('mongoose');

const EmployeeSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    phone: {
        type: String,
        required: true,
        trim: true
    },
    department: {
        type: String,
        required: true,
        trim: true
    },
    position: {
        type: String,
        required: true,
        trim: true
    },
    salary: {
        type: Number,
        required: true,
        min: 0
    }
}, {
    timestamps: true // This will automatically add createdAt and updatedAt fields
});

module.exports = mongoose.model('Employee', EmployeeSchema); 