import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Button, Modal, Form, Table, Badge } from 'react-bootstrap';
import { Briefcase, Plus, Trash2, Phone, Mail } from 'lucide-react';
import toast from 'react-hot-toast';
import PageTransition from './PageTransition';

// --- FIREBASE IMPORTS ---
import { db } from './firebase';
import { collection, getDocs, addDoc, deleteDoc, doc } from 'firebase/firestore';

const Staff = () => {
  const [showModal, setShowModal] = useState(false);
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);

  const [newStaff, setNewStaff] = useState({
    name: '', role: 'Teacher', department: '', phone: '', email: ''
  });

  const staffCollectionRef = collection(db, "staff");

  // --- 1. FETCH FROM FIREBASE ---
  useEffect(() => {
    const fetchStaff = async () => {
      try {
        const data = await getDocs(staffCollectionRef);
        const loadedStaff = data.docs.map(doc => ({ ...doc.data(), id: doc.id }));
        
        // Sort alphabetically
        loadedStaff.sort((a, b) => a.name.localeCompare(b.name));
        setStaffList(loadedStaff);
        setLoading(false);
      } catch (error) {
        toast.error("Failed to load staff directory.");
        console.error(error);
        setLoading(false);
      }
    };
    fetchStaff();
  }, []);

  // --- 2. SAVE TO FIREBASE ---
  const handleSave = async () => {
    if (!newStaff.name || !newStaff.phone) {
      toast.error("Name and Phone are required!");
      return;
    }

    const staffToAdd = {
      ...newStaff,
      joinDate: new Date().toLocaleDateString('en-CA'),
      timestamp: Date.now()
    };

    try {
      const docRef = await addDoc(staffCollectionRef, staffToAdd);
      setStaffList([{ ...staffToAdd, id: docRef.id }, ...staffList]);
      toast.success("Staff member added to Cloud Directory!");
      setShowModal(false);
      setNewStaff({ name: '', role: 'Teacher', department: '', phone: '', email: '' });
    } catch (error) {
      toast.error("Error saving staff to cloud.");
      console.error(error);
    }
  };

  // --- 3. DELETE FROM FIREBASE ---
  const handleDelete = async (id, name) => {
    if(window.confirm(`Permanently remove ${name} from the directory?`)) {
      try {
        await deleteDoc(doc(db, "staff", id));
        setStaffList(staffList.filter(s => s.id !== id));
        toast.success(`${name} removed.`);
      } catch (error) {
        toast.error("Error deleting staff member.");
        console.error(error);
      }
    }
  };

  const getRoleBadge = (role) => {
    switch(role) {
      case 'Admin': return 'danger';
      case 'Teacher': return 'info';
      case 'Receptionist': return 'secondary';
      case 'Accountant': return 'success';
      default: return 'primary';
    }
  };

  return (
    <PageTransition>
      <div>
        <div className="d-flex justify-content-between align-items-center mb-4 gap-3">
          <h2 className="text-white mb-0 d-flex align-items-center">
            <Briefcase className="me-3 text-primary" size={28} />
            Staff Directory
          </h2>
          <Button variant="primary" onClick={() => setShowModal(true)} className="fw-bold px-4 rounded-pill shadow-sm d-flex align-items-center">
            <Plus size={18} className="me-2" /> Add Staff
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-5 text-white-50">
            <div className="spinner-border text-primary mb-3" role="status"></div>
            <p>Loading Directory...</p>
          </div>
        ) : (
          <Card className="border-0 shadow-sm overflow-hidden" style={{ backgroundColor: 'rgba(17, 24, 39, 0.6)' }}>
            <Table hover variant="dark" className="mb-0 bg-transparent align-middle">
              <thead>
                <tr>
                  <th className="py-3 ps-4 bg-transparent border-secondary text-muted small">NAME</th>
                  <th className="py-3 bg-transparent border-secondary text-muted small">ROLE</th>
                  <th className="py-3 bg-transparent border-secondary text-muted small">SUBJECT/DEPT</th>
                  <th className="py-3 bg-transparent border-secondary text-muted small">CONTACT</th>
                  <th className="py-3 bg-transparent border-secondary text-muted small text-end pe-4">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {staffList.length > 0 ? staffList.map(staff => (
                  <tr key={staff.id}>
                    <td className="ps-4 py-3 text-white fw-bold">{staff.name}</td>
                    <td className="py-3">
                      <Badge bg={getRoleBadge(staff.role)} className="px-3 py-1 rounded-pill text-dark fw-bold">
                        {staff.role}
                      </Badge>
                    </td>
                    <td className="py-3 text-white-50">{staff.department || '-'}</td>
                    <td className="py-3">
                      <div className="d-flex flex-column gap-1 text-white-50 small">
                        <span><Phone size={12} className="me-2" />{staff.phone}</span>
                        {staff.email && <span><Mail size={12} className="me-2" />{staff.email}</span>}
                      </div>
                    </td>
                    <td className="py-3 text-end pe-4">
                      <Button variant="link" className="text-danger p-2" onClick={() => handleDelete(staff.id, staff.name)}>
                        <Trash2 size={18} />
                      </Button>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="5" className="text-center py-5 text-muted">
                      <Briefcase size={48} className="mb-3 opacity-25" />
                      <p>Cloud directory is empty. Click "Add Staff" to populate.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </Card>
        )}

        {/* ADD STAFF MODAL */}
        <Modal show={showModal} onHide={() => setShowModal(false)} centered>
          <Modal.Header closeButton className="bg-dark border-secondary">
            <Modal.Title className="text-white">Add Staff Member</Modal.Title>
          </Modal.Header>
          <Modal.Body className="bg-dark text-white">
            <Form>
              <Form.Group className="mb-3">
                <Form.Label className="small fw-bold text-muted">Full Name</Form.Label>
                <Form.Control type="text" className="bg-dark text-white border-secondary" placeholder="e.g. Vikram Singh" onChange={e => setNewStaff({...newStaff, name: e.target.value})} />
              </Form.Group>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label className="small fw-bold text-muted">Role</Form.Label>
                    <Form.Select className="bg-dark text-white border-secondary" value={newStaff.role} onChange={e => setNewStaff({...newStaff, role: e.target.value})}>
                      <option>Admin</option>
                      <option>Teacher</option>
                      <option>Receptionist</option>
                      <option>Accountant</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label className="small fw-bold text-muted">Subject / Dept</Form.Label>
                    <Form.Control type="text" className="bg-dark text-white border-secondary" placeholder="e.g. Physics" onChange={e => setNewStaff({...newStaff, department: e.target.value})} />
                  </Form.Group>
                </Col>
              </Row>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label className="small fw-bold text-muted">Phone Number</Form.Label>
                    <Form.Control type="tel" className="bg-dark text-white border-secondary" placeholder="e.g. 9876543210" onChange={e => setNewStaff({...newStaff, phone: e.target.value})} />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label className="small fw-bold text-muted">Email Address</Form.Label>
                    <Form.Control type="email" className="bg-dark text-white border-secondary" placeholder="optional@email.com" onChange={e => setNewStaff({...newStaff, email: e.target.value})} />
                  </Form.Group>
                </Col>
              </Row>
            </Form>
          </Modal.Body>
          <Modal.Footer className="bg-dark border-secondary">
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleSave}>Save to Directory</Button>
          </Modal.Footer>
        </Modal>
      </div>
    </PageTransition>
  );
};

export default Staff;