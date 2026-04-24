"use client"
import { useState, useEffect, useMemo, useCallback } from 'react';
import { Container, Badge, Button, Spinner } from 'react-bootstrap';
import {
    ReactFlow,
    Controls,
    Background,
    BackgroundVariant,
    MarkerType,
    Panel,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { ArrowLeft } from 'react-feather';
import { useRouter } from 'next/navigation';
import { useGlobalStateContext } from '@/context/GolobalStateProvider';
import { useTheme } from '@/layout/theme-provider/theme-provider';

const statusColors = {
    draft: '#6c757d',
    analyzing: '#0d6efd',
    completed: '#198754',
};

const CanvasSBPM = () => {
    const router = useRouter();
    const { states } = useGlobalStateContext();
    const { activeTenantId } = states.tenantState;
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProjects = async () => {
            if (!activeTenantId) return;
            setLoading(true);
            try {
                const res = await fetch(`/api/projects?tenantId=${activeTenantId}&category=SBPM`);
                if (res.ok) {
                    const data = await res.json();
                    setProjects(data);
                }
            } catch (err) {
                console.error('Fetch SBPM projects error:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchProjects();
    }, [activeTenantId]);

    // Generate nodes and edges from projects data
    const { nodes, edges } = useMemo(() => {
        const generatedNodes = [];
        const generatedEdges = [];

        // Group by division
        const divisionGroups = {};
        projects.forEach(p => {
            const divName = p.division_name || 'Tanpa Divisi';
            if (!divisionGroups[divName]) divisionGroups[divName] = [];
            divisionGroups[divName].push(p);
        });

        const divKeys = Object.keys(divisionGroups);
        let globalY = 80;

        divKeys.forEach((divName, divIndex) => {
            const group = divisionGroups[divName];

            // Division header node
            generatedNodes.push({
                id: `div_${divIndex}`,
                type: 'default',
                position: { x: 20, y: globalY },
                data: { label: `📁 ${divName}` },
                style: {
                    backgroundColor: isDark ? '#3d2e1e' : '#fef3c7',
                    border: `2px solid ${isDark ? '#f59e0b' : '#d97706'}`,
                    borderRadius: '12px',
                    padding: '10px 18px',
                    fontWeight: 700,
                    fontSize: '14px',
                    color: isDark ? '#fbbf24' : '#92400e',
                    minWidth: '180px',
                    textAlign: 'center',
                },
                draggable: true,
            });

            group.forEach((project, pIndex) => {
                const nodeId = `project_${project.id}`;
                const xPos = 280 + pIndex * 280;
                const yPos = globalY;

                const statusColor = statusColors[project.status] || '#6c757d';
                const steps = project.total_steps || 0;
                const bottlenecks = project.bottlenecks || 0;

                generatedNodes.push({
                    id: nodeId,
                    type: 'default',
                    position: { x: xPos, y: yPos },
                    data: {
                        label: `${project.name}\n📋 ${steps} langkah${bottlenecks > 0 ? ` | ⚠️ ${bottlenecks}` : ''}\n👤 ${project.pic || project.actor_name || '-'}`,
                    },
                    style: {
                        backgroundColor: isDark ? '#1e293b' : '#fff',
                        border: `2px solid ${statusColor}`,
                        borderRadius: '12px',
                        padding: '12px 16px',
                        fontWeight: 500,
                        fontSize: '12px',
                        color: isDark ? '#f1f5f9' : '#333',
                        minWidth: '200px',
                        maxWidth: '240px',
                        boxShadow: `0 0 10px ${statusColor}33`,
                        whiteSpace: 'pre-line',
                        cursor: 'pointer',
                    },
                    draggable: true,
                });

                // Edge from division to project
                generatedEdges.push({
                    id: `e-div${divIndex}-p${project.id}`,
                    source: `div_${divIndex}`,
                    target: nodeId,
                    type: 'smoothstep',
                    markerEnd: { type: MarkerType.ArrowClosed, color: statusColor },
                    style: { stroke: statusColor, strokeWidth: 2 },
                    animated: project.status === 'analyzing',
                });

                // Connect sequential projects in same division
                if (pIndex > 0) {
                    const prevId = `project_${group[pIndex - 1].id}`;
                    generatedEdges.push({
                        id: `e-p${group[pIndex - 1].id}-p${project.id}`,
                        source: prevId,
                        target: nodeId,
                        type: 'smoothstep',
                        markerEnd: { type: MarkerType.ArrowClosed, color: '#adb5bd' },
                        style: { stroke: '#adb5bd', strokeWidth: 1.5, strokeDasharray: '5,5' },
                    });
                }
            });

            globalY += 150;
        });

        return { nodes: generatedNodes, edges: generatedEdges };
    }, [projects, isDark]);

    const onNodeDoubleClick = useCallback((_, node) => {
        const projectId = node.id.replace('project_', '');
        if (node.id.startsWith('project_')) {
            router.push(`/canvas/${projectId}`);
        }
    }, [router]);

    if (loading) {
        return (
            <Container fluid="xxl">
                <div className="hk-pg-header pt-7 pb-4">
                    <h1 className="pg-title">📋 Kanvas SBPM</h1>
                </div>
                <div className="text-center py-5">
                    <Spinner animation="border" variant="warning" />
                    <p className="text-muted mt-2">Memuat data...</p>
                </div>
            </Container>
        );
    }

    return (
        <Container fluid="xxl">
            <div className="hk-pg-header pt-7 pb-4">
                <div className="d-flex justify-content-between align-items-center">
                    <div>
                        <h1 className="pg-title">📋 Kanvas SBPM</h1>
                        <p className="text-muted mb-0">Sub Bisnis Proses Manajemen — Tampilan kanvas seluruh sub-proses SBPM</p>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                        <Badge bg="warning" className="text-dark px-3 py-2">{projects.length} Proyek SBPM</Badge>
                        <Button variant="outline-secondary" size="sm" onClick={() => router.push('/process-maps')} className="d-flex align-items-center gap-1">
                            <ArrowLeft size={14} /> Peta Proses
                        </Button>
                    </div>
                </div>
            </div>

            <div style={{ width: '100%', height: 'calc(100vh - 200px)', borderRadius: '12px', overflow: 'hidden', border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}` }}>
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodeDoubleClick={onNodeDoubleClick}
                    fitView
                    minZoom={0.3}
                    maxZoom={2}
                    panOnScroll
                    style={{
                        backgroundColor: isDark ? '#0f172a' : '#fffbeb',
                    }}
                >
                    <Controls />
                    <Background variant={BackgroundVariant.Dots} gap={20} size={1} color={isDark ? '#334155' : '#e5e0d5'} />
                    <Panel position="top-left">
                        <div className="bg-white p-2 rounded shadow-sm border" style={{ fontSize: '11px' }}>
                            <div className="fw-bold mb-1">🔍 Legenda</div>
                            <div className="d-flex align-items-center gap-2 mb-1">
                                <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#6c757d', display: 'inline-block' }}></span>
                                <span>Draft</span>
                            </div>
                            <div className="d-flex align-items-center gap-2 mb-1">
                                <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#0d6efd', display: 'inline-block' }}></span>
                                <span>Analyzing</span>
                            </div>
                            <div className="d-flex align-items-center gap-2">
                                <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#198754', display: 'inline-block' }}></span>
                                <span>Completed</span>
                            </div>
                            <hr className="my-1" />
                            <small className="text-muted">Double-klik proyek untuk buka kanvas</small>
                        </div>
                    </Panel>
                </ReactFlow>
            </div>
        </Container>
    );
};

export default CanvasSBPM;
