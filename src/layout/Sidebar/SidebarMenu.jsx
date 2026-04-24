import * as Icons from 'tabler-icons-react';
import HkBadge from '@/components/@hk-badge/@hk-badge';

export const SidebarMenu = [
    {
        group: '',
        contents: [
            {
                name: 'Dashboard',
                icon: <Icons.ChartBar />,
                path: '/dashboard',
                badge: <HkBadge size="sm" bg="cyan" soft="true" className="ms-auto">BPI</HkBadge>
            },
        ]
    },
    {
        group: 'Proses',
        contents: [
            {
                name: 'Peta Proses',
                icon: <Icons.Map2 />,
                path: '/process-maps',
                grp_name: "apps",
            },
            {
                name: 'Kanvas BPM',
                icon: <Icons.ChartDots />,
                path: '/canvas-bpm',
                grp_name: "apps",
            },
            {
                name: 'Kanvas SBPM',
                icon: <Icons.ChartDots3 />,
                path: '/canvas-sbpm',
                grp_name: "apps",
            },
            {
                name: 'Pelacak Tindakan',
                icon: <Icons.LayoutKanban />,
                path: '/action-tracker',
                grp_name: "apps",
            },
            {
                name: 'Performa Kinerja',
                icon: <Icons.ChartInfographic />,
                path: '/performa',
                grp_name: "apps",
            },
            {
                name: 'Performa Staff',
                icon: <Icons.Award />,
                path: '/staff-performance',
                grp_name: "apps",
            },
        ]
    },
    {
        group: 'Admin',
        contents: [
            {
                name: 'Operator',
                icon: <Icons.Users />,
                path: '/users',
                grp_name: "apps",
            },
            {
                name: 'Organisasi',
                icon: <Icons.BuildingCommunity />,
                path: '/tenants',
                grp_name: "apps",
            },
            {
                name: 'Divisi',
                icon: <Icons.Sitemap />,
                path: '/divisions',
                grp_name: "apps",
            },
            {
                name: 'Staff',
                icon: <Icons.UserCheck />,
                path: '/pic-database',
                grp_name: "apps",
            },
        ]
    },
]