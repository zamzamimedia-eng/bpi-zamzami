"use client"
import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import {
    ReactFlow,
    Controls,
    Background,
    useNodesState,
    useEdgesState,
    BackgroundVariant,
    MarkerType,
    Panel,
    ConnectionMode,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Button, Badge, Dropdown } from 'react-bootstrap';
import { X, Trash2, Plus, Save, Activity, Download, Upload } from 'react-feather';
import { motion, AnimatePresence } from 'framer-motion';
import Split from 'react-split';
import ProcessNode from './ProcessNode';
import DecisionNode from './DecisionNode';
import NodeEditModal from './NodeEditModal';
import InsertableEdge from './InsertableEdge';
import { Position } from '@xyflow/react';

// Custom hook for animated number values
const useAnimatedValue = (targetValue, duration = 600) => {
    const [displayValue, setDisplayValue] = useState(targetValue);
    const previousValue = useRef(targetValue);
    const animationRef = useRef(null);

    useEffect(() => {
        const startValue = previousValue.current;
        const diff = targetValue - startValue;
        if (diff === 0) return;

        const startTime = performance.now();

        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Ease-out cubic for smooth deceleration
            const easeOut = 1 - Math.pow(1 - progress, 3);
            const current = startValue + diff * easeOut;

            setDisplayValue(current);

            if (progress < 1) {
                animationRef.current = requestAnimationFrame(animate);
            } else {
                setDisplayValue(targetValue);
                previousValue.current = targetValue;
            }
        };

        animationRef.current = requestAnimationFrame(animate);
        return () => {
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
        };
    }, [targetValue, duration]);

    return displayValue;
};

