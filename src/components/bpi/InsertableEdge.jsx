"use client"
import { memo, useState } from 'react';
import { BaseEdge, getSmoothStepPath, useReactFlow } from '@xyflow/react';

const InsertableEdge = memo(({
    id,
    source,
    target,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    markerEnd,
    style = {},
    label,
    labelStyle,
    data,
    selected,
}) => {
    const [hovered, setHovered] = useState(false);
    const isVisible = hovered || selected;

    const [edgePath, labelX, labelY] = getSmoothStepPath({
        sourceX,
        sourceY,
        targetX,
        targetY,
        sourcePosition,
        targetPosition,
        borderRadius: 0,
    });

    // Calculate midpoint for the + button
    const midX = (sourceX + targetX) / 2;
    const midY = (sourceY + targetY) / 2;

    const handleInsertClick = (e) => {
        e.stopPropagation();
        // Dispatch a custom event that CanvasClient will listen to
        window.dispatchEvent(new CustomEvent('insertNodeOnEdge', {
            detail: { edgeId: id, source, target, midX, midY }
        }));
    };

    const handleDeleteClick = (e) => {
        e.stopPropagation();
        if (confirm('Hapus garis ini?')) {
            window.dispatchEvent(new CustomEvent('deleteEdge', {
                detail: { edgeId: id }
            }));
        }
    };

    return (
        <>
            {/* Invisible wider path for easier hover detection */}
            <path
                d={edgePath}
                fill="none"
                stroke="transparent"
                strokeWidth={30}
                onMouseEnter={() => setHovered(true)}
                onMouseLeave={() => setHovered(false)}
            />

            {/* Visible edge */}
            <BaseEdge
                path={edgePath}
                markerEnd={markerEnd}
                style={style}
            />

            {/* Edge label */}
            {label && (
                <text>
                    <textPath
                        href={`#${id}`}
                        startOffset="50%"
                        textAnchor="middle"
                        style={{ fontSize: '12px', ...labelStyle }}
                    >
                        {label}
                    </textPath>
                </text>
            )}

            {/* Floating Buttons Group */}
            <foreignObject
                x={midX - 45}
                y={midY - 18}
                width={90}
                height={36}
                onMouseEnter={() => setHovered(true)}
                onMouseLeave={() => setHovered(false)}
                style={{
                    overflow: 'visible',
                    pointerEvents: 'all',
                }}
            >
                <div style={{
                    position: 'relative',
                    width: '100%',
                    height: '100%',
                    opacity: isVisible ? 1 : 0,
                    transition: 'opacity 0.2s ease, transform 0.2s ease',
                    transform: isVisible ? 'scale(1)' : 'scale(0.8)',
                    pointerEvents: isVisible ? 'all' : 'none'
                }}>
                    {/* + Button */}
                    <div
                        onClick={handleInsertClick}
                        title="Tambah Langkah Di Sini"
                        style={{
                            position: 'absolute',
                            left: '8px',
                            top: '4px',
                            width: 28,
                            height: 28,
                            borderRadius: '50%',
                            backgroundColor: '#0d6efd',
                            color: '#fff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '18px',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            boxShadow: '0 2px 8px rgba(13, 110, 253, 0.4)',
                            border: '2px solid #fff',
                            lineHeight: 1,
                        }}
                    >
                        +
                    </div>

                    {/* Delete Button */}
                    <div
                        onClick={handleDeleteClick}
                        title="Hapus Garis"
                        style={{
                            position: 'absolute',
                            right: '8px',
                            top: '4px',
                            width: 28,
                            height: 28,
                            borderRadius: '50%',
                            backgroundColor: '#dc3545',
                            color: '#fff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '14px',
                            cursor: 'pointer',
                            boxShadow: '0 2px 8px rgba(220, 53, 69, 0.4)',
                            border: '2px solid #fff',
                            lineHeight: 1,
                        }}
                    >
                        🗑️
                    </div>
                </div>
            </foreignObject>
        </>
    );
});

InsertableEdge.displayName = 'InsertableEdge';
export default InsertableEdge;
