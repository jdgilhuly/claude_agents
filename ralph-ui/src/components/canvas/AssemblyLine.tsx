import type { Story, Agent, QualityGate } from '../../types/events';
import { useAssemblyStore } from '../../stores/assemblyStore';

interface AssemblyLineProps {
  sessionId: string;
  featureName?: string;
  branchName?: string;
  iteration: number;
  maxIterations: number;
  status: 'idle' | 'running' | 'completed' | 'incomplete';
  stories: Story[];
  agents: Agent[];
  qualityGates: QualityGate[];
  currentStoryId?: string;
  compact?: boolean;
}

export function AssemblyLine({
  sessionId,
  featureName,
  branchName,
  iteration,
  maxIterations,
  status,
  stories,
  agents,
  qualityGates,
  currentStoryId,
  compact = false,
}: AssemblyLineProps) {
  const { setSelectedElement, selectedElement } = useAssemblyStore();

  const stations = [
    { id: 'planning', label: 'Plan', icon: '📋' },
    { id: 'implementation', label: 'Impl', icon: '⚙️' },
    { id: 'code-review', label: 'Review', icon: '🔍' },
    { id: 'testing', label: 'Test', icon: '✓' },
    { id: 'complete', label: 'Done', icon: '✅' },
  ];

  const getStationStatus = (stationId: string) => {
    const gate = qualityGates.find((g) => g.type.includes(stationId));
    if (gate?.status === 'passed') return 'success';
    if (gate?.status === 'failed') return 'fail';

    const stationAgents = agents.filter((a) => a.type.includes(stationId));
    if (stationAgents.some((a) => a.status === 'active')) return 'active';
    if (gate?.status === 'checking') return 'active';

    return 'idle';
  };

  const statusColors = {
    idle: 'bg-gray-700',
    running: 'bg-factory-warning',
    completed: 'bg-factory-success',
    incomplete: 'bg-factory-danger',
  };

  // Calculate story positions on the belt
  const getStoryPosition = (story: Story) => {
    switch (story.status) {
      case 'pending': return 5;
      case 'processing': return 35 + Math.random() * 20;
      case 'complete': return 85;
      case 'failed': return 60;
      default: return 5;
    }
  };

  const height = compact ? 'h-20' : 'h-28';
  const stationSize = compact ? 'w-10 h-10' : 'w-14 h-14';
  const fontSize = compact ? 'text-[10px]' : 'text-xs';

  return (
    <div className="bg-factory-panel border border-factory-border rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-factory-bg/50 border-b border-factory-border">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${statusColors[status]} ${status === 'running' ? 'animate-pulse' : ''}`} />
          <span className="text-sm font-medium text-white truncate">
            {featureName || sessionId.slice(0, 16)}
          </span>
          {branchName && (
            <span className="text-xs text-factory-info font-mono truncate hidden sm:block">
              {branchName}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <span className="text-xs text-gray-400">
            Iteration {iteration}/{maxIterations}
          </span>
          <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
            status === 'running' ? 'bg-factory-warning/20 text-factory-warning' :
            status === 'completed' ? 'bg-factory-success/20 text-factory-success' :
            status === 'incomplete' ? 'bg-factory-danger/20 text-factory-danger' :
            'bg-gray-600/20 text-gray-400'
          }`}>
            {status.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Assembly line */}
      <div className="relative flex items-center gap-2 p-2">
        {/* Work stations */}
        <div className="flex items-center justify-between flex-shrink-0 w-[280px] z-10">
          {stations.map((station) => {
            const stationStatus = getStationStatus(station.id);
            const stationAgents = agents.filter((a) => a.type.includes(station.id));
            const isSelected = selectedElement?.type === 'gate' && selectedElement?.id === station.id;

            return (
              <div
                key={station.id}
                className="flex flex-col items-center cursor-pointer group"
                onClick={() => setSelectedElement({ type: 'gate', id: station.id, sessionId })}
              >
                <div
                  className={`
                    ${stationSize} rounded-lg flex items-center justify-center
                    transition-all duration-200 group-hover:scale-110 border-2
                    ${stationStatus === 'success' ? 'bg-factory-success/20 border-factory-success' : ''}
                    ${stationStatus === 'fail' ? 'bg-factory-danger/20 border-factory-danger' : ''}
                    ${stationStatus === 'active' ? 'bg-factory-warning/20 border-factory-warning animate-pulse' : ''}
                    ${stationStatus === 'idle' ? 'bg-factory-panel border-factory-border' : ''}
                    ${isSelected ? 'ring-2 ring-factory-accent' : ''}
                  `}
                >
                  <span className={compact ? 'text-base' : 'text-lg'}>{station.icon}</span>
                </div>
                <span className={`${fontSize} text-gray-400 mt-1`}>{station.label}</span>
                {stationAgents.length > 0 && (
                  <div className="flex gap-0.5 mt-0.5">
                    {stationAgents.slice(0, 2).map((agent) => (
                      <div
                        key={agent.id}
                        className={`w-1.5 h-3 rounded-b ${
                          agent.status === 'active' ? 'bg-factory-accent animate-bounce' : 'bg-factory-success'
                        }`}
                        title={agent.type}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Conveyor belt */}
        <div className="flex-1 relative">
          <div
            className={`
              ${height} bg-factory-conveyor rounded border-2 border-factory-metal overflow-hidden
              ${status === 'running' ? 'animate-conveyor-move' : ''}
            `}
            style={{
              backgroundImage: `
                repeating-linear-gradient(
                  90deg,
                  transparent,
                  transparent 18px,
                  rgba(255, 255, 255, 0.08) 18px,
                  rgba(255, 255, 255, 0.08) 20px
                )
              `,
              backgroundSize: '40px 100%',
            }}
          >
            {/* Belt rails */}
            <div className="absolute top-0 left-0 right-0 h-2 bg-factory-metal" />
            <div className="absolute bottom-0 left-0 right-0 h-2 bg-factory-metal" />

            {/* Stories on belt */}
            <div className="absolute inset-x-4 top-3 bottom-3 flex items-center">
              {stories.length === 0 ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-gray-500 text-sm">Waiting for stories...</span>
                </div>
              ) : (
                stories.map((story) => {
                  const isSelected = selectedElement?.type === 'story' && selectedElement?.id === story.id;
                  const isActive = story.id === currentStoryId;

                  return (
                    <div
                      key={story.id}
                      className={`
                        absolute px-2 py-1 rounded cursor-pointer transition-all duration-500
                        ${story.status === 'complete' ? 'bg-factory-success/30 border border-factory-success' : ''}
                        ${story.status === 'processing' ? 'bg-factory-warning/30 border border-factory-warning' : ''}
                        ${story.status === 'pending' ? 'bg-gray-600/30 border border-gray-500' : ''}
                        ${story.status === 'failed' ? 'bg-factory-danger/30 border border-factory-danger' : ''}
                        ${isActive ? 'scale-105 shadow-lg' : ''}
                        ${isSelected ? 'ring-2 ring-factory-accent' : ''}
                        hover:scale-105
                      `}
                      style={{ left: `${getStoryPosition(story)}%` }}
                      onClick={() => setSelectedElement({ type: 'story', id: story.id, sessionId })}
                    >
                      <div className="flex items-center gap-1.5">
                        <span className={`${fontSize} font-mono font-bold`}>{story.id}</span>
                        <div className={`w-1.5 h-1.5 rounded-full ${
                          story.status === 'complete' ? 'bg-factory-success' :
                          story.status === 'processing' ? 'bg-factory-warning animate-pulse' :
                          story.status === 'failed' ? 'bg-factory-danger' :
                          'bg-gray-500'
                        }`} />
                      </div>
                      {!compact && (
                        <div className="text-[10px] text-gray-300 truncate max-w-[120px]">
                          {story.title}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Belt supports */}
          <div className="flex justify-between px-8 -mt-1">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="w-2 h-3 bg-factory-metal rounded-b" />
            ))}
          </div>
        </div>

        {/* Output/reject area */}
        <div className="flex-shrink-0 w-24">
          <div className="text-[10px] text-gray-500 text-center mb-1">Output</div>
          <div className="bg-factory-success/10 border border-factory-success/30 rounded p-1.5 min-h-[40px] text-center">
            <span className="text-factory-success text-lg font-bold">
              {stories.filter((s) => s.status === 'complete').length}
            </span>
            <span className="text-[10px] text-gray-400 block">done</span>
          </div>
          {stories.some((s) => s.status === 'failed') && (
            <div className="mt-1 bg-factory-danger/10 border border-factory-danger/30 rounded p-1 text-center">
              <span className="text-factory-danger text-sm font-bold">
                {stories.filter((s) => s.status === 'failed').length}
              </span>
              <span className="text-[10px] text-gray-400 block">failed</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
