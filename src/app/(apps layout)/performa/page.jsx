"use client"
import { Badge, Button, Card, Col, Container, Form, Modal, Row, Table, InputGroup } from 'react-bootstrap';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { 
    Activity, AlertTriangle, TrendingUp, DollarSign, 
    Search, ChevronUp, ChevronDown, 
    Edit3, FileText, Map, Filter, BarChart2
} from 'react-feather';
import { motion, AnimatePresence } from 'framer-motion';
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

const getPercentColor = (percent, inverse = false) => {
    if (percent === 0) return 'text-muted';
    if (inverse) {
        return percent > 0 ? 'text-danger' : 'text-success';
    }
    return percent > 0 ? 'text-success' : 'text-danger';
};

const statusColors = {
    draft: { bg: 'secondary', label: 'Draft' },
    analyzing: { bg: 'primary', label: 'Analyzing' },
    completed: { bg: 'success', label: 'Completed' },
};

const PerformaPage = () => {
    const router = useRouter();
    const { states } = useGlobalStateContext();
    const { activeTenantId } = states.tenantState;
    
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Search & Filter
    const [searchTerm, setSearchTerm] = useState('');
    const [DIVISION_FILTER, setDivisionFilter] = useState('');
    const [picFilter, setPicFilter] = useState('');
    const [actors, setActors] = useState([]);
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    const [dateFilterType, setDateFilterType] = useState('created_at');
    const [sortConfig, setSortConfig] = useState({ key: 'updated_at', direction: 'desc' });

    // Modals
    const [freqModal, setFreqModal] = useState({ show: false, project: null, value: 1 });
    const [rcaModal, setRcaModal] = useState({ show: false, project: null, data: [] });
    const [rcaLoading, setRcaLoading] = useState(false);
    const [resumeModal, setResumeModal] = useState({ show: false, project: null });
    const [picResumeModal, setPicResumeModal] = useState({ show: false, pic: null });

    const fetchProjects = async () => {
        if (!activeTenantId) return;
        setLoading(true);
        try {
            const res = await fetch(`/api/projects?tenantId=${activeTenantId}`);
            const data = await res.json();
            if (res.ok) setProjects(data);
        } catch (error) {
            console.error('Fetch project error:', error);
        } finally {
            setLoading(false);
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

    useEffect(() => {
        fetchProjects();
        fetchActors();
    }, [activeTenantId]);

    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const divisions = useMemo(() => {
        const divs = new Set();
        projects.forEach(p => {
            if (p.division_name) divs.add(p.division_name);
        });
        return Array.from(divs).sort();
    }, [projects]);

    const picWorkload = useMemo(() => {
        const picMap = {};
        projects.forEach(p => {
            const name = p.actor_name || p.pic || 'Unassigned';
            const id = p.actor_id || name; // Use ID if available for grouping
            
            if (!picMap[id]) picMap[id] = { id, name, count: 0, savings: 0, projects: [], rawProjects: [] };
            picMap[id].count += 1;
            picMap[id].savings += (p.potential_saving_cost || 0) * (p.frequency || 1);
            picMap[id].projects.push(p.name);
            picMap[id].rawProjects.push(p);
        });
        return Object.values(picMap).sort((a, b) => b.savings - a.savings);
    }, [projects]);

    const filteredProjects = useMemo(() => {
        let filtered = projects;

        if (searchTerm) {
            filtered = filtered.filter(p => 
                p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (p.division_name && p.division_name.toLowerCase().includes(searchTerm.toLowerCase()))
            );
        }

        if (DIVISION_FILTER) {
            filtered = filtered.filter(p => p.division_name === DIVISION_FILTER);
        }

        if (picFilter) {
            filtered = filtered.filter(p => (p.actor_id == picFilter) || (p.pic === picFilter));
        }

        if (dateRange.start || dateRange.end) {
            filtered = filtered.filter(p => {
                const pDate = new Date(p[dateFilterType]);
                if (dateRange.start && pDate < new Date(dateRange.start)) return false;
                if (dateRange.end) {
                    const endDate = new Date(dateRange.end);
                    endDate.setHours(23, 59, 59, 999);
                    if (pDate > endDate) return false;
                }
                return true;
            });
        }

        return filtered;
    }, [projects, searchTerm, DIVISION_FILTER, picFilter, dateRange, dateFilterType]);

    const summaryStats = useMemo(() => {
        let totalAsIsCost = 0;
        let totalToBeCost = 0;
        let totalAsIsTime = 0;
        let totalToBeTime = 0;
        let totalBottlenecks = 0;

        // stats should reflect CURRENT filter view
        filteredProjects.forEach(p => {
            const f = p.frequency || 1;
            totalAsIsCost += (p.as_is_cost || 0) * f;
            totalToBeCost += (p.to_be_cost || 0) * f;
            totalAsIsTime += (p.as_is_time || 0) * f;
            totalToBeTime += (p.to_be_time || 0) * f;
            totalBottlenecks += (p.bottlenecks || 0);
        });

        const savings = Math.max(0, totalAsIsCost - totalToBeCost);
        const efficiency = totalAsIsTime > 0 ? Math.round(((totalAsIsTime - totalToBeTime) / totalAsIsTime) * 100) : 0;

        return { savings, efficiency, totalBottlenecks, projectCount: filteredProjects.length };
    }, [filteredProjects]);

    const sortedProjects = useMemo(() => {
        const sorted = [...filteredProjects];
        sorted.sort((a, b) => {
            let valA = a[sortConfig.key];
            let valB = b[sortConfig.key];
            if (valA === null) valA = '';
            if (valB === null) valB = '';
            if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
            if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });

        return sorted;
    }, [filteredProjects, sortConfig]);

    const handleUpdateFrequency = async () => {
        if (!freqModal.project) return;
        try {
            const res = await fetch(`/api/projects/${freqModal.project.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ frequency: freqModal.value })
            });
            if (res.ok) {
                fetchProjects();
                setFreqModal({ show: false, project: null, value: 1 });
            }
        } catch (error) {
            alert('Gagal update frekuensi');
        }
    };

    const handleShowRca = async (project) => {
        if (!project.process_map_id) {
            alert('Proyek ini belum memiliki peta proses');
            return;
        }
        setRcaModal({ show: true, project, data: [] });
        setRcaLoading(true);
        try {
            const res = await fetch(`/api/rca?processMapId=${project.process_map_id}`);
            const data = await res.json();
            if (res.ok) {
                const rcaList = Object.entries(data).map(([nodeId, rca]) => ({ nodeId, ...rca }));
                setRcaModal(prev => ({ ...prev, data: rcaList }));
            }
        } catch (error) {
            console.error('RCA fetch error:', error);
        } finally {
            setRcaLoading(false);
        }
    };

    const calculatePercent = (oldVal, newVal) => {
        if (oldVal === 0) return 0;
        return Math.round(((newVal - oldVal) / oldVal) * 100);
    };

    const SortIcon = ({ column }) => {
        if (sortConfig.key !== column) return <Activity size={12} className="ms-1 opacity-20" />;
        return sortConfig.direction === 'asc' ? <ChevronUp size={14} className="ms-1 text-primary" /> : <ChevronDown size={14} className="ms-1 text-primary" />;
    };

    return (
        <Container fluid="xxl">
            <div className="hk-pg-header pt-7 pb-4">
                <div className="d-flex flex-wrap justify-content-between align-items-center">
                    <div>
                        <h1 className="pg-title">📊 Performa Proyek</h1>
                        <p className="text-muted mb-0">Analisis efisiensi dan penghematan biaya seluruh proyek</p>
                    </div>
                    <div className="d-flex align-items-center gap-3">
                        <div style={{ minWidth: '180px' }}>
                            <WorkspaceSwitcher />
                        </div>
                    </div>
                </div>
            </div>

            <div className="hk-pg-body">
                {/* Resume Cards */}
                <Row className="mb-4">
                    <Col lg={3} sm={6} className="mb-3 mb-lg-0">
                        <Card className="card-border shadow-sm border-start-4 border-success h-100">
                            <Card.Body className="p-3">
                                <div className="d-flex align-items-center">
                                    <div className="avatar avatar-sm avatar-soft-success avatar-rounded me-3">
                                        <span className="initial-wrap"><DollarSign size={20} /></span>
                                    </div>
                                    <div>
                                        <span className="d-block text-muted small fw-bold text-uppercase">Total Hemat Biaya</span>
                                        <h4 className="mb-0">{formatRupiah(summaryStats.savings)}</h4>
                                    </div>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col lg={3} sm={6} className="mb-3 mb-lg-0">
                        <Card className="card-border shadow-sm border-start-4 border-primary h-100">
                            <Card.Body className="p-3">
                                <div className="d-flex align-items-center">
                                    <div className="avatar avatar-sm avatar-soft-primary avatar-rounded me-3">
                                        <span className="initial-wrap"><TrendingUp size={20} /></span>
                                    </div>
                                    <div>
                                        <span className="d-block text-muted small fw-bold text-uppercase">Rata-rata Efisiensi</span>
                                        <h4 className="mb-0">+{summaryStats.efficiency}%</h4>
                                    </div>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col lg={3} sm={6} className="mb-3 mb-sm-0">
                        <Card className="card-border shadow-sm border-start-4 border-info h-100">
                            <Card.Body className="p-3">
                                <div className="d-flex align-items-center">
                                    <div className="avatar avatar-sm avatar-soft-info avatar-rounded me-3">
                                        <span className="initial-wrap"><Activity size={20} /></span>
                                    </div>
                                    <div>
                                        <span className="d-block text-muted small fw-bold text-uppercase">Total Proyek</span>
                                        <h4 className="mb-0">{summaryStats.projectCount}</h4>
                                    </div>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col lg={3} sm={6}>
                        <Card className="card-border shadow-sm border-start-4 border-danger h-100">
                            <Card.Body className="p-3">
                                <div className="d-flex align-items-center">
                                    <div className="avatar avatar-sm avatar-soft-danger avatar-rounded me-3">
                                        <span className="initial-wrap"><AlertTriangle size={20} /></span>
                                    </div>
                                    <div>
                                        <span className="d-block text-muted small fw-bold text-uppercase">Bottleneck Terdeteksi</span>
                                        <h4 className="mb-0">{summaryStats.totalBottlenecks}</h4>
                                    </div>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>

                {/* Filters */}
                <Card className="card-border mb-4 shadow-sm">
                    <Card.Body className="p-3">
                        <Row className="g-3 align-items-end">
                            <Col lg={3} md={6}>
                                <Form.Group>
                                    <Form.Label className="fs-8 fw-bold text-uppercase text-muted">Cari Proyek</Form.Label>
                                    <InputGroup size="sm">
                                        <InputGroup.Text className="bg-light border-end-0"><Search size={14} /></InputGroup.Text>
                                        <Form.Control className="bg-light border-start-0" placeholder="Nama atau divisi..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                                    </InputGroup>
                                </Form.Group>
                            </Col>
                            <Col lg={2} md={6}>
                                <Form.Group>
                                    <Form.Label className="fs-8 fw-bold text-uppercase text-muted">Divisi</Form.Label>
                                    <Form.Select size="sm" className="bg-light text-muted" value={DIVISION_FILTER} onChange={e => setDivisionFilter(e.target.value)}>
                                        <option value="">Semua Divisi</option>
                                        {divisions.map(d => <option key={d} value={d}>{d}</option>)}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col lg={2} md={6}>
                                <Form.Group>
                                    <Form.Label className="fs-8 fw-bold text-uppercase text-muted">PIC / Aktor</Form.Label>
                                    <Form.Select size="sm" className="bg-light text-muted" value={picFilter} onChange={e => setPicFilter(e.target.value)}>
                                        <option value="">Semua PIC</option>
                                        {actors.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                                        {picWorkload.filter(p => !actors.find(a => a.id == p.id || a.name == p.name)).map(p => (
                                            <option key={p.id} value={p.name}>{p.name} (Legacy)</option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col lg={2} md={6}>
                                <Form.Group>
                                    <Form.Label className="fs-8 fw-bold text-uppercase text-muted">Tipe Tanggal</Form.Label>
                                    <Form.Select 
                                        size="sm" 
                                        className="bg-light text-muted" 
                                        value={dateFilterType} 
                                        onChange={e => setDateFilterType(e.target.value)}
                                    >
                                        <option value="created_at">Tanggal Dibuat</option>
                                        <option value="updated_at">Tanggal Diupdate</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col lg={3} md={6}>
                                <Form.Group>
                                    <Form.Label className="fs-8 fw-bold text-uppercase text-muted mb-1">Rentang Tanggal</Form.Label>
                                    <div className="d-flex gap-2 align-items-center">
                                        <Form.Control size="sm" type="date" value={dateRange.start} onChange={e => setDateRange({...dateRange, start: e.target.value})} />
                                        <span className="text-muted small">sd</span>
                                        <Form.Control size="sm" type="date" value={dateRange.end} onChange={e => setDateRange({...dateRange, end: e.target.value})} />
                                        {(dateRange.start || dateRange.end) && (
                                            <Button variant="link" size="sm" className="text-danger p-0 ms-2" onClick={() => setDateRange({start: '', end: ''})}>Reset</Button>
                                        )}
                                    </div>
                                </Form.Group>
                            </Col>
                        </Row>
                    </Card.Body>
                </Card>

                {/* Table */}
                <div className="card card-border shadow-sm overflow-hidden">
                    <div className="table-responsive">
                        <Table hover className="mb-0 performa-table align-middle">
                            <thead className="bg-light opacity-80">
                                <tr>
                                    <th onClick={() => handleSort('name')} className="cursor-pointer">Proyek <SortIcon column="name" /></th>
                                    <th>Status</th>
                                    <th onClick={() => handleSort('division_name')} className="cursor-pointer">Divisi <SortIcon column="division_name" /></th>
                                    <th onClick={() => handleSort('frequency')} className="cursor-pointer text-center">Frek <SortIcon column="frequency" /></th>
                                    <th className="text-center text-secondary">Langkah Lama</th>
                                    <th className="text-center text-primary">Langkah Baru</th>
                                    <th className="text-center">% Langkah</th>
                                    <th className="text-center text-secondary">Waktu Lama</th>
                                    <th className="text-center text-primary">Waktu Baru</th>
                                    <th className="text-center text-warning">% Efisiensi</th>
                                    <th className="text-center text-secondary">Biaya Lama</th>
                                    <th className="text-center text-success">Biaya Baru</th>
                                    <th className="text-center text-success">% Hemat</th>
                                    <th className="text-center">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sortedProjects.map(p => {
                                    const f = p.frequency || 1;
                                    const as_is_steps = (p.as_is_steps || 0) * f;
                                    const to_be_steps = (p.to_be_steps || 0) * f;
                                    const as_is_time = (p.as_is_time || 0) * f;
                                    const to_be_time = (p.to_be_time || 0) * f;
                                    const as_is_cost = (p.as_is_cost || 0) * f;
                                    const to_be_cost = (p.to_be_cost || 0) * f;

                                    const stepDiff = calculatePercent(as_is_steps, to_be_steps);
                                    const timeDiff = calculatePercent(as_is_time, to_be_time);
                                    const costDiff = calculatePercent(as_is_cost, to_be_cost);
                                    
                                    return (
                                        <tr key={p.id}>
                                            <td className="fw-bold">{p.name}</td>
                                            <td><Badge bg={statusColors[p.status]?.bg || 'secondary'} size="sm">{p.status}</Badge></td>
                                            <td>{p.division_name || '-'}</td>
                                            <td className="text-center">
                                                <div className="d-flex align-items-center justify-content-center gap-2">
                                                    <span>{f}</span>
                                                    <Button variant="flush-light" size="xs" className="btn-icon p-0" onClick={() => setFreqModal({ show: true, project: p, value: f })}><Edit3 size={12} className="text-muted" /></Button>
                                                </div>
                                            </td>
                                            <td className="text-center fw-bold text-secondary">{as_is_steps}</td>
                                            <td className="text-center fw-bold text-primary">{to_be_steps}</td>
                                            <td className={`text-center fw-bold ${getPercentColor(stepDiff, true)}`}>{stepDiff > 0 ? '+' : ''}{stepDiff}%</td>
                                            <td className="text-center fw-bold text-secondary">{formatTime(as_is_time)}</td>
                                            <td className="text-center fw-bold text-primary">{formatTime(to_be_time)}</td>
                                            <td className={`text-center fw-bold ${getPercentColor(timeDiff, true)}`}>{timeDiff > 0 ? '+' : ''}{timeDiff}%</td>
                                            <td className="text-center fw-bold text-secondary">{formatRupiah(as_is_cost)}</td>
                                            <td className="text-center fw-bold text-success">{formatRupiah(to_be_cost)}</td>
                                            <td className={`text-center fw-bold ${getPercentColor(costDiff, true)}`}>{costDiff > 0 ? '+' : ''}{costDiff}%</td>
                                            <td className="text-center">
                                                <div className="d-flex justify-content-center gap-2">
                                                    <Button variant="outline-success" size="xs" className="btn-icon" onClick={() => setResumeModal({ show: true, project: p })} title="Resume Performa"><BarChart2 size={12} /></Button>
                                                    <Button variant="outline-primary" size="xs" className="btn-icon" onClick={() => handleShowRca(p)} title="Ringkasan RCA"><FileText size={12} /></Button>
                                                    <Button variant="outline-secondary" size="xs" className="btn-icon" onClick={() => router.push(`/canvas/${p.id}`)} title="Buka Kanvas"><Map size={12} /></Button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </Table>
                    </div>
                </div>

                {/* PIC Resume */}
                <div className="mt-5 mb-4">
                    <div className="d-flex align-items-center gap-2 mb-3">
                        <div className="avatar avatar-xs avatar-soft-primary avatar-rounded">
                            <span className="initial-wrap"><Activity size={14} /></span>
                        </div>
                        <h5 className="mb-0">Resume Beban Kerja PIC</h5>
                    </div>
                    <div className="card card-border shadow-sm overflow-hidden">
                        <div className="table-responsive">
                            <Table hover className="mb-0 align-middle">
                                <thead className="bg-light opacity-80">
                                    <tr>
                                        <th className="fs-8 fw-bold text-uppercase px-3">Nama PIC</th>
                                        <th className="fs-8 fw-bold text-uppercase text-center">Jumlah Proyek</th>
                                        <th className="fs-8 fw-bold text-uppercase text-center text-success">Total Kontribusi Hemat</th>
                                        <th className="fs-8 fw-bold text-uppercase px-3">Daftar Proyek</th>
                                        <th className="fs-8 fw-bold text-uppercase text-center">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {picWorkload.length === 0 ? (
                                        <tr><td colSpan="4" className="text-center py-4 text-muted small">Belum ada data PIC terdaftar</td></tr>
                                    ) : picWorkload.map(pic => (
                                        <tr key={pic.name}>
                                            <td className="px-3">
                                                <div className="d-flex align-items-center gap-2">
                                                    <div className="avatar avatar-xs avatar-primary avatar-rounded">
                                                        <span className="initial-wrap">{pic.name.charAt(0).toUpperCase()}</span>
                                                    </div>
                                                    <span className="fw-bold">{pic.name}</span>
                                                </div>
                                            </td>
                                            <td className="text-center fw-bold">{pic.count}</td>
                                            <td className="text-center fw-bold text-success">{formatRupiah(pic.savings)}</td>
                                            <td className="small text-muted py-2 px-3" style={{ maxWidth: '300px' }}>
                                                {pic.projects.map((p, i) => (
                                                    <Badge key={i} bg="soft-secondary" className="me-1 mb-1 text-dark fw-normal">{p}</Badge>
                                                ))}
                                            </td>
                                            <td className="text-center">
                                                <Button 
                                                    variant="soft-success" 
                                                    size="xs" 
                                                    className="px-2"
                                                    onClick={() => setPicResumeModal({ show: true, pic })}
                                                >
                                                    <BarChart2 size={12} className="me-1" /> Resume
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        </div>
                    </div>
                </div>
            </div>

            {/* Freq Modal */}
            <Modal show={freqModal.show} onHide={() => setFreqModal({ show: false, project: null, value: 1 })} centered size="sm">
                <Modal.Header closeButton className="py-2 px-3"><Modal.Title className="fs-6">Ubah Frekuensi</Modal.Title></Modal.Header>
                <Modal.Body className="p-3">
                    <Form.Label className="small text-muted mb-2">Frekuensi proses per bulan:</Form.Label>
                    <Form.Control type="number" min="1" value={freqModal.value} onChange={e => setFreqModal({ ...freqModal, value: parseInt(e.target.value) || 1 })} />
                </Modal.Body>
                <Modal.Footer className="py-2 px-3">
                    <Button variant="secondary" size="sm" onClick={() => setFreqModal({ show: false, project: null, value: 1 })}>Batal</Button>
                    <Button variant="primary" size="sm" onClick={handleUpdateFrequency}>Simpan</Button>
                </Modal.Footer>
            </Modal>

            {/* RCA Modal */}
            <Modal show={rcaModal.show} onHide={() => setRcaModal({ show: false, project: null, data: [] })} centered size="lg" scrollable>
                <Modal.Header closeButton className="bg-light"><Modal.Title className="fs-5 d-flex align-items-center gap-2"><Activity className="text-danger" size={20} /> Ringkasan Bedah Akar Masalah</Modal.Title></Modal.Header>
                <Modal.Body className="p-4 bg-light-soft">
                    <div className="mb-3"><h6 className="fw-bold text-primary mb-1">{rcaModal.project?.name}</h6><p className="text-muted small mb-0">Divisi: {rcaModal.project?.division_name || '-'}</p></div>
                    {rcaLoading ? <div className="text-center py-5"><div className="spinner-border text-primary"></div></div> :
                    rcaModal.data.length === 0 ? <div className="text-center py-5 bg-white rounded"><h6 className="text-muted">Belum Ada Analisis</h6></div> :
                    <div className="d-flex flex-column gap-3">
                        {rcaModal.data.map((rca, idx) => (
                            <Card key={rca.nodeId} className="border-0 shadow-sm">
                                <Card.Header className="bg-white py-2 px-3 fw-bold d-flex justify-content-between align-items-center"><span>Analisis Langkah #{idx+1}</span><Badge bg="soft-danger" className="text-danger">#{rca.nodeId.split('_').pop()}</Badge></Card.Header>
                                <Card.Body>
                                    <div className="mb-3 small fw-bold text-muted text-uppercase">Gejala:</div>
                                    <div className="p-2 bg-light rounded mb-3 small">{rca.problemStatement || 'Tidak ada keterangan'}</div>
                                    <div className="small fw-bold text-muted text-uppercase mb-2">5 Whys:</div>
                                    <div className="ps-2 border-start border-2 border-primary">
                                        {rca.whys.map((w, wi) => w && <div key={wi} className="mb-2"><div className="fs-9 fw-bold text-muted">Why {wi+1}:</div><div className={`fs-8 ${wi===4?'text-danger fw-bold':''}`}>{w}</div></div>)}
                                    </div>
                                </Card.Body>
                            </Card>
                        ))}
                    </div>}
                </Modal.Body>
                <Modal.Footer><Button variant="secondary" onClick={() => setRcaModal({ show: false, project: null, data: [] })}>Tutup</Button></Modal.Footer>
            </Modal>

            {/* Resume Proyek Modal */}
            <Modal show={resumeModal.show} onHide={() => setResumeModal({ show: false, project: null })} centered size="lg">
                <Modal.Header closeButton className="bg-light">
                    <Modal.Title className="fs-5 d-flex align-items-center gap-2">
                        <BarChart2 className="text-success" size={20} /> Resume Performa Proyek
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body className="p-4">
                    {resumeModal.project && (() => {
                        const p = resumeModal.project;
                        const f = p.frequency || 1;
                        const as_is_steps = (p.as_is_steps || 0) * f;
                        const to_be_steps = (p.to_be_steps || 0) * f;
                        const as_is_time = (p.as_is_time || 0) * f;
                        const to_be_time = (p.to_be_time || 0) * f;
                        const as_is_cost = (p.as_is_cost || 0) * f;
                        const to_be_cost = (p.to_be_cost || 0) * f;

                        const stepDiff = calculatePercent(as_is_steps, to_be_steps);
                        const timeDiff = calculatePercent(as_is_time, to_be_time);
                        const costDiff = calculatePercent(as_is_cost, to_be_cost);

                        const monthlySavings = Math.max(0, as_is_cost - to_be_cost);
                        const yearlySavings = monthlySavings * 12;
                        const monthlyTimeSaved = Math.max(0, as_is_time - to_be_time);
                        const yearlyTimeSaved = monthlyTimeSaved * 12;

                        return (
                            <div className="resume-content">
                                <div className="mb-4 text-center">
                                    <h4 className="fw-bold text-primary mb-1">{p.name}</h4>
                                    <p className="text-muted small mb-0">
                                        <span className="badge bg-soft-info text-info me-2">{p.division_name || 'Tanpa Divisi'}</span>
                                        <span className="badge bg-soft-secondary text-secondary">PIC: {p.pic || '-'}</span>
                                    </p>
                                </div>

                                <Row className="g-3 mb-4 text-center">
                                    <Col md={4}>
                                        <div className="p-3 bg-light rounded-4 h-100 border">
                                            <div className="text-muted small fw-bold text-uppercase mb-2">Langkah Kerja</div>
                                            <div className="d-flex justify-content-center align-items-center gap-2 mb-1">
                                                <span className="text-muted text-decoration-line-through small">{p.as_is_steps || 0}</span>
                                                <span className="fw-bold fs-5 text-primary">→ {p.to_be_steps || 0}</span>
                                            </div>
                                            <Badge bg="soft-primary" className="text-primary">{stepDiff}% Efisiensi</Badge>
                                        </div>
                                    </Col>
                                    <Col md={4}>
                                        <div className="p-3 bg-light rounded-4 h-100 border">
                                            <div className="text-muted small fw-bold text-uppercase mb-2">Durasi Proses</div>
                                            <div className="d-flex justify-content-center align-items-center gap-2 mb-1">
                                                <span className="text-muted text-decoration-line-through small">{formatTime(p.as_is_time || 0)}</span>
                                                <span className="fw-bold fs-5 text-warning">→ {formatTime(p.to_be_time || 0)}</span>
                                            </div>
                                            <Badge bg="soft-warning" className="text-warning">{timeDiff}% Waktu</Badge>
                                        </div>
                                    </Col>
                                    <Col md={4}>
                                        <div className="p-3 bg-light rounded-4 h-100 border">
                                            <div className="text-muted small fw-bold text-uppercase mb-2">Biaya Operasional</div>
                                            <div className="d-flex justify-content-center align-items-center gap-2 mb-1">
                                                <span className="text-muted text-decoration-line-through small">{formatRupiah(p.as_is_cost || 0)}</span>
                                                <span className="fw-bold fs-5 text-success">→ {formatRupiah(p.to_be_cost || 0)}</span>
                                            </div>
                                            <Badge bg="soft-success" className="text-success">{costDiff}% Biaya</Badge>
                                        </div>
                                    </Col>
                                </Row>

                                <div className="p-4 bg-soft-success rounded-4 border border-success border-opacity-25">
                                    <h6 className="fw-bold text-success text-uppercase small mb-3">Proyeksi Penghematan & Dampak</h6>
                                    <Row className="g-4">
                                        <Col sm={6}>
                                            <div className="mb-3">
                                                <div className="text-muted small mb-1">Estimasi Penghematan Biaya:</div>
                                                <div className="d-flex align-items-baseline gap-2">
                                                    <h4 className="mb-0 text-success fw-bold">{formatRupiah(yearlySavings)}</h4>
                                                    <span className="text-muted small">/ tahun</span>
                                                </div>
                                                <div className="small text-muted mt-1">({formatRupiah(monthlySavings)} / bulan)</div>
                                            </div>
                                        </Col>
                                        <Col sm={6}>
                                            <div className="mb-3">
                                                <div className="text-muted small mb-1">Estimasi Efisiensi Waktu:</div>
                                                <div className="d-flex align-items-baseline gap-2">
                                                    <h4 className="mb-0 text-primary fw-bold">{formatTime(yearlyTimeSaved)}</h4>
                                                    <span className="text-muted small">/ tahun</span>
                                                </div>
                                                <div className="small text-muted mt-1">({formatTime(monthlyTimeSaved)} / bulan)</div>
                                            </div>
                                        </Col>
                                    </Row>
                                    <div className="mt-2 text-muted small pt-3 border-top border-success border-opacity-10 fst-italic">
                                        * Perhitungan berdasarkan frekuensi proses sebanyak <strong>{f} kali</strong> per bulan.
                                    </div>
                                </div>
                            </div>
                        );
                    })()}
                </Modal.Body>
                <Modal.Footer className="bg-light pt-2 pb-2">
                    <Button variant="secondary" size="sm" onClick={() => setResumeModal({ show: false, project: null })}>Tutup</Button>
                </Modal.Footer>
            </Modal>
            
            {/* PIC Resume Modal */}
            <Modal show={picResumeModal.show} onHide={() => setPicResumeModal({ show: false, pic: null })} centered size="lg">
                <Modal.Header closeButton className="bg-light">
                    <Modal.Title className="fs-5 d-flex align-items-center gap-2">
                        <Activity className="text-primary" size={20} /> Resume Performa PIC
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body className="p-4">
                    {picResumeModal.pic && (() => {
                        const pic = picResumeModal.pic;
                        const projects = pic.rawProjects;
                        
                        let totalAsIsCost = 0;
                        let totalToBeCost = 0;
                        let totalAsIsTime = 0;
                        let totalToBeTime = 0;
                        
                        projects.forEach(p => {
                            const f = p.frequency || 1;
                            totalAsIsCost += (p.as_is_cost || 0) * f;
                            totalToBeCost += (p.to_be_cost || 0) * f;
                            totalAsIsTime += (p.as_is_time || 0) * f;
                            totalToBeTime += (p.to_be_time || 0) * f;
                        });

                        const monthlySavings = Math.max(0, totalAsIsCost - totalToBeCost);
                        const yearlySavings = monthlySavings * 12;
                        const monthlyTimeSaved = Math.max(0, totalAsIsTime - totalToBeTime);
                        const yearlyTimeSaved = monthlyTimeSaved * 12;
                        const avgEfficiency = totalAsIsTime > 0 ? Math.round(((totalAsIsTime - totalToBeTime) / totalAsIsTime) * 100) : 0;

                        return (
                            <div className="resume-content">
                                <div className="mb-4 text-center">
                                    <div className="avatar avatar-xl avatar-soft-primary avatar-rounded mb-3 mx-auto">
                                        <span className="initial-wrap fs-2">{pic.name.charAt(0).toUpperCase()}</span>
                                    </div>
                                    <h4 className="fw-bold text-dark mb-1">{pic.name}</h4>
                                    <p className="text-muted small">Penanggung Jawab Proyek Perbaikan Bisnis</p>
                                </div>

                                <Row className="g-3 mb-4 text-center">
                                    <Col md={4}>
                                        <div className="p-3 bg-light rounded-4 h-100 border">
                                            <div className="text-muted small fw-bold text-uppercase mb-1">Total Proyek</div>
                                            <h3 className="mb-0 text-primary">{pic.count}</h3>
                                            <div className="text-muted small mt-1">Selesai/Proses</div>
                                        </div>
                                    </Col>
                                    <Col md={4}>
                                        <div className="p-3 bg-light rounded-4 h-100 border">
                                            <div className="text-muted small fw-bold text-uppercase mb-1">Rata-rata Efisiensi</div>
                                            <h3 className="mb-0 text-warning">+{avgEfficiency}%</h3>
                                            <div className="text-muted small mt-1">Peningkatan Kecepatan</div>
                                        </div>
                                    </Col>
                                    <Col md={4}>
                                        <div className="p-3 bg-light rounded-4 h-100 border">
                                            <div className="text-muted small fw-bold text-uppercase mb-1">Dampak Hemat Biaya</div>
                                            <h3 className="mb-0 text-success">{formatRupiah(monthlySavings)}</h3>
                                            <div className="text-muted small mt-1">Per Bulan</div>
                                        </div>
                                    </Col>
                                </Row>

                                <div className="p-4 bg-soft-success rounded-4 border border-success border-opacity-25 mb-4 text-center">
                                    <div className="text-muted small fw-bold text-uppercase mb-2">Total Estimasi Kontribusi Tahunan</div>
                                    <h2 className="display-6 fw-bold text-success mb-2">{formatRupiah(yearlySavings)}</h2>
                                    <p className="text-muted small mb-0 px-md-5">
                                        Estimasi total penghematan biaya operasional dari seluruh proyek yang ditangani oleh <strong>{pic.name}</strong> dalam satu tahun fiskal.
                                    </p>
                                </div>

                                <div className="bg-light p-3 rounded-4 border">
                                    <h6 className="fw-bold fs-7 mb-3">Daftar Proyek di Bawah Kendali PIC:</h6>
                                    <div className="d-flex flex-wrap gap-2">
                                        {pic.rawProjects.map((p, idx) => (
                                            <Badge key={idx} bg="white" className="border text-dark p-2 shadow-sm rounded-pill">
                                                <TrendingUp size={12} className="text-success me-1" /> {p.name}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        );
                    })()}
                </Modal.Body>
                <Modal.Footer className="bg-light pt-2 pb-2">
                    <Button variant="secondary" size="sm" onClick={() => setPicResumeModal({ show: false, pic: null })}>Tutup</Button>
                </Modal.Footer>
            </Modal>

            <style jsx global>{`
                .performa-table th { font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 700; color: #64748b; padding: 12px 8px; cursor: pointer; }
                .performa-table td { font-size: 13px; }
                .bg-light-soft { background-color: #f8fafc; }
            `}</style>
        </Container>
    );
};

export default PerformaPage;
