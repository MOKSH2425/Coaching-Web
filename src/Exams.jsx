import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Button, Modal, Form, Table, Badge } from 'react-bootstrap';
import { BookOpen, Plus, Trash2, Award, Save, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import PageTransition from './PageTransition';

// --- FIREBASE IMPORTS ---
import { db } from './firebase';
import { collection, getDocs, addDoc, deleteDoc, doc, setDoc, getDoc, query, where } from 'firebase/firestore';

const Exams = () => {
  const [showModal, setShowModal] = useState(false);
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Marks Entry State
  const [selectedExam, setSelectedExam] = useState(null);
  const [students, setStudents] = useState([]);
  const [marks, setMarks] = useState({});
  const [loadingStudents, setLoadingStudents] = useState(false);

  const [newExam, setNewExam] = useState({
    title: '', course: '10th Science', date: '', maxMarks: '100'
  });

  const examsCollectionRef = collection(db, "exams");

  // --- 1. FETCH EXAMS ---
  useEffect(() => {
    const fetchExams = async () => {
      try {
        const data = await getDocs(examsCollectionRef);
        const loadedExams = data.docs.map(doc => ({ ...doc.data(), id: doc.id }));
        loadedExams.sort((a, b) => b.timestamp - a.timestamp); // Newest first
        setExams(loadedExams);
        setLoading(false);
      } catch (error) {
        toast.error("Failed to load exams.");
        console.error(error);
        setLoading(false);
      }
    };
    fetchExams();
  }, []);

  // --- 2. ADD NEW EXAM ---
  const handleSaveExam = async () => {
    if (!newExam.title || !newExam.date || !newExam.maxMarks) {
      toast.error("Please fill all exam details!");
      return;
    }

    const examToAdd = {
      title: newExam.title,
      course: newExam.course,
      date: newExam.date,
      maxMarks: newExam.maxMarks,
      timestamp: Date.now()
    };

    try {
      const docRef = await addDoc(examsCollectionRef, examToAdd);
      setExams([{ ...examToAdd, id: docRef.id }, ...exams]);
      toast.success("Exam Created!");
      setShowModal(false);
      setNewExam({ title: '', course: '10th Science', date: '', maxMarks: '100' });
    } catch (error) {
      toast.error("Error creating exam.");
      console.error(error);
    }
  };

  // --- 3. DELETE EXAM ---
  const handleDeleteExam = async (id) => {
    if(window.confirm("Permanently delete this exam and all its marks?")) {
      try {
        await deleteDoc(doc(db, "exams", id));
        // Also delete the associated marks document
        await deleteDoc(doc(db, "marks", id)); 
        
        setExams(exams.filter(e => e.id !== id));
        if (selectedExam && selectedExam.id === id) setSelectedExam(null);
        toast.success("Exam deleted.");
      } catch (error) {
        toast.error("Error deleting exam.");
        console.error(error);
      }
    }
  };

  // --- 4. LOAD STUDENTS & EXISTING MARKS FOR SELECTED EXAM ---
  const handleSelectExam = async (exam) => {
    setSelectedExam(exam);
    setLoadingStudents(true);
    setMarks({}); // Clear previous marks

    try {
      // A. Get Students for this course
      const q = query(collection(db, "students"), where("class", "==", exam.course));
      const studentDocs = await getDocs(q);
      const classStudents = studentDocs.docs.map(d => ({ id: d.id, name: d.data().name }));
      classStudents.sort((a, b) => a.name.localeCompare(b.name));
      setStudents(classStudents);

      // B. Get existing marks if they exist
      const marksDocSnap = await getDoc(doc(db, "marks", exam.id));
      if (marksDocSnap.exists()) {
        setMarks(marksDocSnap.data().records || {});
      }
    } catch (error) {
      toast.error("Error loading student data.");
      console.error(error);
    } finally {
      setLoadingStudents(false);
    }
  };

  // --- 5. HANDLE MARKS INPUT ---
  const handleMarkChange = (studentId, value) => {
    setMarks(prev => ({ ...prev, [studentId]: value }));
  };

  // --- 6. SAVE MARKS TO FIREBASE ---
  const handleSaveMarks = async () => {
    if (!selectedExam) return;
    
    try {
      await setDoc(doc(db, "marks", selectedExam.id), {
        examId: selectedExam.id,
        course: selectedExam.course,
        records: marks,
        lastUpdated: Date.now()
      });
      toast.success(`Marks saved for ${selectedExam.title}!`);
    } catch (error) {
      toast.error("Error saving marks.");
      console.error(error);
    }
  };

  return (
    <PageTransition>
      <div>
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-3">
          <h2 className="text-white mb-0 d-flex align-items-center">
            <BookOpen className="me-3 text-primary" size={28} />
            Exams & Results
          </h2>
          <Button variant="primary" onClick={() => setShowModal(true)} className="fw-bold px-4 rounded-pill shadow-sm d-flex align-items-center">
            <Plus size={18} className="me-2" /> Create Exam
          </Button>
        </div>

        <Row className="g-4">
          {/* LEFT SIDE: EXAM LIST */}
          <Col lg={5}>
            <Card className="border-0 shadow-sm h-100" style={{ backgroundColor: 'rgba(17, 24, 39, 0.6)' }}>
              <div className="p-3 bg-primary bg-opacity-10 border-bottom border-primary border-opacity-25">
                <h6 className="text-white fw-bold mb-0">Scheduled Exams</h6>
              </div>
              <div className="p-3">
                {loading ? (
                   <div className="text-center py-4 text-white-50"><div className="spinner-border spinner-border-sm me-2"></div>Loading...</div>
                ) : exams.length > 0 ? (
                  <div className="d-flex flex-column gap-2">
                    {exams.map(exam => (
                      <div 
                        key={exam.id} 
                        className={`p-3 rounded border transition-all cursor-pointer hover-scale ${selectedExam?.id === exam.id ? 'bg-primary bg-opacity-25 border-primary' : 'bg-dark border-secondary border-opacity-50'}`}
                        style={{ cursor: 'pointer' }}
                        onClick={() => handleSelectExam(exam)}
                      >
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <h6 className="text-white fw-bold mb-0">{exam.title}</h6>
                          <Button variant="link" className="text-danger p-0" onClick={(e) => { e.stopPropagation(); handleDeleteExam(exam.id); }}>
                            <Trash2 size={16} />
                          </Button>
                        </div>
                        <div className="d-flex align-items-center gap-2">
                          <Badge bg="info" className="text-dark" style={{ fontSize: '0.65rem' }}>{exam.course}</Badge>
                          <small className="text-muted" style={{ fontSize: '0.75rem' }}>{exam.date} • Max: {exam.maxMarks}</small>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted small">No exams created yet.</div>
                )}
              </div>
            </Card>
          </Col>

          {/* RIGHT SIDE: MARKS ENTRY */}
          <Col lg={7}>
            <Card className="border-0 shadow-sm h-100" style={{ backgroundColor: 'rgba(17, 24, 39, 0.6)' }}>
              {!selectedExam ? (
                <div className="d-flex flex-column justify-content-center align-items-center h-100 p-5 text-center text-muted">
                  <Award size={48} className="mb-3 opacity-25 text-primary" />
                  <p>Select an exam from the left panel to enter or view marks.</p>
                </div>
              ) : (
                <>
                  <div className="p-3 bg-success bg-opacity-10 border-bottom border-success border-opacity-25 d-flex justify-content-between align-items-center">
                    <div>
                      <h6 className="text-white fw-bold mb-0">Enter Marks: {selectedExam.title}</h6>
                      <small className="text-muted">Out of {selectedExam.maxMarks} points</small>
                    </div>
                    <Button variant="success" size="sm" className="fw-bold px-3 hover-scale" onClick={handleSaveMarks}>
                      <Save size={16} className="me-2" /> Save Results
                    </Button>
                  </div>
                  
                  <div className="p-0">
                    {loadingStudents ? (
                       <div className="text-center py-5 text-white-50"><div className="spinner-border mb-2"></div><br/>Loading class roster...</div>
                    ) : (
                      <Table hover variant="dark" className="mb-0 bg-transparent">
                        <thead>
                          <tr>
                            <th className="py-3 ps-4 bg-transparent border-secondary text-muted small">STUDENT NAME</th>
                            <th className="py-3 bg-transparent border-secondary text-muted small text-end pe-4" style={{ width: '150px' }}>SCORE</th>
                          </tr>
                        </thead>
                        <tbody>
                          {students.length > 0 ? students.map(student => (
                            <tr key={student.id}>
                              <td className="ps-4 py-3 text-white fw-bold align-middle">{student.name}</td>
                              <td className="py-2 text-end pe-4">
                                <Form.Control 
                                  type="number" 
                                  className="bg-dark text-white border-secondary text-center ms-auto fw-bold text-success" 
                                  style={{ width: '100px' }}
                                  placeholder="0"
                                  value={marks[student.id] || ''}
                                  onChange={(e) => handleMarkChange(student.id, e.target.value)}
                                />
                              </td>
                            </tr>
                          )) : (
                            <tr><td colSpan="2" className="text-center py-5 text-muted">No students found in {selectedExam.course}.</td></tr>
                          )}
                        </tbody>
                      </Table>
                    )}
                  </div>
                </>
              )}
            </Card>
          </Col>
        </Row>

        {/* CREATE EXAM MODAL */}
        <Modal show={showModal} onHide={() => setShowModal(false)} centered>
          <Modal.Header closeButton className="bg-dark border-secondary">
            <Modal.Title className="text-white">Create New Exam</Modal.Title>
          </Modal.Header>
          <Modal.Body className="bg-dark text-white">
            <Form>
              <Form.Group className="mb-3">
                <Form.Label className="small fw-bold text-muted">Exam Title</Form.Label>
                <Form.Control type="text" className="bg-dark text-white border-secondary" placeholder="e.g. Mid-Term Physics" onChange={e => setNewExam({...newExam, title: e.target.value})} />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label className="small fw-bold text-muted">Target Class</Form.Label>
                <Form.Select className="bg-dark text-white border-secondary" value={newExam.course} onChange={e => setNewExam({...newExam, course: e.target.value})}>
                  <option>10th Science</option>
                  <option>12th Commerce</option>
                  <option>JEE Prep</option>
                  <option>NEET Prep</option>
                </Form.Select>
              </Form.Group>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label className="small fw-bold text-muted">Date</Form.Label>
                    <Form.Control type="date" className="bg-dark text-white border-secondary" onChange={e => setNewExam({...newExam, date: e.target.value})} />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label className="small fw-bold text-muted">Max Marks</Form.Label>
                    <Form.Control type="number" className="bg-dark text-white border-secondary" placeholder="100" value={newExam.maxMarks} onChange={e => setNewExam({...newExam, maxMarks: e.target.value})} />
                  </Form.Group>
                </Col>
              </Row>
            </Form>
          </Modal.Body>
          <Modal.Footer className="bg-dark border-secondary">
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleSaveExam}>Save Exam</Button>
          </Modal.Footer>
        </Modal>
      </div>
    </PageTransition>
  );
};

export default Exams;