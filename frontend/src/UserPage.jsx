import { useState, useEffect } from 'react'
import axios from 'axios'

const UserPage = () => {
    const [formData, setFormData] = useState({
        name: '',
        purpose: '',
        bookingTime: '',
        returnTime: ''
    })
    const [approvedBookings, setApprovedBookings] = useState([])
    const [message, setMessage] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)

    useEffect(() => {
        fetchApprovedBookings()
    }, [])

    const fetchApprovedBookings = async () => {
        try {
            const response = await axios.get('/api/bookings/approved')
            setApprovedBookings(response.data)
        } catch (error) {
            console.error('Error fetching approved bookings:', error)
        }
    }

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        })
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setIsSubmitting(true)
        setMessage('')

        try {
            await axios.post('/api/bookings', formData)
            setMessage('Booking request submitted successfully! Waiting for admin approval.')
            setFormData({
                name: '',
                purpose: '',
                bookingTime: '',
                returnTime: ''
            })
            fetchApprovedBookings()
        } catch (error) {
            setMessage(error.response?.data?.message || 'Error submitting booking request')
        } finally {
            setIsSubmitting(false)
        }
    }

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString()
    }

    return (
        <div className="container mx-auto p-4 max-w-4xl">
            <div className="grid md:grid-cols-2 gap-8">
                {/* Booking Form */}
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-2xl font-bold mb-6 text-gray-800">Book the Motorbike</h2>

                    {message && (
                        <div className={`p-4 rounded mb-4 ${
                            message.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                        }`}>
                            {message}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Your Name *
                            </label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Enter your full name"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Purpose *
                            </label>
                            <input
                                type="text"
                                name="purpose"
                                value={formData.purpose}
                                onChange={handleChange}
                                required
                                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="What will you use the bike for?"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Booking Time *
                            </label>
                            <input
                                type="datetime-local"
                                name="bookingTime"
                                value={formData.bookingTime}
                                onChange={handleChange}
                                required
                                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Estimated Return Time *
                            </label>
                            <input
                                type="datetime-local"
                                name="returnTime"
                                value={formData.returnTime}
                                onChange={handleChange}
                                required
                                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 transition-colors"
                        >
                            {isSubmitting ? 'Submitting...' : 'Submit Booking Request'}
                        </button>
                    </form>
                </div>

                {/* Approved Bookings */}
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-2xl font-bold mb-6 text-gray-800">Approved Bookings</h2>

                    {approvedBookings.length === 0 ? (
                        <p className="text-gray-500 text-center py-8">No approved bookings yet.</p>
                    ) : (
                        <div className="space-y-4">
                            {approvedBookings.map((booking) => (
                                <div key={booking._id} className="border border-green-200 rounded-lg p-4 bg-green-50">
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="font-semibold text-gray-800">{booking.name}</h3>
                                        <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                      Approved
                    </span>
                                    </div>
                                    <p className="text-sm text-gray-600 mb-2">{booking.purpose}</p>
                                    <div className="text-xs text-gray-500">
                                        <p>From: {formatDate(booking.bookingTime)}</p>
                                        <p>To: {formatDate(booking.returnTime)}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default UserPage