import { useAssemblyStore } from '../../stores/assemblyStore';
import { ConveyorBelt } from './ConveyorBelt';
import { StoryItem } from './StoryItem';
import { WorkStation } from './WorkStation';

export function AssemblyLineCanvas() {
  const { stories, agents, qualityGates, currentStoryId, status } = useAssemblyStore();

  // Get active agents as array
  const activeAgents = Array.from(agents.values());

  // Define work stations
  const stations = [
    { id: 'planning', label: 'Planning', type: 'planning' as const },
    { id: 'implementation', label: 'Implementation', type: 'implementation' as const },
    { id: 'code-review', label: 'Code Review', type: 'quality' as const },
    { id: 'testing', label: 'Testing', type: 'quality' as const },
    { id: 'complete', label: 'Complete', type: 'output' as const },
  ];

  return (
    <div className="flex-1 relative overflow-hidden bg-factory-bg p-6">
      {/* Background grid pattern */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `
            linear-gradient(to right, #fff 1px, transparent 1px),
            linear-gradient(to bottom, #fff 1px, transparent 1px)
          `,
          backgroundSize: '20px 20px',
        }}
      />

      {/* Main assembly line */}
      <div className="relative h-full flex flex-col justify-center gap-8">
        {/* Work stations row */}
        <div className="flex justify-between items-end px-12">
          {stations.map((station) => {
            // Determine station status based on current processing
            const isActive =
              status === 'running' &&
              ((station.type === 'implementation' && currentStoryId) ||
                (station.type === 'quality' &&
                  qualityGates.some((g) => g.type.includes(station.id) && g.status === 'checking')) ||
                (station.type === 'planning' && activeAgents.some((a) => a.type === 'planning')));

            const gateStatus = qualityGates.find((g) => g.type.includes(station.id));
            const stationStatus =
              gateStatus?.status === 'passed'
                ? 'success'
                : gateStatus?.status === 'failed'
                  ? 'fail'
                  : isActive
                    ? 'active'
                    : 'idle';

            return (
              <WorkStation
                key={station.id}
                id={station.id}
                label={station.label}
                type={station.type}
                status={stationStatus}
                agents={activeAgents.filter((a) => a.type.includes(station.id))}
              />
            );
          })}
        </div>

        {/* Conveyor belt */}
        <ConveyorBelt active={status === 'running'}>
          {/* Story items on conveyor */}
          {stories.map((story) => (
            <StoryItem
              key={story.id}
              story={story}
              isActive={story.id === currentStoryId}
            />
          ))}

          {/* Empty state */}
          {stories.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-gray-500 text-lg mb-2">Awaiting Stories</div>
                <div className="text-gray-600 text-sm">
                  {status === 'idle'
                    ? 'No active Ralph session'
                    : 'Waiting for stories to be loaded...'}
                </div>
              </div>
            </div>
          )}
        </ConveyorBelt>

        {/* Reject lane (for failed items) */}
        <div className="flex justify-end px-12">
          <div className="w-48">
            <div className="text-xs text-gray-500 mb-2 text-center">Reject Lane</div>
            <div className="bg-factory-danger/10 border border-factory-danger/30 rounded-lg p-2 min-h-[60px]">
              {stories
                .filter((s) => s.status === 'failed')
                .map((story) => (
                  <div
                    key={story.id}
                    className="px-2 py-1 bg-factory-danger/20 rounded text-xs text-factory-danger mb-1"
                  >
                    {story.id}
                  </div>
                ))}
              {stories.filter((s) => s.status === 'failed').length === 0 && (
                <div className="text-center text-gray-600 text-xs py-4">
                  No failures
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Status indicators */}
      <div className="absolute bottom-4 left-4 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="led led-green" />
          <span className="text-xs text-gray-400">Passed</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="led led-yellow" />
          <span className="text-xs text-gray-400">Processing</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="led led-red" />
          <span className="text-xs text-gray-400">Failed</span>
        </div>
      </div>
    </div>
  );
}
