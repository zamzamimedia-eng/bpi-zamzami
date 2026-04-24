"use client"
import { Badge, Button, Card, Col, Container, Form, Modal, Row } from 'react-bootstrap';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Map, ArrowRight, Trash2, Edit2, Activity, AlertTriangle, TrendingUp, DollarSign, Layers } from 'react-feather';
import { motion, AnimatePresence } from 'framer-motion';
import * as XLSX from 'xlsx';
import { DownloadCloud } from 'react-feather';
import { useGlobalStateContext } from '@/context/GolobalStateProvider';
import WorkspaceSwitcher from '@/components/bpi/WorkspaceSwitcher';

const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).replace(/\./g, ':');
};

const formatRupiah = (number) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0
    }).format(number || 0);
};

const formatTime = (mins) => {
    if (mins >= 480) return `${(mins / 480).toFixed(1)} hari`;
    if (mins >= 60) return `${(mins / 60).toFixed(1)} jam`;
    return `${Math.round(mins)} mnt`;
};

const getProjectAge = (dateString) => {
    if (!dateString) return '-';
    const diff = new Date() - new Date(dateString);
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Hari ini';
    if (days < 30) return `${days} hari`;
    const months = Math.floor(days / 30);
    return `${months} bln`;
};

const statusColors = {
    draft: { bg: 'secondary', label: 'Draft' },
    analyzing: { bg: 'primary', label: 'Analyzing' },
    completed: { bg: 'success', label: 'Completed' },
};

// Animation Variants
const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
};

const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
        y: 0,
        opacity: 1,
        transition: {
            duration: 0.5,
            ease: "easeOut"
        }
    }
};

const cardHover = {
    scale: 1.02,
    y: -5,
    boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
    transition: {
        duration: 0.2,
        ease: "easeInOut"
    }
};

