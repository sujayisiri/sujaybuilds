export default function StatsCards({ stats }) {
  const items = [
    { label: 'Pages today', value: stats.today, icon: '📖' },
    { label: 'This week', value: stats.week, icon: '📅' },
    { label: 'Day streak', value: stats.streak, icon: '🔥' },
    { label: 'Reading now', value: stats.reading, icon: '⏳' },
    { label: 'Finished this year', value: stats.finishedThisYear, icon: '🏁' },
    { label: 'Total pages', value: stats.totalPages.toLocaleString(), icon: '📈' },
  ]
  return (
    <div className="stats">
      {items.map((s) => (
        <div className="card stat" key={s.label}>
          <span className="stat-icon">{s.icon}</span>
          <div>
            <div className="stat-value">{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        </div>
      ))}
    </div>
  )
}
