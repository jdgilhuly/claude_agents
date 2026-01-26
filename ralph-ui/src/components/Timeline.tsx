import { useState, useMemo } from 'react';
import type { RalphEvent, EventType } from '../types/events';

interface TimelineProps {
  events: RalphEvent[];
}

const EVENT_TYPE_COLORS: Record<string, string> = {
  session_start: 'bg-factory-info',
  session_end: 'bg-factory-info',
  iteration_start: 'bg-factory-accent',
  iteration_end: 'bg-factory-accent',
  story_start: 'bg-blue-500',
  story_complete: 'bg-factory-success',
  story_failed: 'bg-factory-danger',
  agent_spawn: 'bg-purple-500',
  agent_output: 'bg-purple-400',
  agent_complete: 'bg-purple-600',
  quality_gate_start: 'bg-factory-warning',
  quality_gate_pass: 'bg-factory-success',
  quality_gate_fail: 'bg-factory-danger',
  prd_loaded: 'bg-cyan-500',
  prd_updated: 'bg-cyan-400',
  briefing_generated: 'bg-gray-500',
};

const EVENT_TYPE_LABELS: Record<string, string> = {
  session_start: 'Session Started',
  session_end: 'Session Ended',
  iteration_start: 'Iteration Started',
  iteration_end: 'Iteration Ended',
  story_start: 'Story Started',
  story_complete: 'Story Complete',
  story_failed: 'Story Failed',
  agent_spawn: 'Agent Spawned',
  agent_output: 'Agent Output',
  agent_complete: 'Agent Complete',
  quality_gate_start: 'QA Check Started',
  quality_gate_pass: 'QA Passed',
  quality_gate_fail: 'QA Failed',
  prd_loaded: 'PRD Loaded',
  prd_updated: 'PRD Updated',
  briefing_generated: 'Briefing Generated',
};

type FilterCategory = 'all' | 'session' | 'iteration' | 'story' | 'agent' | 'quality';

export function Timeline({ events }: TimelineProps) {
  const [filter, setFilter] = useState<FilterCategory>('all');
  const [expanded, setExpanded] = useState(false);

  const filteredEvents = useMemo(() => {
    if (filter === 'all') return events;

    const categoryFilters: Record<FilterCategory, EventType[]> = {
      all: [],
      session: ['session_start', 'session_end', 'prd_loaded', 'prd_updated'],
      iteration: ['iteration_start', 'iteration_end', 'briefing_generated'],
      story: ['story_start', 'story_complete', 'story_failed'],
      agent: ['agent_spawn', 'agent_output', 'agent_complete'],
      quality: ['quality_gate_start', 'quality_gate_pass', 'quality_gate_fail'],
    };

    return events.filter((e) => categoryFilters[filter].includes(e.type));
  }, [events, filter]);

  // Show only last N events when collapsed
  const displayEvents = expanded ? filteredEvents : filteredEvents.slice(-20);

  return (
    <div className="bg-factory-panel border-t border-factory-border">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-factory-border">
        <div className="flex items-center gap-4">
          <h3 className="text-sm font-medium text-white">Event Timeline</h3>
          <span className="text-xs text-gray-500">
            {filteredEvents.length} events
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Filter buttons */}
          <div className="flex gap-1">
            {(['all', 'session', 'iteration', 'story', 'agent', 'quality'] as FilterCategory[]).map(
              (cat) => (
                <button
                  key={cat}
                  onClick={() => setFilter(cat)}
                  className={`
                    px-2 py-0.5 rounded text-xs transition-colors
                    ${filter === cat
                      ? 'bg-factory-accent/20 text-factory-accent'
                      : 'text-gray-400 hover:text-gray-300 hover:bg-factory-border'}
                  `}
                >
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </button>
              )
            )}
          </div>

          {/* Expand/collapse */}
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1 text-gray-400 hover:text-white transition-colors"
          >
            <svg
              className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Timeline content */}
      <div
        className={`overflow-x-auto ${expanded ? 'max-h-64' : 'max-h-24'} transition-all duration-300`}
      >
        {displayEvents.length === 0 ? (
          <div className="p-4 text-center text-gray-500 text-sm">No events to display</div>
        ) : (
          <div className="flex gap-1 p-2 min-w-max">
            {displayEvents.map((event, index) => (
              <TimelineEvent key={event.id || index} event={event} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function TimelineEvent({ event }: { event: RalphEvent }) {
  const [showDetails, setShowDetails] = useState(false);

  const color = EVENT_TYPE_COLORS[event.type] || 'bg-gray-500';
  const label = EVENT_TYPE_LABELS[event.type] || event.type;

  const time = new Date(event.timestamp).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  return (
    <div className="relative">
      <button
        onClick={() => setShowDetails(!showDetails)}
        className={`
          flex flex-col items-center gap-1 px-2 py-1 rounded transition-colors
          hover:bg-factory-border
          ${showDetails ? 'bg-factory-border' : ''}
        `}
      >
        {/* Event dot */}
        <div className={`w-3 h-3 rounded-full ${color}`} />

        {/* Time */}
        <div className="text-[10px] text-gray-500 font-mono">{time}</div>
      </button>

      {/* Details popup */}
      {showDetails && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-10">
          <div className="bg-factory-bg border border-factory-border rounded-lg shadow-lg p-3 min-w-[200px] max-w-[300px]">
            {/* Header */}
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-2 h-2 rounded-full ${color}`} />
              <span className="text-xs font-medium text-white">{label}</span>
            </div>

            {/* Timestamp */}
            <div className="text-[10px] text-gray-500 mb-2">
              {new Date(event.timestamp).toLocaleString()}
            </div>

            {/* Payload */}
            <div className="text-xs font-mono text-gray-300 bg-factory-panel rounded p-2 max-h-32 overflow-auto">
              <pre className="whitespace-pre-wrap">
                {JSON.stringify(event.payload, null, 2)}
              </pre>
            </div>

            {/* Close hint */}
            <div className="text-[10px] text-gray-600 text-center mt-2">
              Click to close
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