const ProcessMaps = () => {
    const router = useRouter();
    const { states } = useGlobalStateContext();
    const { activeTenantId } = states.tenantState;
    
    const [projects, setProjects] = useState([]);
    const [divs, setDivs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [showChoiceModal, setShowChoiceModal] = useState(false);
    const [showBulkModal, setShowBulkModal] = useState(false);
    const [bulkFile, setBulkFile] = useState(null);
    const [isImportingBulk, setIsImportingBulk] = useState(false);
    const [editingProject, setEditingProject] = useState(null);
    const [form, setForm] = useState({ 
        name: '', 
        description: '', 
        tenant_id: activeTenantId,
        division_id: '',
        pic: '',
        actor_id: ''
    });
    const [excelFile, setExcelFile] = useState(null);
    const [actors, setActors] = useState([]);
    const [showActorModal, setShowActorModal] = useState(false);
    const [actorForm, setActorForm] = useState({ name: '', role: '' });
    const [errors, setErrors] = useState({});

    const resetForm = () => {
        setForm({ name: '', description: '', tenant_id: activeTenantId, division_id: '', pic: '', actor_id: '' });
        setErrors({});
        setExcelFile(null);
    };

    const fetchCurrentUser = async () => {
        try {
            const res = await fetch('/api/auth/me');
            if (res.ok) {
                const data = await res.json();
                setCurrentUser(data);
            }
        } catch (error) {
            console.error('Fetch current user error:', error);
        }
    };

    const fetchDivs = async () => {
        if (!activeTenantId) return;
        try {
            const res = await fetch(`/api/divisions?tenant_id=${activeTenantId}`);
            if (res.ok) {
                const data = await res.json();
                setDivs(data);
            }
        } catch (error) {
            console.error('Fetch divisions error:', error);
        }
    };

    const fetchActors = async () => {
        if (!activeTenantId) return;
        try {
            const res = await fetch(`/api/actors?tenantId=${activeTenantId}`);
            if (res.ok) {
                const data = await res.json();
                setActors(data);
            }
        } catch (error) {
            console.error('Fetch actors error:', error);
        }
    };

    const fetchProjects = async () => {
        if (!activeTenantId) return;
        setLoading(true);
        try {
            const res = await fetch(`/api/projects?tenantId=${activeTenantId}`);
            const data = await res.json();
            if (res.ok) {
                setProjects(data);
            } else {
                console.error(`Fetch projects failed (${res.status}):`, data.message);
            }
        } catch (error) {
            console.error('Fetch error:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCurrentUser();
    }, []);

    useEffect(() => {
        // If we have a currentUser but global activeTenantId is still default/missing,
        // we might need to wait for TopNav/Switcher to sync.
        // But the effect will re-run when activeTenantId changes.
        fetchProjects();
        fetchDivs();
        fetchActors();
        setForm(prev => ({ ...prev, tenant_id: activeTenantId }));
    }, [activeTenantId, currentUser?.id]);

    // Helper to check if project can be edited by current user
    const canEditProject = (project) => {
        if (!currentUser) return false;
        if (currentUser.role === 'admin') return true;
        if (!project.created_by) return true; // Legacy projects can be edited by anyone
        return project.created_by === currentUser.id;
    };

    const totalBottlenecks = projects.reduce((sum, p) => sum + (Number(p.bottlenecks) || 0), 0);
    const totalSavings = projects.reduce((sum, p) => sum + (Number(p.potential_saving_cost) || 0), 0);
    const avgEfficiency = projects.length > 0 
        ? Math.round(projects.reduce((sum, p) => sum + (Number(p.potential_saving_time) || 0), 0) / projects.length) 
        : 0;
    
    const healthScore = projects.length > 0
        ? Math.round(projects.reduce((sum, p) => {
            const steps = Number(p.total_steps) || 0;
            const bots = Number(p.bottlenecks) || 0;
            if (steps === 0) return sum + 100;
            const score = Math.max(0, 100 - (bots / steps * 200));
            return sum + score;
        }, 0) / projects.length)
        : 100;

    const handleSave = async () => {
        const newErrors = {};
        if (!form.name.trim()) newErrors.name = 'Nama proyek wajib diisi';
        if (!form.division_id) newErrors.division_id = 'Divisi wajib dipilih';
        if (!form.description.trim()) newErrors.description = 'Deskripsi wajib diisi';
        if (!form.actor_id && !form.pic.trim()) newErrors.pic = 'PIC wajib diisi';

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }
        
        try {
            const method = editingProject ? 'PUT' : 'POST';
            const url = editingProject ? `/api/projects/${editingProject.id}` : '/api/projects';
            
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form)
            });

            if (res.ok) {
                const projectData = await res.json();
                
                // If it's a new project and an Excel file is provided, generate canvas
                if (!editingProject && excelFile) {
                    try {
                        await handleExcelProcessing(projectData.id, excelFile);
                    } catch (exErr) {
                        console.error("Excel generation failed:", exErr);
                    }
                }

                fetchProjects();
                setShowModal(false);
                resetForm();
                setEditingProject(null);
            } else {
                const errorData = await res.json().catch(() => ({ message: 'Gagal mengambil error response' }));
                alert(`Gagal menyimpan proyek: ${errorData.message || res.statusText}\n${errorData.error ? JSON.stringify(errorData.error) : ''}`);
            }
        } catch (error) {
            console.error('Save Project Catch Error:', error);
            alert(`Terjadi kesalahan jaringan atau server: ${error.message}`);
        }
    };

    const handleExcelProcessing = (projectId, file) => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });
                    const sheetName = workbook.SheetNames[0];
                    const sheet = workbook.Sheets[sheetName];
                    const rows = XLSX.utils.sheet_to_json(sheet);
                    
                    const nodes = [];
                    const edges = [];
                    let xPos = 100;
                    const yPos = 200;

                    rows.forEach((row, index) => {
                        const stepStr = row['Langkah'] || row['Aktivitas'] || row['Nama Langkah'] || `Langkah ${index + 1}`;
                        const roleStr = row['Peran'] || row['Aktor'] || row['PIC'] || 'Aktor';
                        const durationNum = parseFloat(row['Durasi'] || row['Waktu']) || 1;
                        const costNum = parseFloat(row['Biaya'] || row['Cost']) || 0;
                        
                        const nodeId = `node_${Date.now()}_${index}`;
                        
                        nodes.push({
                            id: nodeId,
                            type: 'process',
                            position: { x: xPos, y: yPos },
                            data: {
                                action: stepStr,
                                role: roleStr,
                                duration: durationNum,
                                durationUnit: 'menit',
                                cost: costNum,
                            }
                        });
                        
                        if (index > 0) {
                            const prevNodeId = nodes[index - 1].id;
                            edges.push({
                                id: `e-${prevNodeId}-${nodeId}`,
                                source: prevNodeId,
                                sourceHandle: `${prevNodeId}-source-right`,
                                target: nodeId,
                                targetHandle: `${nodeId}-target-left`,
                                type: 'insertable',
                                markerEnd: { type: 'arrowclosed', color: '#6c757d' },
                                style: { stroke: '#6c757d', strokeWidth: 2 }
                            });
                        }
                        
                        xPos += 300;
                    });
                    
                    const canvasData = { nodes, edges, rootCauseData: {} };
                    
                    await fetch(`/api/process-maps/${projectId}`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ canvas_json: JSON.stringify(canvasData) })
                    });
                    
                    resolve();
                } catch (error) {
                    console.error('Error processing Excel:', error);
                    resolve(); // Still resolve so main flow finishes
                }
            };
            reader.readAsArrayBuffer(file);
        });
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

    const handleDelete = async (id) => {
        if (confirm('Yakin ingin menghapus proyek ini?')) {
            try {
                const res = await fetch(`/api/projects/${id}`, { method: 'DELETE' });
                if (res.ok) fetchProjects();
            } catch (error) {
                alert('Gagal menghapus proyek');
            }
        }
    };

    const openEdit = (project) => {
        setEditingProject(project);
        setForm({ 
            name: project.name, 
            description: project.description,
            tenant_id: project.tenant_id,
            division_id: project.division_id || '',
            pic: project.pic || '',
            actor_id: project.actor_id || ''
        });
        setErrors({});
        setExcelFile(null);
        setShowModal(true);
    };

    const downloadBulkTemplate = () => {
        const worksheetData = [
            {
                'Nama Proyek': 'Proyek Perbaikan HR',
                'Divisi': 'Human Resources',
                'PIC': 'Budi Santoso',
                'Deskripsi': 'Optimalisasi proses rekrutmen karyawan baru.'
            },
            {
                'Nama Proyek': 'Otomatisasi Laporan Keuangan',
                'Divisi': 'Finance',
                'PIC': 'Siti Aminah',
                'Deskripsi': 'Membuat laporan bulanan lebih efisien.'
            }
        ];
        
        const worksheet = XLSX.utils.json_to_sheet(worksheetData);
        worksheet['!cols'] = [{ wch: 30 }, { wch: 20 }, { wch: 20 }, { wch: 50 }];
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Template Bulk Proyek");
        XLSX.writeFile(workbook, "Template_Import_Bulk_Proyek.xlsx");
    };

    const handleBulkImport = async () => {
        if (!bulkFile) {
            alert('Pilih file Excel terlebih dahulu!');
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
                    const name = row['Nama Proyek'];
                    if (!name) continue; // Skip if no name
                    
                    const divName = (row['Divisi'] || '').toString().toLowerCase().trim();
                    const picName = (row['PIC'] || '').toString().trim();
                    const desc = (row['Deskripsi'] || '').toString().trim();
                    
                    // Match division
                    let matchedDivId = null;
                    if (divName) {
                        const matched = divs.find(d => d.name.toLowerCase().trim() === divName);
                        if (matched) matchedDivId = matched.id;
                    }

                    // Match actor
                    let matchedActorId = null;
                    if (picName) {
                        const matchedActor = actors.find(a => a.name.toLowerCase().trim() === picName.toLowerCase());
                        if (matchedActor) matchedActorId = matchedActor.id;
                    }
                    
                    const payload = {
                        name: name,
                        description: desc || 'Imported from Excel',
                        tenant_id: activeTenantId,
                        division_id: matchedDivId || (divs.length > 0 ? divs[0].id : null),
                        pic: picName || 'Unassigned',
                        actor_id: matchedActorId,
                        status: 'draft'
                    };
                    
                    const res = await fetch('/api/projects', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    });
                    
                    if (res.ok) {
                        successCount++;
                    }
                }
                
                alert(`Berhasil mengimpor ${successCount} proyek.`);
                setBulkFile(null);
                setShowBulkModal(false);
                fetchProjects();
            } catch (error) {
                console.error('Bulk import error:', error);
                alert('Terjadi kesalahan saat memproses file Excel.');
            } finally {
                setIsImportingBulk(false);
            }
        };
        reader.readAsArrayBuffer(bulkFile);
    };

    const downloadExcelTemplate = () => {
        const worksheetData = [
            {
                'Langkah': 'Terima Dokumen',
                'Peran': 'Admin Staff',
                'Durasi': 10,
                'Biaya': 0
            },
            {
                'Langkah': 'Verifikasi Kelengkapan',
                'Peran': 'Supervisor',
                'Durasi': 15,
                'Biaya': 50000
            },
            {
                'Langkah': 'Input ke Sistem',
                'Peran': 'Admin Staff',
                'Durasi': 20,
                'Biaya': 0
            }
        ];
        
        const worksheet = XLSX.utils.json_to_sheet(worksheetData);
        
        // Add styling logic / column widths if needed
        worksheet['!cols'] = [
            { wch: 30 }, // Langkah
            { wch: 20 }, // Peran
            { wch: 10 }, // Durasi
            { wch: 15 }  // Biaya
        ];

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Template Peta Proses");
        
        XLSX.writeFile(workbook, "Template_Import_Proses_Linear.xlsx");
    };

    return (
        <Container fluid="xxl">
            <motion.div 
                className="hk-pg-header pt-7 pb-4"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
            >
                <div className="d-flex flex-wrap justify-content-between align-items-center">
                    <div className="mb-lg-0 mb-2">
                        <h1 className="pg-title">🗺️ Peta Proses</h1>
                        <p className="text-muted mb-0">Kelola proyek Business Process Improvement Anda</p>
                    </div>
                    <div className="d-flex align-items-center gap-3">
                        {/* Moved Workspace Switcher (Tenant Selector) here */}
                        <div style={{ minWidth: '180px' }}>
                            <WorkspaceSwitcher />
                        </div>
                        <Button variant="primary" className="d-flex align-items-center gap-2" onClick={() => setShowChoiceModal(true)}>
                            <Plus size={16} />
                            Proyek Baru
                        </Button>
                    </div>
                </div>
            </motion.div>

            <div className="hk-pg-body">
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                >
                    <Row className="mb-5">
                        <Col lg={3} sm={6} className="mb-3 mb-lg-0">
                            <motion.div variants={itemVariants}>
                                <Card as={motion.div} whileHover={cardHover} className="card-border shadow-sm border-start-4 border-primary h-100 cursor-pointer">
                                    <Card.Body className="d-flex align-items-center p-3">
                                        <div className="avatar avatar-sm avatar-soft-primary avatar-rounded me-3">
                                            <span className="initial-wrap"><Activity size={20} /></span>
                                        </div>
                                        <div>
                                            <span className="d-block text-muted small fw-medium">Skor Kesehatan</span>
                                            <h4 className="mb-0">{healthScore}%</h4>
                                        </div>
                                    </Card.Body>
                                </Card>
                            </motion.div>
                        </Col>
                        <Col lg={3} sm={6} className="mb-3 mb-lg-0">
                            <motion.div variants={itemVariants}>
                                <Card as={motion.div} whileHover={cardHover} className="card-border shadow-sm border-start-4 border-danger h-100 cursor-pointer">
                                    <Card.Body className="d-flex align-items-center p-3">
                                        <div className="avatar avatar-sm avatar-soft-danger avatar-rounded me-3">
                                            <span className="initial-wrap"><AlertTriangle size={20} /></span>
                                        </div>
                                        <div>
                                            <span className="d-block text-muted small fw-medium">Total Bottleneck</span>
                                            <h4 className="mb-0">{totalBottlenecks}</h4>
                                        </div>
                                    </Card.Body>
                                </Card>
                            </motion.div>
                        </Col>
                        <Col lg={3} sm={6} className="mb-3 mb-sm-0">
                            <motion.div variants={itemVariants}>
                                <Card as={motion.div} whileHover={cardHover} className="card-border shadow-sm border-start-4 border-success h-100 cursor-pointer">
                                    <Card.Body className="d-flex align-items-center p-3">
                                        <div className="avatar avatar-sm avatar-soft-success avatar-rounded me-3">
                                            <span className="initial-wrap"><TrendingUp size={20} /></span>
                                        </div>
                                        <div>
                                            <span className="d-block text-muted small fw-medium">Rata-rata Efisiensi</span>
                                            <h4 className="mb-0">+{avgEfficiency}%</h4>
                                        </div>
                                    </Card.Body>
                                </Card>
                            </motion.div>
                        </Col>
                        <Col lg={3} sm={6}>
                            <motion.div variants={itemVariants}>
                                <Card as={motion.div} whileHover={cardHover} className="card-border shadow-sm border-start-4 border-info h-100 cursor-pointer">
                                    <Card.Body className="d-flex align-items-center p-3">
                                        <div className="avatar avatar-sm avatar-soft-info avatar-rounded me-3">
                                            <span className="initial-wrap"><DollarSign size={20} /></span>
                                        </div>
                                        <div>
                                            <span className="d-block text-muted small fw-medium">Total Hemat Biaya</span>
                                            <h4 className="mb-0 text-truncate" style={{maxWidth: '120px'}} title={formatRupiah(totalSavings)}>{formatRupiah(totalSavings)}</h4>
                                        </div>
                                    </Card.Body>
                                </Card>
                            </motion.div>
                        </Col>
                    </Row>
                </motion.div>

                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                >
                    <Row>
                        <AnimatePresence mode="popLayout">
                            {projects.map((project, index) => (
                                <Col xl={4} md={6} key={project.id} className="mb-4">
                                    <motion.div 
                                        variants={itemVariants}
                                        layout
                                        initial="hidden"
                                        animate="visible"
                                        exit={{ opacity: 0, scale: 0.9 }}
                                    >
                                        <Card as={motion.div} whileHover={cardHover} className="h-100 card-border border-start-4" style={{ borderLeftColor: `var(--bs-${statusColors[project.status].bg})` }}>
                                            <Card.Body>
                                                <div className="d-flex justify-content-between align-items-start mb-2">
                                                    <Badge bg={statusColors[project.status].bg} className="px-2 py-1">
                                                        {statusColors[project.status].label}
                                                    </Badge>
                                                    {canEditProject(project) && (
                                                        <div className="d-flex gap-1">
                                                            <button className="btn btn-flush text-muted" onClick={() => openEdit(project)}>
                                                                <Edit2 size={14} />
                                                            </button>
                                                            <button className="btn btn-flush text-danger" onClick={() => handleDelete(project.id)}>
                                                                <Trash2 size={14} />
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                                <h6 className="mb-1 fw-bold">{project.name}</h6>
                                                {project.division_name && (
                                                    <Badge bg="soft-info" className="text-info mb-2 small d-inline-flex align-items-center gap-1 fw-bold">
                                                        <Layers size={10} /> {project.division_name}
                                                    </Badge>
                                                )}
                                                <p className="text-muted small mb-3">{project.description}</p>
                                                <div className="d-flex justify-content-between align-items-center small text-muted mb-2">
                                                    <span>📋 {project.total_steps} langkah</span>
                                                    {project.bottlenecks > 0 && (
                                                        <span className="text-danger fw-bold">⚠️ {project.bottlenecks} bottleneck</span>
                                                    )}
                                                </div>
                                                
                                                <div className="d-flex justify-content-between align-items-center small text-muted mb-3">
                                                    <span title="Waktu sebelum perbaikan">⌛ Waktu Lama: <b>{formatTime(project.as_is_time)}</b></span>
                                                    <span className="text-primary">⏳ Usia: <b>{getProjectAge(project.created_at)}</b></span>
                                                </div>

                                                {project.potential_saving_time > 0 && (
                                                    <div className="d-flex gap-3 small mb-2 h6 mb-0 text-success fw-bold">
                                                        <span>🚀 +{project.potential_saving_time}% lebih efisien</span>
                                                    </div>
                                                )}

                                                <div className="bg-light rounded p-2 mb-3 border border-light-subtle shadow-xs">
                                                    <div className="d-flex justify-content-between align-items-center small mb-1">
                                                        <span className="text-muted">Biaya Aktual:</span>
                                                        <span className="fw-bold">{formatRupiah(project.actual_cost)}</span>
                                                    </div>
                                                    <div className="d-flex justify-content-between align-items-center small">
                                                        <span className="text-muted">Potensi Hemat:</span>
                                                        <span className="text-success fw-bold">{formatRupiah(project.potential_saving_cost)}</span>
                                                    </div>
                                                </div>
                                                <div className="d-flex justify-content-between align-items-center">
                                                    <div className="d-flex flex-column">
                                                        <small className="text-muted" style={{ fontSize: '10px', lineHeight: '1.2' }}>Dibuat: {formatDate(project.created_at)}</small>
                                                        <small className="text-primary fw-medium" style={{ fontSize: '11px', lineHeight: '1.2' }}>Update: {formatDate(project.updated_at || project.created_at)}</small>
                                                    </div>
                                                    <Button variant="outline-primary" size="sm" className="d-flex align-items-center gap-1" onClick={() => router.push(`/canvas/${project.id}`)}>
                                                        <Map size={14} />
                                                        Buka Kanvas
                                                        <ArrowRight size={14} />
                                                    </Button>
                                                </div>
                                            </Card.Body>
                                        </Card>
                                    </motion.div>
                                </Col>
                            ))}
                        </AnimatePresence>
                    </Row>
                </motion.div>
            </div>

            {/* Modal Create/Edit */}
            <Modal show={showModal} onHide={() => setShowModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>{editingProject ? 'Edit Proyek' : 'Buat Proyek Baru'}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form.Group className="mb-3">
                        <Form.Label>Nama Proyek <span className="text-danger">*</span></Form.Label>
                        <Form.Control 
                            type="text" 
                            placeholder="Misal: Perbaikan Alur Reimbursement" 
                            value={form.name} 
                            onChange={e => setForm({ ...form, name: e.target.value })} 
                            isInvalid={!!errors.name}
                        />
                        <Form.Control.Feedback type="invalid">{errors.name}</Form.Control.Feedback>
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
                        <Form.Label>Manager / PIC <span className="text-danger">*</span></Form.Label>
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
                                <option value="">Pilih dari Staff</option>
                                {actors.map(a => (
                                    <option key={a.id} value={a.id}>{a.name} {a.role ? `(${a.role})` : ''}</option>
                                ))}
                            </Form.Select>
                            <Button variant="soft-primary" className="btn-icon btn-sm h-100" onClick={() => setShowActorModal(true)} title="Tambah Staff Baru">
                                <Plus size={18} />
                            </Button>
                        </div>
                        {form.pic && !form.actor_id && <Form.Text className="text-primary fw-bold">Legacy Staff: {form.pic}</Form.Text>}
                        <Form.Control.Feedback type="invalid" style={{display: errors.pic ? 'block' : 'none'}}>{errors.pic}</Form.Control.Feedback>
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Deskripsi <span className="text-danger">*</span></Form.Label>
                        <Form.Control 
                            as="textarea" 
                            rows={3} 
                            placeholder="Jelaskan tujuan perbaikan proses..." 
                            value={form.description} 
                            onChange={e => setForm({ ...form, description: e.target.value })} 
                            isInvalid={!!errors.description}
                        />
                        <Form.Control.Feedback type="invalid">{errors.description}</Form.Control.Feedback>
                    </Form.Group>
                    {!editingProject && (
                        <div className="bg-light p-3 rounded-3 mt-4 border border-light-subtle">
                            <Form.Group>
                                <div className="d-flex justify-content-between align-items-center mb-2">
                                    <Form.Label className="mb-0 fw-bold text-primary">Import Diagram dari Excel <Badge bg="soft-primary" className="text-primary ms-1">Opsional</Badge></Form.Label>
                                    <Button variant="link" size="sm" className="p-0 text-decoration-none d-flex align-items-center gap-1" onClick={downloadExcelTemplate}>
                                        <DownloadCloud size={14} /> Template
                                    </Button>
                                </div>
                                <Form.Text className="text-muted d-block mb-2">Unggah file .xlsx untuk otomatis membuat diagram berurutan.</Form.Text>
                                <Form.Control 
                                    type="file" 
                                    accept=".xlsx, .xls" 
                                    onChange={(e) => setExcelFile(e.target.files[0])}
                                />
                            </Form.Group>
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowModal(false)}>Batal</Button>
                    <Button variant="primary" onClick={handleSave} disabled={!form.name.trim()}>
                        {editingProject ? 'Simpan' : 'Buat Proyek'}
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Quick Add Actor Modal */}
            <Modal show={showActorModal} onHide={() => setShowActorModal(false)} size="sm" centered>
                <Modal.Header closeButton>
                    <Modal.Title className="h6">Tambah Staff Baru</Modal.Title>
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
                        Simpan Staff
                    </Button>
                </Modal.Footer>
            </Modal>
            
            {/* Modal Choice Proyek Baru */}
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
                            setEditingProject(null);
                            resetForm();
                            setShowModal(true);
                        }}
                    >
                        <Edit2 size={24} />
                        Input Satuan
                    </Button>
                    
                    <Button 
                        variant="soft-success" 
                        size="lg" 
                        className="w-100 d-flex flex-column align-items-center justify-content-center gap-2 p-3"
                        onClick={() => {
                            setShowChoiceModal(false);
                            setBulkFile(null);
                            setShowBulkModal(true);
                        }}
                    >
                        <DownloadCloud size={24} />
                        Import Bulk Proyek
                    </Button>
                </Modal.Body>
            </Modal>
            
            {/* Modal Bulk Import */}
            <Modal show={showBulkModal} onHide={() => setShowBulkModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Import Bulk Proyek</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p className="text-muted small mb-4">
                        Isi banyak proyek sekaligus tanpa peta proses (hanya data dasar). Upload file Excel (.xlsx) dengan kolom: <b>Nama Proyek, Divisi, Staff, Deskripsi</b>.
                    </p>
                    
                    <div className="bg-light p-3 rounded-3 mb-3 border border-light-subtle">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                            <Form.Label className="mb-0 fw-bold text-primary">Template Excel</Form.Label>
                            <Button variant="link" size="sm" className="p-0 text-decoration-none d-flex align-items-center gap-1" onClick={downloadBulkTemplate}>
                                <DownloadCloud size={14} /> Download Template
                            </Button>
                        </div>
                        <Form.Text className="text-muted d-block mb-3">Unduh template, isi data proyek, lalu unggah kembali di bawah.</Form.Text>
                        
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
            
            <style jsx global>{`
                .workspace-switcher-wrap {
                    margin-top: 0 !important;
                    padding: 0 !important;
                }
            `}</style>
        </Container>
    );
};

export default ProcessMaps;
