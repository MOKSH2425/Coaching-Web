import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, Users, CreditCard, CalendarCheck, Calendar, 
  BookOpen, Contact, Settings, LogOut, UserPlus, Megaphone, Library 
} from 'lucide-react';
import toast from 'react-hot-toast';

const Sidebar = ({ isOpen, closeSidebar }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('user_role');
    toast.success("Logged out successfully");
    navigate('/login');
  };

  const handleLinkClick = () => {
    if (window.innerWidth < 768) closeSidebar();
  };

  return (
    <div className={`sidebar d-flex flex-column p-3 text-white ${isOpen ? 'open' : ''}`}>
      <h3 className="mb-4 fw-bold px-2" style={{ letterSpacing: '1px' }}>DIGITALFORGEX</h3>
      
      <div className="flex-grow-1 overflow-auto">
        <div className="nav flex-column gap-2">
          
          <NavLink to="/dashboard" onClick={handleLinkClick} className={({ isActive }) => `sidebar-link rounded ${isActive ? 'active' : ''}`}>
            <LayoutDashboard size={20} /> Dashboard
          </NavLink>

          <NavLink to="/students" onClick={handleLinkClick} className={({ isActive }) => `sidebar-link rounded ${isActive ? 'active' : ''}`}>
            <Users size={20} /> Students
          </NavLink>

          <NavLink to="/fees" onClick={handleLinkClick} className={({ isActive }) => `sidebar-link rounded ${isActive ? 'active' : ''}`}>
            <CreditCard size={20} /> Fees
          </NavLink>

          <NavLink to="/attendance" onClick={handleLinkClick} className={({ isActive }) => `sidebar-link rounded ${isActive ? 'active' : ''}`}>
            <CalendarCheck size={20} /> Attendance
          </NavLink>
          
          <NavLink to="/notices" onClick={handleLinkClick} className={({ isActive }) => `sidebar-link rounded ${isActive ? 'active' : ''}`}>
            <Megaphone size={20} /> Notice Board
          </NavLink>
          
          <NavLink to="/resources" onClick={handleLinkClick} className={({ isActive }) => `sidebar-link rounded ${isActive ? 'active' : ''}`}>
            <Library size={20} /> Study Materials
          </NavLink>

          <NavLink to="/timetable" onClick={handleLinkClick} className={({ isActive }) => `sidebar-link rounded ${isActive ? 'active' : ''}`}>
            <Calendar size={20} /> Timetable
          </NavLink>

          <NavLink to="/exams" onClick={handleLinkClick} className={({ isActive }) => `sidebar-link rounded ${isActive ? 'active' : ''}`}>
            <BookOpen size={20} /> Exams & Results
          </NavLink>

          <NavLink to="/staff" onClick={handleLinkClick} className={({ isActive }) => `sidebar-link rounded ${isActive ? 'active' : ''}`}>
            <Contact size={20} /> Staff Directory
          </NavLink>

          <NavLink to="/inquiries" onClick={handleLinkClick} className={({ isActive }) => `sidebar-link rounded ${isActive ? 'active' : ''}`}>
            <UserPlus size={20} /> Inquiry CRM
          </NavLink>

          <NavLink to="/settings" onClick={handleLinkClick} className={({ isActive }) => `sidebar-link rounded ${isActive ? 'active' : ''}`}>
            <Settings size={20} /> Settings
          </NavLink>
        </div>
      </div>

      <div className="mt-auto pt-3 border-top border-secondary">
        <button onClick={handleLogout} className="btn btn-link text-danger text-decoration-none d-flex align-items-center gap-2 ps-2">
          <LogOut size={20} /> Logout
        </button>
      </div>
    </div>
  );
};

export default Sidebar;