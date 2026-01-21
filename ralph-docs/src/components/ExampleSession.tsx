import { exampleSession } from '../data/exampleSession';
import { stages } from '../data/stages';
import './ExampleSession.css';

export default function ExampleSession() {
  return (
    <div className="example-session">
      <h4 className="example-title">Example Session</h4>

      <div className="example-header">
        <div className="example-row">
          <span className="example-label">Session ID:</span>
          <code>{exampleSession.sessionId}</code>
        </div>
        <div className="example-row">
          <span className="example-label">Feature:</span>
          <code>{exampleSession.featureName}</code>
        </div>
      </div>

      <div className="example-prompt">
        <span className="example-label">Prompt:</span>
        <p>"{exampleSession.originalPrompt}"</p>
      </div>

      <div className="example-stages">
        {stages.map((stage) => {
          const stageStatus = exampleSession.stages[stage.id];
          return (
            <div key={stage.id} className="example-stage">
              <div className={`example-stage-status ${stageStatus.status}`} />
              <div className="example-stage-info">
                <span className="example-stage-name">{stage.name}</span>
                {stageStatus.outputFile && (
                  <code className="example-stage-file">
                    {stageStatus.outputFile.split('/').pop()}
                  </code>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
