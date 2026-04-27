"use client"
import { Button, Card, Col, Container, Row, Navbar } from 'react-bootstrap';
import { useRouter } from 'next/navigation';
import { 
    Map, Activity, CheckSquare, ArrowRight, 
    Layers, Zap, BarChart2, MousePointer, 
    ArrowDownCircle, HelpCircle, RefreshCw
} from 'react-feather';
import { motion } from 'framer-motion';
import { useGlobalStateContext } from '@/context/GolobalStateProvider';
import WorkspaceSwitcher from '@/components/bpi/WorkspaceSwitcher';

const Dashboard = () => {
    const router = useRouter();
    const { states } = useGlobalStateContext();
    const { activeTenantId } = states.tenantState;

    return (
        <Container fluid="xxl" className="pb-8">
            <motion.div 
                className="hk-pg-header pt-7 pb-5"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <div className="d-flex flex-wrap justify-content-between align-items-center mb-4">
                    <div className="mb-3 mb-md-0">
                        <h1 className="pg-title mb-1">🏠 Dashboard Utama</h1>
                        <p className="mb-0 text-muted">Selamat datang kembali di sistem Business Process Improvement (BPI).</p>
                    </div>
                    <div style={{ minWidth: '220px' }}>
                        <WorkspaceSwitcher />
                    </div>
                </div>

                <Row className="mt-5">
                    <Col lg={4} sm={6} className="mb-4">
                        <Card as={motion.div} whileHover={{ y: -5 }} className="card-border shadow-sm border-start-4 border-primary h-100 cursor-pointer" onClick={() => router.push('/process-maps')}>
                            <Card.Body className="p-4 d-flex align-items-center gap-3">
                                <div className="bg-primary text-white rounded-circle d-flex justify-content-center align-items-center flex-shrink-0 shadow-sm" style={{ width: 50, height: 50 }}>
                                    <Map size={24} strokeWidth={2} />
                                </div>
                                <div>
                                    <h5 className="fw-bold mb-1">Peta Proses</h5>
                                    <p className="small mb-0 text-muted">Kelola dan petakan alur kerja.</p>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col lg={4} sm={6} className="mb-4">
                        <Card as={motion.div} whileHover={{ y: -5 }} className="card-border shadow-sm border-start-4 border-success h-100 cursor-pointer" onClick={() => router.push('/performa')}>
                            <Card.Body className="p-4 d-flex align-items-center gap-3">
                                <div className="bg-success text-white rounded-circle d-flex justify-content-center align-items-center flex-shrink-0 shadow-sm" style={{ width: 50, height: 50 }}>
                                    <Activity size={24} strokeWidth={2} />
                                </div>
                                <div>
                                    <h5 className="fw-bold mb-1">Analisis Performa</h5>
                                    <p className="small mb-0 text-muted">Pantau efisiensi proyek.</p>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col lg={4} sm={6} className="mb-4">
                        <Card as={motion.div} whileHover={{ y: -5 }} className="card-border shadow-sm border-start-4 border-warning h-100 cursor-pointer" onClick={() => router.push('/action-tracker')}>
                            <Card.Body className="p-4 d-flex align-items-center gap-3">
                                <div className="bg-warning text-white rounded-circle d-flex justify-content-center align-items-center flex-shrink-0 shadow-sm" style={{ width: 50, height: 50 }}>
                                    <CheckSquare size={24} strokeWidth={2} />
                                </div>
                                <div>
                                    <h5 className="fw-bold mb-1">Pelacak Tindakan</h5>
                                    <p className="small mb-0 text-muted">Pantau implementasi solusi.</p>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            </motion.div>
        </Container>
    );
};

export default Dashboard;
