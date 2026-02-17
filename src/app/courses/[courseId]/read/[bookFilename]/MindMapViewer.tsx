'use client';

import React, { useMemo } from 'react';
import ReactFlow, {
    Controls,
    Background,
    useNodesState,
    useEdgesState,
    Node,
    Edge,
    Position
} from 'reactflow';
import 'reactflow/dist/style.css';
import dagre from 'dagre';
import { Box } from '@mantine/core';

interface MindMapViewerProps {
    data: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        nodes: any[];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        edges: any[];
    };
}

const getLayoutedElements = (nodes: Node[], edges: Edge[], direction = 'TB') => {
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));

    const nodeWidth = 172;
    const nodeHeight = 36;

    dagreGraph.setGraph({ rankdir: direction });

    nodes.forEach((node) => {
        dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
    });

    edges.forEach((edge) => {
        dagreGraph.setEdge(edge.source, edge.target);
    });

    dagre.layout(dagreGraph);

    const newNodes = nodes.map((node) => {
        const nodeWithPosition = dagreGraph.node(node.id);
        node.targetPosition = isHorizontal ? Position.Left : Position.Top;
        node.sourcePosition = isHorizontal ? Position.Right : Position.Bottom;

        // We are shifting the dagre node position (anchor=center center) to the top left
        // so it matches the React Flow node anchor point (top left).
        node.position = {
            x: nodeWithPosition.x - nodeWidth / 2,
            y: nodeWithPosition.y - nodeHeight / 2,
        };

        return node;
    });

    return { nodes: newNodes, edges };
};

const isHorizontal = false; // 'TB' for Top-Bottom

export default function MindMapViewer({ data }: MindMapViewerProps) {
    const { nodes: initialNodes, edges: initialEdges } = data;

    // Convert AI data to React Flow format if needed or assume exact match
    // Ideally we might want to map types to custom nodes or styles
    const nodeStyle = {
        fontFamily: "'Kalam', cursive",
        fontWeight: 700,
        fontSize: '14px',
        padding: '10px',
        borderRadius: '5px',
        border: '1px solid #1a237e',
        backgroundColor: '#fff',
        color: '#1a237e',
        boxShadow: '2px 2px 5px rgba(0,0,0,0.1)',
        minWidth: '150px'
    };

    const layouted = useMemo(() => {
        const flowNodes: Node[] = initialNodes.map(n => ({
            ...n,
            position: { x: 0, y: 0 },
            data: { label: n.label },
            style: nodeStyle
        }));
        const flowEdges: Edge[] = initialEdges.map(e => ({
            ...e,
            type: 'smoothstep',
            animated: true,
            style: { stroke: '#1a237e', strokeWidth: 2 }
        }));
        return getLayoutedElements(flowNodes, flowEdges);
    }, [initialNodes, initialEdges]);

    const [nodes, , onNodesChange] = useNodesState(layouted.nodes);
    const [edges, , onEdgesChange] = useEdgesState(layouted.edges);

    return (
        <Box w="100%" h={500} style={{ border: '1px solid #eee', borderRadius: 8, background: '#f9f9f9' }}>
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                fitView
            >
                <Background color="#eee" gap={20} />
                <Controls />
            </ReactFlow>
        </Box>
    );
}
