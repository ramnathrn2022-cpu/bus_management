import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Sidebar from './components/Sidebar';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import OwnerDashboard from './pages/OwnerDashboard';
import UserDashboard from './pages/UserDashboard';
import DriverDashboard from './pages/DriverDashboard';
import ManagerDashboard from './pages/ManagerDashboard';
import BusList from './pages/BusList';
import BookTicket from './pages/BookTicket';
import MyTickets from './pages/MyTickets';
import AvailableSeats from './pages/AvailableSeats';
import Drivers from './pages/Drivers';
import { getToken } from './utils/token';

/**
 * AppContent contains page routing and sidebar layout logic.
 * Needs to run inside BrowserRouter.
 */
function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Listen for global auth expiration events triggered by the Axios response interceptor
  useEffect(() => {
    const handleAuthExpired = () => {
      navigate('/login', { 
        state: { message: 'Your session has expired. Please log in again.' },
        replace: true
      });
    };

    window.addEventListener('auth-expired', handleAuthExpired);
    return () => {
      window.removeEventListener('auth-expired', handleAuthExpired);
    };
  }, [navigate]);

  const token = getToken();
  
  // Decide whether to show Sidebar (only on dashboard/internal screens, and if logged in)
  const isAuthPage = ['/login', '/register', '/'].includes(location.pathname);
  const showSidebar = token && !isAuthPage;

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      <div className="flex flex-1 relative">
        {showSidebar && (
          <Sidebar isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        )}
        
        <main className={`flex-1 min-h-[calc(100vh-140px)] transition-all duration-300 ${
          showSidebar ? 'md:pl-0' : ''
        }`}>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Protected Role-specific Routes */}
            <Route
              path="/owner"
              element={
                <ProtectedRoute allowedRoles={['owner']}>
                  <OwnerDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/user"
              element={
                <ProtectedRoute allowedRoles={['user']}>
                  <UserDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/driver"
              element={
                <ProtectedRoute allowedRoles={['driver']}>
                  <DriverDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/manager"
              element={
                <ProtectedRoute allowedRoles={['manager']}>
                  <ManagerDashboard />
                </ProtectedRoute>
              }
            />

            {/* Shared Protected Routes */}
            <Route
              path="/buses"
              element={
                <ProtectedRoute allowedRoles={['owner', 'manager', 'user']}>
                  <BusList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/drivers"
              element={
                <ProtectedRoute allowedRoles={['owner', 'manager']}>
                  <Drivers />
                </ProtectedRoute>
              }
            />
            <Route
              path="/my-tickets"
              element={
                <ProtectedRoute allowedRoles={['user']}>
                  <MyTickets />
                </ProtectedRoute>
              }
            />
            <Route
              path="/book-ticket/:busId"
              element={
                <ProtectedRoute allowedRoles={['user']}>
                  <BookTicket />
                </ProtectedRoute>
              }
            />
            <Route
              path="/available-seats/:busId"
              element={
                <ProtectedRoute allowedRoles={['owner', 'manager', 'user']}>
                  <AvailableSeats />
                </ProtectedRoute>
              }
            />

            {/* Fallback Catch-All Redirect */}
            <Route path="*" element={<Home />} />
          </Routes>
        </main>
      </div>
      
      <Footer />
    </div>
  );
}

/**
 * Root App component wrapped in BrowserRouter
 */
export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}
