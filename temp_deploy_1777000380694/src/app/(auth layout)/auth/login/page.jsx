'use client'
import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button, Col, Container, Form, InputGroup, Row } from 'react-bootstrap';
import { ExternalLink } from 'react-feather';
import { useTheme } from '@/layout/theme-provider/theme-provider';

//Images
import logoZamzami from '@/assets/img/logo-zamzami.png';
import logoutImg from '@/assets/img/macaroni-logged-out.png';
import { useRouter } from 'next/navigation';

const Login = () => {

    const [userName, setUserName] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        
        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: userName, password })
            });

            const data = await res.json();

            if (res.ok) {
                router.push("/dashboard");
                router.refresh();
            } else {
                setError(data.message || 'Login gagal');
            }
        } catch (err) {
            setError('Terjadi kesalahan koneksi');
        } finally {
            setLoading(false);
        }
    }

    const { theme } = useTheme();

    return (
        <div className="hk-pg-wrapper py-0" >
            <div className="hk-pg-body py-0">
                <Container fluid>
                    <Row className="auth-split">
                        <Col xl={5} lg={6} md={7} className="position-relative mx-auto">
                            <div className="auth-content flex-column pt-8 pb-md-8 pb-13">
                                <div className="text-center mb-7">
                                    <Link href="/" className="navbar-brand me-0 d-flex align-items-center justify-content-center">
                                        <Image className="brand-img d-inline-block" src={logoZamzami} alt="brand" priority style={{ height: '42px', width: 'auto' }} />
                                        <span className="fw-bold ms-2 text-primary" style={{ fontSize: '1.5rem' }}>BPI Zamzami</span>
                                    </Link>
                                </div>
                                <Form className="w-100" onSubmit={e => handleSubmit(e)} >
                                    <Row>
                                        <Col xl={7} sm={10} className="mx-auto">
                                            <div className="text-center mb-4">
                                                <h4>Selamat Datang Kembali</h4>
                                                <p>Silakan masuk ke akun Anda untuk melanjutkan optimasi BPI</p>
                                                {error && <div className="alert alert-danger py-2 fs-7 mt-3">{error}</div>}
                                            </div>
                                            <Row className="gx-3">
                                                <Col as={Form.Group} lg={12} className="mb-3" >
                                                    <div className="form-label-group">
                                                        <Form.Label>User Name</Form.Label>
                                                    </div>
                                                    <Form.Control placeholder="Enter username or email ID" type="text" value={userName} onChange={e => setUserName(e.target.value)} />
                                                </Col>
                                                <Col as={Form.Group} lg={12} className="mb-3" >
                                                    <div className="form-label-group">
                                                        <Form.Label>Password</Form.Label>
                                                        <Link href="#" className="fs-7 fw-medium">Forgot Password ?</Link>
                                                    </div>
                                                    <InputGroup className="password-check">
                                                        <span className="input-affix-wrapper affix-wth-text">
                                                            <Form.Control placeholder="Enter your password" value={password} onChange={e => setPassword(e.target.value)} type={showPassword ? "text" : "password"} />
                                                            <Link href="#" className="input-suffix text-primary text-uppercase fs-8 fw-medium" onClick={() => setShowPassword(!showPassword)} >
                                                                {showPassword
                                                                    ?
                                                                    <span>Hide</span>
                                                                    :
                                                                    <span>Show</span>
                                                                }
                                                            </Link>
                                                        </span>
                                                    </InputGroup>
                                                </Col>
                                            </Row>
                                            <div className="d-flex justify-content-center">
                                                <Form.Check id="logged_in" className="form-check-sm mb-3" >
                                                    <Form.Check.Input type="checkbox" defaultChecked />
                                                    <Form.Check.Label className="text-muted fs-7">Keep me logged in</Form.Check.Label>
                                                </Form.Check>
                                            </div>
                                            <Button variant="primary" type="submit" className="btn-uppercase btn-block" disabled={loading}>
                                                {loading ? 'Logging in...' : 'Login'}
                                            </Button>
                                            <p className="p-xs mt-2 text-center">New to BPI YZI? <Link href="#"><u>Create new account</u></Link></p>
                                            <Link href="https://wa.me/6289520003403" target="_blank" className="d-block extr-link text-center mt-4">
                                                <span className="feather-icon">
                                                    <ExternalLink />
                                                </span>
                                                <u className="text-muted">Laporkan Kendala/Feedback</u>
                                            </Link>
                                        </Col>
                                    </Row>
                                </Form>
                            </div>
                            {/* Page Footer */}
                            <div className="hk-footer border-0">
                                <Container fluid as="footer" className="footer">
                                    <Row>
                                        <div className="col-xl-8 text-center">
                                            <p className="footer-text pb-0"><span className="copy-text">BPI YZI © {new Date().getFullYear()} All rights reserved.</span> <a href="#some" target="_blank">Privacy Policy</a><span className="footer-link-sep">|</span><a href="#some" target="_blank">T&amp;C</a><span className="footer-link-sep">|</span><a href="#some" target="_blank">System Status</a><span className="footer-link-sep">|</span><a href="#" target="_blank">Dhayu Fandy Stiawan</a></p>
                                        </div>
                                    </Row>
                                </Container>
                            </div>
                        </Col>
                        <Col xl={7} lg={6} md={5} sm={10} className="d-md-block d-none position-relative bg-primary-light-5">
                            <div className="auth-content flex-column text-center py-8">
                                <Row>
                                    <Col xxl={7} xl={8} lg={11} className="mx-auto">
                                        <h2 className="mb-4">Optimalkan Proses Bisnis dengan BPI Zamzami</h2>
                                        <p>Platform Business Process Improvement (BPI) terintegrasi untuk memantau, menganalisis, dan memperbaiki alur kerja organisasi Anda secara sistematis demi mencapai keunggulan operasional.</p>
                                    </Col>
                                </Row>
                                <Image src={logoutImg} className="img-fluid w-sm-50 mt-7" alt="login" />
                            </div>
                            <p className="p-xs credit-text opacity-55">All illustration are powered by <Link href="https://icons8.com/ouch/" target="_blank" rel="noreferrer" className="text-light"><u>Icons8</u></Link></p>
                        </Col>
                    </Row>
                </Container>
            </div>
        </div>
    )
}

export default Login
