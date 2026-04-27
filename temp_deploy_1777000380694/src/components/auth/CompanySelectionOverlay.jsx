'use client';

import { useState, useEffect } from 'react';
import { Button, Card, Container, Spinner } from 'react-bootstrap';
import { Briefcase, ArrowRight, LogOut } from 'react-feather';
import { useRouter } from 'next/navigation';

const CompanySelectionOverlay = () => {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selecting, setSelecting] = useState(false);

    useEffect(() => {
        const checkSelection = async () => {
            try {
                const res = await fetch('/api/auth/me');
                if (res.ok) {
                    const data = await res.json();
                    setUser(data);
                    // If tenant is already selected in cookies, we don't need the overlay
                    // We check if the cookie exists by looking at a specific field returned by /me
                    // but for more reliability, we can see if the app is already functional.
                    // Actually, let's use a flag from the API.
                    
                    // IF selectedTenantId matches one of the companies and is not null
                    if (data.selectedTenantId && data.companies.some(c => c.id == data.selectedTenantId)) {
                        setLoading(false);
                    } else {
                        setLoading(false); // Show the selection UI
                    }
                } else {
                    // Not logged in or error, layout will probably redirect anyway
                    setLoading(false);
                }
            } catch (error) {
                console.error('Auth Check Error:', error);
                setLoading(false);
            }
        };

        checkSelection();
    }, []);

    const handleSelectTenant = async (tenantId) => {
        setSelecting(true);
        try {
            const res = await fetch('/api/auth/select-tenant', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tenantId })
            });

            if (res.ok) {
                window.location.reload();
            }
        } catch (error) {
            console.error('Error selecting workspace:', error);
        } finally {
            setSelecting(false);
        }
    };

    const handleLogout = async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        router.push('/auth/login');
    };

    if (loading) return null;

    // Determine if we need to show labels
    const needsSelection = user && user.companies && user.companies.length > 0 && 
                          (!user.selectedTenantId || !user.companies.some(c => c.id == user.selectedTenantId));

    if (!needsSelection) return null;

    return (
        <div className="selection-overlay">
            <Container className="h-100 d-flex align-items-center justify-content-center">
                <Card className="border-0 shadow-xxl p-4 rounded-4 selection-card" style={{ maxWidth: '500px', width: '100%' }}>
                    <div className="text-center mb-4">
                        <div className="avatar avatar-xl avatar-primary avatar-rounded mb-3">
                            <span className="initial-wrap"><Briefcase size={32} /></span>
                        </div>
                        <h3 className="fw-bold mb-1">Pilih Perusahaan</h3>
                        <p className="text-muted">Silakan pilih perusahaan untuk melanjutkan ke dashboard.</p>
                    </div>

                    <div className="company-list mb-4">
                        {user.companies.map((company) => (
                            <Button 
                                key={company.id}
                                variant="outline-primary" 
                                className="w-100 d-flex align-items-center justify-content-between p-3 mb-2 rounded-3 text-start company-btn"
                                onClick={() => handleSelectTenant(company.id)}
                                disabled={selecting}
                            >
                                <div className="d-flex align-items-center">
                                    <div className="avatar avatar-xs avatar-soft-primary avatar-rounded me-2">
                                        <span className="initial-wrap">{company.name.charAt(0)}</span>
                                    </div>
                                    <span className="fw-bold">{company.name}</span>
                                </div>
                                <ArrowRight size={18} />
                            </Button>
                        ))}
                    </div>

                    <div className="text-center border-top pt-3 mt-2">
                        <Button variant="link" className="text-muted text-decoration-none fs-7" onClick={handleLogout}>
                            <LogOut size={14} className="me-1" /> Keluar & Masuk Akun Lain
                        </Button>
                    </div>
                </Card>
            </Container>

            <style jsx>{`
                .selection-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(var(--bs-body-bg-rgb), 0.88);
                    backdrop-filter: blur(15px);
                    z-index: 9999;
                }
                .selection-card {
                    background: var(--bs-card-bg);
                }
                .company-btn:hover {
                    transform: translateY(-2px);
                    transition: all 0.2s ease;
                }
                .shadow-xxl {
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
                }
            `}</style>
        </div>
    );
};

export default CompanySelectionOverlay;
