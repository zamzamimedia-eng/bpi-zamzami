"use client"
import { useState, useEffect } from 'react';
import { Offcanvas, Form, Button, Badge } from 'react-bootstrap';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/layout/theme-provider/theme-provider';

const RootCauseDrawer = ({ show, onHide, node, rootCauseData, onSave, onDelete }) => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const [whys, setWhys] = useState(['', '', '', '', '']);
    const [problemStatement, setProblemStatement] = useState('');
    const [revealedCount, setRevealedCount] = useState(1);

    useEffect(() => {
        if (node && rootCauseData && rootCauseData[node.id]) {
            const data = rootCauseData[node.id];
            setProblemStatement(data.problemStatement || '');
            setWhys(data.whys || ['', '', '', '', '']);
            // Reveal up to the last filled + 1
            const lastFilled = data.whys ? data.whys.findLastIndex(w => w.trim() !== '') : -1;
            setRevealedCount(Math.min(lastFilled + 2, 5));
        } else {
            setWhys(['', '', '', '', '']);
            setProblemStatement('');
            setRevealedCount(1);
        }
    }, [node, rootCauseData]);

    const handleWhyChange = (index, value) => {
        const newWhys = [...whys];
        newWhys[index] = value;
        setWhys(newWhys);
    };

    const handleWhySubmit = (index) => {
        if (whys[index].trim() && index < 4 && revealedCount <= index + 1) {
            setRevealedCount(index + 2);
        }
    };

    const handleSave = () => {
        if (node) {
            onSave(node.id, { problemStatement, whys });
        }
        onHide();
    };

    const handleDelete = () => {
        if (window.confirm('Hapus seluruh analisis akar masalah untuk langkah ini?')) {
            if (node) {
                onDelete(node.id);
            }
            onHide();
        }
    };

    const getDurationText = () => {
        if (!node?.data) return '';
        return `${node.data.duration || 0} ${node.data.durationUnit || 'menit'}`;
    };

    const whyLabels = [
        'Mengapa proses ini lambat/bermasalah?',
        'Mengapa hal di atas terjadi?',
        'Mengapa kondisi tersebut muncul?',
        'Mengapa penyebab itu belum diperbaiki?',
        'Mengapa (Akar Masalah / Root Cause)?',
    ];

    return (
        <Offcanvas 
            show={show} 
            onHide={onHide} 
            placement="end" 
            style={{ 
                width: '450px',
                backgroundColor: isDark ? '#1e293b' : '#fff',
                color: isDark ? '#f1f5f9' : '#333'
            }}
        >
            <Offcanvas.Header 
                closeButton 
                closeVariant={isDark ? 'white' : undefined}
                style={{ 
                    backgroundColor: isDark ? '#0f172a' : '#f8f9fa',
                    borderBottom: isDark ? '1px solid #334155' : '1px solid #dee2e6'
                }}
            >
                <Offcanvas.Title style={{ color: isDark ? '#f1f5f9' : '#0f172a' }}>
                    🔬 Bedah Akar Masalah
                </Offcanvas.Title>
            </Offcanvas.Header>
            <Offcanvas.Body>
                {node && (
                    <>
                        {/* Node Info */}
                        <div className="p-3 rounded mb-4" style={{ backgroundColor: 'rgba(220,53,69,0.1)', border: '1px solid rgba(220,53,69,0.3)' }}>
                            <div className="d-flex justify-content-between align-items-start">
                                <div>
                                    <h6 className="mb-1">{node.data?.action || node.data?.label}</h6>
                                    <small className="text-muted">{node.data?.role}</small>
                                </div>
                                <Badge bg="danger" className="px-2 py-1">
                                    ⏱️ {getDurationText()}
                                </Badge>
                            </div>
                        </div>

                        {/* Problem Statement */}
                        <Form.Group className="mb-4">
                            <Form.Label className="fw-bold">📋 Gejala / Problem Statement</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={2}
                                placeholder="Deskripsikan gejala masalah yang terlihat..."
                                value={problemStatement}
                                onChange={e => setProblemStatement(e.target.value)}
                            />
                        </Form.Group>

                        {/* 5 Whys Progressive */}
                        <h6 className="fw-bold mb-3">🔍 Analisis 5 Mengapa (5 Whys)</h6>

                        <AnimatePresence>
                            {whyLabels.map((label, index) => (
                                index < revealedCount && (
                                    <motion.div
                                        key={index}
                                        initial={{ opacity: 0, y: 20, height: 0 }}
                                        animate={{ opacity: 1, y: 0, height: 'auto' }}
                                        exit={{ opacity: 0, y: -20 }}
                                        transition={{ duration: 0.4, ease: 'easeOut' }}
                                        className="mb-3"
                                    >
                                        <div className="d-flex align-items-center gap-2 mb-1">
                                            <Badge bg={index === 4 ? 'danger' : 'primary'} className="rounded-circle" style={{ width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px' }}>
                                                {index + 1}
                                            </Badge>
                                            <Form.Label className="mb-0 small fw-semibold">{label}</Form.Label>
                                        </div>
                                        <Form.Control
                                            as="textarea"
                                            rows={2}
                                            placeholder={`Jawaban mengapa ke-${index + 1}...`}
                                            value={whys[index]}
                                            onChange={e => handleWhyChange(index, e.target.value)}
                                            onKeyDown={e => {
                                                if (e.key === 'Enter' && !e.shiftKey) {
                                                    e.preventDefault();
                                                    handleWhySubmit(index);
                                                }
                                            }}
                                            onBlur={() => handleWhySubmit(index)}
                                            style={{
                                                borderLeft: `3px solid ${index === 4 ? '#dc3545' : '#0d6efd'}`,
                                            }}
                                        />
                                        {index < 4 && whys[index].trim() && revealedCount <= index + 1 && (
                                            <small className="text-muted mt-1 d-block">
                                                Tekan Enter untuk lanjut ke &quot;Mengapa&quot; berikutnya ↓
                                            </small>
                                        )}
                                    </motion.div>
                                )
                            ))}
                        </AnimatePresence>

                        {/* Root Cause Summary */}
                        {whys[4] && whys[4].trim() && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="p-3 rounded mt-3"
                                style={{ backgroundColor: 'rgba(220,53,69,0.1)', border: '2px solid #dc3545' }}
                            >
                                <h6 className="text-danger mb-1">🎯 Akar Masalah Ditemukan!</h6>
                                <p className="mb-0 small">{whys[4]}</p>
                            </motion.div>
                        )}

                        {/* Buttons */}
                        <div className="d-grid gap-2 mt-4">
                            <Button variant="primary" onClick={handleSave}>
                                💾 Simpan Analisis
                            </Button>
                            {(problemStatement || whys.some(w => w.trim())) && (
                                <Button variant="outline-danger" size="sm" onClick={handleDelete} className="border-0">
                                    🗑️ Hapus Analisis
                                </Button>
                            )}
                        </div>
                    </>
                )}
            </Offcanvas.Body>
        </Offcanvas>
    );
};

export default RootCauseDrawer;
