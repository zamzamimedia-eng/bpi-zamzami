"use client"
import { useState, useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Plus, GitBranch, FileText } from 'react-feather';
import { useTheme } from '@/layout/theme-provider/theme-provider';

// This component renders the + button and popup menu OUTSIDE the Handle,
// at the node level, so ReactFlow does not intercept the events.
const QuickAddButton = ({ nodeId, handleId, position = 'right', style = {}, isConnected = false, isNodeHovered = false }) => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const [showMenu, setShowMenu] = useState(false);
    const [menuPos, setMenuPos] = useState({ x: 0, y: 0 });
    const btnRef = useRef(null);

    const onAddNode = useCallback((nodeType) => {
        const event = new CustomEvent('quickAddNode', {
            detail: {
                sourceNodeId: nodeId,
                sourceHandleId: handleId || null,
                sourceHandlePosition: position,
                newNodeType: nodeType,
            }
        });
        window.dispatchEvent(event);
        setShowMenu(false);
    }, [nodeId, handleId, position]);

    // Open menu and calculate portal position
    const toggleMenu = useCallback((e) => {
        e.stopPropagation();
        e.preventDefault();
        if (showMenu) {
            setShowMenu(false);
        } else {
            if (btnRef.current) {
                const rect = btnRef.current.getBoundingClientRect();
                if (position === 'right') {
                    setMenuPos({ x: rect.right + 8, y: rect.top + rect.height / 2 });
                } else if (position === 'left') {
                    setMenuPos({ x: rect.left - 8, y: rect.top + rect.height / 2 });
                } else if (position === 'top') {
                    setMenuPos({ x: rect.left + rect.width / 2, y: rect.top - 8 });
                } else if (position === 'bottom') {
                    setMenuPos({ x: rect.left + rect.width / 2, y: rect.bottom + 8 });
                }
            }
            setShowMenu(true);
        }
    }, [showMenu, position]);

    // Close on any click outside
    useEffect(() => {
        if (!showMenu) return;
        const close = (e) => {
            if (btnRef.current && btnRef.current.contains(e.target)) return;
            setShowMenu(false);
        };
        const timer = setTimeout(() => {
            document.addEventListener('pointerdown', close);
        }, 100);
        return () => {
            clearTimeout(timer);
            document.removeEventListener('pointerdown', close);
        };
    }, [showMenu]);

    if (isConnected) return null;

    const getPositionStyle = () => {
        if (position === 'right') return { right: '-12px', top: '50%', transform: 'translateY(-50%)' };
        if (position === 'left') return { left: '-12px', top: '50%', transform: 'translateY(-50%)' };
        if (position === 'top') return { top: '-12px', left: '50%', transform: 'translateX(-50%)' };
        if (position === 'bottom') return { bottom: '-12px', left: '50%', transform: 'translateX(-50%)' };
        return {};
    };

    const positionStyle = getPositionStyle();
    
    // Determine visibility based on hover or menu state
    const isVisible = isNodeHovered || showMenu;

    return (
        <>
            {/* The + button rendered OUTSIDE Handle, at node level */}
            <div
                ref={btnRef}
                className="nodrag nopan"
                onPointerDown={toggleMenu}
                onClick={(e) => e.stopPropagation()}
                onDoubleClick={(e) => e.stopPropagation()}
                style={{
                    position: 'absolute',
                    ...positionStyle,
                    ...style,
                    width: '18px',
                    height: '18px',
                    backgroundColor: showMenu ? (isDark ? '#2563eb' : '#0056b3') : (isDark ? '#3b82f6' : '#0d6efd'),
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    cursor: 'pointer',
                    boxShadow: isDark ? '0 2px 10px rgba(0,0,0,0.4)' : '0 2px 6px rgba(0,0,0,0.3)',
                    zIndex: 20,
                    opacity: isVisible ? 1 : 0,
                    pointerEvents: isVisible ? 'all' : 'none',
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    transform: `${positionStyle.transform || ''} ${showMenu ? 'scale(1.2) rotate(45deg)' : 'scale(1)'}`.trim(),
                }}
                onMouseEnter={(e) => {
                    if (!showMenu) e.currentTarget.style.backgroundColor = isDark ? '#2563eb' : '#0056b3';
                }}
                onMouseLeave={(e) => {
                    if (!showMenu) e.currentTarget.style.backgroundColor = isDark ? '#3b82f6' : '#0d6efd';
                }}
            >
                <Plus size={12} strokeWidth={3} />
            </div>

            {/* Portal menu rendered at document.body */}
            {showMenu && typeof document !== 'undefined' && createPortal(
                <div
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
                    style={{
                        position: 'fixed',
                        left: `${menuPos.x}px`,
                        top: `${menuPos.y}px`,
                        transform: position === 'top' ? 'translate(-50%, -100%)' : position === 'bottom' ? 'translateX(-50%)' : `translateY(-50%) ${position === 'left' ? 'translateX(-100%)' : ''}`,
                        marginLeft: (position === 'top' || position === 'bottom') ? '0' : (position === 'left' ? '-8px' : '8px'),
                        marginTop: position === 'top' ? '-8px' : position === 'bottom' ? '8px' : '0',
                        backgroundColor: isDark ? '#1e293b' : '#fff',
                        border: isDark ? '1px solid #334155' : '1px solid #e0e0e0',
                        borderRadius: '10px',
                        padding: '6px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px',
                        boxShadow: isDark ? '0 10px 25px rgba(0,0,0,0.5)' : '0 10px 25px rgba(0,0,0,0.2)',
                        zIndex: 999999,
                        width: 'max-content',
                    }}
                >
                    <button 
                        onClick={(e) => { e.stopPropagation(); onAddNode('process'); }}
                        style={{
                            border: 'none',
                            background: 'none',
                            padding: '8px 12px',
                            fontSize: '12px',
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            cursor: 'pointer',
                            borderRadius: '6px',
                            color: isDark ? '#f1f5f9' : '#333',
                            transition: 'all 0.2s',
                            textAlign: 'left',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = isDark ? '#334155' : '#f4f7fe';
                            e.currentTarget.style.color = isDark ? '#3b82f6' : '#0d6efd';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                            e.currentTarget.style.color = isDark ? '#f1f5f9' : '#333';
                        }}
                    >
                        <FileText size={14} /> Langkah Proses
                    </button>
                    <button 
                        onClick={(e) => { e.stopPropagation(); onAddNode('decision'); }}
                        style={{
                            border: 'none',
                            background: 'none',
                            padding: '8px 12px',
                            fontSize: '12px',
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            cursor: 'pointer',
                            borderRadius: '6px',
                            color: isDark ? '#f1f5f9' : '#333',
                            transition: 'all 0.2s',
                            textAlign: 'left',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = isDark ? '#334155' : '#f4f7fe';
                            e.currentTarget.style.color = isDark ? '#3b82f6' : '#0d6efd';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                            e.currentTarget.style.color = isDark ? '#f1f5f9' : '#333';
                        }}
                    >
                        <GitBranch size={14} /> Cabang Keputusan
                    </button>
                </div>,
                document.body
            )}
        </>
    );
};

export default QuickAddButton;
