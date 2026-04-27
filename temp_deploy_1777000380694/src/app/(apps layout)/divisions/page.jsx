"use client"
import { useState, useEffect } from 'react';
import { Button, Card, Col, Container, Form, Modal, Row, Table, Badge } from 'react-bootstrap';
import { Edit2, Plus, Trash2, Layers, Filter } from 'react-feather';

const DivisionManagement = () => {
    const [divisions, setDivisions] = useState([]);
    const [tenants, setTenants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [selectedId, setSelectedId] = useState(null);
    const [filterTenant, setFilterTenant] = useState('');
    const [form, setForm] = useState({ tenant_id: '', name: '', description: '' });
    const [error, setError] = useState('');

    const fetchTenants = async () => {
        try {
            const res = await fetch('/api/tenants');
            const data = await res.json();
            if (res.ok) setTenants(data);
        } catch (error) {
            console.error('Fetch tenants error:', error);
        }
    };

    const fetchDivisions = async () => {
        setLoading(true);
        try {
            const url = filterTenant ? `/api/divisions?tenant_id=${filterTenant}` : '/api/divisions';
            const res = await fetch(url);
            const data = await res.json();
            if (res.ok) setDivisions(data);
        } catch (error) {
            console.error('Fetch error:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTenants();
    }, []);

    useEffect(() => {
        fetchDivisions();
    }, [filterTenant]);

    const handleEdit = (division) => {
        setForm({ tenant_id: division.tenant_id, name: division.name, description: division.description || '' });
        setSelectedId(division.id);
        setIsEdit(true);
        setShowModal(true);
    };

    const handleAdd = () => {
        setForm({ tenant_id: filterTenant || '', name: '', description: '' });
        setSelectedId(null);
        setIsEdit(false);
        setShowModal(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const url = isEdit ? `/api/divisions/${selectedId}` : '/api/divisions';
            const method = isEdit ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form)
            });
            const data = await res.json();
            if (res.ok) {
                fetchDivisions();
                setShowModal(false);
            } else {
                setError(data.message);
            }
        } catch (error) {
            setError('Gagal menyimpan data divisi');
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Yakin ingin menghapus divisi ini?')) return;
        try {
            const res = await fetch(`/api/divisions/${id}`, { method: 'DELETE' });
            if (res.ok) fetchDivisions();
        } catch (error) {
            console.error('Delete error:', error);
        }
    };

    return (
        <Container fluid="xxl">
            <div className="hk-pg-header pt-7 pb-4">
                <div className="d-flex flex-wrap justify-content-between align-items-center">
                    <div>
                        <h1 className="pg-title">🏗️ Divisi</h1>
                        <p className="text-muted mb-0">Kelola divisi di setiap perusahaan</p>
                    </div>
                    <div className="d-flex gap-2 align-items-center">
                        <Form.Select
                            size="sm"
                            style={{ width: '220px' }}
                            value={filterTenant}
                            onChange={e => setFilterTenant(e.target.value)}
                        >
                            <option value="">Semua Perusahaan</option>
                            {tenants.map(t => (
                                <option key={t.id} value={t.id}>{t.name}</option>
                            ))}
                        </Form.Select>
                        <Button variant="primary" className="d-flex align-items-center gap-1" onClick={handleAdd}>
                            <Plus size={16} /> Tambah Divisi
                        </Button>
                    </div>
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
                                            <th>Nama Divisi</th>
                                            <th>Perusahaan</th>
                                            <th>Deskripsi</th>
                                            <th>Tanggal Dibuat</th>
                                            <th className="text-end">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {loading ? (
                                            <tr><td colSpan="5" className="text-center py-4">Memuat data...</td></tr>
                                        ) : divisions.length === 0 ? (
                                            <tr><td colSpan="5" className="text-center py-4">Belum ada divisi terdaftar</td></tr>
                                        ) : divisions.map(division => (
                                            <tr key={division.id}>
                                                <td>
                                                    <div className="d-flex align-items-center">
                                                        <div className="avatar avatar-xs avatar-soft-info avatar-rounded me-2">
                                                            <span className="initial-wrap text-info"><Layers size={14} /></span>
                                                        </div>
                                                        <span className="fw-medium">{division.name}</span>
                                                    </div>
                                                </td>
                                                <td>
                                                    <Badge bg="soft-primary" className="text-primary">
                                                        {division.tenant_name}
                                                    </Badge>
                                                </td>
                                                <td>
                                                    <span className="text-muted">{division.description || '-'}</span>
                                                </td>
                                                <td>{new Date(division.created_at).toLocaleDateString('id-ID')}</td>
                                                <td className="text-end">
                                                    <Button
                                                        variant="flush-info"
                                                        size="sm"
                                                        className="btn-icon btn-rounded flush-soft-hover me-1"
                                                        onClick={() => handleEdit(division)}
                                                    >
                                                        <Edit2 size={14} />
                                                    </Button>
                                                    <Button
                                                        variant="flush-danger"
                                                        size="sm"
                                                        className="btn-icon btn-rounded flush-soft-hover"
                                                        onClick={() => handleDelete(division.id)}
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
                    <Modal.Title>{isEdit ? 'Edit Divisi' : 'Tambah Divisi Baru'}</Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleSave}>
                    <Modal.Body>
                        {error && <div className="alert alert-danger small py-2 mb-3">{error}</div>}
                        <Form.Group className="mb-3">
                            <Form.Label>Perusahaan</Form.Label>
                            <Form.Select
                                required
                                value={form.tenant_id}
                                onChange={e => setForm({ ...form, tenant_id: e.target.value })}
                                disabled={isEdit}
                            >
                                <option value="">Pilih Perusahaan</option>
                                {tenants.map(t => (
                                    <option key={t.id} value={t.id}>{t.name}</option>
                                ))}
                            </Form.Select>
                            {isEdit && <Form.Text className="text-muted">Perusahaan tidak bisa diubah</Form.Text>}
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Nama Divisi</Form.Label>
                            <Form.Control
                                type="text"
                                required
                                value={form.name}
                                onChange={e => setForm({ ...form, name: e.target.value })}
                                placeholder="Misal: IT, Keuangan, HRD"
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Deskripsi <span className="text-muted">(opsional)</span></Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={3}
                                value={form.description}
                                onChange={e => setForm({ ...form, description: e.target.value })}
                                placeholder="Deskripsi singkat tentang divisi ini"
                            />
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowModal(false)}>Batal</Button>
                        <Button variant="primary" type="submit">{isEdit ? 'Simpan Perubahan' : 'Tambah Divisi'}</Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </Container>
    );
};

export default DivisionManagement;
