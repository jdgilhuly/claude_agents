import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { DecisionPoint } from '../types/workflow';
import './DecisionNode.css';

interface DecisionNodeData {
  decision: DecisionPoint;
  onSelect: (decision: DecisionPoint) => void;
}

interface DecisionNodeProps {
  data: DecisionNodeData;
}

function DecisionNode({ data }: DecisionNodeProps) {
  const { decision, onSelect } = data;

  return (
    <div className="decision-node" onClick={() => onSelect(decision)}>
      <Handle type="target" position={Position.Left} />

      <div className="decision-diamond">
        <span className="decision-icon">?</span>
      </div>

      <div className="decision-label">Stage Boundary</div>
      <div className="decision-options-preview">
        {decision.options.slice(0, 3).map((opt) => (
          <span key={opt.key} className="option-key">[{opt.key}]</span>
        ))}
      </div>

      <Handle type="source" position={Position.Right} />
    </div>
  );
}

export default memo(DecisionNode);
