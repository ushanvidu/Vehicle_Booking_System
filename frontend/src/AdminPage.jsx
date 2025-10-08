import { useState, useEffect } from 'react'
import axios from 'axios'

const AdminPage = () => {
    const [bookings, setBookings] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchBookings()
    }, [])

    const fetchBookings = async () => {
        try {
            const response = await axios.get('/api/bookings')
            setBookings(response.data)
        } catch (error) {
            console.error('Error fetching bookings:', error)
        } finally {
            setLoading(false)
        }
    }

    const updateBookingStatus = async (id, status) => {
        try {
            await axios.patch(`/api/bookings/${id}`, { status })
            fetchBookings() // Refresh the list
        } catch (error) {
            console.error('Error updating booking:', error)
            alert('Error updating booking status')
        }
    }

    const deleteBooking = async (id) => {
        if (window.confirm('Are you sure you want to delete this booking?')) {
            try {
                await axios.delete(`/api/bookings/${id}`)
                fetchBookings() // Refresh the list
            } catch (error) {
                console.error('Error deleting booking:', error)
                alert('Error deleting booking')
            }
        }
    }

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString()
    }

    const getStatusColor = (status) => {
        switch (status) {
            case 'approved':
                return 'bg-green-100 text-green-800'
            case 'rejected':
                return 'bg-red-100 text-red-800'
            default:
                return 'bg-yellow-100 text-yellow-800'
        }
    }

    if (loading) {
        return (
            <div className="container mx-auto p-4">
                <div className="flex justify-center items-center h-64">
                    <div className="text-lg text-gray-600">Loading bookings...</div>
                </div>
            </div>
        )
    }

    return (
        <div className="container mx-auto p-4 max-w-6xl">
            <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-3xl font-bold mb-6 text-gray-800">Admin Dashboard</h2>
                <p className="text-gray-600 mb-6">Manage motorbike booking requests</p>

                {bookings.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-gray-500 text-lg">No booking requests yet.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full table-auto">
                            <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Name
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Purpose
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Booking Time
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Return Time
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                            {bookings.map((booking) => (
                                <tr key={booking._id} className="hover:bg-gray-50">
                                    <td className="px-4 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">{booking.name}</div>
                                    </td>
                                    <td className="px-4 py-4">
                                        <div className="text-sm text-gray-900">{booking.purpose}</div>
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">{formatDate(booking.bookingTime)}</div>
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">{formatDate(booking.returnTime)}</div>
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(booking.status)}`}>
                        {booking.status}
                      </span>
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                        {booking.status === 'pending' && (
                                            <>
                                                <button
                                                    onClick={() => updateBookingStatus(booking._id, 'approved')}
                                                    className="text-green-600 hover:text-green-900 transition-colors"
                                                >
                                                    Approve
                                                </button>
                                                <button
                                                    onClick={() => updateBookingStatus(booking._id, 'rejected')}
                                                    className="text-red-600 hover:text-red-900 transition-colors"
                                                >
                                                    Reject
                                                </button>
                                            </>
                                        )}
                                        <button
                                            onClick={() => deleteBooking(booking._id)}
                                            className="text-gray-600 hover:text-gray-900 transition-colors"
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    )
}

export default AdminPage