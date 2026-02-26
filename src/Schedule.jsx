import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Button, Modal, Form, Badge, Table } from 'react-bootstrap';
import { Calendar, Plus, Trash2, Clock, MapPin, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import PageTransition from './PageTransition';

// --- FIREBASE IMPORTS ---
import { db } from './firebase';
import { collection, getDocs, addDoc, deleteDoc, doc } from 'firebase/firestore';

const Schedule = () => {
  const [showModal, setShowModal] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [newSession, setNewSession] = useState({
    course: '10th Science', subject: '', teacher: '', day: 'Monday', startTime: '', endTime: '', room: ''
  });

  const scheduleCollectionRef = collection(db, "schedule");

  // --- 1. FETCH FROM FIREBASE ---
  useEffect(() => {
    const getSchedule = async () => {
      try {
        const data = await getDocs(scheduleCollectionRef);
        const loadedSessions = data.docs.map((doc) => ({
          ...doc.data(),
          id: doc.id
        }));
        setSessions(loadedSessions);
        setLoading(false);
      } catch (error) {
        toast.error("Failed to load timetable from cloud.");
        console.error(error);
        setLoading(false);
      }
    };
    getSchedule();
  }, []);

  // --- 2. SAVE TO FIREBASE ---
  const handleSave = async () => {
    if (!newSession.subject || !newSession.startTime || !newSession.endTime) {
      toast.error("Please fill required fields (Subject & Times)!");
      return;
    }

    try {
      const docRef = await addDoc(scheduleCollectionRef, newSession);
      setSessions([...sessions, { ...newSession, id: docRef.id }]);
      toast.success("Class Scheduled Live!");
      setShowModal(false);
      setNewSession({ ...newSession, subject: '', startTime: '', endTime: '' }); // Reset some fields
    } catch (error) {
      toast.error("Error saving to cloud.");
      console.error(error);
    }
  };

  // --- 3. DELETE FROM FIREBASE ---
  const handleDelete = async (id) => {
    if(window.confirm("Remove this class from the schedule?")) {
      try {
        const sessionDoc = doc(db, "schedule", id);
        await deleteDoc(sessionDoc);
        setSessions(sessions.filter(s => s.id !== id));
        toast.success("Class removed.");
      } catch (error) {
        toast.error("Error deleting class.");
        console.error(error);
      }
    }
  };

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  return (
    <PageTransition>
      <div>
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-3">
          <h2 className="text-white mb-0 d-flex align-items-center">
            <Calendar className="me-3 text-primary" size={28} />
            Master Timetable
          </h2>
          <Button variant="primary" onClick={() => setShowModal(true)} className="fw-bold px-4 rounded-pill shadow-sm d-flex align-items-center">
            <Plus size={18} className="me-2" /> Schedule Class
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-5 text-white-50">
            <div className="spinner-border text-primary mb-3" role="status"></div>
            <p>Loading Cloud Timetable...</p>
          </div>
        ) : (
          <Row className="g-4">
            {days.map(day => {
              const daySessions = sessions.filter(s => s.day === day);
              if (daySessions.length === 0) return null; // Hide empty days

              // Sort sessions by start time for the day
              daySessions.sort((a, b) => a.startTime.localeCompare(b.startTime));

              return (
                <Col md={6} xl={4} key={day}>
                  <Card className="h-100 border-0 shadow-sm overflow-hidden" style={{ backgroundColor: 'rgba(17, 24, 39, 0.6)' }}>
                    <div className="bg-primary bg-opacity-25 p-3 border-bottom border-primary border-opacity-25">
                      <h5 className="text-white fw-bold mb-0 text-uppercase tracking-wider">{day}</h5>
                    </div>
                    <div className="p-0">
                      <Table hover variant="dark" className="mb-0 bg-transparent">
                        <tbody>
                          {daySessions.map(session => (
                            <tr key={session.id}>
                              <td className="p-3 border-bottom border-secondary border-opacity-25">
                                <div className="d-flex justify-content-between align-items-start mb-2">
                                  <Badge bg="info" className="text-dark fw-bold">{session.course}</Badge>
                                  <Button variant="link" className="text-danger p-0" onClick={() => handleDelete(session.id)}>
                                    <Trash2 size={14} />
                                  </Button>
                                </div>
                                <h6 className="text-white fw-bold mb-1">{session.subject}</h6>
                                <div className="text-white-50 small d-flex flex-column gap-1">
                                  <span className="d-flex align-items-center"><Clock size={12} className="me-2 text-warning" /> {session.startTime} - {session.endTime}</span>
                                  {session.teacher && <span className="d-flex align-items-center"><Users size={12} className="me-2 text-info" /> {session.teacher}</span>}
                                  {session.room && <span className="d-flex align-items-center"><MapPin size={12} className="me-2 text-success" /> {session.room}</span>}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </div>
                  </Card>
                </Col>
              );
            })}
            
            {sessions.length === 0 && (
              <Col xs={12}>
                <div className="text-center py-5 text-muted">
                  <Calendar size={48} className="mb-3 opacity-25" />
                  <p>No classes scheduled yet. Click "Schedule Class" to begin.</p>
                </div>
              </Col>
            )}
          </Row>
        )}

        {/* SCHEDULE MODAL */}
        <Modal show={showModal} onHide={() => setShowModal(false)} centered>
          <Modal.Header closeButton className="bg-dark border-secondary">
            <Modal.Title className="text-white">Schedule New Class</Modal.Title>
          </Modal.Header>
          <Modal.Body className="bg-dark text-white">
            <Form>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label className="small fw-bold text-muted">Target Class</Form.Label>
                    <Form.Select className="bg-dark text-white border-secondary" value={newSession.course} onChange={e => setNewSession({...newSession, course: e.target.value})}>
                      <option>10th Science</option>
                      <option>12th Commerce</option>
                      <option>JEE Prep</option>
                      <option>NEET Prep</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label className="small fw-bold text-muted">Day of Week</Form.Label>
                    <Form.Select className="bg-dark text-white border-secondary" value={newSession.day} onChange={e => setNewSession({...newSession, day: e.target.value})}>
                      {days.map(d => <option key={d}>{d}</option>)}
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>
              <Form.Group className="mb-3">
                <Form.Label className="small fw-bold text-muted">Subject / Topic</Form.Label>
                <Form.Control type="text" className="bg-dark text-white border-secondary" placeholder="e.g. Thermodynamics" value={newSession.subject} onChange={e => setNewSession({...newSession, subject: e.target.value})} />
              </Form.Group>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label className="small fw-bold text-muted">Start Time</Form.Label>
                    <Form.Control type="time" className="bg-dark text-white border-secondary" value={newSession.startTime} onChange={e => setNewSession({...newSession, startTime: e.target.value})} />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label className="small fw-bold text-muted">End Time</Form.Label>
                    <Form.Control type="time" className="bg-dark text-white border-secondary" value={newSession.endTime} onChange={e => setNewSession({...newSession, endTime: e.target.value})} />
                  </Form.Group>
                </Col>
              </Row>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label className="small fw-bold text-muted">Teacher (Optional)</Form.Label>
                    <Form.Control type="text" className="bg-dark text-white border-secondary" placeholder="e.g. Mr. Sharma" value={newSession.teacher} onChange={e => setNewSession({...newSession, teacher: e.target.value})} />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label className="small fw-bold text-muted">Room / Link (Optional)</Form.Label>
                    <Form.Control type="text" className="bg-dark text-white border-secondary" placeholder="e.g. Room 101 or Zoom Link" value={newSession.room} onChange={e => setNewSession({...newSession, room: e.target.value})} />
                  </Form.Group>
                </Col>
              </Row>
            </Form>
          </Modal.Body>
          <Modal.Footer className="bg-dark border-secondary">
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleSave}>Publish to Timetable</Button>
          </Modal.Footer>
        </Modal>
      </div>
    </PageTransition>
  );
};

export default Schedule;