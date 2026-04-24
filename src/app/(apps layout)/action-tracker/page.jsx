"use client"
import { useState, useEffect } from 'react';
import { Button, Card, Col, Container, Form, Modal, Row, Badge } from 'react-bootstrap';
import HkBadge from '@/components/@hk-badge/@hk-badge';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Plus, Calendar, User, AlertCircle } from 'react-feather';
import { useGlobalStateContext } from '@/context/GolobalStateProvider';
import WorkspaceSwitcher from '@/components/bpi/WorkspaceSwitcher';

const columnMeta = {
    todo: { title: '📋 To Do', color: '#6c757d', bg: 'rgba(108,117,125,0.1)', status: 'todo' },
    analyze: { title: '🔍 Analyze', color: '#17a2b8', bg: 'rgba(23,162,184,0.1)', status: 'analyze' },
    doing: { title: '🔄 Doing', color: '#ffc107', bg: 'rgba(255,193,7,0.1)', status: 'doing' },
    done: { title: '✅ Done', color: '#198754', bg: 'rgba(25,135,84,0.1)', status: 'done' },
};

// Helper for currency
const formatRupiah = (number) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0
    }).format(number || 0);
};

// Helper for date input
const formatDateForInput = (dateStr) => {
    if (!dateStr) return '';
    try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return '';
        return d.toISOString().split('T')[0];
    } catch (e) {
        return '';
    }
};

// Map projects status to colors for badges (consistent with ProcessMaps)
const statusColors = {
    draft: { bg: 'secondary', label: 'Draft' },
    analyzing: { bg: 'info', label: 'Analyzing' },
    planning: { bg: 'info', label: 'Planning' },
    executing: { bg: 'warning', label: 'Executing' },
    completed: { bg: 'success', label: 'Completed' },
};

// Helper for UI display (DD MMM YYYY)
const formatDateForUI = (dateStr) => {
    if (!dateStr) return '-';
    try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return dateStr;
        return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch (e) {
        return dateStr;
    }
};

