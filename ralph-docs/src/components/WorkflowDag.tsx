import { useCallback, useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  Edge,
  ConnectionMode,
  NodeTypes,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import StageNode from './StageNode';
import DecisionNode from './DecisionNode';
import { stages } from '../data/stages';
import { decisionPoints } from '../data/decisions';
import { Stage, DecisionPoint } from '../types/workflow';
import './WorkflowDag.css';

const nodeTypes: NodeTypes = {
  stage: StageNode,
  decision: DecisionNode,
};

interface WorkflowDagProps {
  onSelectStage: (stage: Stage) => void;
  onSelectDecision: (decision: DecisionPoint) => void;
}

export default function WorkflowDag({
  onSelectStage,
  onSelectDecision,
}: WorkflowDagProps) {
  const handleSelectStage = useCallback(
    (stage: Stage) => {
      onSelectStage(stage);
    },
    [onSelectStage]
  );

  const handleSelectDecision = useCallback(
    (decision: DecisionPoint) => {
      onSelectDecision(decision);
    },
    [onSelectDecision]
  );

  const nodes = useMemo(() => {
    // Interleave stages and decisions: Stage - Decision - Stage - Decision - etc.
    // Each "slot" is 300px wide. Stages take positions 0, 2, 4, 6. Decisions take 1, 3, 5.
    const slotWidth = 300;

    const stageNodes = stages.map((stage, index) => ({
      id: stage.id,
      type: 'stage',
      position: { x: index * 2 * slotWidth, y: 60 },
      data: { stage, onSelect: handleSelectStage },
    }));

    const decisionNodes = decisionPoints.map((decision, index) => ({
      id: decision.id,
      type: 'decision',
      position: { x: (index * 2 + 1) * slotWidth + 100, y: 80 },
      data: { decision, onSelect: handleSelectDecision },
    }));

    return [...stageNodes, ...decisionNodes];
  }, [handleSelectStage, handleSelectDecision]);

  const edges: Edge[] = useMemo(() => {
    return [
      {
        id: 'e-planning-decision1',
        source: 'planning',
        target: 'after-planning',
        type: 'smoothstep',
        animated: true,
        style: { stroke: '#94a3b8', strokeWidth: 2 },
      },
      {
        id: 'e-decision1-prd',
        source: 'after-planning',
        target: 'prd',
        type: 'smoothstep',
        animated: true,
        style: { stroke: '#94a3b8', strokeWidth: 2 },
      },
      {
        id: 'e-prd-decision2',
        source: 'prd',
        target: 'after-prd',
        type: 'smoothstep',
        animated: true,
        style: { stroke: '#94a3b8', strokeWidth: 2 },
      },
      {
        id: 'e-decision2-tasks',
        source: 'after-prd',
        target: 'tasks',
        type: 'smoothstep',
        animated: true,
        style: { stroke: '#94a3b8', strokeWidth: 2 },
      },
      {
        id: 'e-tasks-decision3',
        source: 'tasks',
        target: 'after-tasks',
        type: 'smoothstep',
        animated: true,
        style: { stroke: '#94a3b8', strokeWidth: 2 },
      },
      {
        id: 'e-decision3-ralph',
        source: 'after-tasks',
        target: 'ralph',
        type: 'smoothstep',
        animated: true,
        style: { stroke: '#94a3b8', strokeWidth: 2 },
      },
    ];
  }, []);

  return (
    <div className="workflow-dag">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        connectionMode={ConnectionMode.Loose}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.5}
        maxZoom={1.5}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        panOnScroll
        zoomOnScroll
      >
        <Background color="#e2e8f0" gap={20} />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  );
}
