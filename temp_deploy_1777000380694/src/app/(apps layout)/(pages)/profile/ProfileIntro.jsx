import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Card } from 'react-bootstrap';
import HkBadge from '@/components/@hk-badge/@hk-badge';

//Image 
import avatar3 from '@/assets/img/avatar3.jpg';

const ProfileIntro = () => {
    const [user, setUser] = useState({ full_name: 'Loading...', role: '' });

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await fetch('/api/auth/me');
                if (res.ok) {
                    const data = await res.json();
                    setUser(data);
                }
            } catch (error) {
                console.error('Fetch user error:', error);
            }
        };
        fetchUser();

        window.addEventListener('user-updated', fetchUser);
        return () => window.removeEventListener('user-updated', fetchUser);
    }, []);

    return (
        <div className="profile-intro text-center text-md-start">
            <Card className="card-flush bg-transparent mx-auto mx-md-0" style={{ maxWidth: '400px' }}>
                <Card.Body>
                    <div className="avatar avatar-xxl avatar-rounded mx-auto mx-md-0 mb-3">
                        {user.profile_photo ? (
                            <img 
                                src={user.profile_photo} 
                                alt="user" 
                                className="avatar-img" 
                                style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '50%' }}
                            />
                        ) : (
                            <Image 
                                src={avatar3} 
                                alt="user" 
                                className="avatar-img" 
                                width={100} 
                                height={100}
                            />
                        )}
                        <HkBadge bg="success" indicator className="badge-indicator-xl position-bottom-end-overflow-1 me-1" />
                    </div>
                    <h4>{user.full_name}</h4>
                    <p className="text-muted">
                        {user.role ? user.role.toUpperCase() : ''}
                    </p>
                </Card.Body>
            </Card>
        </div>
    )
}

export default ProfileIntro
