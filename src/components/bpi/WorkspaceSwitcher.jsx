'use client';

import { useState, useEffect } from 'react';
import { Dropdown } from 'react-bootstrap';
import { ChevronDown, Briefcase, Check } from 'react-feather';
import { useGlobalStateContext } from '@/context/GolobalStateProvider';
import { useRouter } from 'next/navigation';

const WorkspaceSwitcher = ({ navbar = false }) => {
    const router = useRouter();
    const { states, dispatch } = useGlobalStateContext();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchUserAndTenants = async () => {
        try {
            const res = await fetch('/api/auth/me');
            if (res.ok) {
                const data = await res.json();
                setUser(data);
                if (data.selectedTenantId) {
                    dispatch({ type: 'set_active_tenant', tenantId: parseInt(data.selectedTenantId) });
                }
            }
        } catch (error) {
            console.error('Error fetching workspace data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUserAndTenants();
    }, []);

    const handleSelectTenant = async (tenantId) => {
        try {
            const res = await fetch('/api/auth/select-tenant', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tenantId })
            });

            if (res.ok) {
                dispatch({ type: 'set_active_tenant', tenantId });
                // Force a hard reload to ensure all data re-fetches with new tenant context
                window.location.reload();
            }
        } catch (error) {
            console.error('Error switching workspace:', error);
        }
    };

    if (loading || !user || !user.companies || user.companies.length === 0) {
        return null;
    }

    const activeTenant = user.companies.find(c => c.id === states.tenantState.activeTenantId) || user.companies[0];

    return (
        <div className={`workspace-switcher-wrap ${navbar ? '' : 'mt-3 px-3'}`}>
            <Dropdown className="w-100">
                <Dropdown.Toggle 
                    className={`w-100 d-flex align-items-center justify-content-between p-2 rounded-3 border-0 ${navbar ? 'bg-transparent' : 'bg-soft-primary'}`} 
                    variant="link"
                    style={{ textDecoration: 'none', color: 'inherit' }}
                >
                    <div className="d-flex align-items-center text-start overflow-hidden">
                        <div className={`avatar avatar-xs avatar-rounded me-2 flex-shrink-0 ${navbar ? 'bg-soft-primary text-primary' : 'avatar-primary'}`}>
                            <span className="initial-wrap"><Briefcase size={14} /></span>
                        </div>
                        <div className="overflow-hidden">
                            <div className="fs-9 text-muted text-uppercase fw-bold lh-1 mb-1" style={{ fontSize: '10px' }}>Holding</div>
                            <div className={`text-truncate fw-bold ${navbar ? 'fs-8' : 'fs-7'}`} style={{ maxWidth: navbar ? '100px' : 'none' }}>{activeTenant?.name}</div>
                        </div>
                    </div>
                    <ChevronDown size={14} className="text-muted ms-2" />
                </Dropdown.Toggle>

                <Dropdown.Menu className="w-100 mt-1 border-0 shadow-lg portal-dropdown" style={{ minWidth: '220px' }}>
                    <Dropdown.Header className="fs-8 text-uppercase fw-bold text-muted px-3 py-2">Select Company</Dropdown.Header>
                    {user.companies.map((company) => (
                        <Dropdown.Item 
                            key={company.id} 
                            onClick={() => handleSelectTenant(company.id)}
                            className={`d-flex align-items-center justify-content-between py-2 px-3 ${company.id === activeTenant?.id ? 'bg-soft-primary' : ''}`}
                        >
                            <span className={company.id === activeTenant?.id ? 'fw-bold text-primary' : ''}>{company.name}</span>
                            {company.id === activeTenant?.id && <Check size={14} className="text-primary" />}
                        </Dropdown.Item>
                    ))}
                    <Dropdown.Divider />
                    <Dropdown.Item href="/tenants/manage" className="fs-8 text-muted">Manage Workspaces</Dropdown.Item>
                </Dropdown.Menu>
            </Dropdown>
            
            <style jsx>{`
                .bg-soft-primary {
                    background-color: rgba(var(--hk-primary-rgb), 0.08);
                }
                .portal-dropdown {
                    background: var(--bs-card-bg);
                    backdrop-filter: blur(10px);
                }
            `}</style>
        </div>
    );
};

export default WorkspaceSwitcher;
