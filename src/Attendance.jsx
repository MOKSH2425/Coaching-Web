import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Button, Form, Table, Badge } from 'react-bootstrap';
import { CalendarCheck, Save, Search, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import PageTransition from './PageTransition';

// --- FIREBASE IMPORTS ---
import { db } from './firebase';
import { collection, query, where, getDocs, doc, setDoc, getDoc } from 'firebase/firestore';

const Attendance = () => {
  const [selectedClass, setSelectedClass] = useState('10th Science');
  const [selectedDate, setSelectedDate] = useState(new Date().toLocaleDateString('en-CA'));
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [loading, setLoading] = useState(false);

  const classes = ["10th Science", "12th Commerce", "JEE Prep", "NEET Prep"];

  // --- 1. FETCH STUDENTS AND EXISTING ATTENDANCE ---
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // A. Get the students for the selected class
        const studentsRef = collection(db, "students");
        const q = query(studentsRef, where("class", "==", selectedClass));
        const studentDocs = await getDocs(q);
        
        const classStudents = studentDocs.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name
        }));
        
        // Sort alphabetically
        classStudents.sort((a, b) => a.name.localeCompare(b.name));
        setStudents(classStudents);

        // B. Check if attendance already exists for this date and class
        const attendanceDocId = `${selectedDate}_${selectedClass}`;
        const docRef = doc(db, "attendance", attendanceDocId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          // Load existing attendance
          setAttendance(docSnap.data().records);
        } else {
          // Default everyone to 'Present' if no record exists yet
          const initialAttendance = {};
          classStudents.forEach(s => {
            initialAttendance[s.id] = 'Present';
          });
          setAttendance(initialAttendance);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load data.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedClass, selectedDate]);

  // --- 2. HANDLE TOGGLE PRESENT/ABSENT ---
  const handleToggle = (studentId, currentStatus) => {
    const newStatus = currentStatus === 'Present' ? 'Absent' : 'Present';
    setAttendance(prev => ({
      ...prev,
      [studentId]: newStatus
    }));
  };

  // --- 3. SAVE ATTENDANCE TO FIREBASE ---
  const handleSave = async () => {
    if (students.length === 0) {
      toast.error("No students to save.");
      return;
    }

    const attendanceDocId = `${selectedDate}_${selectedClass}`;
    try {
      // Use setDoc to create or overwrite the record for this specific day and class
      await setDoc(doc(db, "attendance", attendanceDocId), {
        date: selectedDate,
        class: selectedClass,
        records: attendance,
        timestamp: Date.now()
      });
      toast.success(`Attendance saved for ${selectedClass} on ${selectedDate}`);
    } catch (error) {
      console.error("Error saving attendance:", error);
      toast.error("Failed to save to cloud.");
    }
  };

  return (
    <PageTransition>
      <div>
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-3">
          <h2 className="text-white mb-0 d-flex align-items-center">
            <CalendarCheck className="me-3 text-primary" size={28} />
            Student Attendance
          </h2>
          <Button variant="primary" onClick={handleSave} className="fw-bold px-4 rounded-pill shadow-sm d-flex align-items-center hover-scale">
            <Save size={18} className="me-2" /> Save to Cloud
          </Button>
        </div>

        {/* CONTROLS */}
        <Card className="border-0 shadow-sm mb-4 p-3" style={{ backgroundColor: 'rgba(17, 24, 39, 0.6)' }}>
          <Row className="g-3 align-items-center">
            <Col md={4}>
              <Form.Group>
                <Form.Label className="small fw-bold text-muted mb-1">Select Class</Form.Label>
                <Form.Select className="bg-dark text-white border-secondary" value={selectedClass} onChange={e => setSelectedClass(e.target.value)}>
                  {classes.map(c => <option key={c} value={c}>{c}</option>)}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group>
                <Form.Label className="small fw-bold text-muted mb-1">Select Date</Form.Label>
                <Form.Control type="date" className="bg-dark text-white border-secondary" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} />
              </Form.Group>
            </Col>
            <Col md={4} className="d-flex align-items-end h-100 pb-1">
              <Badge bg="info" className="p-2 w-100 text-dark">
                {students.length} Students Found
              </Badge>
            </Col>
          </Row>
        </Card>

        {/* STUDENT LIST */}
        {loading ? (
           <div className="text-center py-5 text-white-50">
             <div className="spinner-border text-primary mb-3" role="status"></div>
             <p>Loading Students...</p>
           </div>
        ) : (
          <Card className="border-0 shadow-sm overflow-hidden" style={{ backgroundColor: 'rgba(17, 24, 39, 0.6)' }}>
            <Table hover variant="dark" className="mb-0 bg-transparent align-middle">
              <thead>
                <tr>
                  <th className="py-3 ps-4 bg-transparent border-secondary text-muted small">STUDENT NAME</th>
                  <th className="py-3 bg-transparent border-secondary text-muted small text-center">STATUS</th>
                  <th className="py-3 bg-transparent border-secondary text-muted small text-end pe-4">ACTION</th>
                </tr>
              </thead>
              <tbody>
                {students.length > 0 ? students.map(student => {
                  const status = attendance[student.id] || 'Present';
                  const isPresent = status === 'Present';
                  
                  return (
                    <tr key={student.id}>
                      <td className="ps-4 py-3 text-white fw-bold">{student.name}</td>
                      <td className="py-3 text-center">
                        <Badge bg={isPresent ? 'success' : 'danger'} className="px-3 py-2 rounded-pill">
                          {status}
                        </Badge>
                      </td>
                      <td className="py-3 text-end pe-4">
                        <Button 
                          variant={isPresent ? 'outline-danger' : 'outline-success'} 
                          size="sm" 
                          className="rounded-pill px-3 fw-bold transition-all"
                          onClick={() => handleToggle(student.id, status)}
                        >
                          {isPresent ? <><XCircle size={14} className="me-1"/> Mark Absent</> : <><CheckCircle size={14} className="me-1"/> Mark Present</>}
                        </Button>
                      </td>
                    </tr>
                  );
                }) : (
                  <tr>
                    <td colSpan="3" className="text-center py-5 text-muted">
                      No students enrolled in {selectedClass} yet. Go to the Students page to add some.
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </Card>
        )}
      </div>
    </PageTransition>
  );
};

export default Attendance;