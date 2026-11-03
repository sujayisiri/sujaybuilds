export default function StatsCards({ stats }) {
  const items = [
    { label: 'Pages today', value: stats.today, icon: '📖', tone: 'violet' },
    { label: 'This week', value: stats.week, icon: '📅', tone: 'sky' },
    { label: 'Day streak', value: stats.streak, icon: '🔥', tone: 'amber' },
    { label: 'Reading now', value: stats.reading, icon: '⏳', tone: 'rose' },
    { label: 'Finished this year', value: stats.finishedThisYear, icon: '🏁', tone: 'green' },
    { label: 'Total pages', value: stats.totalPages.toLocaleString(), icon: '📈', tone: 'slate' },
  ]
  return (
    <div className="stats">
      {items.map((s) => (
        <div className={`card stat tone-${s.tone}`} key={s.label}>
          <span className="stat-icon" aria-hidden="true">{s.icon}</span>
          <div>
            <div className="stat-value">{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        </div>
      ))}
    </div>
  )
}
