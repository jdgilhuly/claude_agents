import type { Agent } from '../../types/events';

interface AgentContextViewProps {
  agent: Agent;
}

export function AgentContextView({ agent }: AgentContextViewProps) {
  const statusColors = {
    active: 'text-factory-warning bg-factory-warning/10 border-factory-warning/30',
    complete: 'text-factory-success bg-factory-success/10 border-factory-success/30',
    failed: 'text-factory-danger bg-factory-danger/10 border-factory-danger/30',
  };

  const statusIcons = {
    active: (
      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
    ),
    complete: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    ),
    failed: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    ),
  };

  return (
    <div className="space-y-4">
      {/* Agent header */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-white font-medium">{formatAgentType(agent.type)}</h3>
          <span
            className={`
              flex items-center gap-1.5 px-2 py-1 rounded border text-xs
              ${statusColors[agent.status]}
            `}
          >
            {statusIcons[agent.status]}
            {agent.status.charAt(0).toUpperCase() + agent.status.slice(1)}
          </span>
        </div>
        <p className="text-xs text-gray-400 font-mono">{agent.id}</p>
      </div>

      {/* Context/prompt given to agent */}
      {agent.context && (
        <div>
          <h4 className="text-xs text-gray-400 uppercase mb-2 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Agent Context
          </h4>
          <div className="bg-factory-bg rounded p-3 border border-factory-border">
            <pre className="text-xs text-gray-300 font-mono whitespace-pre-wrap overflow-auto max-h-64">
              {agent.context}
            </pre>
          </div>
        </div>
      )}

      {/* Agent metadata */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="bg-factory-bg rounded p-2">
          <div className="text-gray-500">Type</div>
          <div className="text-white">{agent.type}</div>
        </div>
        <div className="bg-factory-bg rounded p-2">
          <div className="text-gray-500">Outputs</div>
          <div className="text-white">{agent.outputs.length}</div>
        </div>
      </div>
    </div>
  );
}

function formatAgentType(type: string): string {
  return type
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
