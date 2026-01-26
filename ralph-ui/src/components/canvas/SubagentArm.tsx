import { useAssemblyStore } from '../../stores/assemblyStore';
import type { Agent } from '../../types/events';

interface SubagentArmProps {
  agent: Agent;
}

export function SubagentArm({ agent }: SubagentArmProps) {
  const { setSelectedElement, selectedElement } = useAssemblyStore();

  const isSelected = selectedElement?.type === 'agent' && selectedElement?.id === agent.id;

  const statusColor = {
    active: 'bg-factory-warning',
    complete: 'bg-factory-success',
    failed: 'bg-factory-danger',
  };

  const handleClick = () => {
    setSelectedElement(isSelected ? null : { type: 'agent', id: agent.id });
  };

  return (
    <div
      className={`
        relative cursor-pointer transition-all duration-300
        ${isSelected ? 'scale-110' : ''}
      `}
      onClick={handleClick}
      title={`${agent.type} (${agent.status})`}
    >
      {/* Arm base */}
      <div className="w-8 h-4 bg-factory-metal rounded-t-sm" />

      {/* Arm extension */}
      <div
        className={`
          w-2 mx-auto origin-top transition-transform duration-300
          ${agent.status === 'active' ? 'h-12 animate-arm-extend' : 'h-6'}
          ${statusColor[agent.status]}
        `}
      />

      {/* Arm gripper */}
      <div className="relative w-8 mx-auto">
        <div
          className={`
            absolute -top-1 left-0 w-3 h-3 rounded-sm transform -rotate-12
            ${statusColor[agent.status]}
          `}
        />
        <div
          className={`
            absolute -top-1 right-0 w-3 h-3 rounded-sm transform rotate-12
            ${statusColor[agent.status]}
          `}
        />
      </div>

      {/* Activity pulse */}
      {agent.status === 'active' && (
        <div className="absolute inset-0 flex items-end justify-center">
          <div className="w-2 h-2 rounded-full bg-factory-warning animate-ping" />
        </div>
      )}

      {/* Agent type label */}
      <div className="mt-2 text-[8px] text-gray-500 text-center truncate w-16 -ml-4">
        {agent.type}
      </div>
    </div>
  );
}
