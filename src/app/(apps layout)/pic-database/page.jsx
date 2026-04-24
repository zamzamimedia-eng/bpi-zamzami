"use client"
import { useState, useEffect } from 'react';
import { Button, Card, Col, Container, Form, Modal, Row, Table, Badge } from 'react-bootstrap';
import { Edit2, Plus, Trash2, User, Phone, Mail, Award, DownloadCloud } from 'react-feather';
import * as XLSX from 'xlsx';

const PicDatabaseManagement = () => {
    const [actors, setActors] = useState([]);
    const [tenants, setTenants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showChoiceModal, setShowChoiceModal] = useState(false);
    const [showBulkModal, setShowBulkModal] = useState(false);
    const [bulkFile, setBulkFile] = useState(null);
    const [isImportingBulk, setIsImportingBulk] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [selectedId, setSelectedId] = useState(null);
    const [filterTenant, setFilterTenant] = useState('');
    const [form, setForm] = useState({ tenant_id: '', name: '', role: '', email: '', phone: '' });
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

    const fetchActors = async () => {
        setLoading(true);
        try {
            const url = filterTenant ? `/api/actors?tenantId=${filterTenant}` : '/api/actors';
            const res = await fetch(url);
            const data = await res.json();
            if (res.ok) setActors(data);
        } catch (error) {
            console.error('Fetch actors error:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTenants();
    }, []);

    useEffect(() => {
        fetchActors();
    }, [filterTenant]);

    const handleEdit = (actor) => {
        setForm({ 
            tenant_id: actor.tenant_id, 
            name: actor.name, 
            role: actor.role || '', 
            email: actor.email || '', 
            phone: actor.phone || '' 
        });
        setSelectedId(actor.id);
        setIsEdit(true);
        setShowModal(true);
    };

    const handleAdd = () => {
        setForm({ tenant_id: filterTenant || '', name: '', role: '', email: '', phone: '' });
        setSelectedId(null);
        setIsEdit(false);
        setShowModal(true);
    };

    const downloadBulkTemplate = () => {
        const worksheetData = [
            {
                'Nama Lengkap': 'Ahmad Dahlan',
                'Jabatan': 'Finance Manager',
                'Email': 'ahmad@example.com',
                'No Telepon': '081234567890'
            },
            {
                'Nama Lengkap': 'Siti Rohmah',
                'Jabatan': 'HR Staff',
                'Email': 'siti@example.com',
                'No Telepon': '081298765432'
            }
        ];
        
        const worksheet = XLSX.utils.json_to_sheet(worksheetData);
        worksheet['!cols'] = [{ wch: 30 }, { wch: 25 }, { wch: 30 }, { wch: 20 }];
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Template Bulk Staff");
        XLSX.writeFile(workbook, "Template_Import_Bulk_Staff.xlsx");
    };

    const handleBulkImport = async () => {
        if (!bulkFile) {
            alert('Pilih file Excel terlebih dahulu!');
            return;
        }
        if (!filterTenant) {
            alert('Pilih Perusahaan terlebih dahulu dari dropdown untuk menentukan tujuan import!');
            return;
        }

        setIsImportingBulk(true);
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheet = workbook.Sheets[workbook.SheetNames[0]];
                const rows = XLSX.utils.sheet_to_json(sheet);
                
                let successCount = 0;
                
                for (const row of rows) {
                    const name = row['Nama Lengkap'];
                    if (!name) continue; // Skip if no name
                    
                    const payload = {
                        name: name.toString().trim(),
                        role: (row['Jabatan'] || '').toString().trim(),
                        email: (row['Email'] || '').toString().trim(),
                        phone: (row['No Telepon'] || '').toString().trim(),
                        tenant_id: filterTenant
                    };
                    
                    const res = await fetch('/api/actors', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    });
                    
                    if (res.ok) {
                        successCount++;
                    }
                }
                
                alert(`Berhasil mengimpor ${successCount} Staff.`);
                setBulkFile(null);
                setShowBulkModal(false);
                fetchActors();
            } catch (error) {
                console.error('Bulk import error:', error);
                alert('Terjadi kesalahan saat memproses file Excel.');
            } finally {
                setIsImportingBulk(false);
            }
        };
        reader.readAsArrayBuffer(bulkFile);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const url = '/api/actors';
            const method = isEdit ? 'PUT' : 'POST';
            const body = isEdit ? { ...form, id: selectedId } : form;

            const res = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            const data = await res.json();
            if (res.ok) {
                fetchActors();
                setShowModal(false);
            } else {
                setError(data.message);
            }
        } catch (error) {
            setError('Gagal menyimpan data PIC');
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Yakin ingin menghapus PIC ini dari database?')) return;
        try {
            const res = await fetch(`/api/actors?id=${id}&tenantId=${filterTenant}`, { method: 'DELETE' });
            if (res.ok) fetchActors();
        } catch (error) {
            console.error('Delete error:', error);
        }
    };

    return (
        <Container fluid="xxl">
            <div className="hk-pg-header pt-7 pb-4">
                <div className="d-flex flex-wrap justify-content-between align-items-center">
                    <div>
                        <h1 className="pg-title">👥 Staff</h1>
                        <p className="text-muted mb-0">Kelola daftar staff penanggung jawab proyek</p>
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
                        <Button variant="primary" className="d-flex align-items-center gap-1" onClick={() => setShowChoiceModal(true)}>
                            <Plus size={16} /> Tambah Staff
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
                                            <th>Nama Lengkap</th>
                                            <th>Jabatan / Peran</th>
                                            <th>Kontak</th>
                                            <th>Perusahaan</th>
                                            <th className="text-end">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {loading ? (
                                            <tr><td colSpan="5" className="text-center py-4">Memuat data...</td></tr>
                                        ) : actors.length === 0 ? (
                                            <tr><td colSpan="5" className="text-center py-4">Belum ada Staff terdaftar</td></tr>
                                        ) : actors.map(actor => (
                                            <tr key={actor.id}>
                                                <td>
                                                    <div className="d-flex align-items-center">
                                                        <div className="avatar avatar-xs avatar-soft-primary avatar-rounded me-2">
                                                            <span className="initial-wrap text-primary"><User size={14} /></span>
                                                        </div>
                                                        <span className="fw-medium">{actor.name}</span>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="d-flex align-items-center gap-1">
                                                        <Award size={14} className="text-muted" />
                                                        <span>{actor.role || '-'}</span>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="small">
                                                        {actor.email && <div className="text-muted d-flex align-items-center gap-1"><Mail size={12} /> {actor.email}</div>}
                                                        {actor.phone && <div className="text-muted d-flex align-items-center gap-1"><Phone size={12} /> {actor.phone}</div>}
                                                        {!actor.email && !actor.phone && '-'}
                                                    </div>
                                                </td>
                                                <td>
                                                    <Badge bg="soft-secondary" className="text-secondary">
                                                        {tenants.find(t => t.id === actor.tenant_id)?.name || 'Unknown'}
                                                    </Badge>
                                                </td>
                                                <td className="text-end">
                                                    <Button
                                                        variant="flush-info"
                                                        size="sm"
                                                        className="btn-icon btn-rounded flush-soft-hover me-1"
                                                        onClick={() => handleEdit(actor)}
                                                    >
                                                        <Edit2 size={14} />
                                                    </Button>
                                                    <Button
                                                        variant="flush-danger"
                                                        size="sm"
                                                        className="btn-icon btn-rounded flush-soft-hover"
                                                        onClick={() => handleDelete(actor.id)}
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
                    <Modal.Title>{isEdit ? 'Edit Data Staff' : 'Tambah Staff Baru'}</Modal.Title>
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
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Nama Lengkap</Form.Label>
                            <Form.Control
                                type="text"
                                required
                                value={form.name}
                                onChange={e => setForm({ ...form, name: e.target.value })}
                                placeholder="Masukkan nama lengkap"
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Jabatan / Peran</Form.Label>
                            <Form.Control
                                type="text"
                                value={form.role}
                                onChange={e => setForm({ ...form, role: e.target.value })}
                                placeholder="Misal: Project Manager, Senior Analyst"
                            />
                        </Form.Group>
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Email</Form.Label>
                                    <Form.Control
                                        type="email"
                                        value={form.email}
                                        onChange={e => setForm({ ...form, email: e.target.value })}
                                        placeholder="email@perusahaan.com"
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>No. Telepon</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={form.phone}
                                        onChange={e => setForm({ ...form, phone: e.target.value })}
                                        placeholder="0812..."
                                    />
                                </Form.Group>
                            </Col>
                        </Row>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowModal(false)}>Batal</Button>
                        <Button variant="primary" type="submit">{isEdit ? 'Simpan Perubahan' : 'Tambah Staff'}</Button>
                    </Modal.Footer>
                </Form>
            </Modal>

            {/* Modal Choice Input Method */}
            <Modal show={showChoiceModal} onHide={() => setShowChoiceModal(false)} centered size="sm">
                <Modal.Header closeButton>
                    <Modal.Title className="h6">Pilih Metode Input</Modal.Title>
                </Modal.Header>
                <Modal.Body className="p-4 text-center">
                    <Button 
                        variant="outline-primary" 
                        size="lg" 
                        className="w-100 mb-3 d-flex flex-column align-items-center justify-content-center gap-2 p-3"
                        onClick={() => {
                            setShowChoiceModal(false);
                            handleAdd();
                        }}
                    >
                        <Edit2 size={24} />
                        Input Manual
                    </Button>
                    
                    <Button 
                        variant="soft-success" 
                        size="lg" 
                        className="w-100 d-flex flex-column align-items-center justify-content-center gap-2 p-3"
                        onClick={() => {
                            if (!filterTenant) {
                                alert('Pilih Perusahaan terlebih dahulu dari dropdown sebelum Import Bulk!');
                                return;
                            }
                            setShowChoiceModal(false);
                            setBulkFile(null);
                            setShowBulkModal(true);
                        }}
                    >
                        <DownloadCloud size={24} />
                        Import Bulk Staff
                    </Button>
                </Modal.Body>
            </Modal>
            
            {/* Modal Bulk Import */}
            <Modal show={showBulkModal} onHide={() => setShowBulkModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Import Bulk Staff</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p className="text-muted small mb-4">
                        Tambahkan banyak Staff sekaligus dengan mengunggah file Excel (.xlsx). Pastikan kolom sesuai dengan format: <b>Nama Lengkap, Jabatan, Email, No Telepon</b>.
                    </p>
                    
                    <div className="bg-light p-3 rounded-3 mb-3 border border-light-subtle">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                            <Form.Label className="mb-0 fw-bold text-primary">Template Excel</Form.Label>
                            <Button variant="link" size="sm" className="p-0 text-decoration-none d-flex align-items-center gap-1" onClick={downloadBulkTemplate}>
                                <DownloadCloud size={14} /> Download Template
                            </Button>
                        </div>
                        <Form.Text className="text-muted d-block mb-3">Unduh template, isi data staff, lalu unggah kembali di bawah.</Form.Text>
                        
                        <Form.Group>
                            <Form.Control 
                                type="file" 
                                accept=".xlsx, .xls" 
                                onChange={(e) => setBulkFile(e.target.files[0])}
                                disabled={isImportingBulk}
                            />
                        </Form.Group>
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowBulkModal(false)} disabled={isImportingBulk}>Batal</Button>
                    <Button variant="primary" onClick={handleBulkImport} disabled={!bulkFile || isImportingBulk}>
                        {isImportingBulk ? 'Memproses...' : 'Mulai Import'}
                    </Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );
};

export default PicDatabaseManagement;
