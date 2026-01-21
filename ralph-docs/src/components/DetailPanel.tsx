import { Stage, DecisionPoint } from '../types/workflow';
import './DetailPanel.css';

interface DetailPanelProps {
  selectedStage: Stage | null;
  selectedDecision: DecisionPoint | null;
  onClose: () => void;
}

export default function DetailPanel({
  selectedStage,
  selectedDecision,
  onClose,
}: DetailPanelProps) {
  if (!selectedStage && !selectedDecision) return null;

  return (
    <div className="detail-panel-overlay" onClick={onClose}>
      <div className="detail-panel" onClick={(e) => e.stopPropagation()}>
        <button className="close-button" onClick={onClose}>
          &times;
        </button>

        {selectedStage && (
          <div className="stage-detail">
            <div className="detail-header">
              <span className="detail-number">{selectedStage.number}</span>
              <span className={`detail-mode ${selectedStage.mode}`}>
                {selectedStage.mode === 'interactive' ? 'Interactive' : 'Autonomous'}
              </span>
            </div>

            <h2>{selectedStage.name}</h2>
            <p className="stage-short-desc">{selectedStage.fullDescription}</p>

            <div className="source-section">
              <div className="source-header">
                <span className="source-label">Source:</span>
                <code className="source-file">{selectedStage.sourceFile}</code>
              </div>
              <pre className="source-content">
                <code>{selectedStage.sourceContent}</code>
              </pre>
            </div>

            <div className="detail-footer">
              <div className="output-info">
                <span className="output-label">Output:</span>
                <code>{selectedStage.outputLocation}{selectedStage.outputFile}</code>
              </div>
            </div>
          </div>
        )}

        {selectedDecision && (
          <div className="decision-detail">
            <div className="detail-header">
              <span className="decision-badge">Decision Point</span>
            </div>

            <h2>Stage Boundary</h2>
            <p className="boundary-description">
              After completing the previous stage, you can choose how to proceed:
            </p>

            <div className="options-list">
              {selectedDecision.options.map((option) => (
                <div key={option.key} className="option-item">
                  <div className="option-key-large">[{option.key}]</div>
                  <div className="option-content">
                    <span className="option-label">{option.label}</span>
                    <span className="option-description">{option.description}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
