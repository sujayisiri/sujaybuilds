import { useCallback, useEffect, useMemo, useState } from 'react'
import { isConfigured } from './supabaseClient'
import * as db from './api/db'
import { lookupIsbn } from './api/openLibrary'
import { computeStats } from './lib/stats'
import SetupNotice from './components/SetupNotice'
import StatsCards from './components/StatsCards'
import ActivityChart from './components/ActivityChart'
import AddBookForm from './components/AddBookForm'
import BookCard from './components/BookCard'
import Recommendations from './components/Recommendations'

export default function App() {
  return isConfigured ? <Tracker /> : <SetupNotice />
}

const TABS = [
  { id: 'want_to_read', label: 'Want to read' },
  { id: 'finished', label: 'Finished' },
]

function Tracker() {
  const [books, setBooks] = useState([])
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [tab, setTab] = useState('want_to_read')

  const refresh = useCallback(async () => {
    try {
      const [b, l] = await Promise.all([db.fetchBooks(), db.fetchLogs()])
      setBooks(b)
      setLogs(l)
      setError('')
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const stats = useMemo(() => computeStats(books, logs), [books, logs])

  const run = async (fn) => {
    try {
      await fn()
      await refresh()
      return true
    } catch (e) {
      setError(e.message)
      return false
    }
  }

  const actions = {
    onStart: (b) => run(() => db.updateBook(b.id, { status: 'reading', started_at: new Date().toISOString(), finished_at: null })),
    onFinish: (b) => run(() => db.updateBook(b.id, { status: 'finished', finished_at: new Date().toISOString() })),
    onDelete: (b) => {
      if (window.confirm(`Remove "${b.title}" and its reading history?`)) run(() => db.deleteBook(b.id))
    },
    onLog: (b, pages) => run(() => db.addLog(b.id, pages)),
  }

  const addBook = (book, status) => run(() => db.addBook(book, status))
  const addByIsbn = async (isbn) => addBook(await lookupIsbn(isbn), 'want_to_read')

  const reading = books.filter((b) => b.status === 'reading')
  const shelf = books.filter((b) => b.status === tab)

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="logo">📚</span> Shelf
        </div>
      </header>

      <main className="container">
        {error && (
          <div className="alert" role="alert">
            {error}
            <button className="link" onClick={() => setError('')}>Dismiss</button>
          </div>
        )}

        <StatsCards stats={stats} />

        <div className="grid-2">
          <ActivityChart series={stats.series} avgPerDay={stats.avgPerDay} />
          <AddBookForm onAdd={addBook} />
        </div>

        <section>
          <h2>Currently reading</h2>
          {loading ? (
            <p className="muted">Loading your shelf…</p>
          ) : reading.length === 0 ? (
            <p className="empty">Nothing in progress. Add a book and hit “Start reading”.</p>
          ) : (
            <div className="book-grid">
              {reading.map((b) => (
                <BookCard key={b.id} book={b} stats={stats} {...actions} />
              ))}
            </div>
          )}
        </section>

        <section>
          <div className="section-head">
            <h2>My shelf</h2>
            <div className="tabs" role="tablist">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  role="tab"
                  aria-selected={tab === t.id}
                  className={`tab ${tab === t.id ? 'active' : ''}`}
                  onClick={() => setTab(t.id)}
                >
                  {t.label} <span className="count">{books.filter((b) => b.status === t.id).length}</span>
                </button>
              ))}
            </div>
          </div>
          {shelf.length === 0 ? (
            <p className="empty">No books here yet.</p>
          ) : (
            <div className="book-grid">
              {shelf.map((b) => (
                <BookCard key={b.id} book={b} stats={stats} {...actions} />
              ))}
            </div>
          )}
        </section>

        {!loading && <Recommendations books={books} onAdd={addByIsbn} />}
      </main>
    </div>
  )
}
