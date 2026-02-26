import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
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
import Resources from './Resources'; // <--- NEW IMPORT
import StudentDashboard from './StudentDashboard';

import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';

// ADMIN LAYOUT
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
  useEffect(() => {
    const savedTheme = localStorage.getItem('digitalforgex_theme') || 'dark';
    document.body.setAttribute('data-theme', savedTheme);
  }, []);

  return (
    <Router>
      <Toaster position="top-right" toastOptions={{ style: { background: '#333', color: '#fff' } }} />
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />
        
        {/* STUDENT ROUTE */}
        <Route path="/student/dashboard" element={<StudentDashboard />} />

        {/* ADMIN ROUTES */}
        <Route path="/dashboard" element={<AdminLayout><Dashboard /></AdminLayout>} />
        <Route path="/students" element={<AdminLayout><Students /></AdminLayout>} />
        <Route path="/fees" element={<AdminLayout><Fees /></AdminLayout>} />
        <Route path="/attendance" element={<AdminLayout><Attendance /></AdminLayout>} />
        <Route path="/notices" element={<AdminLayout><Notices /></AdminLayout>} />
        <Route path="/resources" element={<AdminLayout><Resources /></AdminLayout>} /> 
        <Route path="/timetable" element={<AdminLayout><Schedule /></AdminLayout>} />
        <Route path="/exams" element={<AdminLayout><Exams /></AdminLayout>} />
        <Route path="/staff" element={<AdminLayout><Staff /></AdminLayout>} />
        <Route path="/inquiries" element={<AdminLayout><Inquiries /></AdminLayout>} />
        <Route path="/settings" element={<AdminLayout><Settings /></AdminLayout>} />
      </Routes>
    </Router>
  );
}

export default App;