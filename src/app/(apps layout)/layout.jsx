'use client';
import MainLayout from '@/layout/apps-layout'
import CompanySelectionOverlay from '@/components/auth/CompanySelectionOverlay';

const AppsLayout = ({ children }) => {

    return (
        <MainLayout>
            <CompanySelectionOverlay />
            {children}
        </MainLayout>
    )
}

export default AppsLayout
