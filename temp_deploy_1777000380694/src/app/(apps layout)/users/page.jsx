"use client"
import { useState, useEffect } from 'react';
import { Button, Card, Col, Container, Form, Modal, Row, Table, Badge } from 'react-bootstrap';
import { Edit2, UserPlus, Trash2, User } from 'react-feather';

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [tenants, setTenants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [selectedId, setSelectedId] = useState(null);
    const [form, setForm] = useState({ username: '', password: '', full_name: '', role: 'user', tenantIds: [], profile_photo: '' });
    const [error, setError] = useState('');

    const fetchData = async () => {
        setLoading(true);
        try {
            const [usersRes, tenantsRes] = await Promise.all([
                fetch('/api/users'),
                fetch('/api/tenants')
            ]);
            
            if (usersRes.ok) setUsers(await usersRes.json());
            if (tenantsRes.ok) setTenants(await tenantsRes.json());
        } catch (error) {
            console.error('Fetch error:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleEdit = (user) => {
        setForm({ 
            username: user.username, 
            password: '', 
            full_name: user.full_name, 
            role: user.role,
            tenantIds: user.companies ? user.companies.map(c => c.id) : [],
            profile_photo: user.profile_photo || ''
        });
        setSelectedId(user.id);
        setIsEdit(true);
        setShowModal(true);
    };

    const handleAdd = () => {
        setForm({ username: '', password: '', full_name: '', role: 'user', tenantIds: [], profile_photo: '' });
        setSelectedId(null);
        setIsEdit(false);
        setShowModal(true);
    };

    const handleTenantToggle = (tenantId) => {
        setForm(prev => {
            const isSelected = prev.tenantIds.includes(tenantId);
            if (isSelected) {
                return { ...prev, tenantIds: prev.tenantIds.filter(id => id !== tenantId) };
            } else {
                return { ...prev, tenantIds: [...prev.tenantIds, tenantId] };
            }
        });
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const url = isEdit ? `/api/users/${selectedId}` : '/api/users';
            const method = isEdit ? 'PUT' : 'POST';
            
            const res = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form)
            });
            const data = await res.json();
            if (res.ok) {
                fetchData();
                setShowModal(false);
            } else {
                setError(data.message);
            }
        } catch (error) {
            setError('Gagal menyimpan user');
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Yakin ingin menghapus user ini?')) return;
        try {
            const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
            if (res.ok) fetchData();
        } catch (error) {
            console.error('Delete error:', error);
        }
    };

    return (
        <Container fluid="xxl">
            <div className="hk-pg-header pt-7 pb-4">
                <div className="d-flex flex-wrap justify-content-between align-items-center">
                    <div>
                        <h1 className="pg-title">👤 Operator</h1>
                        <p className="text-muted mb-0">Kelola akses admin dan pengguna sistem BPI</p>
                    </div>
                    <Button variant="primary" className="d-flex align-items-center gap-1" onClick={handleAdd}>
                        <UserPlus size={16} /> Tambah User
                    </Button>
                </div>
            </div>

            <div className="hk-pg-body">
                <Row>
                    <Col>
                        <Card className="card-border">
                            <Card.Body className="p-0">
                                <Table responsive hover className="mb-0">
                                    <thead className="thead-light">
                                        <tr>
                                            <th>Nama Lengkap</th>
                                            <th>Username</th>
                                            <th>Role</th>
                                            <th>Perusahaan / Workspace</th>
                                            <th className="text-end">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {loading ? (
                                            <tr><td colSpan="5" className="text-center py-4">Memuat data...</td></tr>
                                        ) : users.length === 0 ? (
                                            <tr><td colSpan="5" className="text-center py-4">Belum ada user tambahan</td></tr>
                                        ) : users.map(user => (
                                            <tr key={user.id}>
                                                <td>
                                                    <div className="d-flex align-items-center">
                                                        <div className="avatar avatar-xs avatar-soft-primary avatar-rounded me-2">
                                                            {user.profile_photo ? (
                                                                <img src={user.profile_photo} alt="user" className="avatar-img" />
                                                            ) : (
                                                                <span className="initial-wrap">{user.full_name?.charAt(0)}</span>
                                                            )}
                                                        </div>
                                                        <span className="fw-medium">{user.full_name}</span>
                                                    </div>
                                                </td>
                                                <td>{user.username}</td>
                                                <td>
                                                    <Badge bg={user.role === 'admin' ? 'danger' : 'primary'} soft="true" className="text-uppercase">
                                                        {user.role}
                                                    </Badge>
                                                </td>
                                                <td>
                                                    <div className="d-flex flex-wrap gap-1">
                                                        {user.companies && user.companies.length > 0 ? (
                                                            user.companies.map(c => (
                                                                <Badge key={c.id} bg="info" soft="true" className="fs-8">
                                                                    {c.name}
                                                                </Badge>
                                                            ))
                                                        ) : (
                                                            <span className="text-muted fs-8">Tidak ada akses</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="text-end text-nowrap">
                                                    <Button 
                                                        variant="flush-info" 
                                                        size="sm" 
                                                        className="btn-icon btn-rounded flush-soft-hover me-1" 
                                                        onClick={() => handleEdit(user)}
                                                    >
                                                        <Edit2 size={14} />
                                                    </Button>
                                                    <Button 
                                                        variant="flush-danger" 
                                                        size="sm" 
                                                        className="btn-icon btn-rounded flush-soft-hover" 
                                                        onClick={() => handleDelete(user.id)}
                                                        disabled={user.username === 'admin'}
                                                    >
                                                        <Trash2 size={14} />
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            </div>

            <Modal show={showModal} onHide={() => setShowModal(false)} centered size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>{isEdit ? 'Edit Pengguna' : 'Tambah Pengguna Baru'}</Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleSave}>
                    <Modal.Body>
                        {error && <div className="alert alert-danger small py-2 mb-3">{error}</div>}
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label className="fw-bold">Informasi Akun</Form.Label>
                                    <div className="p-3 border rounded">
                                        <Form.Group className="mb-3">
                                            <Form.Label className="small">Nama Lengkap</Form.Label>
                                            <Form.Control 
                                                type="text" 
                                                required 
                                                value={form.full_name} 
                                                onChange={e => setForm({...form, full_name: e.target.value})} 
                                                placeholder="Misal: John Doe"
                                            />
                                        </Form.Group>
                                        <Form.Group className="mb-3">
                                            <Form.Label className="small">Username</Form.Label>
                                            <Form.Control 
                                                type="text" 
                                                required 
                                                value={form.username} 
                                                onChange={e => setForm({...form, username: e.target.value})} 
                                                placeholder="Username untuk login"
                                            />
                                        </Form.Group>
                                        <Form.Group className="mb-0">
                                            <Form.Label className="small">Password {isEdit && '(Kosongkan jika tidak ingin ganti)'}</Form.Label>
                                            <Form.Control 
                                                type="password" 
                                                required={!isEdit} 
                                                value={form.password} 
                                                onChange={e => setForm({...form, password: e.target.value})} 
                                                placeholder={isEdit ? "Isi untuk ganti password" : "Minimal 6 karakter"}
                                            />
                                        </Form.Group>
                                    </div>
                                </Form.Group>
                                <Form.Group>
                                    <Form.Label className="fw-bold">Role</Form.Label>
                                    <Form.Select value={form.role} onChange={e => setForm({...form, role: e.target.value})}>
                                        <option value="user">User (Standard)</option>
                                        <option value="admin">Admin (Full Access)</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label className="fw-bold">Akses Perusahaan <span className="text-danger">*</span></Form.Label>
                                    <div className="border rounded p-3" style={{ maxHeight: '250px', overflowY: 'auto' }}>
                                        {tenants.map(tenant => (
                                            <Form.Check 
                                                key={tenant.id}
                                                type="checkbox"
                                                id={`tenant-${tenant.id}`}
                                                label={tenant.name}
                                                checked={form.tenantIds.includes(tenant.id)}
                                                onChange={() => handleTenantToggle(tenant.id)}
                                                className="mb-2"
                                            />
                                        ))}
                                        {tenants.length === 0 && <span className="text-muted small">Memuat daftar perusahaan...</span>}
                                    </div>
                                    <Form.Text className="text-muted small">User hanya bisa mengakses data dari perusahaan yang dipilih.</Form.Text>
                                </Form.Group>
                            </Col>
                        </Row>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowModal(false)}>Batal</Button>
                        <Button variant="primary" type="submit" disabled={form.tenantIds.length === 0}>
                            {isEdit ? 'Simpan Perubahan' : 'Buat User'}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </Container>
    );
};

export default UserManagement;
