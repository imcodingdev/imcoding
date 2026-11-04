'use client'

import '@xyflow/react/dist/style.css'
import { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  Background,
  BackgroundVariant,
  Controls,
  Handle,
  MarkerType,
  Position,
  ReactFlow,
  type Edge,
  type Node,
  type NodeProps,
} from '@xyflow/react'
import type { MapEdge, MapNode } from '@/lib/concepts/layout'
import type { ConceptGroup } from '@/lib/concepts/types'
import type { NodeStatus } from '@/lib/progress/status'
import { GROUP_ACCENT, STATUS_CLASS } from './statusStyles'

type ConceptNodeData = { label: string; status: NodeStatus; group: ConceptGroup }

function ConceptNode({ data }: NodeProps<Node<ConceptNodeData>>) {
  return (
    <div
      data-testid="concept-node"
      data-status={data.status}
      className={`min-h-[44px] w-[190px] cursor-pointer rounded-xl border px-3.5 py-2.5 font-display text-sm font-semibold shadow-xs motion-safe:transition-transform motion-safe:hover:-translate-y-0.5 ${STATUS_CLASS[data.status]} ${GROUP_ACCENT[data.group]}`}
    >
      <Handle type="target" position={Position.Left} isConnectable={false} />
      <span className="line-clamp-2 leading-snug">
        {data.status === 'understood' && '✓ '}
        {data.label}
      </span>
      <Handle type="source" position={Position.Right} isConnectable={false} />
    </div>
  )
}

const nodeTypes = { concept: ConceptNode }

export function ConceptMap({
  nodes,
  edges,
  statuses,
}: {
  nodes: MapNode[]
  edges: MapEdge[]
  statuses: Record<string, NodeStatus>
}) {
  const router = useRouter()
  const flowNodes = useMemo<Node<ConceptNodeData>[]>(
    () => nodes.map((n) => ({
        id: n.id,
        type: 'concept',
        position: { x: n.x, y: n.y },
        data: { label: n.title, status: statuses[n.id] ?? 'neutral', group: n.group },
      })),
    [nodes, statuses],
  )
  const flowEdges = useMemo<Edge[]>(
    () =>
      edges.map((e) => ({
        id: `${e.from}->${e.to}`,
        source: e.from,
        target: e.to,
        markerEnd: { type: MarkerType.ArrowClosed },
        style:
          statuses[e.from] === 'understood'
            ? { stroke: 'var(--status-mastered-border)', strokeWidth: 2 }
            : { stroke: 'var(--status-unseen-border)', strokeWidth: 2, strokeDasharray: '5 5' },
      })),
    [edges, statuses],
  )

  return (
    <div className="h-[55vh] min-h-[360px] w-full min-w-0 overflow-hidden rounded-2xl border border-line bg-surface md:h-[420px] md:min-h-0">
      <ReactFlow
        colorMode="system"
        nodes={flowNodes}
        edges={flowEdges}
        nodeTypes={nodeTypes}
        onInit={(rf) => {
          // mở ở mức phóng đọc được, người dùng kéo ngang để xem tiếp
          void rf.setViewport(
            window.innerWidth < 768 ? { x: 16, y: 40, zoom: 0.85 } : { x: 16, y: 24, zoom: 0.9 },
          )
        }}
        minZoom={0.1}
        nodesDraggable={false}
        nodesConnectable={false}
        onNodeClick={(_, node) => router.push(`/concepts/${node.id}`)}
      >
        <Background variant={BackgroundVariant.Dots} color="var(--line)" gap={20} />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  )
}
