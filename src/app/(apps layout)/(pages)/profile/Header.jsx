import Link from 'next/link';
import { Dropdown, Form, Nav } from 'react-bootstrap';
import { MoreVertical } from 'react-feather';

const Header = () => {
    return (
        <header className="profile-header">
            <Nav defaultActiveKey="tab1" as="ul" variant="tabs" className="nav-line nav-icon nav-light h-100 d-md-flex d-none">
                <Nav.Item as="li">
                    <Nav.Link eventKey="tab1" className="d-flex align-items-center h-100">
                        <span className="nav-link-text">Profile</span>
                    </Nav.Link>
                </Nav.Item>
            </Nav>
            <div className="ms-auto d-flex align-items-center h-100 me-3">
                <Link href="/profile/edit-profile" className="btn btn-primary btn-sm">
                    <i className="bi bi-pencil-square me-1" />
                    Edit Profile
                </Link>
            </div>
            <Form.Select className="mw-200p d-md-none d-flex me-2">
                <option value={1}>Profile</option>
            </Form.Select>
        </header>
    )
}

export default Header
