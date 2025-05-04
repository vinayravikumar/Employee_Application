const mongoose = require('mongoose');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

async function createTestUser() {
    try {
        // Connect to MongoDB
        await mongoose.connect('mongodb+srv://vinay_ravikumar:VxQbDluNY2pKHfIH@cluster0.gzvgtjk.mongodb.net/', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });

        // Check if user already exists
        const existingUser = await User.findOne({ username: 'adminUser' });
        if (existingUser) {
            console.log('User already exists');
            return;
        }

        // Create new user
        const user = new User({
            username: 'adminUser',    
            email: 'adminUser@gmail.com',
            password: '123', // The pre-save middleware will hash this
            role: 'admin'
        });

        await user.save();
        console.log('User created successfully:', user);

    } catch (error) {
        console.error('Error creating user:', error);
    } finally {
        await mongoose.disconnect();
    }
}

createTestUser(); 