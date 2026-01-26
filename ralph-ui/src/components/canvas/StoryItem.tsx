import { useAssemblyStore } from '../../stores/assemblyStore';
import type { Story } from '../../types/events';

interface StoryItemProps {
  story: Story;
  isActive: boolean;
}

export function StoryItem({ story, isActive }: StoryItemProps) {
  const { setSelectedElement, selectedElement } = useAssemblyStore();

  const isSelected = selectedElement?.type === 'story' && selectedElement?.id === story.id;

  const statusColors = {
    pending: 'border-gray-500',
    processing: 'border-factory-warning',
    complete: 'border-factory-success',
    failed: 'border-factory-danger',
  };

  const statusBg = {
    pending: 'bg-gray-500/20',
    processing: 'bg-factory-warning/20',
    complete: 'bg-factory-success/20',
    failed: 'bg-factory-danger/20',
  };

  const handleClick = () => {
    setSelectedElement(
      isSelected ? null : { type: 'story', id: story.id }
    );
  };

  // Calculate position based on story status
  const getPosition = () => {
    switch (story.status) {
      case 'pending':
        return '5%';
      case 'processing':
        return '40%';
      case 'complete':
        return '90%';
      case 'failed':
        return '70%';
      default:
        return '5%';
    }
  };

  return (
    <div
      className={`
        absolute top-1/2 -translate-y-1/2 cursor-pointer transition-all duration-500
        story-item p-3 rounded-lg min-w-[120px] max-w-[160px]
        ${statusColors[story.status]} ${statusBg[story.status]}
        ${isActive ? 'story-item-processing scale-105' : ''}
        ${story.status === 'complete' ? 'story-item-complete' : ''}
        ${story.status === 'failed' ? 'story-item-failed' : ''}
        ${isSelected ? 'ring-2 ring-factory-accent ring-offset-2 ring-offset-factory-bg' : ''}
      `}
      style={{ left: getPosition() }}
      onClick={handleClick}
    >
      {/* Story ID badge */}
      <div className="flex items-center gap-2 mb-1">
        <span
          className={`
            px-1.5 py-0.5 rounded text-[10px] font-bold
            ${statusBg[story.status]}
          `}
        >
          {story.id}
        </span>
        <StatusIndicator status={story.status} isActive={isActive} />
      </div>

      {/* Story title (truncated) */}
      <div className="text-xs text-white/80 truncate" title={story.title}>
        {story.title.length > 30 ? `${story.title.slice(0, 30)}...` : story.title}
      </div>

      {/* Acceptance criteria count */}
      {story.acceptanceCriteria.length > 0 && (
        <div className="mt-2 text-[10px] text-gray-400">
          {story.acceptanceCriteria.length} criteria
        </div>
      )}

      {/* Processing indicator */}
      {isActive && story.status === 'processing' && (
        <div className="absolute -top-1 -right-1">
          <div className="w-3 h-3 bg-factory-warning rounded-full animate-pulse" />
        </div>
      )}
    </div>
  );
}

function StatusIndicator({
  status,
  isActive,
}: {
  status: Story['status'];
  isActive: boolean;
}) {
  const ledClass = {
    pending: 'led-off',
    processing: isActive ? 'led-yellow' : 'led-off',
    complete: 'led-green',
    failed: 'led-red',
  };

  return <div className={`led ${ledClass[status]}`} />;
}
