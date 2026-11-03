import { daysAgo, toDateKey } from './dates'

export function computeStats(books, logs) {
  const todayKey = toDateKey(new Date())
  const pagesByBook = {}
  const todayByBook = {}
  const byDate = {}

  for (const log of logs) {
    pagesByBook[log.book_id] = (pagesByBook[log.book_id] || 0) + log.pages
    byDate[log.log_date] = (byDate[log.log_date] || 0) + log.pages
    if (log.log_date === todayKey) todayByBook[log.book_id] = (todayByBook[log.book_id] || 0) + log.pages
  }

  const sumDays = (n) => {
    let total = 0
    for (let i = 0; i < n; i++) total += byDate[toDateKey(daysAgo(i))] || 0
    return total
  }

  const series = []
  for (let i = 13; i >= 0; i--) {
    const d = daysAgo(i)
    const key = toDateKey(d)
    series.push({ key, label: d.toLocaleDateString(undefined, { weekday: 'narrow' }), day: d.getDate(), pages: byDate[key] || 0 })
  }

  // A streak survives until the end of today even if nothing has been logged yet today.
  let streak = 0
  for (let i = byDate[todayKey] ? 0 : 1; byDate[toDateKey(daysAgo(i))]; i++) streak++

  const avgPerDay = sumDays(14) / 14
  const year = new Date().getFullYear()

  const etaByBook = {}
  for (const b of books) {
    if (b.status !== 'reading' || !b.page_count) continue
    const remaining = Math.max(b.page_count - (pagesByBook[b.id] || 0), 0)
    etaByBook[b.id] = remaining === 0 ? 0 : avgPerDay > 0 ? Math.ceil(remaining / avgPerDay) : null
  }

  return {
    pagesByBook,
    todayByBook,
    etaByBook,
    series,
    streak,
    avgPerDay,
    today: byDate[todayKey] || 0,
    week: sumDays(7),
    totalPages: Object.values(byDate).reduce((a, b) => a + b, 0),
    reading: books.filter((b) => b.status === 'reading').length,
    finished: books.filter((b) => b.status === 'finished').length,
    finishedThisYear: books.filter((b) => b.status === 'finished' && b.finished_at && new Date(b.finished_at).getFullYear() === year).length,
    wantToRead: books.filter((b) => b.status === 'want_to_read').length,
  }
}
