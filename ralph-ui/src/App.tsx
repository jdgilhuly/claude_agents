import { useState } from 'react';
import { useEventStream, useAssemblyState } from './hooks/useEventStream';
import { AssemblyLine } from './components/canvas/AssemblyLine';
import { DetailPanel } from './components/panels/DetailPanel';
import { Timeline } from './components/Timeline';
import { useAssemblyStore } from './stores/assemblyStore';

function App() {
  const [visibleSessions, setVisibleSessions] = useState<string[]>([]);
  const [showAddMenu, setShowAddMenu] = useState(false);

  useEventStream(null); // Always use live mode

  const {
    connected,
    sessions,
    sessionStates,
    selectedElement,
    events,
  } = useAssemblyState();

  const allSessionStates = useAssemblyStore((s) => s.getAllSessionStates());

  // Initialize with first session if none selected
  if (visibleSessions.length === 0 && sessions.length > 0) {
    setVisibleSessions([sessions[0].session_id]);
  }

  const addSession = (sessionId: string) => {
    if (!visibleSessions.includes(sessionId)) {
      setVisibleSessions([...visibleSessions, sessionId]);
    }
    setShowAddMenu(false);
  };

  const removeSession = (sessionId: string) => {
    setVisibleSessions(visibleSessions.filter((id) => id !== sessionId));
  };

  const availableToAdd = sessions.filter((s) => !visibleSessions.includes(s.session_id));

  return (
    <div className="flex flex-col h-screen bg-factory-bg">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-2 bg-factory-panel border-b border-factory-border">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-bold text-factory-accent">
            Ralph Assembly Line
          </h1>
          <div className="flex items-center gap-2">
            <div
              className={`led ${connected ? 'led-green' : 'led-red'}`}
              title={connected ? 'Connected' : 'Disconnected'}
            />
            <span className="text-sm text-gray-400">
              {connected ? 'Live' : 'Disconnected'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-400">
            {visibleSessions.length} of {sessions.length} sessions visible |{' '}
            {allSessionStates.filter((s) => s.status === 'running').length} active
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Assembly lines */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-auto p-4 space-y-3">
            {visibleSessions.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="text-2xl text-gray-600 mb-4">No Assembly Lines</div>
                  <div className="text-gray-500 mb-4">
                    Add a session to start monitoring
                  </div>
                  {sessions.length > 0 && (
                    <button
                      onClick={() => addSession(sessions[0].session_id)}
                      className="px-4 py-2 bg-factory-accent text-black rounded font-medium hover:bg-factory-accent/80"
                    >
                      Add First Session
                    </button>
                  )}
                </div>
              </div>
            ) : (
              visibleSessions.map((sessionId) => {
                const session = sessions.find((s) => s.session_id === sessionId);
                const state = sessionStates.get(sessionId);

                if (!session) return null;

                return (
                  <div key={sessionId} className="relative group">
                    <AssemblyLine
                      sessionId={sessionId}
                      featureName={state?.featureName || session.feature_name || undefined}
                      branchName={state?.branchName || undefined}
                      iteration={state?.currentIteration || 0}
                      maxIterations={state?.maxIterations || 5}
                      status={state?.status || 'idle'}
                      stories={state?.stories || []}
                      agents={state ? Array.from(state.agents.values()) : []}
                      qualityGates={state?.qualityGates || []}
                      currentStoryId={state?.currentStoryId || undefined}
                      compact={visibleSessions.length > 2}
                    />
                    {/* Remove button */}
                    {visibleSessions.length > 1 && (
                      <button
                        onClick={() => removeSession(sessionId)}
                        className="absolute top-2 right-2 p-1 bg-factory-danger/20 hover:bg-factory-danger/40 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Remove from view"
                      >
                        <svg className="w-4 h-4 text-factory-danger" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                );
              })
            )}

            {/* Add session bar */}
            {sessions.length > 0 && (
              <div className="relative">
                <button
                  onClick={() => setShowAddMenu(!showAddMenu)}
                  disabled={availableToAdd.length === 0}
                  className={`
                    w-full py-3 border-2 border-dashed rounded-lg flex items-center justify-center gap-2
                    transition-colors
                    ${availableToAdd.length > 0
                      ? 'border-factory-border hover:border-factory-accent hover:bg-factory-accent/5 text-gray-400 hover:text-factory-accent cursor-pointer'
                      : 'border-factory-border/50 text-gray-600 cursor-not-allowed'
                    }
                  `}
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span className="text-sm font-medium">
                    {availableToAdd.length > 0
                      ? `Add Assembly Line (${availableToAdd.length} available)`
                      : 'All sessions visible'
                    }
                  </span>
                </button>

                {/* Dropdown menu */}
                {showAddMenu && availableToAdd.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-factory-panel border border-factory-border rounded-lg shadow-xl z-20 max-h-60 overflow-auto">
                    {availableToAdd.map((session) => {
                      const state = sessionStates.get(session.session_id);
                      return (
                        <button
                          key={session.session_id}
                          onClick={() => addSession(session.session_id)}
                          className="w-full px-4 py-2 flex items-center justify-between hover:bg-factory-accent/10 text-left"
                        >
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${
                              state?.status === 'running' ? 'bg-factory-warning animate-pulse' :
                              state?.status === 'completed' ? 'bg-factory-success' :
                              'bg-gray-500'
                            }`} />
                            <span className="text-white text-sm">
                              {state?.featureName || session.feature_name || session.session_id.slice(0, 16)}
                            </span>
                          </div>
                          <span className="text-xs text-gray-400">
                            {session.event_count} events
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Timeline */}
          <Timeline events={events} />
        </div>

        {/* Detail panel */}
        {selectedElement && (
          <div className="w-80 border-l border-factory-border flex-shrink-0">
            <DetailPanel />
          </div>
        )}
      </div>

      {/* Click outside to close menu */}
      {showAddMenu && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => setShowAddMenu(false)}
        />
      )}
    </div>
  );
}

export default App;
