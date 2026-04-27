"use client"
import { useCallback, useState, useRef, useMemo, useEffect } from 'react';
import {
    ReactFlow,
    Controls,
    Background,
    useNodesState,
    useEdgesState,
    addEdge,
    MarkerType,
    Panel,
    BackgroundVariant,
    Position,
    ConnectionMode,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Button, Badge, Dropdown, Offcanvas, Form, Modal, ButtonGroup } from 'react-bootstrap';
import { Thermometer, GitBranch, Plus, Save, ArrowLeft, Columns, Maximize2, ZoomIn, ZoomOut, Trash2, Download, Upload } from 'react-feather';
import { useRouter, useParams } from 'next/navigation';
import ProcessNode from '@/components/bpi/ProcessNode';
import DecisionNode from '@/components/bpi/DecisionNode';
import InsertableEdge from '@/components/bpi/InsertableEdge';
import RootCauseDrawer from '@/components/bpi/RootCauseDrawer';
import ToBeSimulator from '@/components/bpi/ToBeSimulator';
import NodeEditModal from '@/components/bpi/NodeEditModal';
import { useTheme } from '@/layout/theme-provider/theme-provider';
import { useGlobalStateContext } from '@/context/GolobalStateProvider';

// Initial canvas data
const getInitialNodes = () => [];

const getInitialEdges = () => [];

