import { useState, useEffect } from 'react';
import { Card, Col, Row, ListGroup } from 'react-bootstrap';
import { User, Mail, Shield, Clock } from 'react-feather';

const Body = () => {
    const [user, setUser] = useState(null);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await fetch('/api/auth/me');
                if (res.ok) {
                    const data = await res.json();
                    setUser(data);
                }
            } catch (error) {
                console.error('Fetch user error:', error);
            }
        };
        fetchUser();

        window.addEventListener('user-updated', fetchUser);
        return () => window.removeEventListener('user-updated', fetchUser);
    }, []);

    if (!user) return <div className="mt-5 text-center">Loading profile details...</div>;

    return (
        <Row className="mt-7 justify-content-center">
            <Col lg={8}>
                <Card className="card-border mb-4">
                    <Card.Header>
                        <h6 className="mb-0">Informasi Akun</h6>
                    </Card.Header>
                    <Card.Body className="p-0">
                        <ListGroup variant="flush">
                            <ListGroup.Item className="py-3 px-4">
                                <Row className="align-items-center">
                                    <Col sm={3} className="text-muted">
                                        <User size={18} className="me-2" />
                                        Username
                                    </Col>
                                    <Col sm={9} className="fw-medium">
                                        {user.username}
                                    </Col>
                                </Row>
                            </ListGroup.Item>
                            <ListGroup.Item className="py-3 px-4">
                                <Row className="align-items-center">
                                    <Col sm={3} className="text-muted">
                                        <User size={18} className="me-2" />
                                        Nama Lengkap
                                    </Col>
                                    <Col sm={9} className="fw-medium">
                                        {user.full_name}
                                    </Col>
                                </Row>
                            </ListGroup.Item>
                            <ListGroup.Item className="py-3 px-4">
                                <Row className="align-items-center">
                                    <Col sm={3} className="text-muted">
                                        <Shield size={18} className="me-2" />
                                        Role
                                    </Col>
                                    <Col sm={9}>
                                        <span className="badge bg-soft-primary text-primary text-uppercase">
                                            {user.role}
                                        </span>
                                    </Col>
                                </Row>
                            </ListGroup.Item>
                        </ListGroup>
                    </Card.Body>
                </Card>

                <Card className="card-border">
                    <Card.Header>
                        <h6 className="mb-0">Keamanan & Aktivitas</h6>
                    </Card.Header>
                    <Card.Body>
                        <div className="d-flex align-items-start mb-4">
                            <div className="avatar avatar-sm avatar-soft-info avatar-rounded me-3">
                                <span className="initial-wrap">
                                    <Clock size={16} />
                                </span>
                            </div>
                            <div>
                                <div className="fw-medium text-dark">Sesi Aktif</div>
                                <p className="text-muted small mb-0">Anda sedang login di perangkat ini.</p>
                            </div>
                        </div>
                        <div className="d-flex align-items-start">
                            <div className="avatar avatar-sm avatar-soft-success avatar-rounded me-3">
                                <span className="initial-wrap">
                                    <Shield size={16} />
                                </span>
                            </div>
                            <div>
                                <div className="fw-medium text-dark">Status Akun</div>
                                <p className="text-muted small mb-0">Akun Anda aktif dan terverifikasi.</p>
                            </div>
                        </div>
                    </Card.Body>
                </Card>
            </Col>
        </Row>
    )
}

export default Body
