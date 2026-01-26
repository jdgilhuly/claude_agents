import { useAssemblyStore } from '../../stores/assemblyStore';
import { SubagentArm } from './SubagentArm';
import type { Agent } from '../../types/events';

interface WorkStationProps {
  id: string;
  label: string;
  type: 'planning' | 'implementation' | 'quality' | 'output';
  status: 'idle' | 'active' | 'success' | 'fail';
  agents: Agent[];
}

export function WorkStation({ id, label, type, status, agents }: WorkStationProps) {
  const { setSelectedElement, selectedElement } = useAssemblyStore();

  const isSelected = selectedElement?.type === 'gate' && selectedElement?.id === id;

  const statusStyles = {
    idle: '',
    active: 'station-active',
    success: 'station-success',
    fail: 'station-fail',
  };

  const typeIcons = {
    planning: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
    implementation: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
      </svg>
    ),
    quality: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    output: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    ),
  };

  const ledColor =
    status === 'success'
      ? 'led-green'
      : status === 'fail'
        ? 'led-red'
        : status === 'active'
          ? 'led-yellow'
          : 'led-off';

  return (
    <div className="flex flex-col items-center">
      {/* Station body */}
      <div
        className={`
          relative w-28 h-24 bg-factory-panel border-2 border-factory-border rounded-lg
          cursor-pointer transition-all duration-300
          ${statusStyles[status]}
          ${isSelected ? 'ring-2 ring-factory-accent' : ''}
        `}
        onClick={() => setSelectedElement(isSelected ? null : { type: 'gate', id })}
      >
        {/* Top panel with LED indicators */}
        <div className="absolute top-0 inset-x-0 h-6 bg-factory-border/50 rounded-t-md flex items-center justify-between px-2">
          <div className={`led ${ledColor}`} />
          <div className="flex gap-1">
            <div className={`led ${agents.length > 0 ? 'led-blue' : 'led-off'}`} />
            <div className="led led-off" />
          </div>
        </div>

        {/* Icon */}
        <div className="absolute inset-0 flex items-center justify-center pt-4 text-factory-accent">
          {typeIcons[type]}
        </div>

        {/* Activity indicator */}
        {status === 'active' && (
          <div className="absolute inset-0 rounded-lg bg-factory-accent/5 animate-pulse" />
        )}
      </div>

      {/* Label */}
      <div className="mt-2 text-xs text-gray-400 text-center font-medium">{label}</div>

      {/* Subagent arms */}
      {agents.length > 0 && (
        <div className="mt-2 flex gap-1">
          {agents.map((agent) => (
            <SubagentArm key={agent.id} agent={agent} />
          ))}
        </div>
      )}

      {/* Connection to conveyor */}
      <div className="w-px h-8 bg-factory-border mt-2" />
    </div>
  );
}
