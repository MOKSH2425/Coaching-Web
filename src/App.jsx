import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute'; // Security Wrapper!
import { Container } from 'react-bootstrap';
import { Menu } from 'lucide-react';
import { Toaster } from 'react-hot-toast';

// IMPORTS
import Login from './Login';
import Dashboard from './Dashboard';
import Students from './Students';
import Fees from './Fees';
import Attendance from './Attendance';
import Sidebar from './Sidebar';
import Settings from './Settings';
import Schedule from './Schedule';
import Exams from './Exams';
import Staff from './Staff';
import Inquiries from './Inquiries';
import Notices from './Notices';
import Resources from './Resources'; 
import StudentDashboard from './StudentDashboard';

import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';

// ADMIN LAYOUT (Kept exactly as you built it!)
const AdminLayout = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setIsSidebarOpen(false);

  return (
    <div className="d-flex" style={{ minHeight: '100vh' }}>
      <div className={`sidebar-overlay ${isSidebarOpen ? 'show' : ''}`} onClick={closeSidebar}></div>
      <Sidebar isOpen={isSidebarOpen} closeSidebar={closeSidebar} />
      <div className="flex-grow-1 d-flex flex-column" style={{ marginLeft: '0px', overflowX: 'hidden', width: '100%' }}>
        <div className="mobile-header p-3 d-md-none d-flex align-items-center justify-content-between shadow-sm">
          <h5 className="mb-0 fw-bold text-white">DIGITALFORGEX</h5>
          <button className="btn btn-link text-white p-0" onClick={toggleSidebar}><Menu size={28} /></button>
        </div>
        <div className="p-3 p-md-4 flex-grow-1"><Container fluid className="p-0">{children}</Container></div>
      </div>
    </div>
  );
};

function App() {
  // Theme Loader (Kept exactly as you built it!)
  useEffect(() => {
    const savedTheme = localStorage.getItem('digitalforgex_theme') || 'dark';
    document.body.setAttribute('data-theme', savedTheme);
  }, []);

  return (
    <Router>
      <Toaster position="top-right" toastOptions={{ style: { background: '#333', color: '#fff' } }} />
      <Routes>
        {/* PUBLIC ROUTES */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        
        {/* ======================================================== */}
        {/* STUDENT ROUTE (Locked for Students Only)                 */}
        {/* ======================================================== */}
        <Route path="/student/dashboard" element={
          <ProtectedRoute allowedRole="student">
            <StudentDashboard />
          </ProtectedRoute>
        } />

        {/* ======================================================== */}
        {/* ADMIN ROUTES (Locked for Admins Only + Includes Sidebar) */}
        {/* ======================================================== */}
        <Route path="/dashboard" element={<ProtectedRoute allowedRole="admin"><AdminLayout><Dashboard /></AdminLayout></ProtectedRoute>} />
        <Route path="/students" element={<ProtectedRoute allowedRole="admin"><AdminLayout><Students /></AdminLayout></ProtectedRoute>} />
        <Route path="/fees" element={<ProtectedRoute allowedRole="admin"><AdminLayout><Fees /></AdminLayout></ProtectedRoute>} />
        <Route path="/attendance" element={<ProtectedRoute allowedRole="admin"><AdminLayout><Attendance /></AdminLayout></ProtectedRoute>} />
        <Route path="/notices" element={<ProtectedRoute allowedRole="admin"><AdminLayout><Notices /></AdminLayout></ProtectedRoute>} />
        <Route path="/resources" element={<ProtectedRoute allowedRole="admin"><AdminLayout><Resources /></AdminLayout></ProtectedRoute>} /> 
        <Route path="/timetable" element={<ProtectedRoute allowedRole="admin"><AdminLayout><Schedule /></AdminLayout></ProtectedRoute>} />
        <Route path="/exams" element={<ProtectedRoute allowedRole="admin"><AdminLayout><Exams /></AdminLayout></ProtectedRoute>} />
        <Route path="/staff" element={<ProtectedRoute allowedRole="admin"><AdminLayout><Staff /></AdminLayout></ProtectedRoute>} />
        <Route path="/inquiries" element={<ProtectedRoute allowedRole="admin"><AdminLayout><Inquiries /></AdminLayout></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute allowedRole="admin"><AdminLayout><Settings /></AdminLayout></ProtectedRoute>} />

        {/* CATCH-ALL: If they type a broken URL, kick them to login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;