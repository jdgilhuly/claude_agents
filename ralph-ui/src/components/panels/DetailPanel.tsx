import { useAssemblyStore } from '../../stores/assemblyStore';
import { AgentContextView } from './AgentContextView';
import { OutputStreamView } from './OutputStreamView';

export function DetailPanel() {
  const { selectedElement, setSelectedElement, currentBriefing } =
    useAssemblyStore();

  if (!selectedElement) {
    return null;
  }

  const handleClose = () => setSelectedElement(null);

  return (
    <div className="h-full flex flex-col bg-factory-panel">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-factory-border">
        <h2 className="text-sm font-semibold text-white">
          {selectedElement.type === 'story' && 'Story Details'}
          {selectedElement.type === 'agent' && 'Agent Details'}
          {selectedElement.type === 'gate' && 'Quality Gate'}
        </h2>
        <button
          onClick={handleClose}
          className="p-1 hover:bg-factory-border rounded transition-colors"
        >
          <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {selectedElement.type === 'story' && (
          <StoryDetail storyId={selectedElement.id} briefing={currentBriefing} />
        )}
        {selectedElement.type === 'agent' && (
          <AgentDetail agentId={selectedElement.id} />
        )}
        {selectedElement.type === 'gate' && (
          <GateDetail gateId={selectedElement.id} />
        )}
      </div>
    </div>
  );
}

function StoryDetail({ storyId, briefing }: { storyId: string; briefing: string | null }) {
  const { stories } = useAssemblyStore();
  const story = stories.find((s) => s.id === storyId);

  if (!story) {
    return <div className="p-4 text-gray-400">Story not found</div>;
  }

  const statusColors = {
    pending: 'text-gray-400',
    processing: 'text-factory-warning',
    complete: 'text-factory-success',
    failed: 'text-factory-danger',
  };

  return (
    <div className="p-4 space-y-4">
      {/* Story header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <span className="px-2 py-0.5 bg-factory-bg rounded text-xs font-mono">
            {story.id}
          </span>
          <span className={`text-xs font-medium ${statusColors[story.status]}`}>
            {story.status.charAt(0).toUpperCase() + story.status.slice(1)}
          </span>
        </div>
        <h3 className="text-white font-medium">{story.title}</h3>
      </div>

      {/* Acceptance criteria */}
      {story.acceptanceCriteria.length > 0 && (
        <div>
          <h4 className="text-xs text-gray-400 uppercase mb-2">Acceptance Criteria</h4>
          <ul className="space-y-2">
            {story.acceptanceCriteria.map((criterion, index) => (
              <li key={index} className="flex items-start gap-2 text-sm">
                <span className="text-gray-500 mt-0.5">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </span>
                <span className="text-gray-300">{criterion}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Current briefing */}
      {briefing && (
        <div>
          <h4 className="text-xs text-gray-400 uppercase mb-2">Current Iteration Briefing</h4>
          <div className="bg-factory-bg rounded p-3 text-xs text-gray-300 font-mono whitespace-pre-wrap max-h-96 overflow-auto">
            {briefing}
          </div>
        </div>
      )}
    </div>
  );
}

function AgentDetail({ agentId }: { agentId: string }) {
  const { agents } = useAssemblyStore();
  const agent = agents.get(agentId);

  if (!agent) {
    return <div className="p-4 text-gray-400">Agent not found</div>;
  }

  return (
    <div className="p-4 space-y-4">
      <AgentContextView agent={agent} />
      <OutputStreamView outputs={agent.outputs} />
    </div>
  );
}

function GateDetail({ gateId }: { gateId: string }) {
  const { qualityGates } = useAssemblyStore();
  const gate = qualityGates.find((g) => g.type.includes(gateId));

  if (!gate) {
    return (
      <div className="p-4">
        <h3 className="text-white font-medium mb-2">{gateId}</h3>
        <p className="text-gray-400 text-sm">No quality gate data available</p>
      </div>
    );
  }

  const statusColors = {
    pending: 'text-gray-400',
    checking: 'text-factory-warning',
    passed: 'text-factory-success',
    failed: 'text-factory-danger',
  };

  return (
    <div className="p-4 space-y-4">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs text-gray-400 uppercase">{gate.type}</span>
          <span className={`text-xs font-medium ${statusColors[gate.status]}`}>
            {gate.status.charAt(0).toUpperCase() + gate.status.slice(1)}
          </span>
        </div>
        {gate.storyId && (
          <p className="text-sm text-gray-300">
            Checking story: <span className="font-mono">{gate.storyId}</span>
          </p>
        )}
      </div>

      {/* Issues (if failed) */}
      {gate.issues && gate.issues.length > 0 && (
        <div>
          <h4 className="text-xs text-gray-400 uppercase mb-2">Issues Found</h4>
          <ul className="space-y-2">
            {gate.issues.map((issue, index) => (
              <li
                key={index}
                className="flex items-start gap-2 text-sm bg-factory-danger/10 border border-factory-danger/30 rounded p-2"
              >
                <span className="text-factory-danger mt-0.5">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </span>
                <span className="text-gray-300">{issue}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
