export default function ActivityChart({ series, avgPerDay }) {
  const max = Math.max(...series.map((d) => d.pages), 1)
  const last = series.length - 1
  return (
    <div className="card">
      <div className="card-head">
        <h3>Last 14 days</h3>
        <span className="avg-badge">{avgPerDay.toFixed(1)} pages/day avg</span>
      </div>
      <div className="chart">
        {series.map((d, i) => (
          <div className={`chart-col ${i === last ? 'today' : ''}`} key={d.key} title={`${d.key}: ${d.pages} pages`}>
            <span className="chart-val">{d.pages || ''}</span>
            <div className="chart-track">
              <span className="chart-bar" style={{ height: `${(d.pages / max) * 100}%` }} />
            </div>
            <span className="chart-label">{d.day}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
