import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Button, Modal, Form, Table, Badge } from 'react-bootstrap';
import { CreditCard, Plus, Trash2, Search, CheckCircle, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import PageTransition from './PageTransition';

// --- FIREBASE IMPORTS ---
import { db } from './firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';

const Fees = () => {
  const [showModal, setShowModal] = useState(false);
  const [fees, setFees] = useState([]);
  const [studentsList, setStudentsList] = useState([]); // Real students from Cloud
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const [newFee, setNewFee] = useState({
    studentId: '', studentName: '', course: '', amount: '', date: '', status: 'Pending'
  });

  const feesCollectionRef = collection(db, "fees");
  const studentsCollectionRef = collection(db, "students");

  // --- 1. FETCH FEES & STUDENTS FROM FIREBASE ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch Students for the Dropdown
        const studentData = await getDocs(studentsCollectionRef);
        const loadedStudents = studentData.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        // Sort students alphabetically
        loadedStudents.sort((a, b) => a.name.localeCompare(b.name));
        setStudentsList(loadedStudents);

        // Fetch Fees
        const feeData = await getDocs(feesCollectionRef);
        const loadedFees = feeData.docs.map(doc => ({
          ...doc.data(),
          id: doc.id
        }));
        // Sort newest first
        loadedFees.sort((a, b) => b.timestamp - a.timestamp);
        setFees(loadedFees);

        setLoading(false);
      } catch (error) {
        toast.error("Failed to load data from cloud.");
        console.error(error);
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Handle Dropdown Change to auto-fill course and name
  const handleStudentSelect = (e) => {
    const selectedId = e.target.value;
    const selectedStudent = studentsList.find(s => s.id === selectedId);
    
    if (selectedStudent) {
      setNewFee({
        ...newFee,
        studentId: selectedStudent.id,
        studentName: selectedStudent.name,
        course: selectedStudent.class
      });
    } else {
      setNewFee({ ...newFee, studentId: '', studentName: '', course: '' });
    }
  };

  // --- 2. SAVE FEE TO FIREBASE ---
  const handleSave = async () => {
    if (!newFee.studentId || !newFee.amount || !newFee.date) {
      toast.error("Student, Amount, and Due Date are required!");
      return;
    }

    const feeToAdd = { 
      studentId: newFee.studentId,
      studentName: newFee.studentName,
      course: newFee.course,
      amount: newFee.amount,
      date: newFee.date,
      status: newFee.status,
      timestamp: Date.now()
    };

    try {
      const docRef = await addDoc(feesCollectionRef, feeToAdd);
      setFees([{ ...feeToAdd, id: docRef.id }, ...fees]);
      toast.success("Fee Invoice Generated Live!");
      setShowModal(false);
      setNewFee({ studentId: '', studentName: '', course: '', amount: '', date: '', status: 'Pending' });
    } catch (error) {
      toast.error("Error generating invoice.");
      console.error(error);
    }
  };

  // --- 3. UPDATE STATUS IN FIREBASE ---
  const handleStatusToggle = async (id, currentStatus) => {
    const newStatus = currentStatus === 'Pending' ? 'Paid' : 'Pending';
    try {
      const feeDoc = doc(db, "fees", id);
      await updateDoc(feeDoc, { status: newStatus });
      
      // Update UI locally
      setFees(fees.map(f => f.id === id ? { ...f, status: newStatus } : f));
      toast.success(`Marked as ${newStatus}`);
    } catch (error) {
      toast.error("Error updating status.");
      console.error(error);
    }
  };

  // --- 4. DELETE FROM FIREBASE ---
  const handleDelete = async (id) => {
    if(window.confirm("Permanently delete this fee record?")) {
      try {
        const feeDoc = doc(db, "fees", id);
        await deleteDoc(feeDoc);
        setFees(fees.filter(f => f.id !== id));
        toast.success("Record deleted.");
      } catch (error) {
        toast.error("Error deleting record.");
        console.error(error);
      }
    }
  };

  const filteredFees = fees.filter(f => 
    f.studentName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    f.course.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <PageTransition>
      <div>
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-3">
          <h2 className="text-white mb-0 d-flex align-items-center">
            <CreditCard className="me-3 text-primary" size={28} />
            Fee Management
          </h2>
          <div className="d-flex gap-3">
            <div className="position-relative">
              <Search className="position-absolute text-muted" size={18} style={{ top: '10px', left: '12px' }} />
              <Form.Control 
                type="text" 
                placeholder="Search student or class..." 
                className="bg-dark text-white border-secondary ps-5"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ width: '250px' }}
              />
            </div>
            <Button variant="primary" onClick={() => setShowModal(true)} className="fw-bold px-4 rounded-pill shadow-sm d-flex align-items-center">
              <Plus size={18} className="me-2" /> Generate Invoice
            </Button>
          </div>
        </div>

        {loading ? (
           <div className="text-center py-5 text-white-50">
             <div className="spinner-border text-primary mb-3" role="status"></div>
             <p>Loading Cloud Ledger...</p>
           </div>
        ) : (
          <Card className="border-0 shadow-sm overflow-hidden" style={{ backgroundColor: 'rgba(17, 24, 39, 0.6)' }}>
            <Table hover variant="dark" className="mb-0 bg-transparent align-middle">
              <thead>
                <tr>
                  <th className="py-3 ps-4 bg-transparent border-secondary text-muted small">STUDENT</th>
                  <th className="py-3 bg-transparent border-secondary text-muted small">INVOICE DETAILS</th>
                  <th className="py-3 bg-transparent border-secondary text-muted small">AMOUNT</th>
                  <th className="py-3 bg-transparent border-secondary text-muted small">STATUS</th>
                  <th className="py-3 bg-transparent border-secondary text-muted small text-end pe-4">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filteredFees.length > 0 ? filteredFees.map(fee => (
                  <tr key={fee.id}>
                    <td className="ps-4 py-3 text-white fw-bold">{fee.studentName}</td>
                    <td className="py-3">
                      <div className="d-flex flex-column gap-1">
                        <Badge bg="info" className="text-dark w-fit-content px-2 py-1">{fee.course} Fee</Badge>
                        <small className="text-white-50"><Clock size={12} className="me-1" /> Due: {fee.date}</small>
                      </div>
                    </td>
                    <td className="py-3 fw-bold fs-5 text-white">₹ {fee.amount}</td>
                    <td className="py-3">
                      <Badge 
                        bg={fee.status === 'Paid' ? 'success' : 'warning'} 
                        className="px-3 py-2 rounded-pill text-dark cursor-pointer shadow-sm hover-scale"
                        style={{ cursor: 'pointer' }}
                        onClick={() => handleStatusToggle(fee.id, fee.status)}
                      >
                        {fee.status === 'Paid' ? <CheckCircle size={14} className="me-1"/> : <Clock size={14} className="me-1"/>}
                        {fee.status}
                      </Badge>
                    </td>
                    <td className="py-3 text-end pe-4">
                      <Button variant="link" className="text-danger p-2 hover-scale" onClick={() => handleDelete(fee.id)}>
                        <Trash2 size={18} />
                      </Button>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="5" className="text-center py-5 text-muted">
                      <CreditCard size={48} className="mb-3 opacity-25" />
                      <p>No fee records found in cloud database.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </Card>
        )}

        {/* GENERATE INVOICE MODAL */}
        <Modal show={showModal} onHide={() => setShowModal(false)} centered>
          <Modal.Header closeButton className="bg-dark border-secondary">
            <Modal.Title className="text-white">Generate Fee Invoice</Modal.Title>
          </Modal.Header>
          <Modal.Body className="bg-dark text-white">
            <Form>
              <Form.Group className="mb-3">
                <Form.Label className="small fw-bold text-muted">Select Student</Form.Label>
                <Form.Select className="bg-dark text-white border-secondary" onChange={handleStudentSelect} value={newFee.studentId}>
                  <option value="">-- Choose a Student --</option>
                  {studentsList.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.class})</option>
                  ))}
                </Form.Select>
              </Form.Group>
              
              {newFee.studentId && (
                <>
                  <Form.Group className="mb-3">
                     <Form.Label className="small fw-bold text-muted">Course (Auto-filled)</Form.Label>
                     <Form.Control type="text" className="bg-dark text-white-50 border-secondary" value={newFee.course} disabled />
                  </Form.Group>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label className="small fw-bold text-muted">Amount (₹)</Form.Label>
                        <Form.Control type="number" className="bg-dark text-white border-secondary fw-bold text-success" placeholder="5000" value={newFee.amount} onChange={e => setNewFee({...newFee, amount: e.target.value})} />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label className="small fw-bold text-muted">Due Date</Form.Label>
                        <Form.Control type="date" className="bg-dark text-white border-secondary" value={newFee.date} onChange={e => setNewFee({...newFee, date: e.target.value})} />
                      </Form.Group>
                    </Col>
                  </Row>
                  <Form.Group className="mb-3">
                    <Form.Label className="small fw-bold text-muted">Initial Status</Form.Label>
                    <Form.Select className="bg-dark text-white border-secondary" value={newFee.status} onChange={e => setNewFee({...newFee, status: e.target.value})}>
                      <option value="Pending">Pending</option>
                      <option value="Paid">Paid</option>
                    </Form.Select>
                  </Form.Group>
                </>
              )}
            </Form>
          </Modal.Body>
          <Modal.Footer className="bg-dark border-secondary">
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleSave} disabled={!newFee.studentId}>Create Invoice</Button>
          </Modal.Footer>
        </Modal>
      </div>
    </PageTransition>
  );
};

export default Fees;