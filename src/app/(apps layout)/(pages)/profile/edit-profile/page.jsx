'use client'
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Button, Col, Container, Form, Nav, Row, Tab, Alert } from 'react-bootstrap';
import avatar3 from '@/assets/img/avatar3.jpg';

const EditProfile = () => {
    const [user, setUser] = useState({ id: '', username: '', full_name: '', role: '', profile_photo: '' });
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

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
            } finally {
                setLoading(false);
            }
        };
        fetchUser();
    }, []);

    const handlePhotoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });
            const data = await res.json();
            if (res.ok) {
                setUser({ ...user, profile_photo: data.url });
                setMessage({ type: 'success', text: 'Foto berhasil diunggah! Klik simpan untuk memperbarui profil.' });
            } else {
                setMessage({ type: 'danger', text: data.message || 'Gagal mengunggah foto' });
            }
        } catch (error) {
            setMessage({ type: 'danger', text: 'Gagal mengunggah foto: Kesalahan sistem' });
        } finally {
            setUploading(false);
        }
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setMessage({ type: '', text: '' });
        try {
            const res = await fetch(`/api/users/${user.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: user.username,
                    full_name: user.full_name,
                    role: user.role,
                    profile_photo: user.profile_photo,
                    password: password || undefined
                }),
            });
            const data = await res.json();
            if (res.ok) {
                setMessage({ type: 'success', text: 'Profil berhasil diperbarui!' });
                setPassword('');
                // Notify other components (like TopNav) to refresh user data
                window.dispatchEvent(new Event('user-updated'));
            } else {
                setMessage({ type: 'danger', text: data.message || 'Gagal memperbarui profil' });
            }
        } catch (error) {
            setMessage({ type: 'danger', text: 'Terjadi kesalahan sistem' });
        }
    };

    if (loading) return <Container className="mt-7 text-center">Loading...</Container>;

    return (
        <Container>
            <div className="hk-pg-header pt-7 pb-4">
                <h1 className="pg-title">Edit Profile</h1>
                <p>Perbarui informasi akun Anda di sini.</p>
            </div>
            
            <div className="hk-pg-body">
                {message.text && (
                    <Alert variant={message.type} dismissible onClose={() => setMessage({ type: '', text: '' })}>
                        {message.text}
                    </Alert>
                )}
                
                <Tab.Container defaultActiveKey="tabBlock1">
                    <Row className="edit-profile-wrap">
                        <Col lg={2} md={3} xs={12}>
                            <div className="nav-profile mt-4 mb-4 mb-md-0">
                                <div className="nav-header">
                                    <span>Account</span>
                                </div>
                                <Nav as="ul" variant="tabs" className="nav-light nav-vertical nav-tabs-responsive">
                                    <Nav.Item as="li">
                                        <Nav.Link eventKey="tabBlock1">
                                            <span className="nav-link-text">Public Profile</span>
                                        </Nav.Link>
                                    </Nav.Item>
                                    <Nav.Item as="li">
                                        < Nav.Link eventKey="tabBlock2">
                                            <span className="nav-link-text">Login & Security</span>
                                        </Nav.Link>
                                    </Nav.Item>
                                </Nav>
                            </div>
                        </Col>
                        <Col lg={10} md={9} xs={12}>
                            <Tab.Content>
                                <Tab.Pane eventKey="tabBlock1">
                                    <Form onSubmit={handleUpdateProfile}>
                                        <div className="title title-xs title-wth-divider text-primary text-uppercase my-4">
                                            <span>Informasi Personal</span>
                                        </div>
                                        <Row className="gx-3">
                                            <Col sm={12}>
                                                <Form.Group className="mb-4">
                                                    <div className="media align-items-center">
                                                        <div className="media-head me-5">
                                                            <div className="avatar avatar-rounded avatar-xxl">
                                                                 {user.profile_photo ? (
                                                                    <img 
                                                                        src={user.profile_photo} 
                                                                        alt="user" 
                                                                        className="avatar-img" 
                                                                        style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '50%' }}
                                                                    />
                                                                ) : (
                                                                    <Image 
                                                                        src={avatar3} 
                                                                        alt="user" 
                                                                        className="avatar-img" 
                                                                        width={100} 
                                                                        height={100}
                                                                    />
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="media-body">
                                                            <Button variant="soft-primary" className="btn-file mb-1" disabled={uploading}>
                                                                {uploading ? 'Mengunggah...' : 'Unggah Foto'}
                                                                <Form.Control type="file" className="upload" onChange={handlePhotoUpload} accept="image/*" />
                                                            </Button>
                                                            <Form.Text as="div" className="form-text text-muted">
                                                                Rekomendasi ukuran 450px x 450px. Maksimal 5mb.
                                                            </Form.Text>
                                                        </div>
                                                    </div>
                                                </Form.Group>
                                            </Col>
                                        </Row>
                                        <Row className="gx-3">
                                            <Col sm={12}>
                                                <Form.Group className="mb-3">
                                                    <Form.Label>Nama Lengkap</Form.Label>
                                                    <Form.Control 
                                                        type="text" 
                                                        value={user.full_name} 
                                                        onChange={(e) => setUser({ ...user, full_name: e.target.value })}
                                                        required
                                                    />
                                                </Form.Group>
                                            </Col>
                                        </Row>
                                        <Row className="gx-3">
                                            <Col sm={6}>
                                                <Form.Group className="mb-3">
                                                    <Form.Label>Username</Form.Label>
                                                    <Form.Control 
                                                        type="text" 
                                                        value={user.username} 
                                                        onChange={(e) => setUser({ ...user, username: e.target.value })}
                                                        required
                                                    />
                                                </Form.Group>
                                            </Col>
                                            <Col sm={6}>
                                                <Form.Group className="mb-3">
                                                    <Form.Label>Role</Form.Label>
                                                    <Form.Control 
                                                        type="text" 
                                                        value={user.role} 
                                                        disabled
                                                        className="bg-light"
                                                    />
                                                </Form.Group>
                                            </Col>
                                        </Row>
                                        <Button variant="primary" type="submit" className="mt-4">Simpan Perubahan</Button>
                                    </Form>
                                </Tab.Pane>
                                
                                <Tab.Pane eventKey="tabBlock2">
                                    <Form onSubmit={handleUpdateProfile}>
                                        <div className="title title-xs title-wth-divider text-primary text-uppercase my-4">
                                            <span>Keamanan Akun</span>
                                        </div>
                                        <Row className="gx-3">
                                            <Col sm={12}>
                                                <Form.Group className="mb-3">
                                                    <Form.Label>Ganti Password</Form.Label>
                                                    <Form.Control 
                                                        type="password" 
                                                        placeholder="Masukkan password baru jika ingin mengganti"
                                                        value={password}
                                                        onChange={(e) => setPassword(e.target.value)}
                                                    />
                                                    <Form.Text className="text-muted">
                                                        Kosongkan jika tidak ingin mengubah password.
                                                    </Form.Text>
                                                </Form.Group>
                                            </Col>
                                        </Row>
                                        <Button variant="primary" type="submit" className="mt-3">Update Keamanan</Button>
                                    </Form>
                                </Tab.Pane>
                            </Tab.Content>
                        </Col>
                    </Row>
                </Tab.Container>
            </div>
        </Container>
    );
};

export default EditProfile;