const ActionTracker = () => {
    const { states } = useGlobalStateContext();
    const { activeTenantId } = states.tenantState;

    const [tasks, setTasks] = useState({ todo: [], analyze: [], doing: [], done: [] });
    const [divs, setDivs] = useState([]);
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editTask, setEditTask] = useState(null);
    const [editColumn, setEditColumn] = useState('todo');
    const [form, setForm] = useState({ title: '', description: '', pic: '', actor_id: '', deadline: '', project_id: '', division_id: '' });
    const [actors, setActors] = useState([]);
    const [showActorModal, setShowActorModal] = useState(false);
    const [actorForm, setActorForm] = useState({ name: '', role: '' });
    const [errors, setErrors] = useState({});

    const fetchDivs = async () => {
        if (!activeTenantId) return;
        try {
            const res = await fetch(`/api/divisions?tenant_id=${activeTenantId}`);
            const data = await res.json();
            if (res.ok) setDivs(data);
        } catch (error) {
            console.error('Fetch divisions error:', error);
        }
    };

    const fetchActors = async () => {
        if (!activeTenantId) return;
        try {
            const res = await fetch(`/api/actors?tenantId=${activeTenantId}`);
            const data = await res.json();
            if (res.ok) setActors(data);
        } catch (error) {
            console.error('Fetch actors error:', error);
        }
    };

    const fetchData = async () => {
        if (!activeTenantId) return;
        setLoading(true);
        try {
            // Fetch Projects (filtered by tenant)
            const res = await fetch(`/api/projects?tenantId=${activeTenantId}`);
            const data = await res.json();
            if (res.ok) {
                const grouped = { todo: [], analyze: [], doing: [], done: [] };
                data.forEach(project => {
                    const status = (project.status || 'draft').toLowerCase();
                    let group = 'todo';
                    if (status === 'analyzing' || status === 'planning') group = 'analyze';
                    if (status === 'executing') group = 'doing';
                    if (status === 'completed') group = 'done';
                    
                    grouped[group].push({ ...project, id: project.id.toString() });
                });
                setTasks(grouped);
            }
        } catch (error) {
            console.error('Fetch error:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        fetchDivs();
        fetchActors();
    }, [activeTenantId]);

    const onDragEnd = async (result) => {
        const { source, destination, draggableId } = result;
        if (!destination) return;
        if (source.droppableId === destination.droppableId && source.index === destination.index) return;

        // Visual update first
        const sourceCol = [...tasks[source.droppableId]];
        const destCol = source.droppableId === destination.droppableId ? sourceCol : [...tasks[destination.droppableId]];
        const [moved] = sourceCol.splice(source.index, 1);
        
        // Update task status local data
        moved.status = destination.droppableId;

        if (source.droppableId === destination.droppableId) {
            sourceCol.splice(destination.index, 0, moved);
            setTasks(prev => ({ ...prev, [source.droppableId]: sourceCol }));
        } else {
            destCol.splice(destination.index, 0, moved);
            setTasks(prev => ({
                ...prev,
                [source.droppableId]: sourceCol,
                [destination.droppableId]: destCol,
            }));

            // Sync with backend on status change
            try {
                let mappedStatus = 'draft';
                if (destination.droppableId === 'analyze') mappedStatus = 'analyzing';
                if (destination.droppableId === 'doing') mappedStatus = 'executing';
                if (destination.droppableId === 'done') mappedStatus = 'completed';

                const res = await fetch(`/api/projects/${draggableId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: mappedStatus })
                });

                if (!res.ok) {
                    throw new Error('Gagal update status di server');
                }
            } catch (error) {
                console.error('Sync error:', error);
                alert('Gagal memindahkan proyek. Sinkronisasi dengan server terputus.');
                fetchData(); // Revert on failure
            }
        }
    };

    const validateForm = () => {
        const newErrors = {};
        if (!form.title.trim()) newErrors.title = 'Nama proyek wajib diisi';
        if (!form.division_id) newErrors.division_id = 'Divisi wajib dipilih';
        if (!form.description.trim()) newErrors.description = 'Deskripsi wajib diisi';
        if (!form.actor_id && !form.pic.trim()) newErrors.pic = 'Penanggung jawab wajib diisi';
        if (!form.deadline) newErrors.deadline = 'Target selesai wajib diisi';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = async () => {
        if (!validateForm()) return;

        try {
            const method = editTask ? 'PUT' : 'POST';
            const url = editTask ? `/api/projects/${editTask.id}` : '/api/projects';
            const payload = { 
                ...form, 
                status: editTask ? editTask.status : (
                    editColumn === 'todo' ? 'draft' : (
                        editColumn === 'analyze' ? 'analyzing' : (
                            editColumn === 'doing' ? 'executing' : 'completed'
                        )
                    )
                ),
                tenant_id: activeTenantId
            };
            
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                fetchData();
                closeModal();
            } else {
                const err = await res.json();
                alert('Gagal menyimpan: ' + err.message);
            }
        } catch (error) {
            alert('Gagal menyimpan tugas');
        }
    };

    const handleSaveActor = async () => {
        if (!actorForm.name.trim()) return;
        try {
            const res = await fetch('/api/actors', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...actorForm, tenant_id: activeTenantId })
            });
            const data = await res.json();
            if (res.ok) {
                fetchActors();
                setForm(prev => ({ ...prev, actor_id: data.id, pic: data.name }));
                setShowActorModal(false);
                setActorForm({ name: '', role: '' });
            }
        } catch (error) {
            console.error('Save actor error:', error);
        }
    };

    const closeModal = () => {
        setShowModal(false);
        setEditTask(null);
        setForm({ 
            title: '', description: '', pic: 'Unassigned', actor_id: '', deadline: '', 
            actual_cost: 0, potential_saving_cost: 0, name: '', division_id: '' 
        });
        setErrors({});
    };

    const openAdd = (column) => {
        setEditTask(null);
        setEditColumn(column);
        setForm({ 
            title: '', description: '', pic: 'Unassigned', actor_id: '', deadline: '', 
            actual_cost: 0, potential_saving_cost: 0, name: '', division_id: '' 
        });
        setErrors({});
        setShowModal(true);
    };

    const openEdit = (project) => {
        setEditTask(project);
        setForm({ 
            title: project.name, 
            name: project.name,
            description: project.description || '', 
            pic: project.pic || 'Unassigned', 
            deadline: formatDateForInput(project.deadline),
            actual_cost: project.actual_cost || 0,
            potential_saving_cost: project.potential_saving_cost || 0,
            division_id: project.division_id || '',
            actor_id: project.actor_id || ''
        });
        setErrors({});
        setShowModal(true);
    };

    const handleDelete = async (projectId) => {
        if (confirm('Hapus proyek ini?')) {
            try {
                const res = await fetch(`/api/projects/${projectId}`, { method: 'DELETE' });
                if (res.ok) fetchData();
            } catch (error) {
                alert('Gagal menghapus proyek');
            }
        }
    };

    const isOverdue = (deadline) => {
        if (!deadline) return false;
        const d = new Date(deadline);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return d < today;
    };

    return (
        <Container fluid="xxl">
            <div className="hk-pg-header pt-7 pb-4">
                <div className="d-flex flex-wrap justify-content-between align-items-center">
                    <div>
                        <h1 className="pg-title">✅ Project Tracker</h1>
                        <p className="text-muted mb-0">Manajemen progres perbaikan proses bisnis</p>
                    </div>
                    <div className="d-flex align-items-center gap-3">
                        <div style={{ minWidth: '180px' }}>
                            <WorkspaceSwitcher />
                        </div>
                    </div>
                </div>
            </div>

            <div className="hk-pg-body">
                <style jsx global>{`
                    .task-column-scroll {
                        max-height: calc(100vh - 280px);
                        overflow-y: auto;
                        overflow-x: hidden;
                        padding-right: 8px;
                        margin-right: -8px;
                        scroll-behavior: smooth;
                    }
                    /* Custom Scrollbar */
                    .task-column-scroll::-webkit-scrollbar {
                        width: 6px;
                    }
                    .task-column-scroll::-webkit-scrollbar-track {
                        background: transparent;
                    }
                    .task-column-scroll::-webkit-scrollbar-thumb {
                        background: rgba(0,0,0,0.1);
                        border-radius: 10px;
                    }
                    .task-column-scroll::-webkit-scrollbar-thumb:hover {
                        background: rgba(0,0,0,0.2);
                    }
                `}</style>
                <DragDropContext onDragEnd={onDragEnd}>
                    <Row className="flex-nowrap overflow-auto pb-3 gx-3">
                        {Object.entries(columnMeta).map(([colId, meta]) => (
                            <Col xs={11} md={6} lg={4} key={colId} className="flex-shrink-0">
                                <div 
                                    className="p-3 rounded-4 d-flex flex-column" 
                                    style={{ 
                                        backgroundColor: meta.bg, 
                                        border: '1px solid rgba(0,0,0,0.05)',
                                        height: 'fit-content',
                                        maxHeight: 'calc(100vh - 230px)'
                                    }}
                                >
                                    <div className="d-flex justify-content-between align-items-center mb-3 flex-shrink-0">
                                        <h6 className="mb-0 fw-bold d-flex align-items-center">
                                            {meta.title}
                                            <Badge bg="white" text="dark" className="ms-2 rounded-pill shadow-sm border small">
                                                {tasks[colId].length}
                                            </Badge>
                                        </h6>
                                    </div>

                                    <div className="task-column-scroll">
                                        <Droppable droppableId={colId}>
                                            {(provided, snapshot) => (
                                                <div
                                                    ref={provided.innerRef}
                                                    {...provided.droppableProps}
                                                    style={{
                                                        minHeight: '100px',
                                                        borderRadius: '8px',
                                                        transition: 'background-color 0.2s',
                                                        backgroundColor: snapshot.isDraggingOver ? 'rgba(0,0,0,0.02)' : 'transparent',
                                                    }}
                                                >
                                                    {tasks[colId].map((task, index) => (
                                                        <Draggable key={task.id} draggableId={task.id} index={index}>
                                                            {(prov, snap) => (
                                                                <div
                                                                    ref={prov.innerRef}
                                                                    {...prov.draggableProps}
                                                                    {...prov.dragHandleProps}
                                                                    className="mb-3"
                                                                    style={{
                                                                        ...prov.draggableProps.style,
                                                                        cursor: 'grab',
                                                                        opacity: snap.isDragging ? 0.8 : 1,
                                                                    }}
                                                                >
                                                                    <Card
                                                                        className={`shadow-sm border-0 h-100 ${snap.isDragging ? 'shadow-lg' : ''}`}
                                                                        style={{
                                                                            borderLeft: `5px solid var(--bs-${statusColors[task.status || 'draft']?.bg || 'secondary'})`,
                                                                            borderRadius: '12px',
                                                                            transition: 'transform 0.2s, box-shadow 0.2s',
                                                                        }}
                                                                        onClick={() => openEdit(task)}
                                                                    >
                                                                        <Card.Body className="p-3">
                                                                            <div className="d-flex justify-content-between align-items-start mb-2">
                                                                                <Badge bg={statusColors[task.status || 'draft']?.bg || 'secondary'} className="px-2 py-1 small">
                                                                                    {statusColors[task.status || 'draft']?.label || 'Project'}
                                                                                </Badge>
                                                                                <div className="text-muted small">
                                                                                    #{task.id}
                                                                                </div>
                                                                            </div>
                                                                            <h6 className="mb-1 fw-bold lh-base">{task.name || task.title}</h6>
                                                                            {task.division_name && (
                                                                                <div className="mb-2">
                                                                                    <span className="badge bg-soft-info text-info border border-info border-opacity-25 px-2 py-1 small fw-bold">
                                                                                        🏗️ {task.division_name}
                                                                                    </span>
                                                                                </div>
                                                                            )}
                                                                            {task.description && (
                                                                                <p className="text-muted small mb-3" style={{ 
                                                                                    display: '-webkit-box',
                                                                                    WebkitLineClamp: 2,
                                                                                    WebkitBoxOrient: 'vertical',
                                                                                    overflow: 'hidden',
                                                                                    lineHeight: '1.4'
                                                                                }}>
                                                                                    {task.description}
                                                                                </p>
                                                                            )}

                                                                            <div className="d-flex justify-content-between align-items-center small text-muted mb-3">
                                                                                <span>📋 {task.total_steps || 0} langkah</span>
                                                                                {task.bottlenecks > 0 && (
                                                                                    <span className="text-danger">⚠️ {task.bottlenecks} bottleneck</span>
                                                                                )}
                                                                            </div>

                                                                            {task.potential_saving_time > 0 && (
                                                                                <div className="text-success small mb-2 fw-medium">
                                                                                    ⏱️ +{task.potential_saving_time}% efisiensi
                                                                                </div>
                                                                            )}

                                                                            <div className="bg-light rounded p-2 mb-3 border">
                                                                                <div className="d-flex justify-content-between align-items-center small mb-1">
                                                                                    <span className="text-muted">Biaya Aktual:</span>
                                                                                    <span className="fw-bold">{formatRupiah(task.actual_cost)}</span>
                                                                                </div>
                                                                                <div className="d-flex justify-content-between align-items-center small">
                                                                                    <span className="text-muted">Potensi Hemat:</span>
                                                                                    <span className="text-success fw-bold">{formatRupiah(task.potential_saving_cost)}</span>
                                                                                </div>
                                                                            </div>

                                                                            <div className="d-flex justify-content-end align-items-center small pt-2 border-top">
                                                                                <span className={`d-flex align-items-center gap-1 ${isOverdue(task.deadline) ? 'text-danger fw-bold' : 'text-muted'}`} title="Target Selesai">
                                                                                    <Calendar size={12} strokeWidth={2.5} /> {formatDateForUI(task.deadline)}
                                                                                </span>
                                                                            </div>
                                                                        </Card.Body>
                                                                    </Card>
                                                                </div>
                                                            )}
                                                        </Draggable>
                                                    ))}
                                                    {provided.placeholder}
                                                </div>
                                            )}
                                        </Droppable>
                                    </div>
                                </div>
                            </Col>
                        ))}
                    </Row>
                </DragDropContext>
            </div>

            {/* Project Modal */}
            <Modal show={showModal} onHide={closeModal} centered>
                <Modal.Header closeButton>
                    <Modal.Title>{editTask ? 'Edit Proyek' : 'Proyek Baru'}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form.Group className="mb-3">
                        <Form.Label>Nama Proyek <span className="text-danger">*</span></Form.Label>
                        <Form.Control
                            type="text"
                            placeholder="Misal: Digitalisasi Procurement"
                            value={form.title}
                            onChange={e => setForm({ ...form, title: e.target.value, name: e.target.value })}
                            isInvalid={!!errors.title}
                        />
                        <Form.Control.Feedback type="invalid">{errors.title}</Form.Control.Feedback>
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Divisi <span className="text-danger">*</span></Form.Label>
                        <Form.Select 
                            value={form.division_id} 
                            onChange={e => setForm({ ...form, division_id: e.target.value })}
                            isInvalid={!!errors.division_id}
                        >
                            <option value="">Pilih Divisi</option>
                            {divs.map(d => (
                                <option key={d.id} value={d.id}>{d.name}</option>
                            ))}
                        </Form.Select>
                        <Form.Control.Feedback type="invalid">{errors.division_id}</Form.Control.Feedback>
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Deskripsi <span className="text-danger">*</span></Form.Label>
                        <Form.Control 
                            as="textarea" 
                            rows={2} 
                            placeholder="Jelaskan tujuan perbaikan proses..." 
                            value={form.description} 
                            onChange={e => setForm({ ...form, description: e.target.value })} 
                            isInvalid={!!errors.description}
                        />
                        <Form.Control.Feedback type="invalid">{errors.description}</Form.Control.Feedback>
                    </Form.Group>
                    <Row>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Manager (PIC) <span className="text-danger">*</span></Form.Label>
                                <div className="d-flex gap-2">
                                    <Form.Select 
                                        value={form.actor_id} 
                                        onChange={e => {
                                            const selectedActor = actors.find(a => a.id == e.target.value);
                                            setForm({ ...form, actor_id: e.target.value, pic: selectedActor ? selectedActor.name : '' });
                                        }}
                                        isInvalid={!!errors.pic}
                                        className="flex-grow-1"
                                    >
                                        <option value="">Pilih PIC</option>
                                        {actors.map(a => (
                                            <option key={a.id} value={a.id}>{a.name}</option>
                                        ))}
                                    </Form.Select>
                                    <Button variant="soft-primary" className="btn-icon btn-sm h-100" onClick={() => setShowActorModal(true)}>
                                        <Plus size={18} />
                                    </Button>
                                </div>
                                {form.pic && !form.actor_id && <Form.Text className="text-primary fw-bold small">Legacy: {form.pic}</Form.Text>}
                                <Form.Control.Feedback type="invalid" style={{display: errors.pic ? 'block' : 'none'}}>{errors.pic}</Form.Control.Feedback>
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Target Selesai <span className="text-danger">*</span></Form.Label>
                                <Form.Control
                                    type="date"
                                    value={form.deadline}
                                    onChange={e => setForm({ ...form, deadline: e.target.value })}
                                    isInvalid={!!errors.deadline}
                                />
                                <Form.Control.Feedback type="invalid">{errors.deadline}</Form.Control.Feedback>
                            </Form.Group>
                        </Col>
                    </Row>
                    <Row>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Biaya Aktual (IDR)</Form.Label>
                                <Form.Control type="number" value={form.actual_cost} onChange={e => setForm({ ...form, actual_cost: e.target.value })} />
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Potensi Hemat (IDR)</Form.Label>
                                <Form.Control type="number" value={form.potential_saving_cost} onChange={e => setForm({ ...form, potential_saving_cost: e.target.value })} />
                            </Form.Group>
                        </Col>
                    </Row>
                </Modal.Body>
                <Modal.Footer className="d-flex justify-content-between">
                    {editTask && (
                        <Button variant="outline-danger" size="sm" onClick={() => { handleDelete(editTask.id); closeModal(); }}>
                            Hapus
                        </Button>
                    )}
                    <div className="d-flex gap-2 ms-auto">
                        <Button variant="secondary" onClick={closeModal}>Batal</Button>
                        <Button variant="primary" onClick={handleSave}>Simpan</Button>
                    </div>
                </Modal.Footer>
            </Modal>

            {/* Quick Add Actor Modal */}
            <Modal show={showActorModal} onHide={() => setShowActorModal(false)} size="sm" centered>
                <Modal.Header closeButton>
                    <Modal.Title className="h6">Tambah PIC Baru</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form.Group className="mb-3">
                        <Form.Label className="small fw-bold">Nama Lengkap</Form.Label>
                        <Form.Control 
                            size="sm"
                            type="text" 
                            value={actorForm.name} 
                            onChange={e => setActorForm({ ...actorForm, name: e.target.value })} 
                            placeholder="Misal: Budi Santoso"
                        />
                    </Form.Group>
                    <Form.Group className="mb-2">
                        <Form.Label className="small fw-bold">Jabatan (Opsional)</Form.Label>
                        <Form.Control 
                            size="sm"
                            type="text" 
                            value={actorForm.role} 
                            onChange={e => setActorForm({ ...actorForm, role: e.target.value })} 
                            placeholder="Misal: Project Manager"
                        />
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer className="py-2">
                    <Button variant="secondary" size="sm" onClick={() => setShowActorModal(false)}>Batal</Button>
                    <Button variant="primary" size="sm" onClick={handleSaveActor} disabled={!actorForm.name.trim()}>
                        Simpan PIC
                    </Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );
};

export default ActionTracker;
