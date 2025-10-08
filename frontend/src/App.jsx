import { Routes, Route, Link } from 'react-router-dom'
import UserPage from './UserPage'
import AdminPage from './AdminPage'

function App() {
    return (
        <div className="min-h-screen bg-gray-50">
            <nav className="bg-blue-600 text-white p-4">
                <div className="container mx-auto flex justify-between items-center">
                    <h1 className="text-xl font-bold">🏍️ Motorbike Booking</h1>
                    <div className="space-x-4">
                        <Link to="/" className="hover:text-blue-200 transition-colors">
                            User
                        </Link>
                        <Link to="/admin" className="hover:text-blue-200 transition-colors">
                            Admin
                        </Link>
                    </div>
                </div>
            </nav>

            <Routes>
                <Route path="/" element={<UserPage />} />
                <Route path="/admin" element={<AdminPage />} />
            </Routes>
        </div>
    )
}

export default App