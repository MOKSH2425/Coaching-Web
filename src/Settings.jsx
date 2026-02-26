import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Button, Form, Spinner } from 'react-bootstrap';
import { Settings as SettingsIcon, Save, Building, Phone, Mail, MapPin, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';
import PageTransition from './PageTransition';

// --- FIREBASE IMPORTS ---
import { db } from './firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const Settings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Default settings state
  const [settings, setSettings] = useState({
    instituteName: 'DigitalForgex Institute',
    email: 'contact@digitalforgex.edu',
    phone: '9876543210',
    address: '123 Tech Park, Innovation Hub',
    academicYear: '2026-2027'
  });

  // Reference to the ONE specific "global" document inside the "settings" collection
  const settingsDocRef = doc(db, "settings", "global");

  // --- 1. FETCH SETTINGS FROM FIREBASE ---
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const docSnap = await getDoc(settingsDocRef);
        
        if (docSnap.exists()) {
          // If settings exist in the cloud, load them!
          setSettings(docSnap.data());
        } else {
          // If they don't exist yet, we just stick with the default state above
          console.log("No settings found in cloud, using defaults.");
        }
        setLoading(false);
      } catch (error) {
        toast.error("Failed to load settings from cloud.");
        console.error(error);
        setLoading(false);
      }
    };
    
    fetchSettings();
  }, []);

  // --- 2. SAVE SETTINGS TO FIREBASE ---
  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      // setDoc will create the document if it doesn't exist, or overwrite it if it does
      await setDoc(settingsDocRef, settings);
      toast.success("Global Settings successfully updated!");
    } catch (error) {
      toast.error("Error saving settings.");
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: value }));
  };

  return (
    <PageTransition>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div className="d-flex justify-content-between align-items-center mb-4 gap-3">
          <h2 className="text-white mb-0 d-flex align-items-center">
            <SettingsIcon className="me-3 text-primary" size={28} />
            System Settings
          </h2>
        </div>

        {loading ? (
          <div className="text-center py-5 text-white-50">
            <Spinner animation="border" variant="primary" className="mb-3" />
            <p>Loading System Configuration...</p>
          </div>
        ) : (
          <Card className="border-0 shadow-lg" style={{ backgroundColor: 'rgba(17, 24, 39, 0.6)' }}>
            <div className="p-4 bg-primary bg-opacity-10 border-bottom border-primary border-opacity-25">
              <h5 className="text-white fw-bold mb-0">General Institute Details</h5>
              <small className="text-white-50">This information will be displayed on reports and invoices.</small>
            </div>
            
            <Form onSubmit={handleSave} className="p-4">
              <Row className="g-4">
                <Col md={12}>
                  <Form.Group>
                    <Form.Label className="small fw-bold text-muted d-flex align-items-center mb-2">
                      <Building size={16} className="me-2 text-primary"/> Institute Name
                    </Form.Label>
                    <Form.Control 
                      type="text" 
                      name="instituteName"
                      value={settings.instituteName} 
                      onChange={handleChange}
                      className="bg-dark text-white border-secondary p-3 fs-5 fw-bold" 
                      required
                    />
                  </Form.Group>
                </Col>

                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="small fw-bold text-muted d-flex align-items-center mb-2">
                      <Phone size={16} className="me-2 text-primary"/> Primary Contact Number
                    </Form.Label>
                    <Form.Control 
                      type="tel" 
                      name="phone"
                      value={settings.phone} 
                      onChange={handleChange}
                      className="bg-dark text-white border-secondary" 
                      required
                    />
                  </Form.Group>
                </Col>

                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="small fw-bold text-muted d-flex align-items-center mb-2">
                      <Mail size={16} className="me-2 text-primary"/> Support Email Address
                    </Form.Label>
                    <Form.Control 
                      type="email" 
                      name="email"
                      value={settings.email} 
                      onChange={handleChange}
                      className="bg-dark text-white border-secondary" 
                      required
                    />
                  </Form.Group>
                </Col>

                <Col md={12}>
                  <Form.Group>
                    <Form.Label className="small fw-bold text-muted d-flex align-items-center mb-2">
                      <MapPin size={16} className="me-2 text-primary"/> Registered Address
                    </Form.Label>
                    <Form.Control 
                      as="textarea" 
                      rows={3}
                      name="address"
                      value={settings.address} 
                      onChange={handleChange}
                      className="bg-dark text-white border-secondary" 
                      required
                    />
                  </Form.Group>
                </Col>

                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="small fw-bold text-muted d-flex align-items-center mb-2">
                      <Calendar size={16} className="me-2 text-primary"/> Current Academic Year
                    </Form.Label>
                    <Form.Select 
                      name="academicYear"
                      value={settings.academicYear} 
                      onChange={handleChange}
                      className="bg-dark text-white border-secondary"
                    >
                      <option value="2025-2026">2025-2026</option>
                      <option value="2026-2027">2026-2027</option>
                      <option value="2027-2028">2027-2028</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>

              <div className="mt-5 text-end border-top border-secondary border-opacity-25 pt-4">
                <Button 
                  type="submit" 
                  variant="primary" 
                  className="fw-bold px-5 py-2 rounded-pill shadow-lg d-inline-flex align-items-center hover-scale"
                  disabled={saving}
                >
                  {saving ? (
                    <><Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" /> Saving...</>
                  ) : (
                    <><Save size={18} className="me-2" /> Save Configuration</>
                  )}
                </Button>
              </div>
            </Form>
          </Card>
        )}
      </div>
    </PageTransition>
  );
};

export default Settings;