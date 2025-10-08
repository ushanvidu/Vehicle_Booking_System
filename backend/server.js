import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables FIRST
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Debug: Check if env vars are loaded
console.log('Environment Variables:', {
    MONGO_URI: process.env.MONGO_URI ? 'Loaded' : 'Missing',
    PORT: process.env.PORT
});

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection with better error handling
const MONGODB_URI = process.env.MONGO_URI;

if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI is not defined in environment variables');
    process.exit(1);
}

console.log('Connecting to MongoDB Atlas...');

// MongoDB connection options
const mongooseOptions = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    retryWrites: true,
    w: 'majority'
};

mongoose.connect(MONGODB_URI, mongooseOptions)
    .then(() => console.log('✅ Connected to MongoDB Atlas successfully'))
    .catch(err => {
        console.error('❌ MongoDB connection error:', err.message);
        console.log('Please check:');
        console.log('1. Your MongoDB Atlas connection string');
        console.log('2. Your IP is whitelisted in MongoDB Atlas');
        console.log('3. Your database user credentials are correct');
        process.exit(1);
    });

// MongoDB connection events
mongoose.connection.on('error', err => {
    console.error('❌ MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
    console.log('⚠️ MongoDB disconnected');
});

mongoose.connection.on('connected', () => {
    console.log('✅ MongoDB connected');
});

// Booking Schema
const bookingSchema = new mongoose.Schema({
    name: { type: String, required: true },
    purpose: { type: String, required: true },
    bookingTime: { type: Date, required: true },
    returnTime: { type: Date, required: true },
    status: { type: String, default: 'pending' },
    createdAt: { type: Date, default: Date.now }
});

const Booking = mongoose.model('Booking', bookingSchema);

// Routes

// Health check endpoint
app.get('/api/health', (req, res) => {
    const dbStatus = mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected';
    res.json({
        status: 'OK',
        database: dbStatus,
        timestamp: new Date().toISOString()
    });
});

// Get all bookings (for admin)
app.get('/api/bookings', async (req, res) => {
    try {
        const bookings = await Booking.find().sort({ createdAt: -1 });
        res.json(bookings);
    } catch (error) {
        console.error('Error fetching bookings:', error);
        res.status(500).json({ message: 'Server error fetching bookings' });
    }
});

// Get approved bookings (for users)
app.get('/api/bookings/approved', async (req, res) => {
    try {
        const bookings = await Booking.find({ status: 'approved' }).sort({ bookingTime: 1 });
        res.json(bookings);
    } catch (error) {
        console.error('Error fetching approved bookings:', error);
        res.status(500).json({ message: 'Server error fetching approved bookings' });
    }
});

// Create new booking
app.post('/api/bookings', async (req, res) => {
    try {
        const { name, purpose, bookingTime, returnTime } = req.body;

        console.log('Received booking request:', { name, purpose, bookingTime, returnTime });

        // Validate required fields
        if (!name || !purpose || !bookingTime || !returnTime) {
            return res.status(400).json({
                message: 'All fields are required: name, purpose, bookingTime, returnTime'
            });
        }

        // Validate dates
        const bookingDateTime = new Date(bookingTime);
        const returnDateTime = new Date(returnTime);

        if (isNaN(bookingDateTime.getTime()) || isNaN(returnDateTime.getTime())) {
            return res.status(400).json({
                message: 'Invalid date format for bookingTime or returnTime'
            });
        }

        if (bookingDateTime >= returnDateTime) {
            return res.status(400).json({
                message: 'Return time must be after booking time'
            });
        }

        // Check for time conflicts with approved bookings
        const conflictingBooking = await Booking.findOne({
            status: 'approved',
            $or: [
                {
                    bookingTime: { $lte: returnDateTime },
                    returnTime: { $gte: bookingDateTime }
                }
            ]
        });

        if (conflictingBooking) {
            return res.status(400).json({
                message: `Time conflict with existing booking from ${conflictingBooking.bookingTime} to ${conflictingBooking.returnTime}`
            });
        }

        const booking = new Booking({
            name,
            purpose,
            bookingTime: bookingDateTime,
            returnTime: returnDateTime
        });

        const newBooking = await booking.save();
        console.log('Booking created successfully:', newBooking._id);
        res.status(201).json(newBooking);
    } catch (error) {
        console.error('Error creating booking:', error);
        res.status(500).json({ message: 'Server error creating booking' });
    }
});

// Update booking status
app.patch('/api/bookings/:id', async (req, res) => {
    try {
        const { status } = req.body;

        if (!['pending', 'approved', 'rejected'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        const booking = await Booking.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        );

        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        res.json(booking);
    } catch (error) {
        console.error('Error updating booking:', error);
        res.status(500).json({ message: 'Server error updating booking' });
    }
});

// Delete booking
app.delete('/api/bookings/:id', async (req, res) => {
    try {
        const booking = await Booking.findByIdAndDelete(req.params.id);
        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }
        res.json({ message: 'Booking deleted successfully' });
    } catch (error) {
        console.error('Error deleting booking:', error);
        res.status(500).json({ message: 'Server error deleting booking' });
    }
});

// Test endpoint to check if server is working
app.get('/', (req, res) => {
    res.json({
        message: 'Motorbike Booking API is running!',
        endpoints: {
            health: '/api/health',
            bookings: '/api/bookings',
            approvedBookings: '/api/bookings/approved'
        }
    });
});

app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
    console.log(`📍 Health check: http://localhost:${PORT}/api/health`);
});