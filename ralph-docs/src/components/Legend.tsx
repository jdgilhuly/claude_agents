import './Legend.css';

export default function Legend() {
  return (
    <div className="legend">
      <h4 className="legend-title">Legend</h4>

      <div className="legend-items">
        <div className="legend-item">
          <div className="legend-stage-icon">
            <span>1</span>
          </div>
          <span>Stage Node</span>
        </div>

        <div className="legend-item">
          <div className="legend-decision-icon">
            <span>?</span>
          </div>
          <span>Decision Point</span>
        </div>

        <div className="legend-divider" />

        <div className="legend-item">
          <span className="legend-mode interactive">Interactive</span>
          <span>User interaction required</span>
        </div>

        <div className="legend-item">
          <span className="legend-mode autonomous">Autonomous</span>
          <span>Runs without user input</span>
        </div>

        <div className="legend-divider" />

        <div className="legend-item">
          <span className="legend-status pending" />
          <span>Pending</span>
        </div>

        <div className="legend-item">
          <span className="legend-status in-progress" />
          <span>In Progress</span>
        </div>

        <div className="legend-item">
          <span className="legend-status completed" />
          <span>Completed</span>
        </div>
      </div>
    </div>
  );
}
