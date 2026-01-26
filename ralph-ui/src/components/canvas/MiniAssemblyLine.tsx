import type { Story, Agent, QualityGate } from '../../types/events';
import { useAssemblyStore } from '../../stores/assemblyStore';

interface MiniAssemblyLineProps {
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
}

export function MiniAssemblyLine({
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
}: MiniAssemblyLineProps) {
  const { setSelectedElement, selectedElement } = useAssemblyStore();

  const stations = [
    { id: 'planning', label: 'Plan', type: 'planning' as const },
    { id: 'implementation', label: 'Impl', type: 'implementation' as const },
    { id: 'code-review', label: 'Review', type: 'quality' as const },
    { id: 'testing', label: 'Test', type: 'quality' as const },
    { id: 'complete', label: 'Done', type: 'output' as const },
  ];

  const getStationStatus = (stationId: string, stationType: string) => {
    const gate = qualityGates.find((g) => g.type.includes(stationId));
    if (gate?.status === 'passed') return 'success';
    if (gate?.status === 'failed') return 'fail';

    const isActive =
      status === 'running' &&
      ((stationType === 'implementation' && currentStoryId) ||
        (stationType === 'quality' && gate?.status === 'checking') ||
        agents.some((a) => a.type.includes(stationId) && a.status === 'active'));

    return isActive ? 'active' : 'idle';
  };

  const statusColors = {
    idle: 'bg-gray-600',
    running: 'bg-factory-warning',
    completed: 'bg-factory-success',
    incomplete: 'bg-factory-danger',
  };

  return (
    <div className="bg-factory-panel border border-factory-border rounded-lg p-3 hover:border-factory-accent/50 transition-colors">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className={`w-2 h-2 rounded-full ${statusColors[status]} ${status === 'running' ? 'animate-pulse' : ''}`} />
          <span className="text-xs font-medium text-white truncate" title={featureName || sessionId}>
            {featureName || sessionId.slice(0, 12)}
          </span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {branchName && (
            <span className="text-[10px] text-factory-info font-mono truncate max-w-[100px]" title={branchName}>
              {branchName.split('/').pop()}
            </span>
          )}
          <span className="text-[10px] text-gray-400">
            {iteration}/{maxIterations}
          </span>
        </div>
      </div>

      {/* Mini conveyor with stations */}
      <div className="relative h-12 bg-factory-conveyor/50 rounded border border-factory-metal overflow-hidden">
        {/* Station indicators */}
        <div className="absolute inset-0 flex items-center justify-between px-2">
          {stations.map((station) => {
            const stationStatus = getStationStatus(station.id, station.type);
            const stationAgents = agents.filter((a) => a.type.includes(station.id));

            return (
              <div
                key={station.id}
                className="flex flex-col items-center cursor-pointer group"
                onClick={() => setSelectedElement({ type: 'gate', id: station.id, sessionId })}
              >
                <div
                  className={`
                    w-6 h-6 rounded flex items-center justify-center text-[10px]
                    transition-all duration-200 group-hover:scale-110
                    ${stationStatus === 'success' ? 'bg-factory-success/30 border border-factory-success text-factory-success' : ''}
                    ${stationStatus === 'fail' ? 'bg-factory-danger/30 border border-factory-danger text-factory-danger' : ''}
                    ${stationStatus === 'active' ? 'bg-factory-warning/30 border border-factory-warning text-factory-warning animate-pulse' : ''}
                    ${stationStatus === 'idle' ? 'bg-factory-border/50 border border-factory-border text-gray-500' : ''}
                  `}
                  title={`${station.label}${stationAgents.length ? ` (${stationAgents.map(a => a.type).join(', ')})` : ''}`}
                >
                  {station.label[0]}
                </div>
                {stationAgents.length > 0 && (
                  <div className="w-1 h-2 bg-factory-accent mt-0.5 rounded-b" />
                )}
              </div>
            );
          })}
        </div>

        {/* Connection line */}
        <div className="absolute top-1/2 left-4 right-4 h-px bg-factory-border -translate-y-1/2" />
      </div>

      {/* Stories summary */}
      <div className="mt-2 flex items-center gap-1 overflow-x-auto">
        {stories.length === 0 ? (
          <span className="text-[10px] text-gray-500">No stories</span>
        ) : (
          stories.slice(0, 6).map((story) => {
            const isSelected = selectedElement?.type === 'story' && selectedElement?.id === story.id;
            return (
              <div
                key={story.id}
                className={`
                  px-1.5 py-0.5 rounded text-[10px] cursor-pointer transition-all
                  ${story.status === 'complete' ? 'bg-factory-success/20 text-factory-success' : ''}
                  ${story.status === 'processing' ? 'bg-factory-warning/20 text-factory-warning' : ''}
                  ${story.status === 'pending' ? 'bg-gray-600/20 text-gray-400' : ''}
                  ${story.status === 'failed' ? 'bg-factory-danger/20 text-factory-danger' : ''}
                  ${story.id === currentStoryId ? 'ring-1 ring-factory-accent' : ''}
                  ${isSelected ? 'ring-2 ring-factory-accent' : ''}
                  hover:scale-105
                `}
                onClick={() => setSelectedElement({ type: 'story', id: story.id, sessionId })}
                title={story.title}
              >
                {story.id}
              </div>
            );
          })
        )}
        {stories.length > 6 && (
          <span className="text-[10px] text-gray-500">+{stories.length - 6}</span>
        )}
      </div>
    </div>
  );
}
