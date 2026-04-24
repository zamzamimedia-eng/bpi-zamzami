"use client"
import { Modal, Form, Button, Row, Col } from 'react-bootstrap';
import { useState, useEffect } from 'react';
import { Trash2 } from 'react-feather';

const NodeEditModal = ({ show, onHide, node, onSave, onDelete, actors = [], canEdit = true }) => {
    const [form, setForm] = useState({
        label: '',
        role: '',
        action: '',
        duration: 0,
        durationUnit: 'menit',
        question: '',
        cost: 0,
    });

    useEffect(() => {
        if (node) {
            setForm({
                label: node.data?.label || '',
                role: node.data?.role || '',
                action: node.data?.action || '',
                duration: node.data?.duration || 0,
                durationUnit: node.data?.durationUnit || 'menit',
                question: node.data?.question || '',
                cost: node.data?.cost || 0,
            });
        }
    }, [node]);

    const handleSave = () => {
        onSave(form);
    };

    if (!node) return null;

    const isDecision = node.type === 'decision';

    return (
        <Modal show={show} onHide={onHide} centered>
            <Modal.Header closeButton>
                <Modal.Title>
                    {isDecision ? '✏️ Detail Cabang Keputusan' : '✏️ Detail Langkah Proses'}
                </Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {!canEdit && (
                    <div className="alert alert-soft-warning border-warning-subtle py-2 small mb-3">
                        ⚠️ <strong>Mode Lihat Saja:</strong> Anda tidak memiliki akses untuk mengubah bagan ini karena bukan pembuat proyek.
                    </div>
                )}
                {isDecision ? (
                    <>
                        <Form.Group className="mb-3">
                            <Form.Label>Label</Form.Label>
                            <Form.Control 
                                type="text" 
                                value={form.label} 
                                onChange={e => setForm({ ...form, label: e.target.value })} 
                                disabled={!canEdit}
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Pertanyaan Keputusan</Form.Label>
                            <Form.Control 
                                type="text" 
                                placeholder="Misal: Dokumen Lengkap?" 
                                value={form.question} 
                                onChange={e => setForm({ ...form, question: e.target.value })} 
                                disabled={!canEdit}
                            />
                        </Form.Group>
                    </>
                ) : (
                    <>
                        <Form.Group className="mb-3">
                            <Form.Label>Staff / PIC <span className="text-danger">*</span></Form.Label>
                            <Form.Select 
                                value={form.role} 
                                onChange={e => setForm({ ...form, role: e.target.value })}
                                disabled={!canEdit}
                            >
                                <option value="">Pilih Staff dari Database</option>
                                {actors.map(actor => (
                                    <option key={actor.id} value={actor.name}>
                                        {actor.name} {actor.role ? `(${actor.role})` : ''}
                                    </option>
                                ))}
                                {/* Allow fallback to current value if it's not in the list (e.g. legacy data) */}
                                {form.role && !actors.some(a => a.name === form.role) && (
                                    <option value={form.role}>{form.role} (Legacy)</option>
                                )}
                            </Form.Select>
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Nama Proses / Aksi <span className="text-danger">*</span></Form.Label>
                            <Form.Control 
                                type="text" 
                                placeholder="Misal: Verifikasi Nota" 
                                value={form.action} 
                                onChange={e => setForm({ ...form, action: e.target.value })} 
                                disabled={!canEdit}
                            />
                        </Form.Group>
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Durasi <span className="text-danger">*</span></Form.Label>
                                    <Form.Control 
                                        type="number" 
                                        min={0} 
                                        value={form.duration} 
                                        onChange={e => setForm({ ...form, duration: parseInt(e.target.value) || 0 })} 
                                        disabled={!canEdit}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Satuan</Form.Label>
                                    <Form.Select 
                                        value={form.durationUnit} 
                                        onChange={e => setForm({ ...form, durationUnit: e.target.value })}
                                        disabled={!canEdit}
                                    >
                                        <option value="menit">Menit</option>
                                        <option value="jam">Jam</option>
                                        <option value="hari">Hari</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                        </Row>
                        <Form.Group className="mb-3">
                            <Form.Label>Biaya / Langkah (IDR)</Form.Label>
                            <Form.Control 
                                type="number" 
                                min={0} 
                                value={form.cost} 
                                onChange={e => setForm({ ...form, cost: parseInt(e.target.value) || 0 })} 
                                disabled={!canEdit}
                            />
                            <Form.Text className="text-muted">Masukkan estimasi biaya operasional untuk langkah ini.</Form.Text>
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Detail Diskripsi</Form.Label>
                            <Form.Control 
                                as="textarea" 
                                rows={3} 
                                value={form.label} 
                                onChange={e => setForm({ ...form, label: e.target.value })} 
                                disabled={!canEdit}
                            />
                        </Form.Group>
                    </>
                )}
            </Modal.Body>
            <Modal.Footer className="d-flex justify-content-between">
                <div>
                    {canEdit && (
                        <Button variant="outline-danger" size="sm" onClick={() => onDelete(node.id)} className="d-flex align-items-center gap-1">
                            <Trash2 size={14} /> Hapus Node
                        </Button>
                    )}
                </div>
                <div className="d-flex gap-2">
                    <Button variant="secondary" onClick={onHide}>{canEdit ? 'Batal' : 'Tutup'}</Button>
                    {canEdit && <Button variant="primary" onClick={handleSave}>Simpan</Button>}
                </div>
            </Modal.Footer>
        </Modal>
    );
};

export default NodeEditModal;
