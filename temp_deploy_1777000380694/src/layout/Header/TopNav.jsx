import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import SimpleBar from 'simplebar-react';
import { AlignLeft, Bell, Calendar, Check, CheckSquare, Clock, CreditCard, ExternalLink, Grid, Info, Inbox, Layers, LogOut, MoreVertical, Plus, Settings, Tag, User, X, AlertTriangle } from 'react-feather';
import { Button, Container, Dropdown, Nav, Navbar } from 'react-bootstrap';
import HkBadge from '@/components/@hk-badge/@hk-badge';
import { useGlobalStateContext } from '@/context/GolobalStateProvider';

//Images
import avatar12 from '@/assets/img/avatar12.jpg';
import { ThemeSwitcher } from '../theme-provider/theme-switcher';


const TopNav = () => {
    const router = useRouter();
    const { states, dispatch } = useGlobalStateContext();
    const [user, setUser] = useState({ full_name: 'User', role: 'guest', username: '' });

    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);

    const fetchNotifications = async () => {
        try {
            const res = await fetch('/api/notifications');
            if (res.ok) {
                const data = await res.json();
                setNotifications(data);
                setUnreadCount(data.filter(n => !n.is_read).length);
            }
        } catch (error) {
            console.error('Fetch notifications error:', error);
        }
    };

    const markAsRead = async (id) => {
        try {
            const res = await fetch('/api/notifications', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id })
            });
            if (res.ok) fetchNotifications();
        } catch (error) {
            console.error('Mark as read error:', error);
        }
    };

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const res = await fetch('/api/auth/me');
                if (res.ok) {
                    const data = await res.json();
                    setUser(data);
                    // Sync global tenant state
                    if (data.selectedTenantId) {
                        dispatch({ type: 'set_active_tenant', tenantId: parseInt(data.selectedTenantId) });
                    }
                }
            } catch (error) {
                console.error('Session error:', error);
            }
        };
        fetchUserData();
        fetchNotifications();

        // Listen for profile updates
        window.addEventListener('user-updated', fetchUserData);

        // Polling notifications every 30 seconds
        const interval = setInterval(fetchNotifications, 30000);
        return () => {
            clearInterval(interval);
            window.removeEventListener('user-updated', fetchUserData);
        };
    }, []);

    const handleLogout = async () => {
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
            router.push('/auth/login');
        } catch (error) {
            console.error('Logout error:', error);
        }
    };




    return (
        <Navbar expand="xl" className="hk-navbar navbar-light fixed-top" >
            <Container fluid>
                {/* Start Nav */}
                <div className="nav-start-wrap">
                    <Button variant="flush-dark" onClick={() => dispatch({ type: 'sidebar_toggle', sidebarCollapse: !states.sidebarCollapse })} className="btn-icon btn-rounded flush-soft-hover navbar-toggle d-xl-none">
                        <span className="icon">
                            <span className="feather-icon"><AlignLeft /></span>
                        </span>
                    </Button>
                </div>
                {/* /Start Nav */}
                {/* End Nav */}
                <div className="nav-end-wrap">
                    <Nav className="navbar-nav flex-row">
                        <Nav.Item className='ms-2'>
                            <ThemeSwitcher />
                        </Nav.Item>
                        <Nav.Item>
                            <Dropdown className="dropdown-notifications">
                                <Dropdown.Toggle variant="flush-dark" className="btn-icon btn-rounded flush-soft-hover no-caret">
                                    <span className="icon">
                                        <span className="position-relative">
                                            <span className="feather-icon"><Bell /></span>
                                            {unreadCount > 0 && <HkBadge bg="danger" indicator className="position-top-end-overflow-1" />}
                                        </span>
                                    </span>
                                </Dropdown.Toggle>
                                <Dropdown.Menu align="end" className="p-0">
                                    <Dropdown.Header className="px-4 fs-6">
                                        Notifikasi
                                        <Button variant="flush-dark" className="btn-icon btn-rounded flush-soft-hover">
                                            <span className="icon">
                                                <span className="feather-icon"><Settings /></span>
                                            </span>
                                        </Button>
                                    </Dropdown.Header>
                                    <SimpleBar className="dropdown-body p-2">
                                        {notifications.length === 0 ? (
                                            <div className="p-4 text-center text-muted small">Tidak ada notifikasi</div>
                                        ) : notifications.map(n => (
                                            <Dropdown.Item key={n.id} onClick={() => markAsRead(n.id)} className={n.is_read ? 'opacity-60' : ''}>
                                                <div className="media">
                                                    <div className="media-head">
                                                        <div className={`avatar avatar-icon avatar-sm avatar-rounded ${
                                                            n.type === 'success' ? 'avatar-success' : 
                                                            n.type === 'warning' ? 'avatar-warning' : 
                                                            n.type === 'error' ? 'avatar-danger' : 'avatar-info'
                                                        }`}>
                                                            <span className="initial-wrap">
                                                                <span className="feather-icon">
                                                                    {n.type === 'success' ? <Check /> : 
                                                                     n.type === 'warning' ? <AlertTriangle /> : 
                                                                     n.type === 'error' ? <X /> : <Info />}
                                                                </span>
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="media-body">
                                                        <div>
                                                            <div className={`notifications-text ${!n.is_read ? 'fw-bold' : ''}`}>{n.title}</div>
                                                            <div className="notifications-info">
                                                                <div className="notifications-text small text-muted mb-1">{n.description}</div>
                                                                <div className="notifications-time">
                                                                    {new Date(n.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </Dropdown.Item>
                                        ))}
                                    </SimpleBar>
                                    <div className="dropdown-footer">
                                        <Link href="#"><u>Lihat semua notifikasi</u></Link>
                                    </div>
                                </Dropdown.Menu>
                            </Dropdown>
                        </Nav.Item>
                        <Nav.Item>
                            <Dropdown className="ps-2">
                                <Dropdown.Toggle as={Link} href="#" className="no-caret">
                                    <div className="avatar avatar-rounded avatar-xs">
                                        {user.profile_photo ? (
                                            <img src={user.profile_photo} alt="user" className="avatar-img" />
                                        ) : (
                                            <Image src={avatar12} alt="user" className="avatar-img" />
                                        )}
                                    </div>
                                </Dropdown.Toggle>
                                <Dropdown.Menu align="end" style={{ minWidth: '230px' }}>
                                    <div className="p-3">
                                        <div className="media align-items-center">
                                            <div className="media-head me-3">
                                                <div className="avatar avatar-primary avatar-sm avatar-rounded">
                                                    {user.profile_photo ? (
                                                        <img src={user.profile_photo} alt="user" className="avatar-img" />
                                                    ) : (
                                                        <span className="initial-wrap">{user.full_name?.charAt(0).toUpperCase()}</span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="media-body">
                                                <div className="fs-7 fw-bold text-dark lh-sm">{user.full_name}</div>
                                                <div className="fs-8 text-muted mt-1">{user.role.toUpperCase()}</div>
                                            </div>
                                        </div>
                                        <div className="d-grid mt-3">
                                            <Button variant="outline-danger" size="sm" className="btn-rounded" onClick={handleLogout}>
                                                Keluar
                                            </Button>
                                        </div>
                                    </div>
                                    <Dropdown.Divider as="div" />
                                    <Dropdown.Item as={Link} href="/profile" >Profile</Dropdown.Item>
                                </Dropdown.Menu>
                            </Dropdown>
                        </Nav.Item>
                    </Nav>
                </div>
                {/* /End Nav */}
            </Container>
        </Navbar>
    )
}

export default TopNav;