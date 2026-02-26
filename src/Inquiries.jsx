import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Button, Modal, Form, Badge } from 'react-bootstrap';
// Added 'Plus' back to this list!
import { UserPlus, Phone, Calendar as CalIcon, Trash2, CheckCircle, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import PageTransition from './PageTransition';

import { db } from './firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';

const Inquiries = () => {
  const [showModal, setShowModal] = useState(false);
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);

  const [newInq, setNewInq] = useState({
    studentName: '', parentName: '', phone: '', course: '10th Science', status: 'New'
  });

  const inquiriesCollectionRef = collection(db, "inquiries");

  useEffect(() => {
    const fetchInquiries = async () => {
      try {
        const data = await getDocs(inquiriesCollectionRef);
        const loadedInquiries = data.docs.map(doc => ({ ...doc.data(), id: doc.id }));
        
        loadedInquiries.sort((a, b) => b.timestamp - a.timestamp);
        setInquiries(loadedInquiries);
        setLoading(false);
      } catch (error) {
        toast.error("Firebase connection failed.");
        console.error(error);
        setLoading(false);
      }
    };
    fetchInquiries();
  }, []);

  const handleSave = async () => {
    if (!newInq.studentName || !newInq.phone) {
      toast.error("Student Name and Phone are required!");
      return;
    }

    const inqToAdd = {
      ...newInq,
      date: new Date().toLocaleDateString('en-CA'),
      timestamp: Date.now()
    };

    try {
      const docRef = await addDoc(inquiriesCollectionRef, inqToAdd);
      setInquiries([{ ...inqToAdd, id: docRef.id }, ...inquiries]);
      toast.success("Lead securely saved to Google Cloud!");
      setShowModal(false);
      setNewInq({ studentName: '', parentName: '', phone: '', course: '10th Science', status: 'New' });
    } catch (error) {
      toast.error("Failed to save to cloud.");
      console.error(error);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      const inqDoc = doc(db, "inquiries", id);
      await updateDoc(inqDoc, { status: newStatus });
      setInquiries(inquiries.map(inq => inq.id === id ? { ...inq, status: newStatus } : inq));
      toast.success(`Status updated to ${newStatus}`);
    } catch (error) {
      toast.error("Error updating status.");
      console.error(error);
    }
  };

  const handleDelete = async (id) => {
    if(window.confirm("Delete this inquiry permanently?")) {
      try {
        await deleteDoc(doc(db, "inquiries", id));
        setInquiries(inquiries.filter(inq => inq.id !== id));
        toast.success("Inquiry removed.");
      } catch (error) {
        console.error(error);
      }
    }
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'New': return 'primary';
      case 'Contacted': return 'warning';
      case 'Enrolled': return 'success';
      case 'Closed': return 'secondary';
      default: return 'primary';
    }
  };

  return (
    <PageTransition>
      <div>
        <div className="d-flex justify-content-between align-items-center mb-4 gap-3">
          <h2 className="text-white mb-0 d-flex align-items-center">
            <UserPlus className="me-3 text-primary" size={28} />
            Inquiry CRM
          </h2>
          <Button variant="primary" onClick={() => setShowModal(true)} className="fw-bold px-4 rounded-pill shadow-sm d-flex align-items-center">
            <Plus size={18} className="me-2" /> New Inquiry
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-5 text-white-50">
            <div className="spinner-border text-primary mb-3" role="status"></div>
            <p>Connecting to Cloud Database...</p>
          </div>
        ) : (
          <Row className="g-4">
            {inquiries.length > 0 ? inquiries.map(inq => (
              <Col md={6} xl={4} key={inq.id}>
                <Card className="h-100 border-0 shadow-sm p-4 position-relative" style={{ backgroundColor: 'rgba(17, 24, 39, 0.6)' }}>
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <Badge bg={getStatusBadge(inq.status)} className="px-3 py-1 rounded-pill text-uppercase" style={{ fontSize: '0.7rem', letterSpacing: '1px' }}>
                      {inq.status}
                    </Badge>
                    <small className="text-muted d-flex align-items-center">
                      <CalIcon size={12} className="me-1" /> {inq.date || "Just now"}
                    </small>
                  </div>
                  
                  <h4 className="text-white fw-bold mb-1">{inq.studentName}</h4>
                  {inq.parentName && <p className="text-muted small mb-3">Parent: {inq.parentName}</p>}
                  
                  <div className="text-white-50 small mb-4 d-flex flex-column gap-2">
                    <span className="d-flex align-items-center"><Phone size={14} className="me-2 text-info" /> {inq.phone}</span>
                    <span className="d-flex align-items-center"><UserPlus size={14} className="me-2 text-success" /> Interested in: <strong>{inq.course}</strong></span>
                  </div>

                  <div className="mt-auto pt-3 border-top border-secondary border-opacity-25 d-flex justify-content-between align-items-center">
                    <Form.Select 
                      size="sm" 
                      className="bg-dark text-white border-secondary w-50"
                      value={inq.status}
                      onChange={(e) => handleStatusChange(inq.id, e.target.value)}
                    >
                      <option value="New">New</option>
                      <option value="Contacted">Contacted</option>
                      <option value="Enrolled">Enrolled</option>
                      <option value="Closed">Closed</option>
                    </Form.Select>
                    
                    <div className="d-flex gap-2">
                      {inq.status !== 'Enrolled' && inq.status !== 'Closed' && (
                        <Button variant="outline-success" size="sm" className="p-2 d-flex align-items-center" onClick={() => handleStatusChange(inq.id, 'Enrolled')} title="Mark as Enrolled">
                          <CheckCircle size={16} />
                        </Button>
                      )}
                      <Button variant="outline-danger" size="sm" className="p-2" onClick={() => handleDelete(inq.id)}>
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </div>
                </Card>
              </Col>
            )) : (
              <Col xs={12}>
                 <div className="text-center py-5 text-muted">
                   <UserPlus size={48} className="mb-3 opacity-25" />
                   <p>Cloud database is empty. Click "New Inquiry" to add a lead.</p>
                 </div>
              </Col>
            )}
          </Row>
        )}

        {/* NEW INQUIRY MODAL */}
        <Modal show={showModal} onHide={() => setShowModal(false)} centered>
          <Modal.Header closeButton className="bg-dark border-secondary">
            <Modal.Title className="text-white">Add New Lead</Modal.Title>
          </Modal.Header>
          <Modal.Body className="bg-dark text-white">
            <Form>
              <Form.Group className="mb-3">
                <Form.Label className="small fw-bold text-muted">Student Name</Form.Label>
                <Form.Control type="text" className="bg-dark text-white border-secondary" placeholder="e.g. Rahul Sharma" onChange={e => setNewInq({...newInq, studentName: e.target.value})} />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label className="small fw-bold text-muted">Parent/Guardian Name</Form.Label>
                <Form.Control type="text" className="bg-dark text-white border-secondary" placeholder="Optional" onChange={e => setNewInq({...newInq, parentName: e.target.value})} />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label className="small fw-bold text-muted">Contact Number</Form.Label>
                <Form.Control type="tel" className="bg-dark text-white border-secondary" placeholder="e.g. 9876543210" onChange={e => setNewInq({...newInq, phone: e.target.value})} />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label className="small fw-bold text-muted">Interested Course</Form.Label>
                <Form.Select className="bg-dark text-white border-secondary" value={newInq.course} onChange={e => setNewInq({...newInq, course: e.target.value})}>
                  <option>10th Science</option>
                  <option>12th Commerce</option>
                  <option>JEE Prep</option>
                  <option>NEET Prep</option>
                </Form.Select>
              </Form.Group>
            </Form>
          </Modal.Body>
          <Modal.Footer className="bg-dark border-secondary">
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleSave}>Save Lead</Button>
          </Modal.Footer>
        </Modal>
      </div>
    </PageTransition>
  );
};

export default Inquiries;