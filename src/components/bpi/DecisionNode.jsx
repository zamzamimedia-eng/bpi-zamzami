import { Position } from '@xyflow/react';
import { memo } from 'react';
import QuickAddHandle from './QuickAddHandle';
import QuickAddButton from './QuickAddButton';
import { useTheme } from '@/layout/theme-provider/theme-provider';

const DecisionNode = memo(({ data, id, heatmapMode, connectedHandles = {} }) => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const style = {
        width: '120px',
        height: '120px',
        transform: 'rotate(45deg)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: '2px solid',
        borderColor: heatmapMode ? '#6c757d' : (isDark ? '#3b82f6' : '#0d6efd'),
        backgroundColor: heatmapMode ? 'rgba(13, 110, 253, 0.1)' : (isDark ? 'rgba(30, 41, 59, 0.8)' : '#e7f1ff'),
        cursor: 'pointer',
        transition: 'all 0.3s ease',
    };

    return (
        <div className="decision-node-container" style={{ position: 'relative' }}>
            {/* Diamond shape */}
            <div style={style}>
                <div style={{ 
                    transform: 'rotate(-45deg)', 
                    textAlign: 'center', 
                    fontSize: '11px', 
                    fontWeight: 600, 
                    color: heatmapMode ? '#fff' : (isDark ? '#eff6ff' : '#0d6efd'), 
                    padding: '4px' 
                }}>
                    {data.question || data.label || '?'}
                </div>
            </div>

            {/* Handle dots only - positioned precisely on the rotated diamond edges, rendered after content for z-index */}
            <QuickAddHandle type="target" position={Position.Left} nodeId={id} style={{ left: '-25px' }} />
            <QuickAddHandle type="source" position={Position.Right} id="yes" nodeId={id} style={{ right: '17.5px', top: '17.5px' }} />
            <QuickAddHandle type="source" position={Position.Right} id="no" nodeId={id} style={{ right: '17.5px', top: '102.5px' }} />
            <QuickAddHandle type="target" position={Position.Top} id="top" nodeId={id} style={{ top: '-25px' }} />
            <QuickAddHandle type="source" position={Position.Bottom} id="bottom" nodeId={id} style={{ bottom: '-25px' }} />

            {/* + buttons — safely resting inside the rotated diamond edges */}
            <QuickAddButton nodeId={id} position="left" isConnected={connectedHandles.target} style={{ left: '-10px' }} />
            <QuickAddButton nodeId={id} handleId="yes" position="right" isConnected={connectedHandles.yes} style={{ right: '28px', top: '28px' }} />
            <QuickAddButton nodeId={id} handleId="no" position="right" isConnected={connectedHandles.no} style={{ right: '28px', top: '92px' }} />
            <QuickAddButton nodeId={id} handleId="top" position="top" isConnected={connectedHandles.top} style={{ top: '-10px' }} />
            <QuickAddButton nodeId={id} handleId="bottom" position="bottom" isConnected={connectedHandles.bottom} style={{ bottom: '-10px' }} />
        </div>
    );
});

DecisionNode.displayName = 'DecisionNode';
export default DecisionNode;
