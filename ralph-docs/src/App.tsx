import { useState, useCallback } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import WorkflowDag from './components/WorkflowDag';
import DetailPanel from './components/DetailPanel';
import Legend from './components/Legend';
import ExampleSession from './components/ExampleSession';
import { Stage, DecisionPoint } from './types/workflow';
import './App.css';

function App() {
  const [selectedStage, setSelectedStage] = useState<Stage | null>(null);
  const [selectedDecision, setSelectedDecision] = useState<DecisionPoint | null>(null);

  const handleSelectStage = useCallback((stage: Stage) => {
    setSelectedStage(stage);
    setSelectedDecision(null);
  }, []);

  const handleSelectDecision = useCallback((decision: DecisionPoint) => {
    setSelectedDecision(decision);
    setSelectedStage(null);
  }, []);

  const handleClosePanel = useCallback(() => {
    setSelectedStage(null);
    setSelectedDecision(null);
  }, []);

  return (
    <ReactFlowProvider>
      <div className="app">
        <header className="header">
          <div className="header-content">
            <h1>Ralph Workflow</h1>
            <p className="subtitle">
              An automated feature development pipeline that takes you from idea to implementation
            </p>
          </div>
        </header>

        <main className="main">
          <section className="workflow-section">
            <h2>Workflow Pipeline</h2>
            <p className="section-description">
              Click on any stage or decision point to learn more about what happens at each step.
            </p>
            <WorkflowDag
              onSelectStage={handleSelectStage}
              onSelectDecision={handleSelectDecision}
            />
          </section>

          <section className="info-section">
            <div className="info-panels">
              <Legend />
              <ExampleSession />
            </div>
          </section>

          <section className="commands-section">
            <h2>Quick Start Commands</h2>
            <div className="commands-grid">
              <div className="command-card">
                <h4>Start New Workflow</h4>
                <code>./ralph-workflow.sh "your feature idea"</code>
              </div>
              <div className="command-card">
                <h4>Resume Latest Session</h4>
                <code>./ralph-workflow.sh --continue</code>
              </div>
              <div className="command-card">
                <h4>Resume Specific Session</h4>
                <code>./ralph-workflow.sh --resume abc12345</code>
              </div>
              <div className="command-card">
                <h4>List All Sessions</h4>
                <code>./ralph-workflow.sh --list-sessions</code>
              </div>
            </div>
          </section>
        </main>

        <footer className="footer">
          <p>Ralph Workflow Documentation</p>
        </footer>

        <DetailPanel
          selectedStage={selectedStage}
          selectedDecision={selectedDecision}
          onClose={handleClosePanel}
        />
      </div>
    </ReactFlowProvider>
  );
}

export default App;
