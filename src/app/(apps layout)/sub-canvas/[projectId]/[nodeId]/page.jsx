import CanvasClient from '@/components/bpi/CanvasClient';

export const dynamic = 'force-dynamic';

export default async function SubCanvasPage({ params }) {
    const { projectId, nodeId } = await params;
    return (
        <CanvasClient 
            isSbpmMode={true} 
            parentProjectId={projectId} 
            parentNodeId={nodeId} 
        />
    );
}
