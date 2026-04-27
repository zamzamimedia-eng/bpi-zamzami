"use client"
import { Position } from '@xyflow/react';
import { memo, useMemo, useState } from 'react';
import QuickAddHandle from './QuickAddHandle';
import QuickAddButton from './QuickAddButton';
import { useTheme } from '@/layout/theme-provider/theme-provider';

const ProcessNode = memo(({ data, id, heatmapMode, allNodes, connectedHandles = {}, taskStatus, hasRootCause, isBpmProject, hasSubCanvas, projectId }) => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const [isHovered, setIsHovered] = useState(false);
    
    // Status color mapping
    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'done': return '#198754';
            case 'doing': return '#ffc107';
            case 'todo': return '#0d6efd';
            default: return null;
        }
    };

    const statusColor = getStatusColor(taskStatus);

    // Convert duration to minutes for comparison
    const getDurationMinutes = (node) => {
        const d = node.data?.duration || 0;
        const unit = node.data?.durationUnit || 'menit';
        if (unit === 'jam') return d * 60;
        if (unit === 'hari') return d * 480;
        return d;
    };

    const durationMinutes = getDurationMinutes({ data });
    const formatRupiah = (number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            maximumFractionDigits: 0
        }).format(number || 0);
    };

    // Calculate heatmap color
    const heatmapColor = useMemo(() => {
        if (!heatmapMode || !allNodes || allNodes.length === 0) return null;
        const processNodes = allNodes.filter(n => n.type === 'process' && n.data?.duration > 0);
        if (processNodes.length === 0) return null;

        const durations = processNodes.map(n => getDurationMinutes(n)).sort((a, b) => a - b);
        const threshold80 = durations[Math.floor(durations.length * 0.8)] || durations[durations.length - 1];
        const threshold40 = durations[Math.floor(durations.length * 0.4)] || durations[0];

        if (durationMinutes >= threshold80) return 'red';
        if (durationMinutes >= threshold40) return 'yellow';
        return 'green';
    }, [heatmapMode, allNodes, durationMinutes]);

    const stringToColor = (str) => {
        if (!str || str === '👤 Peran') return null;
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }
        const hue = Math.abs(hash) % 360;
        return `hsl(${hue}, ${isDark ? '50%' : '80%'}, ${isDark ? '25%' : '90%'})`;
    };

    const roleColor = stringToColor(data.role);

    const getNodeStyle = () => {
        const base = {
            padding: '12px 16px',
            borderRadius: '12px',
            minWidth: '180px',
            maxWidth: '220px',
            border: '2px solid',
            transition: 'all 0.4s ease',
            cursor: 'pointer',
        };

        if (heatmapMode) {
            if (heatmapColor === 'red') {
                return {
                    ...base,
                    backgroundColor: 'rgba(220, 53, 69, 0.15)',
                    borderColor: '#dc3545',
                    color: '#fff',
                    animation: 'bottleneck-pulse 1.5s ease-in-out infinite',
                    boxShadow: '0 0 15px rgba(220, 53, 69, 0.6)',
                };
            }
            if (heatmapColor === 'yellow') {
                return {
                    ...base,
                    backgroundColor: 'rgba(255, 193, 7, 0.15)',
                    borderColor: '#ffc107',
                    color: '#fff',
                };
            }
            return {
                ...base,
                backgroundColor: 'rgba(25, 135, 84, 0.15)',
                borderColor: '#198754',
                color: '#fff',
            };
        }

        const baseBgColor = roleColor || (isDark ? '#1e293b' : '#fff');

        return {
            ...base,
            backgroundColor: baseBgColor,
            borderColor: statusColor || (isDark ? '#334155' : '#e0e0e0'),
            color: isDark ? '#f1f5f9' : '#333',
            boxShadow: statusColor 
                ? `0 0 10px ${statusColor}44` 
                : (isDark ? '0 4px 12px rgba(0,0,0,0.5)' : '0 2px 8px rgba(0,0,0,0.08)'),
        };
    };

    const formatDuration = () => {
        if (!data.duration || data.duration === 0) return '';
        return `⏱️ ${data.duration} ${data.durationUnit || 'menit'}`;
    };

    const getStatusLabel = (status) => {
        switch (status?.toLowerCase()) {
            case 'done': return 'SELESAI';
            case 'doing': return 'PROSES';
            case 'todo': return 'TUNGGU';
            default: return null;
        }
    };

    return (
        <div style={{ position: 'relative' }} onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
            {/* Status Badge removed as per user request */}

            {/* Node content */}
            <div style={getNodeStyle()}>
                {/* Step Number Badge */}
                {data.stepNumber && (
                    <div style={{
                        position: 'absolute',
                        top: '-10px',
                        right: '-10px',
                        width: '24px',
                        height: '24px',
                        backgroundColor: statusColor || (isDark ? '#3b82f6' : '#2563eb'),
                        color: '#fff',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '11px',
                        fontWeight: 'bold',
                        border: '2px solid #fff',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                        zIndex: 5
                    }}>
                        {data.stepNumber}
                    </div>
                )}
                {/* Sub-Canvas Indicator */}
                {hasSubCanvas && (
                    <div style={{
                        position: 'absolute',
                        top: '-10px',
                        left: hasRootCause ? '20px' : '-10px',
                        width: '24px',
                        height: '24px',
                        backgroundColor: '#ffc107',
                        color: '#000',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '11px',
                        fontWeight: 'bold',
                        border: '2px solid #fff',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                        zIndex: 5
                    }} title="Sub-Kanvas (SBPM) Tersedia">
                        📂
                    </div>
                )}
                {/* 5 Whys Indicator */}
                {hasRootCause && (
                    <div style={{
                        position: 'absolute',
                        top: '-10px',
                        left: '-10px',
                        width: '24px',
                        height: '24px',
                        backgroundColor: '#dc3545',
                        color: '#fff',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '11px',
                        fontWeight: 'bold',
                        border: '2px solid #fff',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                        zIndex: 5
                    }} title="Analisis Akar Masalah (5 Whys) Tersedia">
                        🔬
                    </div>
                )}
                <div style={{ fontSize: '11px', opacity: 0.7, marginBottom: '4px' }}>
                    {data.role || '👤 Peran'}
                </div>
                <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: '4px' }}>
                    {data.action || data.label || 'Langkah Proses'}
                </div>
                <div className="d-flex flex-column gap-1 mt-2">
                    {data.duration > 0 && (
                        <div style={{
                            fontSize: '11px',
                            padding: '2px 8px',
                            borderRadius: '20px',
                            backgroundColor: heatmapMode
                                ? (heatmapColor === 'red' ? 'rgba(220,53,69,0.3)' : heatmapColor === 'yellow' ? 'rgba(255,193,7,0.3)' : 'rgba(25,135,84,0.3)')
                                : (isDark ? '#334155' : '#f0f0f0'),
                            color: isDark && !heatmapMode ? '#cbd5e1' : undefined,
                            alignSelf: 'flex-start',
                            fontWeight: 600
                        }}>
                            ⏱️ {data.duration} {data.durationUnit || 'menit'}
                        </div>
                    )}
                    {data.cost > 0 && (
                        <div style={{
                            fontSize: '11px',
                            padding: '2px 8px',
                            borderRadius: '20px',
                            backgroundColor: isDark ? 'rgba(16, 185, 129, 0.2)' : 'rgba(16, 185, 129, 0.1)',
                            color: isDark ? '#10b981' : '#059669',
                            alignSelf: 'flex-start',
                            fontWeight: 600
                        }}>
                            💰 {formatRupiah(data.cost)}
                        </div>
                    )}
                    {data.normTime && (() => {
                        const deadline = new Date(data.normTime);
                        const now = new Date();
                        const isOverdue = deadline < now;
                        const diffMs = deadline - now;
                        const diffMins = Math.abs(diffMs) / (1000 * 60);
                        let timeLabel = '';
                        if (diffMins < 60) timeLabel = `${Math.round(diffMins)} mnt`;
                        else if (diffMins < 1440) timeLabel = `${Math.round(diffMins / 60)} jam`;
                        else timeLabel = `${Math.round(diffMins / 1440)} hari`;
                        
                        return (
                            <div style={{
                                fontSize: '10px',
                                padding: '2px 8px',
                                borderRadius: '20px',
                                backgroundColor: isOverdue ? 'rgba(220, 53, 69, 0.2)' : 'rgba(13, 110, 253, 0.1)',
                                color: isOverdue ? '#dc3545' : (isDark ? '#93c5fd' : '#0d6efd'),
                                alignSelf: 'flex-start',
                                fontWeight: 600,
                                animation: isOverdue ? 'bottleneck-pulse 1.5s ease-in-out infinite' : 'none',
                            }}>
                                {isOverdue ? `🔴 -${timeLabel}` : `⏰ ${timeLabel}`}
                            </div>
                        );
                    })()}
                </div>
            </div>

            {/* Handle dots only - restored to the border, rendered after content for z-index */}
            <QuickAddHandle type="target" position={Position.Left} nodeId={id} />
            <QuickAddHandle type="source" position={Position.Right} nodeId={id} />
            <QuickAddHandle type="target" position={Position.Top} id="top" nodeId={id} />
            <QuickAddHandle type="source" position={Position.Bottom} id="bottom" nodeId={id} />

            {/* + buttons — OUTSIDE Handle, at node level */}
            <QuickAddButton nodeId={id} position="left" isConnected={connectedHandles.target} isNodeHovered={isHovered} />
            <QuickAddButton nodeId={id} position="right" isConnected={connectedHandles.source} isNodeHovered={isHovered} />
            <QuickAddButton nodeId={id} handleId="top" position="top" isConnected={connectedHandles.top} isNodeHovered={isHovered} />
            <QuickAddButton nodeId={id} handleId="bottom" position="bottom" isConnected={connectedHandles.bottom} isNodeHovered={isHovered} />
        </div>
    );
});

ProcessNode.displayName = 'ProcessNode';
export default ProcessNode;
