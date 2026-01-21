import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Stage } from '../types/workflow';
import './StageNode.css';

interface StageNodeData {
  stage: Stage;
  onSelect: (stage: Stage) => void;
}

interface StageNodeProps {
  data: StageNodeData;
}

function StageNode({ data }: StageNodeProps) {
  const { stage, onSelect } = data;

  return (
    <div className="stage-node" onClick={() => onSelect(stage)}>
      <Handle type="target" position={Position.Left} />

      <div className="stage-header">
        <span className="stage-number">{stage.number}</span>
        <span className={`stage-mode ${stage.mode}`}>
          {stage.mode === 'interactive' ? 'Interactive' : 'Autonomous'}
        </span>
      </div>

      <h3 className="stage-name">{stage.name}</h3>
      <p className="stage-description">{stage.shortDescription}</p>

      <div className="stage-output">
        <code>{stage.outputFile}</code>
      </div>

      <Handle type="source" position={Position.Right} />
    </div>
  );
}

export default memo(StageNode);
