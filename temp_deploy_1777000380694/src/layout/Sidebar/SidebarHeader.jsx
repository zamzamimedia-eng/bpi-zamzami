import { ArrowBarToLeft } from 'tabler-icons-react';
import { Button } from 'react-bootstrap';
import Link from 'next/link';
import Image from 'next/image';
import { useGlobalStateContext } from '@/context/GolobalStateProvider';
//Images
import logoZamzami from '@/assets/img/logo-zamzami.png';
import { useTheme } from '../theme-provider/theme-provider';


const SidebarHeader = () => {
    const { states, dispatch } = useGlobalStateContext();
    const { theme } = useTheme();

    const toggleSidebar = () => {
        dispatch({ type: 'sidebar_toggle' });
    }

    return (
        <div className="menu-header flex-column align-items-stretch">
            <div className="d-flex align-items-center justify-content-between w-100">
                <Link className="navbar-brand" href="/">
                    <Image className="brand-img img-fluid" src={logoZamzami} alt="brand" priority style={{ height: '42px', width: 'auto' }} />
                    <span className="brand-img" style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--bs-primary)', marginLeft: '10px', verticalAlign: 'middle' }}>BPI Zamzami</span>
                </Link>
                <Button variant="flush-dark" onClick={toggleSidebar} className="btn-icon btn-rounded flush-soft-hover navbar-toggle">
                    <span className="icon">
                        <span className="svg-icon fs-5">
                            <ArrowBarToLeft />
                        </span>
                    </span>
                </Button>
            </div>
        </div>
    )
}


export default SidebarHeader
