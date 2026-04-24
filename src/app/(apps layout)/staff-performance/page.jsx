"use client"
import { useState, useEffect } from 'react';
import { Badge, Card, Col, Container, Row, ProgressBar } from 'react-bootstrap';
import { UserCheck, Activity, TrendingUp, AlertTriangle, Briefcase, Award } from 'react-feather';
import { motion, AnimatePresence } from 'framer-motion';
import { useGlobalStateContext } from '@/context/GolobalStateProvider';
import WorkspaceSwitcher from '@/components/bpi/WorkspaceSwitcher';

const formatRupiah = (number) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0
    }).format(number || 0);
};

const StaffPerformance = () => {
    const { states } = useGlobalStateContext();
    const { activeTenantId } = states.tenantState;
    
    const [staffData, setStaffData] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchPerformanceData = async () => {
        if (!activeTenantId) return;
        setLoading(true);
        try {
            // Fetch both actors and projects
            const [actorsRes, projectsRes] = await Promise.all([
                fetch(`/api/actors?tenantId=${activeTenantId}`),
                fetch(`/api/projects?tenantId=${activeTenantId}`)
            ]);

            const actors = await actorsRes.json();
            const projects = await projectsRes.json();

            // Map and calculate metrics
            const aggregated = actors.map(actor => {
                // Find projects matched to this actor by actor_id or pic name
                const myProjects = projects.filter(p => p.actor_id === actor.id || (actor.name && p.pic && p.pic.toLowerCase() === actor.name.toLowerCase()));
                
                const totalProjects = myProjects.length;
                const completedProjects = myProjects.filter(p => p.status === 'completed').length;
                const draftProjects = myProjects.filter(p => p.status === 'draft').length;
                const analyzingProjects = myProjects.filter(p => p.status === 'analyzing').length;
                
                const totalBottlenecks = myProjects.reduce((sum, p) => sum + (Number(p.bottlenecks) || 0), 0);
                const totalSavings = myProjects.reduce((sum, p) => sum + (Number(p.potential_saving_cost) || 0), 0);
                const efficiency = totalProjects > 0 ? Math.round(myProjects.reduce((sum, p) => sum + (Number(p.potential_saving_time) || 0), 0) / totalProjects) : 0;
                
                const completionRate = totalProjects > 0 ? Math.round((completedProjects / totalProjects) * 100) : 0;

                // Determine rank/badge
                let badge = 'Pemula';
                let badgeColor = 'secondary';
                if (completedProjects >= 5 || totalSavings > 10000000) {
                    badge = 'Top Performer 🌟';
                    badgeColor = 'warning';
                } else if (completedProjects > 0 || totalSavings > 0) {
                    badge = 'Aktif ✅';
                    badgeColor = 'success';
                } else if (totalProjects > 0) {
                    badge = 'Dalam Proses ⏳';
                    badgeColor = 'primary';
                }

                return {
                    ...actor,
                    totalProjects,
                    completedProjects,
                    draftProjects,
                    analyzingProjects,
                    totalBottlenecks,
                    totalSavings,
                    efficiency,
                    completionRate,
                    badge,
                    badgeColor
                };
            });

            // Sort by Top Performers first (based on savings and completion rate)
            aggregated.sort((a, b) => {
                if (b.totalSavings !== a.totalSavings) return b.totalSavings - a.totalSavings;
                return b.completionRate - a.completionRate;
            });

            setStaffData(aggregated);
        } catch (error) {
            console.error('Error fetching performance data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPerformanceData();
    }, [activeTenantId]);

    // Global Stats
    const totalStaff = staffData.length;
    const globalSavings = staffData.reduce((sum, s) => sum + s.totalSavings, 0);
    const topPerformers = staffData.filter(s => s.badge.includes('Top Performer')).length;

    // Animation Variants
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1, transition: { duration: 0.4 } }
    };

    return (
        <Container fluid="xxl">
            {/* Header */}
            <motion.div className="hk-pg-header pt-7 pb-4" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
                <div className="d-flex flex-wrap justify-content-between align-items-center">
                    <div className="mb-lg-0 mb-2">
                        <h1 className="pg-title">📈 Hasil Performa Staff</h1>
                        <p className="text-muted mb-0">Pantau performa PIC dan kontribusi mereka dalam proyek BPI</p>
                    </div>
                    <div className="d-flex align-items-center gap-3">
                        <div style={{ minWidth: '180px' }}>
                            <WorkspaceSwitcher />
                        </div>
                    </div>
                </div>
            </motion.div>

            <div className="hk-pg-body">
                {/* Summary Cards */}
                <motion.div variants={containerVariants} initial="hidden" animate="visible">
                    <Row className="mb-5">
                        <Col lg={4} md={6} className="mb-3 mb-lg-0">
                            <motion.div variants={itemVariants}>
                                <Card className="card-border shadow-sm border-start-4 border-primary h-100">
                                    <Card.Body className="d-flex align-items-center p-3">
                                        <div className="avatar avatar-sm avatar-soft-primary avatar-rounded me-3">
                                            <span className="initial-wrap"><UserCheck size={20} /></span>
                                        </div>
                                        <div>
                                            <span className="d-block text-muted small fw-medium">Total Staff Aktif</span>
                                            <h4 className="mb-0">{totalStaff} Orang</h4>
                                        </div>
                                    </Card.Body>
                                </Card>
                            </motion.div>
                        </Col>
                        <Col lg={4} md={6} className="mb-3 mb-lg-0">
                            <motion.div variants={itemVariants}>
                                <Card className="card-border shadow-sm border-start-4 border-warning h-100">
                                    <Card.Body className="d-flex align-items-center p-3">
                                        <div className="avatar avatar-sm avatar-soft-warning avatar-rounded me-3">
                                            <span className="initial-wrap"><Award size={20} /></span>
                                        </div>
                                        <div>
                                            <span className="d-block text-muted small fw-medium">Top Performers</span>
                                            <h4 className="mb-0">{topPerformers} Staff</h4>
                                        </div>
                                    </Card.Body>
                                </Card>
                            </motion.div>
                        </Col>
                        <Col lg={4} md={12}>
                            <motion.div variants={itemVariants}>
                                <Card className="card-border shadow-sm border-start-4 border-success h-100">
                                    <Card.Body className="d-flex align-items-center p-3">
                                        <div className="avatar avatar-sm avatar-soft-success avatar-rounded me-3">
                                            <span className="initial-wrap"><TrendingUp size={20} /></span>
                                        </div>
                                        <div>
                                            <span className="d-block text-muted small fw-medium">Global Cost Savings</span>
                                            <h4 className="mb-0 text-success">{formatRupiah(globalSavings)}</h4>
                                        </div>
                                    </Card.Body>
                                </Card>
                            </motion.div>
                        </Col>
                    </Row>
                </motion.div>

                {/* Staff Cards Grid */}
                {loading ? (
                    <div className="text-center py-5"><div className="spinner-border text-primary" role="status"></div></div>
                ) : staffData.length === 0 ? (
                    <div className="text-center py-5 text-muted">Belum ada data staff di organisasi ini.</div>
                ) : (
                    <motion.div variants={containerVariants} initial="hidden" animate="visible">
                        <Row>
                            <AnimatePresence>
                                {staffData.map(staff => (
                                    <Col xl={4} md={6} key={staff.id} className="mb-4">
                                        <motion.div variants={itemVariants} layout initial="hidden" animate="visible">
                                            <Card className="h-100 card-border overflow-hidden">
                                                {/* Card Header with Badges */}
                                                <div className="bg-light p-3 border-bottom d-flex justify-content-between align-items-start">
                                                    <div>
                                                        <h6 className="mb-1 fw-bold">{staff.name}</h6>
                                                        <span className="text-muted small d-block mb-2">{staff.role || 'Staff PIC'}</span>
                                                        <Badge bg={staff.badgeColor} className="rounded-pill p-1 px-2 fw-medium shadow-sm">
                                                            {staff.badge}
                                                        </Badge>
                                                    </div>
                                                    <div className="avatar avatar-md avatar-soft-primary avatar-circle shadow-sm">
                                                        <span className="initial-wrap fw-bold fs-5">{staff.name.charAt(0).toUpperCase()}</span>
                                                    </div>
                                                </div>

                                                <Card.Body className="p-3">
                                                    {/* Projects Completion Progress */}
                                                    <div className="mb-4 mt-2">
                                                        <div className="d-flex justify-content-between small mb-1">
                                                            <span className="text-muted fw-medium d-flex align-items-center gap-1"><Briefcase size={12}/> Penyelesaian Proyek</span>
                                                            <span className="fw-bold">{staff.completionRate}%</span>
                                                        </div>
                                                        <ProgressBar style={{ height: '6px' }}>
                                                            <ProgressBar variant="success" now={staff.completedProjects > 0 ? (staff.completedProjects/staff.totalProjects)*100 : 0} key={1} title={`Selesai: ${staff.completedProjects}`} />
                                                            <ProgressBar variant="primary" now={staff.analyzingProjects > 0 ? (staff.analyzingProjects/staff.totalProjects)*100 : 0} key={2} title={`Analisis: ${staff.analyzingProjects}`} />
                                                            <ProgressBar variant="secondary" now={staff.draftProjects > 0 ? (staff.draftProjects/staff.totalProjects)*100 : 0} key={3} title={`Draft: ${staff.draftProjects}`} />
                                                        </ProgressBar>
                                                        <div className="text-muted small mt-1 text-end">{staff.totalProjects} Total Proyek</div>
                                                    </div>

                                                    {/* Key Metrics Grid */}
                                                    <Row className="g-2">
                                                        <Col xs={6}>
                                                            <div className="border border-light-subtle rounded p-2 text-center bg-light">
                                                                <span className="d-block text-muted small mb-1" style={{ fontSize: '11px' }}>Total Bottleneck</span>
                                                                <div className="d-flex justify-content-center align-items-center text-danger fw-bold gap-1">
                                                                    <AlertTriangle size={14}/> {staff.totalBottlenecks}
                                                                </div>
                                                            </div>
                                                        </Col>
                                                        <Col xs={6}>
                                                            <div className="border border-light-subtle rounded p-2 text-center bg-light">
                                                                <span className="d-block text-muted small mb-1" style={{ fontSize: '11px' }}>Rata-Rata Efisiensi</span>
                                                                <div className="d-flex justify-content-center align-items-center text-success fw-bold gap-1">
                                                                    <Activity size={14}/> +{staff.efficiency}%
                                                                </div>
                                                            </div>
                                                        </Col>
                                                        <Col xs={12}>
                                                            <div className="border border-success-subtle rounded p-2 text-center" style={{ backgroundColor: 'rgba(25, 135, 84, 0.05)' }}>
                                                                <span className="d-block text-success small mb-1" style={{ fontSize: '11px' }}>Total penghematan kumulatif</span>
                                                                <h5 className="mb-0 text-success fw-bold">{formatRupiah(staff.totalSavings)}</h5>
                                                            </div>
                                                        </Col>
                                                    </Row>
                                                </Card.Body>
                                            </Card>
                                        </motion.div>
                                    </Col>
                                ))}
                            </AnimatePresence>
                        </Row>
                    </motion.div>
                )}
            </div>
            
            <style jsx global>{`
                .workspace-switcher-wrap {
                    margin-top: 0 !important;
                    padding: 0 !important;
                }
            `}</style>
        </Container>
    );
};

export default StaffPerformance;
