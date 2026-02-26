import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Button, Modal, Form, Badge } from 'react-bootstrap';
import { Megaphone, Trash2, Clock, Send, Bell, AlertTriangle, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';
import PageTransition from './PageTransition';

// --- FIREBASE IMPORTS ---
import { db } from './firebase';
import { collection, getDocs, addDoc, deleteDoc, doc } from 'firebase/firestore';

const Notices = () => {
  const [showModal, setShowModal] = useState(false);
  const [notices, setNotices] = useState([]); // Starts empty, will fill from Firebase
  const [loading, setLoading] = useState(true); // To show a loading state
  const [newNotice, setNewNotice] = useState({ title: '', message: '', type: 'General' });

  // Reference to the "notices" collection in your Firestore Database
  const noticesCollectionRef = collection(db, "notices");

  // --- 1. FETCH FROM FIREBASE ---
  useEffect(() => {
    const getNotices = async () => {
      try {
        const data = await getDocs(noticesCollectionRef);
        // Map the Firebase documents into a normal array
        const loadedNotices = data.docs.map((doc) => ({
          ...doc.data(),
          id: doc.id // Firebase creates a unique random string ID for each document
        }));
        
        // Sort so newest is on top (based on our timestamp)
        loadedNotices.sort((a, b) => b.timestamp - a.timestamp);
        
        setNotices(loadedNotices);
        setLoading(false);
      } catch (error) {
        toast.error("Failed to load notices from cloud.");
        console.error(error);
        setLoading(false);
      }
    };

    getNotices();
  }, []);

  // --- 2. SAVE TO FIREBASE ---
  const handleSave = async () => {
    if (!newNotice.title || !newNotice.message) {
      toast.error("Title and Message required!");
      return;
    }

    const noticeToAdd = { 
      title: newNotice.title,
      message: newNotice.message,
      type: newNotice.type,
      date: new Date().toLocaleDateString('en-CA'),
      timestamp: Date.now() // Used for sorting
    };

    try {
      // Send to Firestore
      const docRef = await addDoc(noticesCollectionRef, noticeToAdd);
      
      // Update local screen immediately
      setNotices([{ ...noticeToAdd, id: docRef.id }, ...notices]);
      toast.success("Notice Broadcasted to Cloud!");
      setShowModal(false);
      setNewNotice({ title: '', message: '', type: 'General' });
    } catch (error) {
      toast.error("Error saving to cloud.");
      console.error(error);
    }
  };

  // --- 3. DELETE FROM FIREBASE ---
  const handleDelete = async (id) => {
    if(window.confirm("Delete this notice from the cloud?")) {
      try {
        const noticeDoc = doc(db, "notices", id);
        await deleteDoc(noticeDoc); // Delete from Firestore
        
        // Update local screen
        setNotices(notices.filter(n => n.id !== id));
        toast.success("Notice removed from cloud.");
      } catch (error) {
        toast.error("Error deleting notice.");
        console.error(error);
      }
    }
  };

  const getTypeConfig = (type) => {
    switch(type) {
      case 'Urgent': return { color: 'danger', icon: AlertTriangle };
      case 'Holiday': return { color: 'success', icon: Calendar };
      case 'Exam': return { color: 'warning', icon: Clock };
      default: return { color: 'primary', icon: Megaphone };
    }
  };

  return (
    <PageTransition>
      <div>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="text-white mb-0 d-flex align-items-center">
            <Megaphone className="me-3 text-primary" size={28} />
            Digital Notice Board
          </h2>
          <Button variant="primary" onClick={() => setShowModal(true)} className="fw-bold px-4 rounded-pill shadow-sm">
            <Send size={18} className="me-2" /> Broadcast Notice
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-5 text-white-50">
             <div className="spinner-border text-primary mb-3" role="status"></div>
             <p>Syncing with cloud database...</p>
          </div>
        ) : (
          <Row className="g-4">
            {notices.map(notice => {
              const config = getTypeConfig(notice.type);
              const Icon = config.icon;
              
              return (
                <Col lg={6} key={notice.id}>
                  <Card className="h-100 border-0 shadow-sm p-4 position-relative" style={{ backgroundColor: 'rgba(17, 24, 39, 0.6)' }}>
                    <div className="d-flex justify-content-between align-items-start mb-3">
                      <Badge bg={config.color} className="px-3 py-2 rounded-pill d-flex align-items-center gap-2">
                        <Icon size={14} /> {notice.type}
                      </Badge>
                      <div className="d-flex align-items-center gap-3">
                        <small className="text-muted d-flex align-items-center">
                          <Clock size={14} className="me-1" /> {notice.date}
                        </small>
                        <Button variant="link" className="text-danger p-0" onClick={() => handleDelete(notice.id)}>
                          <Trash2 size={18} />
                        </Button>
                      </div>
                    </div>
                    
                    <h4 className="text-white fw-bold mb-2">{notice.title}</h4>
                    <p className="text-white-50 mb-0" style={{ lineHeight: '1.6' }}>{notice.message}</p>
                  </Card>
                </Col>
              );
            })}
            
            {notices.length === 0 && (
              <Col xs={12}>
                <div className="text-center py-5 text-muted">
                  <Bell size={48} className="mb-3 opacity-25" />
                  <p>No active notices. Click "Broadcast Notice" to post one.</p>
                </div>
              </Col>
            )}
          </Row>
        )}

        {/* MODAL */}
        <Modal show={showModal} onHide={() => setShowModal(false)} centered>
          <Modal.Header closeButton className="bg-dark border-secondary">
            <Modal.Title className="text-white">Compose Notice</Modal.Title>
          </Modal.Header>
          <Modal.Body className="bg-dark text-white">
            <Form>
              <Form.Group className="mb-3">
                <Form.Label className="small fw-bold text-muted">Title / Headline</Form.Label>
                <Form.Control type="text" className="bg-dark text-white border-secondary" placeholder="e.g. Exam Schedule Released" onChange={e => setNewNotice({...newNotice, title: e.target.value})} />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label className="small fw-bold text-muted">Category</Form.Label>
                <Form.Select className="bg-dark text-white border-secondary" onChange={e => setNewNotice({...newNotice, type: e.target.value})}>
                  <option value="General">General Info</option>
                  <option value="Urgent">Urgent / Important</option>
                  <option value="Holiday">Holiday / Event</option>
                  <option value="Exam">Exam Related</option>
                </Form.Select>
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label className="small fw-bold text-muted">Message Body</Form.Label>
                <Form.Control as="textarea" rows={4} className="bg-dark text-white border-secondary" placeholder="Type your full message here..." onChange={e => setNewNotice({...newNotice, message: e.target.value})} />
              </Form.Group>
            </Form>
          </Modal.Body>
          <Modal.Footer className="bg-dark border-secondary">
            <Button variant="secondary" onClick={() => setShowModal(false)}>Discard</Button>
            <Button variant="primary" onClick={handleSave}>Post Live</Button>
          </Modal.Footer>
        </Modal>
      </div>
    </PageTransition>
  );
};

export default Notices;