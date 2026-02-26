import React, { useState, useEffect } from 'react';
import { Row, Col, Card, ProgressBar, Badge } from 'react-bootstrap';
import { Users, IndianRupee, AlertCircle, UserPlus, TrendingUp } from 'lucide-react';
import PageTransition from './PageTransition';

// --- FIREBASE IMPORTS ---
import { db } from './firebase';
import { collection, getDocs } from 'firebase/firestore';

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  
  // States for our calculated metrics
  const [stats, setStats] = useState({
    totalStudents: 0,
    revenueCollected: 0,
    pendingFees: 0,
    activeLeads: 0
  });
  
  const [courseData, setCourseData] = useState([]);
  const [recentIncome, setRecentIncome] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // 1. FETCH STUDENTS (For Total count & Course Enrollment percentages)
        const studentsSnap = await getDocs(collection(db, "students"));
        const students = studentsSnap.docs.map(doc => doc.data());
        const totalStudentsCount = students.length;

        // Calculate course distribution
        const courseCounts = {};
        students.forEach(s => {
          courseCounts[s.class] = (courseCounts[s.class] || 0) + 1;
        });
        
        const courseDistribution = Object.keys(courseCounts).map(courseName => ({
          name: courseName,
          count: courseCounts[courseName],
          percentage: totalStudentsCount > 0 ? Math.round((courseCounts[courseName] / totalStudentsCount) * 100) : 0
        }));

        // 2. FETCH FEES (For Revenue, Pending, and Recent Income)
        const feesSnap = await getDocs(collection(db, "fees"));
        const fees = feesSnap.docs.map(doc => doc.data());
        
        let collected = 0;
        let pending = 0;
        const paidFeesList = [];

        fees.forEach(fee => {
          const amount = Number(fee.amount) || 0; // Ensure it's treated as a number
          if (fee.status === 'Paid') {
            collected += amount;
            paidFeesList.push(fee);
          } else if (fee.status === 'Pending') {
            pending += amount;
          }
        });

        // Sort paid fees to get the most recent ones
        paidFeesList.sort((a, b) => b.timestamp - a.timestamp);
        const topRecentIncome = paidFeesList.slice(0, 4); // Get top 4 recent payments

        // 3. FETCH INQUIRIES (For Active Leads)
        const inqSnap = await getDocs(collection(db, "inquiries"));
        const inquiries = inqSnap.docs.map(doc => doc.data());
        
        // Count only 'New' and 'Contacted' as active leads
        const activeLeadsCount = inquiries.filter(inq => inq.status === 'New' || inq.status === 'Contacted').length;

        // 4. UPDATE STATE WITH CRUNCHED NUMBERS
        setStats({
          totalStudents: totalStudentsCount,
          revenueCollected: collected,
          pendingFees: pending,
          activeLeads: activeLeadsCount
        });
        
        setCourseData(courseDistribution);
        setRecentIncome(topRecentIncome);
        setLoading(false);

      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Helper colors for progress bars
  const pbColors = ["primary", "info", "success", "warning", "danger"];

  return (
    <PageTransition>
      <div>
        <h2 className="text-white mb-4 fw-bold">Dashboard Overview</h2>

        {loading ? (
          <div className="text-center py-5 text-white-50">
            <div className="spinner-border text-primary mb-3" role="status"></div>
            <p>Crunching the latest numbers from the cloud...</p>
          </div>
        ) : (
          <>
            {/* TOP METRICS CARDS */}
            <Row className="g-4 mb-4">
              <Col md={6} xl={3}>
                <Card className="border-0 shadow-sm h-100 p-4" style={{ backgroundColor: 'rgba(17, 24, 39, 0.6)', borderBottom: '4px solid #3b82f6' }}>
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <p className="text-muted fw-bold small text-uppercase mb-1">Total Students</p>
                      <h2 className="text-white fw-bold mb-0">{stats.totalStudents}</h2>
                    </div>
                    <div className="bg-primary bg-opacity-25 p-2 rounded">
                      <Users size={24} className="text-primary" />
                    </div>
                  </div>
                </Card>
              </Col>
              
              <Col md={6} xl={3}>
                <Card className="border-0 shadow-sm h-100 p-4" style={{ backgroundColor: 'rgba(17, 24, 39, 0.6)', borderBottom: '4px solid #10b981' }}>
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <p className="text-muted fw-bold small text-uppercase mb-1">Revenue Collected</p>
                      <h2 className="text-white fw-bold mb-0">₹ {stats.revenueCollected.toLocaleString()}</h2>
                    </div>
                    <div className="bg-success bg-opacity-25 p-2 rounded">
                      <IndianRupee size={24} className="text-success" />
                    </div>
                  </div>
                </Card>
              </Col>

              <Col md={6} xl={3}>
                <Card className="border-0 shadow-sm h-100 p-4" style={{ backgroundColor: 'rgba(17, 24, 39, 0.6)', borderBottom: '4px solid #ef4444' }}>
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <p className="text-muted fw-bold small text-uppercase mb-1">Pending Fees</p>
                      <h2 className="text-white fw-bold mb-0">₹ {stats.pendingFees.toLocaleString()}</h2>
                    </div>
                    <div className="bg-danger bg-opacity-25 p-2 rounded">
                      <AlertCircle size={24} className="text-danger" />
                    </div>
                  </div>
                </Card>
              </Col>

              <Col md={6} xl={3}>
                <Card className="border-0 shadow-sm h-100 p-4" style={{ backgroundColor: 'rgba(17, 24, 39, 0.6)', borderBottom: '4px solid #f59e0b' }}>
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <p className="text-muted fw-bold small text-uppercase mb-1">Active Leads</p>
                      <h2 className="text-white fw-bold mb-0">{stats.activeLeads}</h2>
                    </div>
                    <div className="bg-warning bg-opacity-25 p-2 rounded">
                      <UserPlus size={24} className="text-warning" />
                    </div>
                  </div>
                </Card>
              </Col>
            </Row>

            {/* CHARTS / LISTS AREA */}
            <Row className="g-4">
              
              {/* COURSE ENROLLMENT (PROGRESS BARS) */}
              <Col lg={7}>
                <Card className="border-0 shadow-sm h-100" style={{ backgroundColor: 'rgba(17, 24, 39, 0.6)' }}>
                  <div className="p-4 border-bottom border-secondary border-opacity-25">
                    <h5 className="text-white fw-bold mb-0">Course Enrollment</h5>
                  </div>
                  <div className="p-4">
                    {courseData.length > 0 ? courseData.map((course, idx) => (
                      <div key={idx} className="mb-4 last-child-mb-0">
                        <div className="d-flex justify-content-between align-items-end mb-2">
                          <span className="text-white fw-bold small">{course.name}</span>
                          <span className="text-white-50 small">{course.count} Students ({course.percentage}%)</span>
                        </div>
                        <ProgressBar 
                          now={course.percentage} 
                          variant={pbColors[idx % pbColors.length]} 
                          style={{ height: '8px', backgroundColor: 'rgba(255,255,255,0.05)' }} 
                        />
                      </div>
                    )) : (
                      <div className="text-center py-4 text-muted small">No students enrolled yet.</div>
                    )}
                  </div>
                </Card>
              </Col>

              {/* RECENT INCOME LIST */}
              <Col lg={5}>
                <Card className="border-0 shadow-sm h-100" style={{ backgroundColor: 'rgba(17, 24, 39, 0.6)' }}>
                  <div className="p-4 border-bottom border-secondary border-opacity-25 d-flex justify-content-between align-items-center">
                    <h5 className="text-white fw-bold mb-0 d-flex align-items-center">
                      <TrendingUp size={18} className="me-2 text-success" /> Recent Income
                    </h5>
                  </div>
                  <div className="p-0">
                    {recentIncome.length > 0 ? (
                      <ul className="list-group list-group-flush bg-transparent">
                        {recentIncome.map((fee, idx) => (
                          <li key={idx} className="list-group-item bg-transparent border-secondary border-opacity-25 p-4 d-flex justify-content-between align-items-center">
                            <div>
                              <h6 className="text-white fw-bold mb-1">{fee.studentName}</h6>
                              <small className="text-white-50">{fee.course} Fee</small>
                            </div>
                            <Badge bg="success" className="px-3 py-2 fs-6 rounded-pill">
                              ₹ {Number(fee.amount).toLocaleString()}
                            </Badge>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="text-center py-5 text-muted small">
                        No recent payments found.
                      </div>
                    )}
                  </div>
                </Card>
              </Col>

            </Row>
          </>
        )}
      </div>
    </PageTransition>
  );
};

export default Dashboard;