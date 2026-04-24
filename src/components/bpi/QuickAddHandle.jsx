"use client"
import { Handle, Position } from '@xyflow/react';

// QuickAddHandle now ONLY renders the Handle dot — no button, no menu.
// The + button logic is handled at the Node level to avoid ReactFlow event conflicts.
const QuickAddHandle = ({ type, position, id, nodeId, style = {} }) => {
    return (
        <Handle 
            type="source" 
            position={position} 
            id={id || `${nodeId}-${type}-${position}`} 
            isConnectable={true}
            isValidConnection={() => true}
            style={{ 
                background: position === Position.Left ? '#0d6efd' : (id === 'no' ? '#dc3545' : id === 'yes' ? '#198754' : '#6c757d'),
                width: 14, 
                height: 14,
                border: '2px solid #fff',
                zIndex: 10000,
                pointerEvents: 'all',
                cursor: 'crosshair',
                ...style
            }} 
        />
    );
};

export default QuickAddHandle;
