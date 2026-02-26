import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Button, Nav, Tab, Container, Row, Col } from 'react-bootstrap';
import { Lock, Mail, ChevronRight, Phone, Shield, User, Hexagon } from 'lucide-react';
import PageTransition from './PageTransition';
import toast from 'react-hot-toast';

// --- FIREBASE IMPORTS ---
import { db } from './firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

const Login = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('admin');
  const [isLoggingIn, setIsLoggingIn] = useState(false); // To show loading state

  // Credentials
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPass, setAdminPass] = useState('');
  const [studentPhone, setStudentPhone] = useState('');

// --- ADMIN LOGIN (SECURED) ---
  const handleAdminLogin = (e) => {
    e.preventDefault();
    
    // 🔒 Set your Master Admin credentials here
    const MASTER_EMAIL = "admin@test.com";
    const MASTER_PASS = "admin123"; 

    if (adminEmail === MASTER_EMAIL && adminPass === MASTER_PASS) {
      localStorage.setItem('user_role', 'admin');
      toast.success("Access Granted. Welcome back, Admin!");
      navigate('/dashboard');
    } else {
      toast.error("Invalid credentials. Access Denied.");
    }
  };

  // --- STUDENT LOGIN (NOW LIVE VIA FIREBASE) ---
  const handleStudentLogin = async (e) => {
    e.preventDefault();
    
    if (!studentPhone) {
      toast.error("Please enter your phone number.");
      return;
    }

    setIsLoggingIn(true);

    try {
      // 1. Ask Firebase: "Find a student where 'phone' equals what the user typed"
      const studentsRef = collection(db, "students");
      const q = query(studentsRef, where("phone", "==", studentPhone));
      const querySnapshot = await getDocs(q);

      // 2. Check if we got a match
      if (!querySnapshot.empty) {
        // Match found! Extract the data
        const studentDoc = querySnapshot.docs[0];
        const studentData = studentDoc.data();
        const studentId = studentDoc.id;

        // Save session data so they stay logged in
        localStorage.setItem('user_role', 'student');
        localStorage.setItem('current_student_id', studentId);
        localStorage.setItem('current_student_name', studentData.name);
        localStorage.setItem('current_student_class', studentData.class);

        toast.success(`Welcome back, ${studentData.name}!`);
        navigate('/student/dashboard');
      } else {
        // No match found
        toast.error("Phone number not registered! Contact Admin.");
      }
    } catch (error) {
      console.error("Login Error:", error);
      toast.error("Error connecting to database.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  // --- STYLES ---
  const glassPanelStyle = {
    backgroundColor: 'rgba(15, 23, 42, 0.70)', 
    backdropFilter: 'blur(25px)',              
    borderLeft: '1px solid rgba(255, 255, 255, 0.08)', 
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    boxShadow: '-10px 0 30px rgba(0,0,0,0.5)' 
  };

  const inputStyle = {
    backgroundColor: 'rgba(0, 0, 0, 0.3)', 
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '12px',
    padding: '16px 20px',
    display: 'flex',
    alignItems: 'center',
    marginBottom: '20px',
    transition: 'all 0.3s ease'
  };

  return (
    <PageTransition>
      <div className="vh-100 w-100 overflow-hidden position-relative">
        
        {/* BACKGROUND */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'url("https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop")',
          backgroundSize: 'cover', backgroundPosition: 'center', zIndex: -2
        }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.4) 100%)', zIndex: -1 }} />

        <Container fluid className="h-100 p-0">
          <Row className="h-100 g-0">
            
            {/* LEFT SIDE TEXT */}
            <Col lg={7} md={6} className="d-none d-md-flex flex-column justify-content-end p-5 text-white">
              <div style={{ marginBottom: '5rem', paddingLeft: '2rem' }}>
                <div className="d-inline-flex align-items-center gap-2 px-3 py-1 rounded-pill mb-3" 
                     style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(4px)' }}>
                   <div className="bg-success rounded-circle shadow" style={{ width: '8px', height: '8px' }}></div>
                   <span className="text-white small fw-bold" style={{ fontSize: '0.75rem', letterSpacing: '1px' }}>SYSTEM OPERATIONAL</span>
                </div>
                <h1 className="display-3 fw-bold mb-2" style={{ textShadow: '0 4px 20px rgba(0,0,0,0.5)' }}>DIGITALFORGEX</h1>
                <p className="lead text-white-50 fs-5" style={{ maxWidth: '500px' }}>
                  The complete ecosystem for academic management, performance tracking, and student success.
                </p>
              </div>
            </Col>

            {/* RIGHT SIDE GLASS PANE */}
            <Col lg={5} md={6} style={glassPanelStyle}>
              <div style={{ width: '100%', maxWidth: '420px', padding: '40px' }}>
                
                <div className="text-center mb-5">
                  <div className="d-inline-flex align-items-center justify-content-center bg-primary bg-opacity-20 rounded-circle mb-4" 
                       style={{ width: '80px', height: '80px', border: '1px solid rgba(59, 130, 246, 0.3)', boxShadow: '0 0 20px rgba(59, 130, 246, 0.2)' }}>
                    <Hexagon size={36} className="text-primary" />
                  </div>
                  <h2 className="fw-bold text-white mb-1">Welcome Back</h2>
                  <p className="text-white-50">Please login to continue.</p>
                </div>

                <Tab.Container activeKey={activeTab} onSelect={(k) => setActiveTab(k)}>
                  
                  {/* TOGGLE */}
                  <div className="mb-5 p-1 rounded-pill d-flex bg-black bg-opacity-40 border border-white border-opacity-10">
                    <Button 
                      variant="link" 
                      className={`w-50 rounded-pill text-decoration-none fw-bold py-2 transition-all ${activeTab === 'admin' ? 'bg-primary text-white shadow' : 'text-white-50'}`}
                      onClick={() => setActiveTab('admin')}
                    >
                      <Shield size={16} className="me-2 mb-1" /> Admin
                    </Button>
                    <Button 
                      variant="link" 
                      className={`w-50 rounded-pill text-decoration-none fw-bold py-2 transition-all ${activeTab === 'student' ? 'bg-success text-white shadow' : 'text-white-50'}`}
                      onClick={() => setActiveTab('student')}
                    >
                      <User size={16} className="me-2 mb-1" /> Student
                    </Button>
                  </div>

                  <Tab.Content>
                    {/* ADMIN FORM */}
                    <Tab.Pane eventKey="admin">
                      <Form onSubmit={handleAdminLogin}>
                        <div style={inputStyle}>
                          <Mail size={20} className="text-white-50 me-3" />
                          <input type="email" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)}
                            className="bg-transparent border-0 text-white w-100 p-0 shadow-none"
                            placeholder="Email Address" style={{ outline: 'none' }} required />
                        </div>
                        <div style={inputStyle}>
                          <Lock size={20} className="text-white-50 me-3" />
                          <input type="password" value={adminPass} onChange={(e) => setAdminPass(e.target.value)}
                            className="bg-transparent border-0 text-white w-100 p-0 shadow-none"
                            placeholder="Password" style={{ outline: 'none' }} required />
                        </div>
                        <Button type="submit" variant="primary" className="w-100 py-3 fw-bold rounded-pill shadow-lg mt-2 hover-scale">
                          Login to Dashboard <ChevronRight size={18} className="ms-2" />
                        </Button>
                      </Form>
                    </Tab.Pane>

                    {/* STUDENT FORM */}
                    <Tab.Pane eventKey="student">
                      <Form onSubmit={handleStudentLogin}>
                        <div className="text-center mb-4">
                          <small className="text-white-50">Enter registered mobile to access portal</small>
                        </div>
                        <div style={inputStyle}>
                          <Phone size={20} className="text-success me-3" />
                          <input type="tel" value={studentPhone} onChange={(e) => setStudentPhone(e.target.value)}
                            className="bg-transparent border-0 text-white w-100 p-0 shadow-none text-center fw-bold"
                            placeholder="987 654 3210" style={{ outline: 'none', fontSize: '1.2rem', letterSpacing: '2px' }} required />
                        </div>
                        <Button type="submit" variant="success" className="w-100 py-3 fw-bold rounded-pill shadow-lg mt-2 hover-scale" disabled={isLoggingIn}>
                          {isLoggingIn ? 'Verifying...' : 'Access Portal'} <ChevronRight size={18} className="ms-2" />
                        </Button>
                      </Form>
                    </Tab.Pane>
                  </Tab.Content>
                </Tab.Container>
                
                <div className="text-center mt-5">
                  <small className="text-white-50 opacity-50">© 2026 DIGITALFORGEX System</small>
                </div>

              </div>
            </Col>
          </Row>
        </Container>
      </div>
    </PageTransition>
  );
};

export default Login;