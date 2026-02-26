import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Button, Modal, Form, Table, Badge } from 'react-bootstrap';
import { Users, Plus, Trash2, Search, Mail, Phone, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';
import PageTransition from './PageTransition';

// --- FIREBASE IMPORTS ---
import { db } from './firebase';
import { collection, getDocs, addDoc, deleteDoc, doc } from 'firebase/firestore';

const Students = () => {
  const [showModal, setShowModal] = useState(false);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [newStudent, setNewStudent] = useState({
    name: '', class: '10th Science', email: '', phone: '', address: ''
  });

  const studentsCollectionRef = collection(db, "students");

  // --- 1. FETCH STUDENTS FROM FIREBASE ---
  useEffect(() => {
    const getStudents = async () => {
      try {
        const data = await getDocs(studentsCollectionRef);
        const loadedStudents = data.docs.map((doc) => ({
          ...doc.data(),
          id: doc.id
        }));
        
        // Sort alphabetically by name
        loadedStudents.sort((a, b) => a.name.localeCompare(b.name));
        setStudents(loadedStudents);
        setLoading(false);
      } catch (error) {
        toast.error("Failed to load students from cloud.");
        console.error(error);
        setLoading(false);
      }
    };
    getStudents();
  }, []);

  // --- 2. ADD STUDENT TO FIREBASE ---
  const handleSave = async () => {
    if (!newStudent.name || !newStudent.phone) {
      toast.error("Name and Phone number are required!");
      return;
    }

    const studentToAdd = {
      name: newStudent.name,
      class: newStudent.class,
      email: newStudent.email || "N/A",
      phone: newStudent.phone,
      address: newStudent.address || "N/A",
      joinDate: new Date().toLocaleDateString('en-CA'),
      timestamp: Date.now()
    };

    try {
      const docRef = await addDoc(studentsCollectionRef, studentToAdd);
      setStudents([{ ...studentToAdd, id: docRef.id }, ...students]);
      toast.success("Student officially enrolled in Cloud Database!");
      setShowModal(false);
      setNewStudent({ name: '', class: '10th Science', email: '', phone: '', address: '' });
    } catch (error) {
      toast.error("Error saving student to cloud.");
      console.error(error);
    }
  };

  // --- 3. DELETE STUDENT FROM FIREBASE ---
  const handleDelete = async (id, name) => {
    if(window.confirm(`Are you sure you want to permanently delete ${name}?`)) {
      try {
        const studentDoc = doc(db, "students", id);
        await deleteDoc(studentDoc);
        setStudents(students.filter(s => s.id !== id));
        toast.success(`${name} removed from system.`);
      } catch (error) {
        toast.error("Error deleting student.");
        console.error(error);
      }
    }
  };

  // Search Filter
  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.phone.includes(searchTerm)
  );

  return (
    <PageTransition>
      <div>
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-3">
          <h2 className="text-white mb-0 d-flex align-items-center">
            <Users className="me-3 text-primary" size={28} />
            Student Directory
          </h2>
          <div className="d-flex gap-3">
            <div className="position-relative">
              <Search className="position-absolute text-muted" size={18} style={{ top: '10px', left: '12px' }} />
              <Form.Control 
                type="text" 
                placeholder="Search name or phone..." 
                className="bg-dark text-white border-secondary ps-5"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ width: '250px' }}
              />
            </div>
            <Button variant="primary" onClick={() => setShowModal(true)} className="fw-bold px-4 rounded-pill shadow-sm d-flex align-items-center">
              <Plus size={18} className="me-2" /> Add Student
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-5 text-white-50">
             <div className="spinner-border text-primary mb-3" role="status"></div>
             <p>Loading Students from Cloud...</p>
          </div>
        ) : (
          <Card className="border-0 shadow-sm overflow-hidden" style={{ backgroundColor: 'rgba(17, 24, 39, 0.6)' }}>
            <Table hover variant="dark" className="mb-0 bg-transparent align-middle">
              <thead>
                <tr>
                  <th className="py-3 ps-4 bg-transparent border-secondary text-muted small">STUDENT INFO</th>
                  <th className="py-3 bg-transparent border-secondary text-muted small">COURSE / CLASS</th>
                  <th className="py-3 bg-transparent border-secondary text-muted small">CONTACT</th>
                  <th className="py-3 bg-transparent border-secondary text-muted small text-end pe-4">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.length > 0 ? filteredStudents.map(s => (
                  <tr key={s.id}>
                    <td className="ps-4 py-3">
                      <div className="d-flex align-items-center">
                        <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-3" style={{ width: '40px', height: '40px', fontWeight: 'bold' }}>
                          {s.name.charAt(0)}
                        </div>
                        <div>
                          <h6 className="text-white fw-bold mb-0">{s.name}</h6>
                          <small className="text-muted">Joined: {s.joinDate}</small>
                        </div>
                      </div>
                    </td>
                    <td className="py-3">
                      <Badge bg="info" className="text-dark fw-bold px-3 py-2 rounded-pill">{s.class}</Badge>
                    </td>
                    <td className="py-3">
                      <div className="text-white-50 small d-flex flex-column gap-1">
                        <span><Phone size={12} className="me-2" />{s.phone}</span>
                        <span><Mail size={12} className="me-2" />{s.email}</span>
                      </div>
                    </td>
                    <td className="py-3 text-end pe-4">
                      <Button variant="link" className="text-danger p-2" onClick={() => handleDelete(s.id, s.name)}>
                        <Trash2 size={18} />
                      </Button>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="4" className="text-center py-5 text-muted">
                       <Users size={48} className="mb-3 opacity-25" />
                       <p>No students found in the database.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </Card>
        )}

        {/* ADD STUDENT MODAL */}
        <Modal show={showModal} onHide={() => setShowModal(false)} centered size="lg">
          <Modal.Header closeButton className="bg-dark border-secondary">
            <Modal.Title className="text-white">Enroll New Student</Modal.Title>
          </Modal.Header>
          <Modal.Body className="bg-dark text-white">
            <Form>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label className="small fw-bold text-muted">Full Name</Form.Label>
                    <Form.Control type="text" className="bg-dark text-white border-secondary" placeholder="e.g. Amit Kumar" value={newStudent.name} onChange={e => setNewStudent({...newStudent, name: e.target.value})} />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label className="small fw-bold text-muted">Course / Class</Form.Label>
                    <Form.Select className="bg-dark text-white border-secondary" value={newStudent.class} onChange={e => setNewStudent({...newStudent, class: e.target.value})}>
                      <option>10th Science</option>
                      <option>12th Commerce</option>
                      <option>JEE Prep</option>
                      <option>NEET Prep</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label className="small fw-bold text-muted">Phone Number (Used for Login)</Form.Label>
                    <Form.Control type="tel" className="bg-dark text-white border-secondary" placeholder="e.g. 9876543210" value={newStudent.phone} onChange={e => setNewStudent({...newStudent, phone: e.target.value})} />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label className="small fw-bold text-muted">Email Address</Form.Label>
                    <Form.Control type="email" className="bg-dark text-white border-secondary" placeholder="student@example.com" value={newStudent.email} onChange={e => setNewStudent({...newStudent, email: e.target.value})} />
                  </Form.Group>
                </Col>
              </Row>
            </Form>
          </Modal.Body>
          <Modal.Footer className="bg-dark border-secondary">
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleSave}>Save to Database</Button>
          </Modal.Footer>
        </Modal>
      </div>
    </PageTransition>
  );
};

export default Students;