const ToBeSimulator = ({ asIsNodes, asIsEdges, toBeCanvasJson, nodeTypes: _, onClose, getTotalDurationMinutes, onSave, taskStatusMap = {} }) => {
    // Clone nodes/edges for as-is (read-only) and to-be (editable)
    const asIsNodesCopy = useMemo(() => asIsNodes.map(n => ({ ...n, draggable: false, selectable: false })), [asIsNodes]);
    const asIsEdgesCopy = useMemo(() => [...asIsEdges], [asIsEdges]);
    const [toBeNodes, setToBeNodes, onToBeNodesChange] = useNodesState([]);
    const [toBeEdges, setToBeEdges, onToBeEdgesChange] = useEdgesState([]);

    const [isSaving, setIsSaving] = useState(false);

    // Initial load of To-Be data
    useEffect(() => {
        if (toBeCanvasJson) {
            try {
                const parsed = typeof toBeCanvasJson === 'string' ? JSON.parse(toBeCanvasJson) : toBeCanvasJson;
            if (parsed && parsed.nodes) {
                setToBeNodes(parsed.nodes);
                const loadedEdges = (parsed.edges || []).map(e => ({
                    ...e,
                    type: e.type === 'smoothstep' || !e.type ? 'insertable' : e.type,
                }));
                setToBeEdges(loadedEdges);
                return;
            }
            } catch (e) {
                console.error('Error parsing To-Be JSON:', e);
            }
        }
        // Fallback: use As-Is if no To-Be exists
        setToBeNodes(asIsNodes.map(n => ({ ...n, id: `tobe_${n.id}`, position: { ...n.position } })));
        setToBeEdges(asIsEdges.map(e => ({ 
            ...e, 
            id: `tobe_${e.id}`, 
            source: `tobe_${e.source}`, 
            target: `tobe_${e.target}`,
            type: e.type === 'smoothstep' || !e.type ? 'insertable' : e.type
        })));
    }, [toBeCanvasJson, asIsNodes, asIsEdges, setToBeNodes, setToBeEdges]);

    // Edit Modal State
    const [editModal, setEditModal] = useState({ show: false, node: null });

    // Calculate which handles are connected per node for both As-Is and To-Be
    const asIsConnectedHandles = useMemo(() => {
        const map = {};
        asIsEdgesCopy.forEach(e => {
            if (!map[e.source]) map[e.source] = {};
            if (e.sourceHandle) map[e.source][e.sourceHandle] = true;
            else map[e.source].source = true;
            if (!map[e.target]) map[e.target] = {};
            if (e.targetHandle) map[e.target][e.targetHandle] = true;
            else map[e.target].target = true;
        });
        return map;
    }, [asIsEdgesCopy]);

    const toBeConnectedHandles = useMemo(() => {
        const map = {};
        toBeEdges.forEach(e => {
            if (!map[e.source]) map[e.source] = {};
            if (e.sourceHandle) map[e.source][e.sourceHandle] = true;
            else map[e.source].source = true;
            if (!map[e.target]) map[e.target] = {};
            if (e.targetHandle) map[e.target][e.targetHandle] = true;
            else map[e.target].target = true;
        });
        return map;
    }, [toBeEdges]);

    const asIsNodeTypes = useMemo(() => ({
        process: (props) => (
            <ProcessNode 
                {...props} 
                heatmapMode={false} 
                allNodes={asIsNodesCopy} 
                connectedHandles={asIsConnectedHandles[props.id] || {}} 
                taskStatus={taskStatusMap[props.id]}
            />
        ),
        decision: (props) => <DecisionNode {...props} heatmapMode={false} connectedHandles={asIsConnectedHandles[props.id] || {}} />,
    }), [asIsNodesCopy, asIsConnectedHandles, taskStatusMap]);

    const toBeNodeTypes = useMemo(() => ({
        process: (props) => {
            const originalId = props.id.replace('tobe_', '');
            return (
                <ProcessNode 
                    {...props} 
                    heatmapMode={false} 
                    allNodes={toBeNodes} 
                    connectedHandles={toBeConnectedHandles[props.id] || {}} 
                    taskStatus={taskStatusMap[originalId]}
                />
            );
        },
        decision: (props) => <DecisionNode {...props} heatmapMode={false} connectedHandles={toBeConnectedHandles[props.id] || {}} />,
    }), [toBeNodes, toBeConnectedHandles, taskStatusMap]);

    // Calculate totals
    const asIsTotalMins = useMemo(() => getTotalDurationMinutes(asIsNodes), [asIsNodes, getTotalDurationMinutes]);
    const toBeTotalMins = useMemo(() => {
        const realNodes = toBeNodes.map(n => ({
            ...n,
            id: n.id.replace('tobe_', ''),
        }));
        return getTotalDurationMinutes(realNodes);
    }, [toBeNodes, getTotalDurationMinutes]);
    
    // Calculate total cost for As-Is and To-Be
    const getTotalCost = (nodeList) => {
        return nodeList.filter(n => n.type === 'process').reduce((sum, n) => {
            return sum + (n.data.cost || 0);
        }, 0);
    };

    const asIsTotalCost = useMemo(() => getTotalCost(asIsNodes), [asIsNodes]);
    const toBeTotalCost = useMemo(() => {
        const realNodes = toBeNodes.map(n => ({
            ...n,
            id: n.id.replace('tobe_', ''),
        }));
        return getTotalCost(realNodes);
    }, [toBeNodes]);

    const efficiencyPercent = asIsTotalMins > 0
        ? (((asIsTotalMins - toBeTotalMins) / asIsTotalMins) * 100)
        : 0;

    // Cost savings calculation
    const directCostSaving = asIsTotalCost - toBeTotalCost;
    
    // Animated values
    const animatedToBeTime = useAnimatedValue(toBeTotalMins);
    const animatedEfficiency = useAnimatedValue(efficiencyPercent);
    const animatedCost = useAnimatedValue(directCostSaving, 800);

    const formatCurrency = (num) => {
        if (Math.abs(num) >= 1000000) return `Rp ${(num / 1000000).toFixed(1)}jt`;
        if (Math.abs(num) >= 1000) return `Rp ${(num / 1000).toFixed(0)}rb`;
        return `Rp ${Math.round(num)}`;
    };

    const formatMinutes = (mins) => {
        if (mins >= 480) return `${(mins / 480).toFixed(1)} hari`;
        if (mins >= 60) return `${(mins / 60).toFixed(1)} jam`;
        return `${Math.round(mins)} menit`;
    };

    // Event Handlers for To-Be
    const handleNodeDoubleClick = useCallback((event, node) => {
        setEditModal({ show: true, node });
    }, []);

    const onConnect = useCallback((params) => {
        const strokeColor = '#6c757d'; // Reverted to gray
        setToBeEdges((eds) => addEdge({ 
            ...params, 
            type: 'insertable', 
            markerEnd: { type: MarkerType.ArrowClosed, color: strokeColor, width: 20, height: 20 }, 
            style: { strokeWidth: 2, stroke: strokeColor } 
        }, eds));
    }, [setToBeEdges]);

    const handleSaveNode = useCallback((newData) => {
        setToBeNodes((nds) =>
            nds.map((node) => {
                if (node.id === editModal.node.id) {
                    return { ...node, data: { ...node.data, ...newData } };
                }
                return node;
            })
        );
        setEditModal({ show: false, node: null });
    }, [editModal.node, setToBeNodes]);

    const handleDeleteNode = useCallback((id) => {
        if (confirm(`Hapus langkah ini?`)) {
            setToBeNodes((nds) => nds.filter((node) => node.id !== id));
            setToBeEdges((eds) => eds.filter((edge) => edge.source !== id && edge.target !== id));
            setEditModal({ show: false, node: null });
        }
    }, [setToBeNodes, setToBeEdges]);

    const handleAddNode = useCallback((type) => {
        const id = `tobe_new_${Date.now()}`;
        const newNode = {
            id,
            type,
            position: { x: 100, y: 100 },
            data: type === 'process' 
                ? { label: 'Langkah Baru', role: 'Peran', action: 'Aksi Baru', duration: 1, durationUnit: 'jam', cost: 0 }
                : { label: 'Keputusan Baru', question: 'Pertanyaan?' },
        };
        setToBeNodes((nds) => nds.concat(newNode));
    }, [setToBeNodes]);

    const fileInputRef = useRef(null);

    const handleExportJSON = useCallback(() => {
        const data = { nodes: toBeNodes, edges: toBeEdges };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `bpi-to-be-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }, [toBeNodes, toBeEdges]);

    const handleImportJSON = useCallback((event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                if (data.nodes && Array.isArray(data.nodes)) {
                    // Update nodes and edges. 
                    // Note: If you want to keep the 'tobe_' prefix logic, 
                    // you might need to process the data, but usually 
                    // an imported file already has the correct IDs.
                    setToBeNodes(data.nodes);
                    setToBeEdges(data.edges || []);
                    alert('Data To-Be berhasil diimpor! ✅');
                } else {
                    alert('Format file tidak valid! ❌ Pastikan file berisi data nodes dan edges.');
                }
            } catch (err) {
                console.error('Import Error:', err);
                alert('Gagal membaca file JSON ❌: ' + err.message);
            }
            event.target.value = '';
        };
        reader.readAsText(file);
    }, [setToBeNodes, setToBeEdges]);

    const handleSave = async () => {
        setIsSaving(true);
        const success = await onSave({ nodes: toBeNodes, edges: toBeEdges });
        setIsSaving(false);
        if (success) {
            alert('Versi To-Be berhasil disimpan! 🚀');
        } else {
            alert('Gagal menyimpan versi To-Be ❌');
        }
    };

    const handleInsertNode = useCallback((edgeId, sourceId, targetId, midX, midY) => {
        // Ensure we only handle To-Be nodes
        if (!sourceId.includes('tobe_') && !sourceId.includes('tobe_')) return;
        
        const newId = `tobe_new_${Date.now()}`;
        const newNode = {
            id: newId,
            type: 'process',
            position: { x: midX - 90, y: midY - 40 },
            data: { label: 'Langkah Baru', role: 'Peran', action: 'Aksi Baru', duration: 1, durationUnit: 'jam', cost: 0 },
        };
        const oldEdge = toBeEdges.find(e => e.id === edgeId);
        const edgeStyle = oldEdge?.style || { stroke: '#6c757d' };

        setToBeNodes(nds => [...nds, newNode]);
        const strokeColor = '#6c757d';
        setToBeEdges(eds => {
            const filtered = eds.filter(e => e.id !== edgeId);
            return [
                ...filtered,
                { id: `e-${sourceId}-${newId}`, source: sourceId, target: newId, type: 'insertable', markerEnd: { type: MarkerType.ArrowClosed, color: strokeColor }, style: { stroke: strokeColor, strokeWidth: 2 } },
                { id: `e-${newId}-${targetId}`, source: newId, target: targetId, type: 'insertable', markerEnd: { type: MarkerType.ArrowClosed, color: strokeColor }, style: { stroke: strokeColor, strokeWidth: 2 } },
            ];
        });
    }, [toBeEdges, setToBeNodes, setToBeEdges]);

    const handleQuickAddNode = useCallback((detail) => {
        const { sourceNodeId, sourceHandleId, sourceHandlePosition, newNodeType } = detail;
        
        // Ensure we only handle To-Be nodes
        if (!sourceNodeId.includes('tobe_')) return;

        const sourceNode = toBeNodes.find(n => n.id === sourceNodeId);
        if (!sourceNode) return;

        const newNodeId = `tobe_new_${Date.now()}`;
        
        // Calculate offsets based on position
        let offsetX = 0;
        let offsetY = 0;
        
        if (sourceHandlePosition === 'right' || sourceHandlePosition === Position.Right) offsetX = 250;
        else if (sourceHandlePosition === 'left' || sourceHandlePosition === Position.Left) offsetX = -250;
        else if (sourceHandlePosition === 'top' || sourceHandlePosition === Position.Top) offsetY = -150;
        else if (sourceHandlePosition === 'bottom' || sourceHandlePosition === Position.Bottom) offsetY = 150;
        
        const newNode = {
            id: newNodeId,
            type: newNodeType,
            position: { 
                x: sourceNode.position.x + offsetX, 
                y: sourceNode.position.y + offsetY + (sourceHandleId === 'no' ? 100 : 0) 
            },
            data: newNodeType === 'process' 
                ? { label: 'Langkah Baru', role: 'Peran', action: 'Aksi Baru', duration: 1, durationUnit: 'jam', cost: 0 }
                : { label: 'Keputusan Baru', question: 'Pertanyaan?' },
        };

        const strokeColor = '#6c757d';
        const newEdge = {
            id: `e-${sourceNodeId}-${newNodeId}`,
            source: sourceNodeId,
            target: newNodeId,
            sourceHandle: sourceHandleId,
            type: 'insertable',
            markerEnd: { type: MarkerType.ArrowClosed, color: strokeColor, width: 20, height: 20 },
            style: { stroke: strokeColor, strokeWidth: 2 }
        };

        setToBeNodes(nds => [...nds, newNode]);
        setToBeEdges(eds => [...eds, newEdge]);
    }, [toBeNodes, setToBeNodes, setToBeEdges]);

    useEffect(() => {
        const handleInsertEvent = (e) => handleInsertNode(e.detail.edgeId, e.detail.source, e.detail.target, e.detail.midX, e.detail.midY);
        const handleDeleteEdgeEvent = (e) => {
            // Only delete if it's a To-Be edge
            if (e.detail.edgeId.includes('tobe_')) {
                setToBeEdges(eds => eds.filter(edge => edge.id !== e.detail.edgeId));
            }
        };
        const handleQuickAddEvent = (e) => handleQuickAddNode(e.detail);

        window.addEventListener('insertNodeOnEdge', handleInsertEvent);
        window.addEventListener('deleteEdge', handleDeleteEdgeEvent);
        window.addEventListener('quickAddNode', handleQuickAddEvent);
        return () => {
            window.removeEventListener('insertNodeOnEdge', handleInsertEvent);
            window.removeEventListener('deleteEdge', handleDeleteEdgeEvent);
            window.removeEventListener('quickAddNode', handleQuickAddEvent);
        };
    }, [handleInsertNode, handleQuickAddNode, setToBeEdges]);

    const defaultEdgeOptions = useMemo(() => ({
        type: 'insertable',
        markerEnd: { type: MarkerType.ArrowClosed, color: '#999' },
        style: { strokeWidth: 2, stroke: '#999' },
    }), []);

    const edgeTypes = useMemo(() => ({
        insertable: InsertableEdge,
    }), []);

    return (
        <div style={{ height: 'calc(100vh - 60px)', position: 'relative' }}>
            {/* Floating Score Board */}
            <div style={{
                position: 'absolute',
                bottom: '16px',
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 999,
                backgroundColor: 'rgba(0,0,0,0.88)',
                color: '#fff',
                padding: '16px 32px',
                borderRadius: '16px',
                textAlign: 'center',
                boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                backdropFilter: 'blur(10px)',
            }}>
                <div className="d-flex align-items-center gap-4">
                    <div>
                        <small className="text-muted d-block">Saat Ini</small>
                        <span className="text-danger fw-bold">{formatMinutes(asIsTotalMins)}</span>
                    </div>
                    <div className="text-warning fs-4">→</div>
                    <div>
                        <small className="text-muted d-block">Target</small>
                        <span className="text-success fw-bold" style={{ transition: 'all 0.3s ease' }}>
                            {formatMinutes(animatedToBeTime)}
                        </span>
                    </div>
                    <div style={{ borderLeft: '1px solid #555', paddingLeft: '16px' }}>
                        <small className="text-muted d-block">Potensi Efisiensi</small>
                        <span
                            className={`fw-bold fs-5 ${animatedEfficiency > 0 ? 'text-success' : 'text-warning'}`}
                            style={{ transition: 'color 0.3s ease' }}
                        >
                            {animatedEfficiency > 0 ? '+' : ''}{animatedEfficiency.toFixed(1)}%
                        </span>
                    </div>
                    <div style={{ borderLeft: '1px solid #555', paddingLeft: '16px' }}>
                        <small className="text-muted d-block">Potensi Hemat Biaya</small>
                        <span
                            className={`fw-bold fs-6 ${animatedCost > 0 ? 'text-info' : (animatedCost < 0 ? 'text-danger' : 'text-warning')}`}
                            style={{ transition: 'color 0.3s ease' }}
                        >
                            {animatedCost > 0 ? '💰 ' : ''}{formatCurrency(animatedCost)}
                        </span>
                    </div>
                </div>
            </div>

            {/* Close Button - Simple Red X */}
            <div style={{ position: 'absolute', top: '16px', right: '16px', zIndex: 1000 }}>
                <Button 
                    variant="danger" 
                    size="sm" 
                    onClick={onClose} 
                    className="rounded-circle p-2 d-flex align-items-center justify-content-center shadow-lg"
                    style={{ width: '32px', height: '32px' }}
                >
                    <X size={20} strokeWidth={3} />
                </Button>
            </div>

            <Split
                className="d-flex h-100"
                sizes={[50, 50]}
                minSize={300}
                gutterSize={6}
                style={{ height: '100%' }}
            >
                {/* As-Is (Left - Read Only) */}
                <div style={{ height: '100%', position: 'relative' }}>
                    <div style={{
                        position: 'absolute', top: 8, left: 8, zIndex: 10,
                        backgroundColor: 'rgba(220,53,69,0.9)', color: '#fff',
                        padding: '4px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 700,
                    }}>
                        📋 KONDISI SAAT INI (As-Is) — Hanya Baca
                    </div>
                    <ReactFlow
                        nodes={asIsNodesCopy}
                        edges={asIsEdgesCopy}
                        nodeTypes={asIsNodeTypes}
                        edgeTypes={edgeTypes}
                        defaultEdgeOptions={defaultEdgeOptions}
                        fitView
                        nodesDraggable={false}
                        nodesConnectable={false}
                        elementsSelectable={false}
                        panOnScroll
                        style={{ backgroundColor: '#fff5f5' }}
                    >
                        <Controls showInteractive={false} />
                        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#fdd" />
                    </ReactFlow>
                </div>

                {/* To-Be (Right - Editable) */}
                <div style={{ height: '100%', position: 'relative' }}>
                    <div style={{
                        position: 'absolute', top: 8, left: 8, zIndex: 10,
                        backgroundColor: 'rgba(25,135,84,0.9)', color: '#fff',
                        padding: '4px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 700,
                    }}>
                        ✏️ KONDISI TARGET (To-Be)
                    </div>

                    <Panel position="bottom-right" style={{ marginBottom: '80px', marginRight: '16px' }}>
                        <div className="d-flex flex-column gap-3">
                            <Dropdown drop="up">
                                <Dropdown.Toggle 
                                    as={motion.button}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    variant="success" 
                                    className="rounded-circle p-0 d-flex align-items-center justify-content-center shadow-lg border-0"
                                    style={{ width: '48px', height: '48px' }}
                                    title="Tambah Node"
                                >
                                    <Plus size={24} />
                                </Dropdown.Toggle>
                                <Dropdown.Menu>
                                    <Dropdown.Item onClick={() => handleAddNode('process')}>
                                        <Activity size={14} className="me-2" /> Langkah Proses (Kotak)
                                    </Dropdown.Item>
                                    <Dropdown.Item onClick={() => handleAddNode('decision')}>
                                        <Plus size={14} className="me-2 text-warning" /> Cabang Keputusan (Wajik)
                                    </Dropdown.Item>
                                </Dropdown.Menu>
                            </Dropdown>
                            
                            <Button 
                                as={motion.button}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                variant="primary" 
                                onClick={handleSave}
                                disabled={isSaving}
                                className="rounded-circle p-0 d-flex align-items-center justify-content-center shadow-lg border-0"
                                style={{ width: '48px', height: '48px' }}
                                title={isSaving ? 'Menyimpan...' : 'Simpan Versi Target'}
                            >
                                <Save size={24} />
                            </Button>

                            <Button 
                                as={motion.button}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                variant="info" 
                                onClick={() => fileInputRef.current?.click()}
                                className="rounded-circle p-0 d-flex align-items-center justify-content-center shadow-lg border-0 text-white"
                                style={{ width: '48px', height: '48px' }}
                                title="Impor Data Target (Unggah JSON)"
                            >
                                <Upload size={24} />
                            </Button>

                            <Button 
                                as={motion.button}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                variant="warning" 
                                onClick={handleExportJSON}
                                className="rounded-circle p-0 d-flex align-items-center justify-content-center shadow-lg border-0 text-white"
                                style={{ width: '48px', height: '48px' }}
                                title="Ekspor Data Target (Unduh JSON)"
                            >
                                <Download size={24} />
                            </Button>
                        </div>
                    </Panel>

                    <ReactFlow
                        nodes={toBeNodes}
                        edges={toBeEdges}
                        onNodesChange={onToBeNodesChange}
                        onEdgesChange={onToBeEdgesChange}
                        nodeTypes={toBeNodeTypes}
                        edgeTypes={edgeTypes}
                        onNodeDoubleClick={handleNodeDoubleClick}
                        onConnect={onConnect}
                        connectionMode="loose"
                        defaultEdgeOptions={defaultEdgeOptions}
                        fitView
                        panOnScroll
                        style={{ backgroundColor: '#f5fff5' }}
                    >
                        <Controls />
                        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#dfd" />
                    </ReactFlow>
                </div>
            </Split>

            {/* Modal Edit for To-Be */}
            <NodeEditModal
                show={editModal.show}
                onHide={() => setEditModal({ show: false, node: null })}
                node={editModal.node}
                onSave={handleSaveNode}
                onDelete={handleDeleteNode}
            />
            <input 
                type="file" 
                ref={fileInputRef} 
                style={{ display: 'none' }} 
                accept=".json" 
                onChange={handleImportJSON} 
            />
        </div>
    );
};

export default ToBeSimulator;
