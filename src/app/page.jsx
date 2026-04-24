'use client'
import Link from 'next/link';
import Image from 'next/image';
import { Button, Col, Container, Row, Card, Badge } from 'react-bootstrap';
import { Layers, Activity, TrendingUp, CheckCircle, ArrowRight, Home, Users, Zap, BarChart2, Shield } from 'react-feather';
import { motion } from 'framer-motion';

//Images
import logoZamzami from '@/assets/img/logo-zamzami.png';

const LandingPage = () => {
    // Animation Variants
    const fadeInUp = {
        initial: { opacity: 0, y: 30 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.6 }
    };

    const staggerContainer = {
        animate: {
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const floatAnimation = {
        animate: {
            y: [0, -15, 0],
            transition: {
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut"
            }
        }
    };

    return (
        <div className="hk-landing-page py-0 bg-white" style={{ minHeight: '100vh', overflowX: 'hidden' }}>
            {/* Header / Navbar */}
            <header className="py-3 border-bottom sticky-top bg-white z-index-10">
                <Container>
                    <div className="d-flex justify-content-between align-items-center">
                        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                            <Link href="/" className="navbar-brand d-flex align-items-center">
                                <Image src={logoZamzami} alt="brand" priority style={{ height: '36px', width: 'auto' }} />
                                <span className="fw-bold ms-2 text-primary fs-4">BPI Zamzami</span>
                            </Link>
                        </motion.div>
                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                            <Link href="/auth/login">
                                <Button variant="primary" className="btn-rounded px-4 fw-bold shadow-sm">Masuk Dasbor</Button>
                            </Link>
                        </motion.div>
                    </div>
                </Container>
            </header>

            <main>
                {/* Hero Section */}
                <section className="hero-section py-10 py-lg-15 position-relative overflow-hidden">
                    {/* Background Decorative Blobs */}
                    <div className="blob blob-1 position-absolute top-0 start-0 translate-middle bg-primary opacity-5 rounded-circle" style={{ width: '600px', height: '600px', filter: 'blur(100px)' }}></div>
                    <div className="blob blob-2 position-absolute bottom-0 end-0 translate-middle bg-info opacity-5 rounded-circle" style={{ width: '400px', height: '400px', filter: 'blur(80px)' }}></div>

                    <Container>
                        <Row className="align-items-center">
                            <Col lg={7} className="mb-6 mb-lg-0 text-center text-lg-start">
                                <motion.div {...fadeInUp} transition={{ delay: 0.2 }}>
                                    <Badge bg="soft-primary" className="text-primary mb-3 px-3 py-2 rounded-pill fs-7 fw-bold">
                                        <Zap size={14} className="me-1 fill-primary" /> Masa Depan Optimasi Bisnis
                                    </Badge>
                                </motion.div>
                                <motion.h1 
                                    className="display-3 fw-black mb-4 lh-tight"
                                    initial={{ opacity: 0, y: 30 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.8, delay: 0.3 }}
                                >
                                    Bangun <span className="text-gradient">Proses Lebih Cepat</span>, <br />
                                    Capai Hasil Lebih Besar.
                                </motion.h1>
                                <motion.p 
                                    className="lead text-muted mb-5 pe-lg-5 fs-4"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.8, delay: 0.5 }}
                                >
                                    BPI Zamzami adalah platform digital terintegrasi untuk memetakan, menganalisis, dan mengeksekusi perbaikan alur kerja organisasi Anda dengan presisi data yang akurat.
                                </motion.p>
                                <motion.div 
                                    className="d-flex flex-column flex-sm-row justify-content-center justify-content-lg-start gap-4"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.7 }}
                                >
                                    <Link href="/auth/login">
                                        <Button variant="primary" size="lg" className="px-5 py-3 btn-rounded shadow-primary btn-hover-grow fw-bold">
                                            Mulai Optimasi <ArrowRight size={20} className="ms-2" />
                                        </Button>
                                    </Link>
                                    <Link href="#pillars">
                                        <Button variant="outline-dark" size="lg" className="px-5 py-3 btn-rounded fw-bold border-2">
                                            Pelajari Fitur
                                        </Button>
                                    </Link>
                                </motion.div>
                            </Col>
                            <Col lg={5} className="position-relative">
                                <motion.div 
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 0.8, delay: 0.4 }}
                                    className="ps-lg-4"
                                >
                                    <motion.div {...floatAnimation}>
                                        <Card className="glass-card shadow-xxl border-0 rounded-5 overflow-hidden z-index-1">
                                            <Card.Body className="p-0">
                                                <div className="p-4 bg-gradient-primary text-white text-center">
                                                    <h5 className="mb-0 text-white fw-bold">Analitik Perusahaan</h5>
                                                </div>
                                                <div className="p-5 text-center">
                                                    <div className="mb-4 d-inline-block p-4 bg-soft-primary rounded-circle">
                                                        <Activity size={60} className="text-primary" />
                                                    </div>
                                                    <h3 className="fw-black">Efisiensi +45%</h3>
                                                    <p className="text-muted">Pantau peningkatan performa operasional divisi secara real-time.</p>
                                                </div>
                                            </Card.Body>
                                        </Card>
                                    </motion.div>

                                    {/* Abstract Floating UI Elements */}
                                    <motion.div 
                                        className="position-absolute top-0 end-0 translate-middle-y mt-n5"
                                        animate={{ x: [0, 10, 0], y: [0, -10, 0] }}
                                        transition={{ duration: 5, repeat: Infinity }}
                                    >
                                        <Badge bg="success" className="p-3 shadow-lg rounded-4">
                                            <TrendingUp size={24} className="text-white" />
                                        </Badge>
                                    </motion.div>
                                </motion.div>
                            </Col>
                        </Row>
                    </Container>
                </section>

                {/* Pillars Section */}
                <section id="pillars" className="py-10 py-lg-15 bg-light position-relative">
                    <Container>
                        <motion.div 
                            className="text-center mb-10"
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            viewport={{ once: true }}
                        >
                            <h2 className="display-5 fw-black mb-3">Tiga Pilar Utama Transformasi</h2>
                            <p className="text-muted mx-auto fs-5" style={{ maxWidth: '650px' }}>
                                Kami menyediakan alat kerja digital yang dirancang khusus untuk memenuhi standar keunggulan operasional modern.
                            </p>
                        </motion.div>

                        <Row className="gx-4 gy-4" as={motion.div} variants={staggerContainer} initial="initial" whileInView="animate" viewport={{ once: true }}>
                            <Col lg={4}>
                                <motion.div variants={fadeInUp} className="h-100">
                                    <Card className="h-100 border-0 shadow-sm rounded-4 hover-shadow-lg transition-all overflow-hidden">
                                        <div className="p-5 h-100 d-flex flex-column">
                                            <div className="mb-4 avatar avatar-lg avatar-soft-primary avatar-rounded shadow-sm">
                                                <span className="initial-wrap"><Layers size={32} /></span>
                                            </div>
                                            <h4 className="fw-bold mb-3">Peta Proses (Kanvas)</h4>
                                            <p className="text-muted mb-0 flex-grow-1">
                                                Visualisasikan alur kerja dari level Departemen hingga Operasional. Bandingkan kondisi saat ini (As-Is) dengan usulan perbaikan (To-Be) secara instan.
                                            </p>
                                        </div>
                                    </Card>
                                </motion.div>
                            </Col>
                            <Col lg={4}>
                                <motion.div variants={fadeInUp} className="h-100">
                                    <Card className="h-100 border-0 shadow-sm rounded-4 hover-shadow-lg transition-all bg-gradient-primary text-white">
                                        <div className="p-5 h-100 d-flex flex-column">
                                            <div className="mb-4 avatar avatar-lg bg-white bg-opacity-20 avatar-rounded shadow-sm text-white">
                                                <span className="initial-wrap"><BarChart2 size={32} /></span>
                                            </div>
                                            <h4 className="fw-bold mb-3 text-white">Analisis Efisiensi</h4>
                                            <p className="text-white opacity-80 mb-0 flex-grow-1">
                                                Identifikasi bottleneck dan perhitungan Value-Added Time otomatis. Dapatkan rekomendasi berdasarkan data untuk meminimalkan 'waste' dalam proses bisnis.
                                            </p>
                                        </div>
                                    </Card>
                                </motion.div>
                            </Col>
                            <Col lg={4}>
                                <motion.div variants={fadeInUp} className="h-100">
                                    <Card className="h-100 border-0 shadow-sm rounded-4 hover-shadow-lg transition-all overflow-hidden">
                                        <div className="p-5 h-100 d-flex flex-column">
                                            <div className="mb-4 avatar avatar-lg avatar-soft-primary avatar-rounded shadow-sm">
                                                <span className="initial-wrap"><CheckCircle size={32} /></span>
                                            </div>
                                            <h4 className="fw-bold mb-3">Pelacak Tindakan</h4>
                                            <p className="text-muted mb-0 flex-grow-1">
                                                Platform monitoring untuk memastikan setiap rencana perbaikan dieksekusi tepat waktu dengan status tracking yang transparan bagi pimpinan.
                                            </p>
                                        </div>
                                    </Card>
                                </motion.div>
                            </Col>
                        </Row>
                    </Container>
                </section>

                {/* Corporate Section */}
                <section className="py-12 bg-white pb-15">
                    <Container>
                        <Row className="align-items-center">
                            <Col lg={6} className="mb-6 mb-lg-0 order-lg-2">
                                <motion.div 
                                    className="ps-lg-6"
                                    initial={{ opacity: 0, x: 50 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.8 }}
                                >
                                    <Badge bg="soft-info" className="text-info mb-3 px-3 py-2 rounded-pill fs-8 fw-bold">TRUSTED PLATFORM</Badge>
                                    <h2 className="display-6 fw-black mb-4">Skalabilitas Untuk <span className="text-gradient">Seluruh Entitas</span> Perusahaan</h2>
                                    <p className="text-muted mb-5 fs-5">
                                        BPI Zamzami dirancang untuk mendukung struktur organisasi yang kompleks:
                                    </p>
                                    <div className="features-list">
                                        {[
                                            { icon: <Shield size={20} />, text: 'Keamanan Data tingkat Enterprise di setiap Tenant.' },
                                            { icon: <Home size={20} />, text: 'Manajemen Multi-Company dalam satu Dashboard terpusat.' },
                                            { icon: <Users size={20} />, text: 'Klasifikasi Proyek yang fleksibel per Divisi & Departemen.' }
                                        ].map((item, i) => (
                                            <div key={i} className="d-flex align-items-start mb-4">
                                                <div className="p-2 bg-gradient-info text-white rounded-circle me-3 shadow-sm" style={{ width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    {item.icon}
                                                </div>
                                                <span className="fs-6 fw-medium text-dark pt-1">{item.text}</span>
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            </Col>
                            <Col lg={6} className="order-lg-1">
                                <motion.div 
                                    initial={{ opacity: 0, x: -50 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.8 }}
                                >
                                    <Row className="gx-3 gy-3">
                                        <Col xs={6}>
                                            <Card className="border-0 shadow-lg rounded-5 overflow-hidden">
                                                <div className="bg-primary p-5 text-center text-white">
                                                    <h2 className="text-white mb-0">100+</h2>
                                                    <small className="opacity-70 text-uppercase fw-bold">Proyek Aktif</small>
                                                </div>
                                            </Card>
                                        </Col>
                                        <Col xs={6} className="mt-5">
                                            <Card className="border-0 shadow-lg rounded-5 overflow-hidden">
                                                <div className="bg-gradient-info p-5 text-center text-white">
                                                    <h2 className="text-white mb-0">2.5k</h2>
                                                    <small className="opacity-70 text-uppercase fw-bold">Tugas Harian</small>
                                                </div>
                                            </Card>
                                        </Col>
                                    </Row>
                                </motion.div>
                            </Col>
                        </Row>
                    </Container>
                </section>

                {/* Final Call to Action */}
                <section className="py-10 bg-white">
                    <Container>
                        <motion.div 
                            className="cta-banner p-8 p-lg-12 rounded-5 text-center position-relative overflow-hidden"
                            style={{ 
                                background: 'linear-gradient(135deg, #0066FF 0%, #00C2FF 100%)',
                                boxShadow: '0 20px 60px -10px rgba(0, 102, 255, 0.4)'
                            }}
                            initial={{ opacity: 0, scale: 0.9 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                        >
                            <div className="position-relative z-index-1">
                                <h1 className="display-4 text-white fw-black mb-4">Siap Bertransformasi Hari Ini?</h1>
                                <p className="text-white opacity-90 mb-5 mx-auto fs-4" style={{ maxWidth: '800px' }}>
                                    Mari bersama-sama membongkar inefisiensi dan membangun organisasi yang lebih lincah dan kompetitif.
                                </p>
                                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                    <Link href="/auth/login">
                                        <Button variant="white" size="xl" className="px-10 py-4 btn-rounded fw-bold text-primary shadow-lg fs-4">
                                            Buka Dasbor Sekarang
                                        </Button>
                                    </Link>
                                </motion.div>
                            </div>
                            
                            {/* Decorative circles inside CTA */}
                            <div className="position-absolute border border-white opacity-10 rounded-circle" style={{ width: '300px', height: '300px', top: '-100px', left: '-100px' }}></div>
                            <div className="position-absolute border border-white opacity-10 rounded-circle" style={{ width: '400px', height: '400px', bottom: '-200px', right: '-150px' }}></div>
                        </motion.div>
                    </Container>
                </section>
            </main>

            {/* Footer */}
            <footer className="py-8 bg-light mt-10">
                <Container>
                    <div className="d-flex flex-column flex-md-row justify-content-between align-items-center">
                        <div className="mb-4 mb-md-0 d-flex align-items-center">
                            <Image src={logoZamzami} alt="brand" style={{ height: '28px', width: 'auto' }} />
                            <span className="ms-3 fw-bold text-dark fs-5">BPI Zamzami</span>
                        </div>
                        <p className="text-muted mb-0 small">© {new Date().getFullYear()} Zamzami International. All rights reserved.</p>
                        <div className="d-flex gap-4">
                            <Link href="#" className="text-muted small">Privacy</Link>
                            <Link href="#" className="text-muted small">Terms</Link>
                            <Link href="#" className="text-muted small">Status</Link>
                        </div>
                    </div>
                </Container>
            </footer>

            <style jsx>{`
                .hk-landing-page { font-family: 'Outfit', 'Inter', sans-serif !important; }
                .fw-black { font-weight: 900; }
                .text-gradient { 
                    background: linear-gradient(90deg, #0066FF, #00C2FF);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }
                .bg-gradient-primary { background: linear-gradient(135deg, #0066FF 0%, #0085FF 100%); }
                .bg-gradient-info { background: linear-gradient(135deg, #00C2FF 0%, #0099CC 100%); }
                .btn-rounded { border-radius: 50px; }
                .glass-card {
                    background: rgba(255, 255, 255, 0.7);
                    backdrop-filter: blur(15px);
                    border: 1px solid rgba(255, 255, 255, 0.3);
                }
                .shadow-xxl { box-shadow: 0 40px 80px -20px rgba(0, 0, 0, 0.15); }
                .shadow-primary { box-shadow: 0 15px 30px -10px rgba(0, 102, 255, 0.4); }
                .z-index-10 { z-index: 10; }
                .py-12 { padding-top: 6rem; padding-bottom: 6rem; }
                .transition-all { transition: all 0.3s ease; }
                .btn-hover-grow:hover { transform: scale(1.05); }
                .hover-shadow-lg:hover { box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.1); }
                
                @media (max-width: 991.98px) {
                    .display-3 { font-size: 3rem; }
                    .display-4 { font-size: 2.5rem; }
                }
            `}</style>
        </div>
    );
};

export default LandingPage;
