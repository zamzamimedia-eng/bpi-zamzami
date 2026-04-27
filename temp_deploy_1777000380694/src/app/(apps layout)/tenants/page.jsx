"use client"
import { useState, useEffect } from 'react';
import { Button, Card, Col, Container, Form, Modal, Row, Table, Badge } from 'react-bootstrap';
import { Edit2, Plus, Trash2, Home, Briefcase } from 'react-feather';

const TenantManagement = () => {
    const [tenants, setTenants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [selectedId, setSelectedId] = useState(null);
    const [form, setForm] = useState({ name: '' });
    const [error, setError] = useState('');

    const fetchTenants = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/tenants');
            const data = await res.json();
            if (res.ok) setTenants(data);
        } catch (error) {
            console.error('Fetch error:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTenants();
    }, []);

    const handleEdit = (tenant) => {
        setForm({ name: tenant.name });
        setSelectedId(tenant.id);
        setIsEdit(true);
        setShowModal(true);
    };

    const handleAdd = () => {
        setForm({ name: '' });
        setSelectedId(null);
        setIsEdit(false);
        setShowModal(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const url = isEdit ? `/api/tenants/${selectedId}` : '/api/tenants';
            const method = isEdit ? 'PUT' : 'POST';
            
            const res = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form)
            });
            const data = await res.json();
            if (res.ok) {
                fetchTenants();
                setShowModal(false);
            } else {
                setError(data.message);
            }
        } catch (error) {
            setError('Gagal menyimpan data perusahaan');
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Yakin ingin menghapus perusahaan ini? Semua data terkait (proyek, dll) mungkin akan terpengaruh.')) return;
        try {
            const res = await fetch(`/api/tenants/${id}`, { method: 'DELETE' });
            if (res.ok) fetchTenants();
        } catch (error) {
            console.error('Delete error:', error);
        }
    };

    return (
        <Container fluid="xxl">
            <div className="hk-pg-header pt-7 pb-4">
                <div className="d-flex flex-wrap justify-content-between align-items-center">
                    <div>
                        <h1 className="pg-title">🏢 Organisasi</h1>
                        <p className="text-muted mb-0">Kelola daftar perusahaan (Tenant) di sistem BPI</p>
                    </div>
                    <Button variant="primary" className="d-flex align-items-center gap-1" onClick={handleAdd}>
                        <Plus size={16} /> Tambah Perusahaan
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
                                            <th>Nama Perusahaan</th>
                                            <th>Tanggal Terdaftar</th>
                                            <th className="text-end">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {loading ? (
                                            <tr><td colSpan="4" className="text-center py-4">Memuat data...</td></tr>
                                        ) : tenants.length === 0 ? (
                                            <tr><td colSpan="4" className="text-center py-4">Belum ada perusahaan terdaftar</td></tr>
                                        ) : tenants.map(tenant => (
                                            <tr key={tenant.id}>
                                                <td>
                                                    <div className="d-flex align-items-center">
                                                        <div className="avatar avatar-xs avatar-soft-primary avatar-rounded me-2">
                                                            <span className="initial-wrap text-primary"><Home size={14} /></span>
                                                        </div>
                                                        <span className="fw-medium">{tenant.name}</span>
                                                    </div>
                                                </td>
                                                <td>{new Date(tenant.created_at).toLocaleDateString('id-ID')}</td>
                                                <td className="text-end">
                                                    <Button 
                                                        variant="flush-info" 
                                                        size="sm" 
                                                        className="btn-icon btn-rounded flush-soft-hover me-1" 
                                                        onClick={() => handleEdit(tenant)}
                                                    >
                                                        <Edit2 size={14} />
                                                    </Button>
                                                    <Button 
                                                        variant="flush-danger" 
                                                        size="sm" 
                                                        className="btn-icon btn-rounded flush-soft-hover" 
                                                        onClick={() => handleDelete(tenant.id)}
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

            <Modal show={showModal} onHide={() => setShowModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>{isEdit ? 'Edit Perusahaan' : 'Tambah Perusahaan Baru'}</Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleSave}>
                    <Modal.Body>
                        {error && <div className="alert alert-danger small py-2 mb-3">{error}</div>}
                        <Form.Group className="mb-3">
                            <Form.Label>Nama Perusahaan</Form.Label>
                            <Form.Control 
                                type="text" 
                                required 
                                value={form.name} 
                                onChange={e => setForm({...form, name: e.target.value})} 
                                placeholder="Misal: PT. Maju Bersama"
                            />
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowModal(false)}>Batal</Button>
                        <Button variant="primary" type="submit">{isEdit ? 'Simpan Perusahaan' : 'Tambah Perusahaan'}</Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </Container>
    );
};

export default TenantManagement;