const CanvasClient = () => {
    const router = useRouter();
    const params = useParams();
    const reactFlowWrapper = useRef(null);
    const { theme } = useTheme();
    const { states } = useGlobalStateContext();

    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [heatmapMode, setHeatmapMode] = useState(false);
    const [showDrawer, setShowDrawer] = useState(false);
    const [selectedNode, setSelectedNode] = useState(null);
    const [showSimulator, setShowSimulator] = useState(false);
    const [showNodeModal, setShowNodeModal] = useState(false);
    const [editNode, setEditNode] = useState(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newNodeType, setNewNodeType] = useState('process');
    const [reactFlowInstance, setReactFlowInstance] = useState(null);
    const [selectionMode, setSelectionMode] = useState(false);
    const [selectedElements, setSelectedElements] = useState({ nodes: [], edges: [] });
    const [history, setHistory] = useState({ past: [], future: [] });
    const [clipboard, setClipboard] = useState(null);
    const [rootCauseData, setRootCauseData] = useState({});
    const [processMapId, setProcessMapId] = useState(null);
    const [toBeCanvasJson, setToBeCanvasJson] = useState(null);
    const fileInputRef = useRef(null);
    const [taskStatusMap, setTaskStatusMap] = useState({});
    const [actors, setActors] = useState([]);
    const [canEdit, setCanEdit] = useState(true);
    const lastMousePos = useRef({ x: 200, y: 200 });
    const pasteCount = useRef(1);

    useEffect(() => {
        const handleMouseMove = (e) => {
            lastMousePos.current = { x: e.clientX, y: e.clientY };
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    useEffect(() => {
        const fetchActors = async () => {
            if (!states.tenantState.activeTenantId) return;
            try {
                const res = await fetch(`/api/actors?tenantId=${states.tenantState.activeTenantId}`);
                if (res.ok) {
                    const data = await res.json();
                    setActors(data);
                }
            } catch (err) {
                console.error('Error fetching actors:', err);
            }
        };
        fetchActors();
    }, [states.tenantState.activeTenantId]);

    // --- 2. CALLBACK HANDLERS ---
    const handleExportJSON = useCallback(() => {
        const canvasData = { nodes, edges, rootCauseData };
        const blob = new Blob([JSON.stringify(canvasData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `bpi-canvas-${params.id}-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }, [nodes, edges, rootCauseData, params.id]);

    const takeSnapshot = useCallback(() => {
        setHistory(prev => ({
            past: [...prev.past.slice(-19), { nodes, edges }],
            future: []
        }));
    }, [nodes, edges]);

    const handleImportJSON = useCallback((event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                if (data.nodes && Array.isArray(data.nodes)) {
                    takeSnapshot();
                    setNodes(data.nodes);
                    setEdges(data.edges || []);
                    setRootCauseData(data.rootCauseData || {});
                    alert('Data bagan berhasil diimpor! ✅');
                } else {
                    alert('Format file tidak valid! ❌ Pastikan file berisi data nodes dan edges.');
                }
            } catch (err) {
                console.error('Import Error:', err);
                alert('Gagal membaca file JSON ❌: ' + err.message);
            }
            // Reset input so the same file can be uploaded again
            event.target.value = '';
        };
        reader.readAsText(file);
    }, [takeSnapshot, setNodes, setEdges]);

    const undo = useCallback(() => {
        if (history.past.length === 0) return;
        const previous = history.past[history.past.length - 1];
        setHistory(prev => ({
            past: prev.past.slice(0, -1),
            future: [{ nodes, edges }, ...prev.future]
        }));
        setNodes(previous.nodes);
        setEdges(previous.edges);
    }, [history, nodes, edges, setNodes, setEdges]);

    const redo = useCallback(() => {
        if (history.future.length === 0) return;
        const next = history.future[0];
        setHistory(prev => ({
            past: [...prev.past, { nodes, edges }],
            future: prev.future.slice(1)
        }));
        setNodes(next.nodes);
        setEdges(next.edges);
    }, [history, nodes, edges, setNodes, setEdges]);

    const handleSaveCanvas = useCallback(async () => {
        const canvasData = { nodes, edges, rootCauseData };
        try {
            const res = await fetch(`/api/process-maps/${params.id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ canvas_json: JSON.stringify(canvasData) })
            });
            if (res.ok) {
                const data = await res.json();
                if (data.id) {
                    setProcessMapId(data.id);
                }
                alert('Kanvas berhasil disimpan ke Database! ✅');
            } else {
                const errorData = await res.json();
                alert(`Gagal menyimpan ke Database: ${errorData.message || 'Error tidak diketahui'}${errorData.error ? '\nDetail: ' + errorData.error : ''}`);
            }
        } catch (error) { 
            alert('Kesalahan koneksi saat menyimpan: ' + error.message); 
        }
    }, [nodes, edges, rootCauseData, params.id]);

    const handleDeleteSelected = useCallback(() => {
        const nodeIds = selectedElements.nodes.map(n => n.id);
        const edgeIds = selectedElements.edges.map(e => e.id);
        if (nodeIds.length === 0 && edgeIds.length === 0) return;
        if (confirm(`Hapus ${nodeIds.length} node dan ${edgeIds.length} garis yang dipilih?`)) {
            takeSnapshot();
            setNodes((nds) => nds.filter((node) => !nodeIds.includes(node.id)));
            setEdges((eds) => eds.filter((edge) => !edgeIds.includes(edge.id) && !nodeIds.includes(edge.source) && !nodeIds.includes(edge.target)));
            setSelectedElements({ nodes: [], edges: [] });
        }
    }, [selectedElements, setNodes, setEdges, takeSnapshot]);

    const copy = useCallback(() => {
        if (selectedElements.nodes.length === 0) return;
        pasteCount.current = 1;
        setClipboard({
            nodes: JSON.parse(JSON.stringify(selectedElements.nodes)),
            edges: JSON.parse(JSON.stringify(selectedElements.edges))
        });
    }, [selectedElements]);

    const paste = useCallback(() => {
        if (!clipboard) return;
        takeSnapshot();
        const idMap = {};
        const offset = pasteCount.current * 40;
        const newNodes = clipboard.nodes.map(node => {
            const newId = `node_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
            idMap[node.id] = newId;
            return {
                ...node,
                id: newId,
                position: { x: node.position.x + offset, y: node.position.y + offset },
                selected: true
            };
        });
        pasteCount.current += 1;
        const newEdges = clipboard.edges.map(edge => {
            if (idMap[edge.source] && idMap[edge.target]) {
                return {
                    ...edge,
                    id: `e-${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                    source: idMap[edge.source],
                    target: idMap[edge.target],
                    selected: true
                };
            }
            return null;
        }).filter(Boolean);
        setNodes(nds => [...nds.map(n => ({ ...n, selected: false })), ...newNodes]);
        setEdges(eds => [...eds.map(e => ({ ...e, selected: false })), ...newEdges]);
    }, [clipboard, setNodes, setEdges, takeSnapshot]);

    const cut = useCallback(() => {
        copy();
        handleDeleteSelected();
    }, [copy, handleDeleteSelected]);

    const handleNodeClick = useCallback((_, node) => {
        if (heatmapMode && node.type === 'process') {
            setSelectedNode(node);
            setShowDrawer(true);
        }
        // Single click mod disabled based on user request (for drag/pan)
    }, [heatmapMode]);

    const onNodeDoubleClick = useCallback((_, node) => {
        setEditNode(node);
        setShowNodeModal(true);
    }, []);

    const onSelectionChange = useCallback((elements) => {
        setSelectedElements({
            nodes: elements.nodes || [],
            edges: elements.edges || []
        });
    }, []);

    const handleAddNode = useCallback((type) => {
        takeSnapshot();
        const id = `node_${Date.now()}`;
        
        // Use true reactFlow window screen to canvas projection relative coords
        const position = reactFlowInstance 
            ? reactFlowInstance.screenToFlowPosition({ x: lastMousePos.current.x, y: lastMousePos.current.y }) 
            : { x: Math.random() * 400, y: Math.random() * 400 };

        const newNode = {
            id,
            type,
            position,
            data: type === 'process' 
                ? { label: 'Langkah Baru', role: '👤 Peran', action: 'Aksi Baru', duration: 1, durationUnit: 'jam', cost: 0 }
                : { label: 'Keputusan Baru', question: 'Pertanyaan?' },
        };
        setNodes((nds) => nds.concat(newNode));
    }, [setNodes, takeSnapshot]);

    const handleSaveNode = useCallback((newData) => {
        if (!editNode) return;
        takeSnapshot();
        setNodes((nds) =>
            nds.map((node) => {
                if (node.id === editNode.id) {
                    return { ...node, data: { ...node.data, ...newData } };
                }
                return node;
            })
        );
        setShowNodeModal(false);
        setEditNode(null);
    }, [editNode, setNodes, takeSnapshot]);

    const handleDeleteRootCause = useCallback(async (nodeId) => {
        setRootCauseData(prev => {
            const newData = { ...prev };
            delete newData[nodeId];
            return newData;
        });
        if (processMapId) {
            try {
                await fetch('/api/rca', {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ processMapId, nodeId }),
                });
            } catch (err) { console.error('Error deleting RCA:', err); }
        }
    }, [processMapId]);

    const handleDeleteNode = useCallback((nodeId) => {
        if (confirm('Hapus node ini?')) {
            takeSnapshot();
            setNodes((nds) => nds.filter((node) => node.id !== nodeId));
            setEdges((eds) => eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId));
            setShowNodeModal(false);
            setEditNode(null);
            handleDeleteRootCause(nodeId);
        }
    }, [setNodes, setEdges, takeSnapshot, handleDeleteRootCause]);

    const handleSaveRootCause = useCallback(async (nodeId, data) => {
        setRootCauseData(prev => ({ ...prev, [nodeId]: data }));
        if (processMapId) {
            try {
                await fetch('/api/rca', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ processMapId, nodeId, problemStatement: data.problemStatement, whys: data.whys }),
                });
            } catch (err) { console.error('Error saving RCA:', err); }
        }
    }, [processMapId]);

    const handleInsertNode = useCallback((edgeId, sourceId, targetId, midX, midY) => {
        takeSnapshot();
        const newId = `node_${Date.now()}`;
        const newNode = {
            id: newId,
            type: 'process',
            position: { x: midX - 90, y: midY - 40 },
            data: { label: 'Langkah Baru', role: '👤 Peran', action: 'Aksi Baru', duration: 1, durationUnit: 'jam', cost: 0 },
        };
        const oldEdge = edges.find(e => e.id === edgeId);
        const edgeStyle = oldEdge?.style || { stroke: '#6c757d' };

        setNodes(nds => [...nds, newNode]);
        const strokeColor = '#6c757d'; // Standard gray
        setEdges(eds => {
            const filtered = eds.filter(e => e.id !== edgeId);
            return [
                ...filtered,
                { id: `e-${sourceId}-${newId}`, source: sourceId, target: newId, type: 'insertable', markerEnd: { type: MarkerType.ArrowClosed, color: strokeColor }, style: { stroke: strokeColor, strokeWidth: 2 } },
                { id: `e-${newId}-${targetId}`, source: newId, target: targetId, type: 'insertable', markerEnd: { type: MarkerType.ArrowClosed, color: strokeColor }, style: { stroke: strokeColor, strokeWidth: 2 } },
            ];
        });
    }, [edges, setNodes, setEdges, takeSnapshot]);

    const onConnect = useCallback((params) => {
        takeSnapshot();
        const strokeColor = '#6c757d'; // Standard gray
        setEdges((eds) => addEdge({ 
            ...params, 
            type: 'insertable', 
            markerEnd: { type: MarkerType.ArrowClosed, color: strokeColor, width: 20, height: 20 }, 
            style: { stroke: strokeColor, strokeWidth: 2 } 
        }, eds));
    }, [setEdges, takeSnapshot]);

    const handleQuickAddNode = useCallback((detail) => {
        const { sourceNodeId, sourceHandleId, sourceHandlePosition, newNodeType } = detail;
        takeSnapshot();

        const sourceNode = nodes.find(n => n.id === sourceNodeId);
        if (!sourceNode) return;

        const newNodeId = `node_${Date.now()}`;
        
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
                ? { label: 'Langkah Baru', role: '👤 Peran', action: 'Aksi Baru', duration: 1, durationUnit: 'jam', cost: 0 }
                : { label: 'Keputusan Baru', question: 'Pertanyaan?' },
        };

        const stroke = sourceHandleId === 'no' ? '#dc3545' : sourceHandleId === 'yes' ? '#198754' : '#6c757d';
        const newEdge = {
            id: `e-${sourceNodeId}-${newNodeId}`,
            source: sourceNodeId,
            target: newNodeId,
            sourceHandle: sourceHandleId,
            type: 'insertable',
            markerEnd: { type: MarkerType.ArrowClosed, color: stroke, width: 20, height: 20 },
            style: { stroke, strokeWidth: 2 }
        };

        setNodes(nds => [...nds, newNode]);
        setEdges(eds => [...eds, newEdge]);
    }, [nodes, setNodes, setEdges, takeSnapshot]);

    // --- 3. MEMOIZED TYPES & CONFIGS ---
    // Calculate which handles are connected per node
    const connectedHandlesMap = useMemo(() => {
        const map = {};
        edges.forEach(e => {
            // Source side: mark the source handle as connected
            if (!map[e.source]) map[e.source] = {};
            if (e.sourceHandle) {
                map[e.source][e.sourceHandle] = true; // 'yes' or 'no' for decision nodes
            } else {
                map[e.source].source = true; // default source for process nodes
            }
            // Target side: mark the target handle as connected
            if (!map[e.target]) map[e.target] = {};
            if (e.targetHandle) {
                map[e.target][e.targetHandle] = true;
            } else {
                map[e.target].target = true;
            }
        });
        return map;
    }, [edges]);

    const nodeTypes = useMemo(() => {
        // Calculate step numbers for process nodes
        const processNodes = nodes
            .filter(n => n.type === 'process')
            .sort((a, b) => {
                // Sort by Y (top to bottom), then by X (left to right)
                if (Math.abs(a.position.y - b.position.y) > 50) return a.position.y - b.position.y;
                return a.position.x - b.position.x;
            });
        
        const stepMap = {};
        processNodes.forEach((n, idx) => {
            stepMap[n.id] = idx + 1;
        });

        return {
            process: (props) => (
                <ProcessNode 
                    {...props} 
                    data={{ ...props.data, stepNumber: stepMap[props.id] }}
                    heatmapMode={heatmapMode} 
                    allNodes={nodes} 
                    connectedHandles={connectedHandlesMap[props.id] || {}} 
                    taskStatus={taskStatusMap[props.id]}
                    hasRootCause={!!rootCauseData[props.id] && (!!rootCauseData[props.id].problemStatement || rootCauseData[props.id].whys?.some(w => typeof w === 'string' && w.trim() !== ''))}
                />
            ),
            decision: (props) => (
                <DecisionNode 
                    {...props} 
                    heatmapMode={heatmapMode} 
                    connectedHandles={connectedHandlesMap[props.id] || {}} 
                />
            ),
        };
    }, [heatmapMode, nodes, connectedHandlesMap, taskStatusMap]);

    const edgeTypes = useMemo(() => ({
        insertable: InsertableEdge,
    }), []);

    // --- 4. LIFECYCLE EFFECTS ---
    useEffect(() => {
        const loadCanvas = async () => {
            try {
                const res = await fetch(`/api/process-maps/${params.id}`);
                const data = await res.json();
                console.log('[Canvas Load] API response:', { id: data?.id, hasCanvasJson: !!data?.canvas_json, canvasJsonType: typeof data?.canvas_json });
                
                if (data && data.canvas_json) {
                    // Handle both string and object formats
                    let parsed;
                    if (typeof data.canvas_json === 'string') {
                        parsed = JSON.parse(data.canvas_json);
                    } else {
                        parsed = data.canvas_json;
                    }
                    
                    // Handle double-stringified JSON edge case
                    if (typeof parsed === 'string') {
                        parsed = JSON.parse(parsed);
                    }
                    
                    console.log('[Canvas Load] Parsed canvas data:', { nodesCount: parsed?.nodes?.length, edgesCount: parsed?.edges?.length });
                    
                    setNodes(parsed.nodes || []);
                    const loadedEdges = (parsed.edges || []).map(e => {
                        // Fixup for missing sourceHandle in Decision branches
                        let sourceHandle = e.sourceHandle;
                        // Add safety check: ensure e.source is a string before calling .includes
                        if (!sourceHandle && typeof e.source === 'string' && e.source.includes('decision')) {
                            if (e.style?.stroke === '#198754') sourceHandle = 'yes';
                            else if (e.style?.stroke === '#dc3545') sourceHandle = 'no';
                        }
                        
                        return {
                            ...e,
                            sourceHandle,
                            type: e.type === 'smoothstep' || !e.type ? 'insertable' : e.type,
                        };
                    });
                    setEdges(loadedEdges);
                    if (data.id) setProcessMapId(data.id);
                    setRootCauseData(parsed.rootCauseData || {});
                    if (data.to_be_json) {
                        setToBeCanvasJson(data.to_be_json);
                    }
                    if (data.task_status_map) {
                        setTaskStatusMap(data.task_status_map);
                    }
                    if (data.can_edit !== undefined) {
                        setCanEdit(data.can_edit);
                    }
                } else {
                    console.log('[Canvas Load] No canvas data found, using empty canvas');
                    setNodes(getInitialNodes());
                    setEdges(getInitialEdges());
                }
            } catch (error) {
                console.error('[Canvas Load] Error loading canvas:', error);
                setNodes(getInitialNodes());
                setEdges(getInitialEdges());
            }
        };
        if (params.id) loadCanvas();
    }, [params.id, setNodes, setEdges]);

    useEffect(() => {
        if (!processMapId) return;
        const loadRCA = async () => {
            try {
                const res = await fetch(`/api/rca?processMapId=${processMapId}`);
                const data = await res.json();
                if (res.ok && Object.keys(data).length > 0) setRootCauseData(data);
            } catch (err) { console.error('Error loading RCA:', err); }
        };
        loadRCA();
    }, [processMapId]);

    useEffect(() => {
        const handleKeys = (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
            if (e.ctrlKey || e.metaKey) {
                switch (e.key.toLowerCase()) {
                    case 'z': e.preventDefault(); if (e.shiftKey) redo(); else undo(); break;
                    case 'y': e.preventDefault(); redo(); break;
                    case 'c': e.preventDefault(); copy(); break;
                    case 'v': e.preventDefault(); paste(); break;
                    case 'x': e.preventDefault(); cut(); break;
                    case 's': e.preventDefault(); handleSaveCanvas(); break;
                }
            } else if (e.key === 'Delete' || e.key === 'Backspace') {
                handleDeleteSelected();
            }
        };
        window.addEventListener('keydown', handleKeys);
        return () => window.removeEventListener('keydown', handleKeys);
    }, [undo, redo, copy, paste, cut, handleSaveCanvas, handleDeleteSelected]);

    useEffect(() => {
        const handleInsertEvent = (e) => handleInsertNode(e.detail.edgeId, e.detail.source, e.detail.target, e.detail.midX, e.detail.midY);
        const handleDeleteEdgeEvent = (e) => {
            takeSnapshot();
            setEdges(eds => eds.filter(edge => edge.id !== e.detail.edgeId));
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
    }, [handleInsertNode, handleQuickAddNode, takeSnapshot, setEdges]);




    // Calculate total duration for all process nodes
    const getTotalDurationMinutes = (nodeList) => {
        return nodeList.filter(n => n.type === 'process').reduce((sum, n) => {
            const d = n.data.duration || 0;
            const unit = n.data.durationUnit || 'menit';
            if (unit === 'jam') return sum + d * 60;
            if (unit === 'hari') return sum + d * 480;
            return sum + d;
        }, 0);
    };

    const handleSaveToBe = async (toBeData) => {
        try {
            console.log('[Canvas Save To-Be] Saving data to Project:', params.id);
            const res = await fetch(`/api/process-maps/${params.id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ to_be_json: JSON.stringify(toBeData) })
            });
            if (res.ok) {
                setToBeCanvasJson(JSON.stringify(toBeData));
                alert('Versi To-Be berhasil disimpan! ✅');
                return true;
            } else {
                const err = await res.json();
                alert('Gagal menyimpan versi To-Be ❌: ' + (err.message || 'Error server'));
                return false;
            }
        } catch (error) {
            console.error('Error saving To-Be:', error);
            alert('Kesalahan koneksi saat menyimpan To-Be ❌');
            return false;
        }
    };

    if (showSimulator) {
        return (
            <ToBeSimulator
                asIsNodes={nodes}
                asIsEdges={edges}
                toBeCanvasJson={toBeCanvasJson}
                nodeTypes={nodeTypes}
                onClose={() => setShowSimulator(false)}
                getTotalDurationMinutes={getTotalDurationMinutes}
                onSave={handleSaveToBe}
                taskStatusMap={taskStatusMap}
            />
        );
    }

    return (
        <div style={{ width: '100%', height: 'calc(100vh - 60px)' }} ref={reactFlowWrapper}>
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onNodeClick={handleNodeClick}
                onNodeDoubleClick={onNodeDoubleClick}
                onInit={setReactFlowInstance}
                onSelectionChange={onSelectionChange}
                connectionMode="loose"
                nodeTypes={nodeTypes}
                edgeTypes={edgeTypes}
                defaultEdgeOptions={{ 
                    type: 'insertable', 
                    markerEnd: { type: MarkerType.ArrowClosed, color: '#999' },
                    style: { strokeWidth: 2, stroke: '#999' }
                }}
                fitView
                minZoom={0.2}
                maxZoom={2}
                panOnScroll
                selectionOnDrag={selectionMode}
                panOnDrag={!selectionMode}
                selectionKeyCode="Shift"
                panActivationKeyCode="Shift"
                selectionMode={selectionMode ? 'full' : 'partial'}
                deleteKeyCode={['Backspace', 'Delete']}
                className={`${heatmapMode ? 'heatmap-mode' : ''} ${selectionMode ? 'selection-mode-active' : ''}`}
                style={{
                    backgroundColor: heatmapMode ? '#1a1a2e' : (theme === 'dark' ? '#0f172a' : '#fafafa'),
                    transition: 'background-color 0.5s ease',
                }}
            >
                <Controls />
                <Background variant={BackgroundVariant.Dots} gap={20} size={1} color={heatmapMode ? '#333' : (theme === 'dark' ? '#334155' : '#ddd')} />

                {/* Toolbar Panel */}
                <Panel position="top-left" className="d-flex gap-3 flex-wrap bg-white p-2 rounded-3 shadow-sm border border-light-subtle align-items-center">
                    {/* Group 1: Navigation */}
                    <Button 
                        variant="link" 
                        className="p-1 link-secondary text-decoration-none d-flex align-items-center gap-1" 
                        onClick={() => router.push('/process-maps')}
                        title="Kembali ke Daftar Map"
                    >
                        <ArrowLeft size={18} />
                    </Button>

                    <div className="vr text-secondary opacity-25" style={{ height: '20px' }}></div>

                    {/* Group 2: View Controls */}
                    <ButtonGroup size="sm">
                        <Button 
                            variant={heatmapMode ? 'danger' : 'outline-secondary'} 
                            onClick={() => setHeatmapMode(!heatmapMode)}
                            title={heatmapMode ? "Matikan Heatmap" : "Nyalakan Heatmap"}
                        >
                            <Thermometer size={14} className={heatmapMode ? "animate__animated animate__pulse animate__infinite" : ""} />
                        </Button>
                        <Button 
                            variant="outline-secondary" 
                            onClick={() => setShowSimulator(true)}
                            title="Bandingkan Saat Ini vs Target"
                        >
                            <Columns size={14} />
                        </Button>
                        <Button 
                            variant={selectionMode ? 'primary' : 'outline-secondary'} 
                            onClick={() => setSelectionMode(!selectionMode)} 
                            title={selectionMode ? "Mode Geser (Pan)" : "Mode Seleksi (Drag)"}
                        >
                            <Maximize2 size={14} />
                        </Button>
                    </ButtonGroup>

                    <div className="vr text-secondary opacity-25" style={{ height: '20px' }}></div>

                    {/* Group 3: History */}
                    <ButtonGroup size="sm">
                        <Button 
                            variant="outline-secondary" 
                            onClick={undo} 
                            disabled={history.past.length === 0}
                            title="Undo (Ctrl+Z)"
                        >
                            <ArrowLeft size={14} style={{ transform: 'rotate(45deg)' }} />
                        </Button>
                        <Button 
                            variant="outline-secondary" 
                            onClick={redo} 
                            disabled={history.future.length === 0}
                            title="Redo (Ctrl+Y)"
                        >
                            <ArrowLeft size={14} style={{ transform: 'rotate(135deg) scaleX(-1)' }} />
                        </Button>
                    </ButtonGroup>

                    <div className="vr text-secondary opacity-25" style={{ height: '20px' }}></div>

                    {/* Group 4: Actions */}
                    <div className="d-flex gap-2 align-items-center">
                        {canEdit && (
                            <>
                                {(selectedElements.nodes.length > 0 || selectedElements.edges.length > 0) && (
                                    <Button 
                                        variant="danger" 
                                        size="sm" 
                                        onClick={handleDeleteSelected} 
                                        className="d-flex align-items-center gap-1 animate__animated animate__fadeInDown"
                                        title="Hapus yang dipilih"
                                    >
                                        <Trash2 size={14} />
                                        <span style={{ fontSize: '11px', fontWeight: 600 }}>Hapus ({selectedElements.nodes.length + selectedElements.edges.length})</span>
                                    </Button>
                                )}
                                <div className="d-flex gap-1">
                                    <Button 
                                        variant="flush-info" 
                                        size="sm" 
                                        className="btn-icon btn-rounded flush-soft-hover"
                                        onClick={() => fileInputRef.current?.click()}
                                        title="Impor Data (Upload JSON)"
                                    >
                                        <Upload size={16} />
                                    </Button>
                                    <Button 
                                        variant="flush-warning" 
                                        size="sm" 
                                        className="btn-icon btn-rounded flush-soft-hover"
                                        onClick={handleExportJSON}
                                        title="Ekspor Data (Download JSON)"
                                    >
                                        <Download size={16} />
                                    </Button>
                                </div>
                            </>
                        )}

                        {!canEdit && (
                            <Badge bg="soft-warning" className="text-warning border border-warning-subtle d-flex align-items-center gap-1 px-2 py-1">
                                <Activity size={12} /> Read-Only
                            </Badge>
                        )}

                        {canEdit && (
                            <Button 
                                variant="success" 
                                size="sm" 
                                onClick={handleSaveCanvas} 
                                className="d-flex align-items-center gap-2 px-3 fw-bold shadow-sm"
                            >
                                <Save size={14} />
                                Simpan
                            </Button>
                        )}
                    </div>
                </Panel>

                {/* Add Node Panel */}
                {canEdit && (
                    <Panel position="top-right">
                        <Dropdown>
                            <Dropdown.Toggle variant="primary" size="sm" className="d-flex align-items-center gap-2 px-3 fw-bold shadow-sm rounded-pill">
                                <Plus size={16} strokeWidth={3} />
                                Tambah Node
                            </Dropdown.Toggle>
                            <Dropdown.Menu className="shadow border-0 animate__animated animate__fadeInUp animate__faster">
                                <Dropdown.Header className="text-uppercase small fw-bold text-muted px-3 pb-1">Elemen Proses</Dropdown.Header>
                                <Dropdown.Item onClick={() => handleAddNode('process')} className="py-2 px-3 d-flex align-items-center gap-2">
                                    <span style={{ fontSize: '18px' }}>📋</span> Langkah Proses
                                </Dropdown.Item>
                                <Dropdown.Item onClick={() => handleAddNode('decision')} className="py-2 px-3 d-flex align-items-center gap-2">
                                    <GitBranch size={16} className="text-primary" /> Cabang Keputusan
                                </Dropdown.Item>
                            </Dropdown.Menu>
                        </Dropdown>
                    </Panel>
                )}

                {/* Info Panel */}
                {heatmapMode && (
                    <Panel position="bottom-left">
                        <div className="bg-dark text-white p-3 rounded shadow" style={{ fontSize: '12px' }}>
                            <div className="fw-bold mb-2">🔍 Legenda Heatmap</div>
                            <div className="d-flex align-items-center gap-2 mb-1">
                                <span style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#198754', display: 'inline-block' }}></span>
                                <span>Efisien (cepat)</span>
                            </div>
                            <div className="d-flex align-items-center gap-2 mb-1">
                                <span style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#ffc107', display: 'inline-block' }}></span>
                                <span>Delay sedang</span>
                            </div>
                            <div className="d-flex align-items-center gap-2">
                                <span style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#dc3545', display: 'inline-block', animation: 'pulse 1.5s ease-in-out infinite' }}></span>
                                <span>⚠️ Bottleneck (Top 20%)</span>
                            </div>
                            <hr className="my-2 border-secondary" />
                            <small className="text-muted">Klik node merah untuk analisis 5 Whys</small>
                        </div>
                    </Panel>
                )}
            </ReactFlow>

            {/* Root Cause Drawer (5 Whys) */}
            <RootCauseDrawer
                show={showDrawer}
                onHide={() => setShowDrawer(false)}
                node={selectedNode}
                rootCauseData={rootCauseData}
                onSave={handleSaveRootCause}
                onDelete={handleDeleteRootCause}
            />

            {/* Node Edit Modal */}
            {editNode && (
                <NodeEditModal
                    show={showNodeModal}
                    onHide={() => { setShowNodeModal(false); setEditNode(null); }}
                    node={editNode}
                    onSave={handleSaveNode}
                    onDelete={handleDeleteNode}
                    actors={actors}
                    canEdit={canEdit}
                />
            )}

            <input 
                type="file" 
                ref={fileInputRef} 
                style={{ display: 'none' }} 
                accept=".json" 
                onChange={handleImportJSON} 
            />

            <style jsx global>{`
                .heatmap-mode .react-flow__edge-path {
                    stroke: #555 !important;
                }
                .heatmap-mode .react-flow__edge-text {
                    fill: #999 !important;
                }
                @keyframes pulse {
                    0%, 100% { opacity: 1; transform: scale(1); }
                    50% { opacity: 0.5; transform: scale(1.05); }
                }
                @keyframes bottleneck-pulse {
                    0%, 100% { box-shadow: 0 0 5px rgba(220,53,69,0.5); }
                    50% { box-shadow: 0 0 20px rgba(220,53,69,0.9), 0 0 40px rgba(220,53,69,0.3); }
                }
                @keyframes insert-pulse {
                    0%, 100% { box-shadow: 0 0 4px rgba(13,110,253,0.4); }
                    50% { box-shadow: 0 0 14px rgba(13,110,253,0.8); }
                }
            `}</style>
        </div>
    );
};

export default CanvasClient;
