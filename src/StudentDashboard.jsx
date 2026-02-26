import React, { useState, useEffect } from 'react';
import { Card, Row, Col, ProgressBar, Badge, Button, Tab, Nav, Table } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { 
  User, Calendar, BookOpen, Clock, LogOut, CheckCircle, 
  Megaphone, Bell, CreditCard, Download, FileText, QrCode, Shield, LayoutGrid, Award 
} from 'lucide-react';
import PageTransition from './PageTransition';
import toast from 'react-hot-toast';

// --- FIREBASE IMPORTS ---
import { db } from './firebase';
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';

const StudentDashboard = () => {
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Data States
  const [attendanceStats, setAttendanceStats] = useState({ present: 0, total: 0, percentage: 0 });
  const [mySchedule, setMySchedule] = useState([]); 
  const [notices, setNotices] = useState([]); 
  const [myFees, setMyFees] = useState([]); 
  const [myResources, setMyResources] = useState([]); 
  const [myResults, setMyResults] = useState([]); // Live from Cloud

  useEffect(() => {
    const id = localStorage.getItem('current_student_id');
    const name = localStorage.getItem('current_student_name');
    const className = localStorage.getItem('current_student_class');

    if (!id) {
      navigate('/login');
      return;
    }

    setStudent({ id, name, class: className });

    // --- 2. ATTENDANCE LOGIC (FIREBASE) ---
    const fetchLiveAttendance = async () => {
      try {
        const q = query(collection(db, "attendance"), where("class", "==", className));
        const querySnapshot = await getDocs(q);

        let presentCount = 0;
        let totalDays = 0;

        querySnapshot.forEach((document) => {
          const records = document.data().records || {};
          if (records[id]) {
            totalDays++;
            if (records[id] === 'Present') presentCount++;
          }
        });

        const percent = totalDays > 0 ? Math.round((presentCount / totalDays) * 100) : 0;
        setAttendanceStats({ present: presentCount, total: totalDays, percentage: percent });
      } catch (error) {
        console.error("Error fetching live attendance:", error);
      }
    };
    fetchLiveAttendance();

    // --- 3. SCHEDULE LOGIC (FIREBASE) ---
    const fetchLiveSchedule = async () => {
      try {
        const data = await getDocs(collection(db, "schedule"));
        const liveSchedule = data.docs.map(doc => ({ ...doc.data(), id: doc.id }));
        const myClasses = liveSchedule.filter(s => s.course === className);
        myClasses.sort((a, b) => a.startTime.localeCompare(b.startTime));
        setMySchedule(myClasses);
      } catch (error) {
        console.error("Error fetching live schedule:", error);
      }
    };
    fetchLiveSchedule();

    // --- 4. NOTICES LOGIC (FIREBASE) ---
    const fetchLiveNotices = async () => {
      try {
        const data = await getDocs(collection(db, "notices"));
        const liveNotices = data.docs.map(doc => ({ ...doc.data(), id: doc.id }));
        liveNotices.sort((a, b) => b.timestamp - a.timestamp);
        setNotices(liveNotices);
      } catch (error) {
        console.error("Error fetching live notices:", error);
      }
    };
    fetchLiveNotices();

    // --- 5. FEES LOGIC (FIREBASE) ---
    const fetchLiveFees = async () => {
      try {
        const q = query(collection(db, "fees"), where("studentId", "==", id));
        const querySnapshot = await getDocs(q);
        const liveFees = querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
        liveFees.sort((a, b) => b.timestamp - a.timestamp);
        setMyFees(liveFees);
      } catch (error) {
        console.error("Error fetching live fees:", error);
      }
    };
    fetchLiveFees();

    // --- 6. RESOURCES LOGIC (FIREBASE) ---
    const fetchLiveResources = async () => {
      try {
        const data = await getDocs(collection(db, "resources"));
        const liveResources = data.docs.map(doc => ({ ...doc.data(), id: doc.id }));
        const filteredRes = liveResources.filter(r => r.class === className || r.class === "All Classes");
        filteredRes.sort((a, b) => b.timestamp - a.timestamp);
        setMyResources(filteredRes);
      } catch (error) {
        console.error("Error fetching live resources:", error);
      }
    };
    fetchLiveResources();

    // --- 7. EXAMS & RESULTS LOGIC (NOW LIVE FROM FIREBASE) ---
    const fetchLiveResults = async () => {
      try {
        // Find exams for my class
        const q = query(collection(db, "exams"), where("course", "==", className));
        const examSnapshot = await getDocs(q);
        
        const resultsData = [];

        // For each exam, check if the admin entered a score for me
        for (const examDoc of examSnapshot.docs) {
          const exam = { ...examDoc.data(), id: examDoc.id };
          
          const markDocRef = doc(db, "marks", exam.id);
          const markDocSnap = await getDoc(markDocRef);

          if (markDocSnap.exists()) {
            const marksData = markDocSnap.data().records || {};
            const myScore = marksData[id]; // 'id' is the student's ID

            if (myScore !== undefined && myScore !== '') {
               resultsData.push({
                 id: exam.id,
                 title: exam.title,
                 date: exam.date,
                 maxMarks: exam.maxMarks,
                 score: myScore,
                 timestamp: exam.timestamp
               });
            }
          }
        }

        resultsData.sort((a, b) => b.timestamp - a.timestamp);
        setMyResults(resultsData);
      } catch (error) {
        console.error("Error fetching live results:", error);
      }
    };
    fetchLiveResults();

  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('user_role');
    localStorage.removeItem('current_student_id');
    navigate('/login');
  };

  const getBadgeColor = (type) => {
    if(type === 'Urgent') return 'danger';
    if(type === 'Holiday') return 'success';
    if(type === 'Exam') return 'warning';
    return 'primary';
  };

  if (!student) return null;

  return (
    <PageTransition>
      <div style={{ minHeight: '100vh', paddingBottom: '80px' }}>
        
        {/* --- HEADER --- */}
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 p-4 rounded shadow-lg position-relative overflow-hidden" 
             style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)', border: '1px solid rgba(255,255,255,0.1)' }}>
          
          <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '200px', height: '200px', background: 'rgba(255,255,255,0.05)', borderRadius: '50%' }}></div>

          <div className="d-flex align-items-center position-relative z-1">
            <div className="bg-white text-primary rounded-circle d-flex align-items-center justify-content-center me-4 shadow-lg" 
                 style={{ width: '64px', height: '64px', fontSize: '1.5rem', fontWeight: 'bold', border: '4px solid rgba(255,255,255,0.2)' }}>
              {student.name.charAt(0)}
            </div>
            <div>
              <h4 className="mb-0 text-white fw-bold">{student.name}</h4>
              <div className="d-flex align-items-center gap-2 mt-1">
                <Badge bg="info" className="text-dark fw-bold">ID: {student.id}</Badge>
                <span className="text-white-50 small">|</span>
                <span className="text-info fw-bold">{student.class}</span>
              </div>
            </div>
          </div>
          
          <div className="mt-3 mt-md-0 position-relative z-1">
            <Button variant="danger" size="sm" onClick={handleLogout} className="px-3 fw-bold shadow-sm">
              <LogOut size={16} className="me-2" /> Logout
            </Button>
          </div>
        </div>

        {/* --- NAVIGATION TABS --- */}
        <Tab.Container activeKey={activeTab} onSelect={(k) => setActiveTab(k)}>
          <Nav variant="pills" className="mb-4 bg-dark p-2 rounded-3 border border-secondary border-opacity-25 d-flex flex-nowrap overflow-auto">
            <Nav.Item>
              <Nav.Link eventKey="overview" className="text-white fw-bold px-4 d-flex align-items-center">
                <LayoutGrid size={18} className="me-2" /> Overview
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="wallet" className="text-white fw-bold px-4 d-flex align-items-center">
                <CreditCard size={18} className="me-2" /> My Wallet
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="results" className="text-white fw-bold px-4 d-flex align-items-center">
                <Award size={18} className="me-2" /> Results
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="resources" className="text-white fw-bold px-4 d-flex align-items-center">
                <Download size={18} className="me-2" /> Resources
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="idcard" className="text-white fw-bold px-4 d-flex align-items-center">
                <Shield size={18} className="me-2" /> Digital ID
              </Nav.Link>
            </Nav.Item>
          </Nav>

          <Tab.Content>
            
            {/* TAB 1: OVERVIEW */}
            <Tab.Pane eventKey="overview">
              <Row className="g-4">
                {/* NOTICES */}
                <Col xs={12}>
                  <Card className="border-0 shadow-sm p-4" style={{ backgroundColor: 'rgba(17, 24, 39, 0.6)' }}>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                       <h6 className="text-white fw-bold text-uppercase mb-0 d-flex align-items-center">
                         <Megaphone size={18} className="me-2 text-warning" /> Notice Board
                       </h6>
                       <Badge bg="secondary" pill>{notices.length}</Badge>
                    </div>
                    {notices.length > 0 ? (
                      <div className="d-flex flex-column gap-3">
                        {notices.slice(0, 3).map(notice => (
                          <div key={notice.id} className="p-3 rounded border border-secondary border-opacity-25" style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}>
                            <div className="d-flex justify-content-between align-items-center mb-2">
                              <Badge bg={getBadgeColor(notice.type)} style={{ fontSize: '0.7rem' }}>{notice.type}</Badge>
                              <small className="text-muted"><Clock size={12} className="me-1" /> {notice.date}</small>
                            </div>
                            <h6 className="text-white fw-bold mb-1">{notice.title}</h6>
                            <p className="text-white-50 small mb-0">{notice.message}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4 text-muted small">No active notices.</div>
                    )}
                  </Card>
                </Col>

                {/* ATTENDANCE & SCHEDULE */}
                <Col md={6}>
                  <Card className="border-0 shadow-sm p-4 h-100" style={{ backgroundColor: 'rgba(17, 24, 39, 0.6)' }}>
                    <h6 className="text-muted fw-bold text-uppercase mb-3"><CheckCircle size={16} className="me-2 text-success" /> Attendance</h6>
                    <div className="text-center mb-3">
                      <h1 className="display-4 fw-bold text-white mb-0">{attendanceStats.percentage}%</h1>
                      <small className="text-muted">Present {attendanceStats.present}/{attendanceStats.total} days</small>
                    </div>
                    <ProgressBar now={attendanceStats.percentage} variant={attendanceStats.percentage > 75 ? "success" : "warning"} style={{ height: '6px' }} />
                  </Card>
                </Col>
                
                <Col md={6}>
                  <Card className="border-0 shadow-sm p-4 h-100" style={{ backgroundColor: 'rgba(17, 24, 39, 0.6)' }}>
                    <h6 className="text-muted fw-bold text-uppercase mb-3"><Clock size={16} className="me-2 text-info" /> My Timetable</h6>
                    {mySchedule.length > 0 ? (
                      <div className="d-flex flex-column gap-2">
                        {mySchedule.slice(0,4).map(s => (
                          <div key={s.id} className="d-flex justify-content-between align-items-center p-2 rounded bg-white bg-opacity-10 border border-white border-opacity-10">
                            <div>
                              <span className="text-white fw-bold d-block small mb-1">{s.subject}</span>
                              <div className="d-flex align-items-center gap-2">
                                <Badge bg="secondary" style={{fontSize: '0.65rem'}}>{s.day}</Badge>
                                <small className="text-info" style={{fontSize: '0.7rem'}}>{s.startTime}</small>
                              </div>
                            </div>
                            {s.room && <Badge bg="dark" border="light" className="border border-secondary">{s.room}</Badge>}
                          </div>
                        ))}
                      </div>
                    ) : <div className="text-center py-4 text-muted small">No classes found for your course.</div>}
                  </Card>
                </Col>
              </Row>
            </Tab.Pane>

            {/* TAB 2: MY WALLET */}
            <Tab.Pane eventKey="wallet">
              <Row>
                <Col lg={8} className="mx-auto">
                  <Card className="border-0 shadow-lg" style={{ backgroundColor: 'rgba(17, 24, 39, 0.8)', overflow: 'hidden' }}>
                    <div className="p-4 bg-primary bg-opacity-25 border-bottom border-primary border-opacity-25">
                      <h5 className="text-white fw-bold mb-0 d-flex align-items-center">
                        <CreditCard className="me-3" /> Fee History
                      </h5>
                    </div>
                    <div className="p-0">
                      <Table hover variant="dark" className="mb-0 bg-transparent">
                        <thead>
                          <tr>
                            <th className="py-3 ps-4 bg-transparent border-secondary text-muted small">DESCRIPTION</th>
                            <th className="py-3 bg-transparent border-secondary text-muted small">DUE DATE</th>
                            <th className="py-3 bg-transparent border-secondary text-muted small">AMOUNT</th>
                            <th className="py-3 bg-transparent border-secondary text-muted small text-end pe-4">STATUS</th>
                          </tr>
                        </thead>
                        <tbody>
                          {myFees.length > 0 ? myFees.map((fee, idx) => (
                            <tr key={idx}>
                              <td className="ps-4 py-3 fw-bold">{fee.course} Fee</td>
                              <td className="py-3 text-muted small">{fee.date || 'N/A'}</td>
                              <td className="py-3 fw-bold">₹ {fee.amount}</td>
                              <td className="py-3 text-end pe-4">
                                <Badge bg={fee.status === 'Paid' ? 'success' : 'danger'} className="px-3 py-2 rounded-pill">
                                  {fee.status}
                                </Badge>
                              </td>
                            </tr>
                          )) : (
                            <tr><td colSpan="4" className="text-center py-5 text-muted">No fee records found.</td></tr>
                          )}
                        </tbody>
                      </Table>
                    </div>
                  </Card>
                </Col>
              </Row>
            </Tab.Pane>

            {/* TAB 3: RESULTS (NEW!) */}
            <Tab.Pane eventKey="results">
              <Row>
                <Col lg={8} className="mx-auto">
                  <Card className="border-0 shadow-lg" style={{ backgroundColor: 'rgba(17, 24, 39, 0.8)', overflow: 'hidden' }}>
                    <div className="p-4 bg-success bg-opacity-25 border-bottom border-success border-opacity-25">
                      <h5 className="text-white fw-bold mb-0 d-flex align-items-center">
                        <Award className="me-3 text-success" /> Academic Performance
                      </h5>
                    </div>
                    <div className="p-0">
                      <Table hover variant="dark" className="mb-0 bg-transparent align-middle">
                        <thead>
                          <tr>
                            <th className="py-3 ps-4 bg-transparent border-secondary text-muted small">EXAM TITLE</th>
                            <th className="py-3 bg-transparent border-secondary text-muted small">DATE</th>
                            <th className="py-3 bg-transparent border-secondary text-muted small text-end pe-4">MY SCORE</th>
                          </tr>
                        </thead>
                        <tbody>
                          {myResults.length > 0 ? myResults.map(result => {
                            const percentage = (result.score / result.maxMarks) * 100;
                            const isPassing = percentage >= 40; // Assuming 40% is passing

                            return (
                              <tr key={result.id}>
                                <td className="ps-4 py-3 text-white fw-bold">{result.title}</td>
                                <td className="py-3 text-muted small">{result.date}</td>
                                <td className="py-3 text-end pe-4">
                                  <div className="d-flex align-items-center justify-content-end gap-3">
                                    <div>
                                      <h5 className={`mb-0 fw-bold ${isPassing ? 'text-success' : 'text-danger'}`}>
                                        {result.score} <span className="text-white-50 fs-6">/ {result.maxMarks}</span>
                                      </h5>
                                    </div>
                                    <Badge bg={isPassing ? 'success' : 'danger'} className="px-2 py-1">
                                      {Math.round(percentage)}%
                                    </Badge>
                                  </div>
                                </td>
                              </tr>
                            );
                          }) : (
                            <tr><td colSpan="3" className="text-center py-5 text-muted">No exam results published yet.</td></tr>
                          )}
                        </tbody>
                      </Table>
                    </div>
                  </Card>
                </Col>
              </Row>
            </Tab.Pane>

            {/* TAB 4: RESOURCES */}
            <Tab.Pane eventKey="resources">
              <Row className="g-4">
                {myResources.length > 0 ? myResources.map(res => (
                  <Col md={6} key={res.id}>
                    <Card className="border-0 shadow-sm p-3 h-100" style={{ backgroundColor: 'rgba(17, 24, 39, 0.6)' }}>
                      <div className="d-flex align-items-center">
                        <div className="bg-danger bg-opacity-10 p-3 rounded me-3">
                           <FileText size={24} className="text-danger" />
                        </div>
                        <div className="flex-grow-1">
                          <h6 className="text-white fw-bold mb-1">{res.title}</h6>
                          <div className="d-flex align-items-center gap-2">
                             <Badge bg="secondary" style={{ fontSize: '0.65rem' }}>{res.subject}</Badge>
                             <small className="text-muted" style={{ fontSize: '0.75rem' }}>{res.date}</small>
                          </div>
                        </div>
                        {res.link && (
                          <Button 
                            variant="outline-light" size="sm" className="rounded-circle p-2" 
                            onClick={() => window.open(res.link, '_blank')}
                          >
                             <Download size={18} />
                          </Button>
                        )}
                      </div>
                    </Card>
                  </Col>
                )) : (
                  <Col xs={12}>
                    <div className="text-center py-5 text-muted">
                      <p>No study materials uploaded for your class yet.</p>
                    </div>
                  </Col>
                )}
              </Row>
            </Tab.Pane>

            {/* TAB 5: DIGITAL ID CARD */}
            <Tab.Pane eventKey="idcard">
              <Row>
                <Col md={6} lg={5} className="mx-auto">
                  <div className="position-relative overflow-hidden rounded-4 shadow-lg" 
                       style={{ 
                         height: '500px', 
                         background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)',
                         border: '1px solid rgba(255,255,255,0.1)' 
                       }}>
                    <div className="p-4 text-center" style={{ background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)' }}>
                       <h5 className="text-white fw-bold mb-0" style={{ letterSpacing: '2px' }}>DIGITALFORGEX</h5>
                       <small className="text-white-50" style={{ fontSize: '0.7rem', letterSpacing: '1px' }}>INSTITUTE OF EXCELLENCE</small>
                    </div>
                    <div className="p-5 text-center d-flex flex-column align-items-center">
                      <div className="rounded-3 mb-4 d-flex align-items-center justify-content-center shadow-lg" 
                           style={{ width: '140px', height: '140px', background: '#334155', border: '4px solid rgba(255,255,255,0.1)' }}>
                        <User size={64} className="text-white-50" />
                      </div>
                      <h3 className="text-white fw-bold mb-1">{student.name}</h3>
                      <Badge bg="primary" className="mb-4 px-3 py-2">{student.class}</Badge>
                      <div className="w-100 border-top border-secondary border-opacity-25 pt-4">
                        <Row className="text-start">
                          <Col xs={6} className="mb-3">
                            <small className="text-muted d-block" style={{ fontSize: '0.7rem' }}>ROLL NUMBER</small>
                            <span className="text-white fw-bold fs-5" style={{ fontSize: '0.85rem' }}>{student.id.substring(0, 8).toUpperCase()}</span>
                          </Col>
                          <Col xs={6} className="mb-3">
                             <small className="text-muted d-block" style={{ fontSize: '0.7rem' }}>VALID UNTIL</small>
                             <span className="text-white fw-bold">Mar 2027</span>
                          </Col>
                        </Row>
                      </div>
                      <div className="mt-auto pt-3">
                         <QrCode size={48} className="text-white opacity-50" />
                      </div>
                    </div>
                  </div>
                </Col>
              </Row>
            </Tab.Pane>

          </Tab.Content>
        </Tab.Container>
      </div>
    </PageTransition>
  );
};

export default StudentDashboard;