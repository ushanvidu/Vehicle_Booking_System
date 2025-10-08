import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error('MONGODB_URI is missing');
}

mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(() => console.log('✅ Connected to MongoDB Atlas'))
    .catch(err => console.error('❌ MongoDB connection error:', err));

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

// Routes (keep your existing routes exactly as they are)
app.get('/api/health', (req, res) => {
    const dbStatus = mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected';
    res.json({
        status: 'OK',
        database: dbStatus,
        timestamp: new Date().toISOString()
    });
});

app.get('/api/bookings', async (req, res) => {
    try {
        const bookings = await Booking.find().sort({ createdAt: -1 });
        res.json(bookings);
    } catch (error) {
        console.error('Error fetching bookings:', error);
        res.status(500).json({ message: 'Server error fetching bookings' });
    }
});

app.get('/api/bookings/approved', async (req, res) => {
    try {
        const bookings = await Booking.find({ status: 'approved' }).sort({ bookingTime: 1 });
        res.json(bookings);
    } catch (error) {
        console.error('Error fetching approved bookings:', error);
        res.status(500).json({ message: 'Server error fetching approved bookings' });
    }
});

app.post('/api/bookings', async (req, res) => {
    try {
        const { name, purpose, bookingTime, returnTime } = req.body;

        if (!name || !purpose || !bookingTime || !returnTime) {
            return res.status(400).json({
                message: 'All fields are required'
            });
        }

        const bookingDateTime = new Date(bookingTime);
        const returnDateTime = new Date(returnTime);

        if (bookingDateTime >= returnDateTime) {
            return res.status(400).json({
                message: 'Return time must be after booking time'
            });
        }

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
                message: 'Time slot conflict with existing booking'
            });
        }

        const booking = new Booking({
            name,
            purpose,
            bookingTime: bookingDateTime,
            returnTime: returnDateTime
        });

        const newBooking = await booking.save();
        res.status(201).json(newBooking);
    } catch (error) {
        console.error('Error creating booking:', error);
        res.status(500).json({ message: 'Server error creating booking' });
    }
});

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

// Export for Vercel
export default app;

// Only listen locally, not on Vercel
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}