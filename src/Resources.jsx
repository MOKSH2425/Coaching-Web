import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Button, Modal, Form, Badge } from 'react-bootstrap';
import { Library, Plus, Trash2, FileText, Link as LinkIcon, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import PageTransition from './PageTransition';

// --- FIREBASE IMPORTS ---
import { db } from './firebase';
import { collection, getDocs, addDoc, deleteDoc, doc } from 'firebase/firestore';

const Resources = () => {
  const [showModal, setShowModal] = useState(false);
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newRes, setNewRes] = useState({ title: '', subject: '', class: '', link: '', type: 'PDF' });

  const classes = ["JEE Prep", "NEET Prep", "10th Science", "12th Commerce", "All Classes"];
  const resourcesCollectionRef = collection(db, "resources");

  // --- 1. FETCH FROM FIREBASE ---
  useEffect(() => {
    const getResources = async () => {
      try {
        const data = await getDocs(resourcesCollectionRef);
        const loadedResources = data.docs.map((doc) => ({
          ...doc.data(),
          id: doc.id
        }));
        
        // Sort newest first
        loadedResources.sort((a, b) => b.timestamp - a.timestamp);
        
        setResources(loadedResources);
        setLoading(false);
      } catch (error) {
        toast.error("Failed to load library from cloud.");
        console.error(error);
        setLoading(false);
      }
    };
    getResources();
  }, []);

  // --- 2. SAVE TO FIREBASE ---
  const handleSave = async () => {
    if (!newRes.title || !newRes.subject || !newRes.class || !newRes.link) {
      toast.error("Please fill all fields and provide a link!");
      return;
    }

    const resToAdd = { 
      title: newRes.title,
      subject: newRes.subject,
      class: newRes.class,
      link: newRes.link,
      type: newRes.type,
      date: new Date().toLocaleDateString('en-CA'),
      timestamp: Date.now()
    };

    try {
      const docRef = await addDoc(resourcesCollectionRef, resToAdd);
      setResources([{ ...resToAdd, id: docRef.id }, ...resources]);
      toast.success("Material Added to Cloud Library!");
      setShowModal(false);
      setNewRes({ title: '', subject: '', class: '', link: '', type: 'PDF' });
    } catch (error) {
      toast.error("Error saving to cloud.");
      console.error(error);
    }
  };

  // --- 3. DELETE FROM FIREBASE ---
  const handleDelete = async (id) => {
    if(window.confirm("Delete this material permanently from the cloud?")) {
      try {
        const resDoc = doc(db, "resources", id);
        await deleteDoc(resDoc);
        setResources(resources.filter(r => r.id !== id));
        toast.success("Resource removed from cloud.");
      } catch (error) {
        toast.error("Error deleting resource.");
        console.error(error);
      }
    }
  };

  return (
    <PageTransition>
      <div>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="text-white mb-0 d-flex align-items-center">
            <Library className="me-3 text-primary" size={28} />
            Study Material Library
          </h2>
          <Button variant="primary" onClick={() => setShowModal(true)} className="fw-bold shadow-sm rounded-pill px-4">
            <Plus size={18} className="me-2" /> Add Material
          </Button>
        </div>

        {loading ? (
           <div className="text-center py-5 text-white-50">
             <div className="spinner-border text-primary mb-3" role="status"></div>
             <p>Loading Cloud Library...</p>
           </div>
        ) : (
          <Row className="g-4">
            {resources.length > 0 ? resources.map(res => (
              <Col md={6} lg={4} key={res.id}>
                <Card className="h-100 border-0 shadow-sm p-3 position-relative" style={{ backgroundColor: 'rgba(17, 24, 39, 0.6)' }}>
                  <div className="d-flex align-items-start">
                    <div className="bg-primary bg-opacity-10 p-3 rounded me-3 d-flex align-items-center justify-content-center" style={{ width: '60px', height: '60px' }}>
                      <FileText size={24} className="text-primary" />
                    </div>
                    <div className="flex-grow-1">
                      <div className="d-flex justify-content-between align-items-start">
                        <h6 className="text-white fw-bold mb-1 text-truncate" style={{ maxWidth: '180px' }}>{res.title}</h6>
                        <Button variant="link" className="text-danger p-0 ms-2" onClick={() => handleDelete(res.id)}>
                          <Trash2 size={16} />
                        </Button>
                      </div>
                      <div className="d-flex align-items-center gap-2 mb-2">
                        <Badge bg="info" className="text-dark" style={{ fontSize: '0.65rem' }}>{res.subject}</Badge>
                        <Badge bg="secondary" style={{ fontSize: '0.65rem' }}>{res.class}</Badge>
                      </div>
                      {res.link && (
                        <a href={res.link} target="_blank" rel="noopener noreferrer" className="text-decoration-none small text-primary d-flex align-items-center">
                          <LinkIcon size={12} className="me-1" /> Open Link
                        </a>
                      )}
                    </div>
                  </div>
                </Card>
              </Col>
            )) : (
              <Col xs={12}>
                <div className="text-center py-5 text-muted">
                  <Library size={48} className="mb-3 opacity-25" />
                  <p>Cloud library is empty. Upload notes for your students.</p>
                </div>
              </Col>
            )}
          </Row>
        )}

        {/* ADD MODAL */}
        <Modal show={showModal} onHide={() => setShowModal(false)} centered>
          <Modal.Header closeButton className="bg-dark border-secondary">
            <Modal.Title className="text-white">Upload Material</Modal.Title>
          </Modal.Header>
          <Modal.Body className="bg-dark text-white">
            <Form>
              <Form.Group className="mb-3">
                <Form.Label className="small fw-bold text-muted">Title</Form.Label>
                <Form.Control type="text" className="bg-dark text-white border-secondary" placeholder="e.g. Physics Chapter 1 Notes" onChange={e => setNewRes({...newRes, title: e.target.value})} />
              </Form.Group>
              <Row>
                <Col>
                  <Form.Group className="mb-3">
                    <Form.Label className="small fw-bold text-muted">Subject</Form.Label>
                    <Form.Control type="text" className="bg-dark text-white border-secondary" placeholder="Physics" onChange={e => setNewRes({...newRes, subject: e.target.value})} />
                  </Form.Group>
                </Col>
                <Col>
                  <Form.Group className="mb-3">
                    <Form.Label className="small fw-bold text-muted">Target Class</Form.Label>
                    <Form.Select className="bg-dark text-white border-secondary" onChange={e => setNewRes({...newRes, class: e.target.value})}>
                      <option value="">Select Class...</option>
                      {classes.map(c => <option key={c} value={c}>{c}</option>)}
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>
              <Form.Group className="mb-3">
                <Form.Label className="small fw-bold text-muted">File/Drive Link</Form.Label>
                <Form.Control type="url" className="bg-dark text-white border-secondary" placeholder="https://drive.google.com/..." onChange={e => setNewRes({...newRes, link: e.target.value})} />
              </Form.Group>
            </Form>
          </Modal.Body>
          <Modal.Footer className="bg-dark border-secondary">
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleSave}>Add to Cloud Library</Button>
          </Modal.Footer>
        </Modal>
      </div>
    </PageTransition>
  );
};

export default Resources;