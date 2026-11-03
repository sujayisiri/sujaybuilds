import { useState } from 'react'
import { formatDate } from '../lib/dates'

const STATUS_LABEL = { want_to_read: 'Want to read', reading: 'Reading', finished: 'Finished' }

export default function BookCard({ book, stats, onStart, onFinish, onDelete, onLog }) {
  const [pages, setPages] = useState('')
  const [busy, setBusy] = useState(false)

  const read = stats.pagesByBook[book.id] || 0
  const today = stats.todayByBook[book.id] || 0
  const pct = book.page_count ? Math.min(100, Math.round((read / book.page_count) * 100)) : null
  const eta = stats.etaByBook[book.id]

  const act = async (fn) => {
    setBusy(true)
    await fn()
    setBusy(false)
  }

  const logPages = (e) => {
    e.preventDefault()
    const n = parseInt(pages, 10)
    if (!(n > 0 && n <= 5000)) return
    act(async () => {
      if (await onLog(book, n)) setPages('')
    })
  }

  return (
    <article className={`card book ${book.status}`}>
      <div className="book-top">
        {book.cover_url ? (
          <img className="cover" src={book.cover_url} alt={`Cover of ${book.title}`} loading="lazy" />
        ) : (
          <div className="cover cover-placeholder">📕</div>
        )}
        <div className="book-info">
          <span className={`badge ${book.status}`}>{STATUS_LABEL[book.status]}</span>
          <h4 title={book.title}>{book.title}</h4>
          <p className="muted small">{book.authors?.join(', ') || 'Unknown author'}</p>
          {book.started_at && <p className="muted small">Started {formatDate(book.started_at)}</p>}
          {book.finished_at && book.status === 'finished' && (
            <p className="muted small">Finished {formatDate(book.finished_at)}</p>
          )}
        </div>
      </div>

      {(book.status !== 'want_to_read' || read > 0) && (
        <div className="progress-wrap">
          <div className="progress-text small">
            <span>
              {read}
              {book.page_count ? ` / ${book.page_count}` : ''} pages
            </span>
            {pct !== null && <span>{pct}%</span>}
          </div>
          {pct !== null && (
            <div className="progress">
              <span style={{ width: `${pct}%` }} />
            </div>
          )}
          {book.status === 'reading' && (
            <p className="muted small">
              {today > 0 && `${today} pages today · `}
              {eta === 0
                ? 'All pages read — mark it done!'
                : eta
                  ? `~${eta} day${eta === 1 ? '' : 's'} to finish at your pace`
                  : 'Log pages to see an estimate'}
            </p>
          )}
        </div>
      )}

      {book.status === 'reading' && (
        <form className="row" onSubmit={logPages}>
          <input
            type="number"
            min="1"
            max="5000"
            placeholder="Pages read today"
            aria-label="Pages read today"
            value={pages}
            onChange={(e) => setPages(e.target.value)}
          />
          <button className="btn primary" disabled={busy || !pages}>
            Log
          </button>
        </form>
      )}

      <div className="row wrap actions">
        {book.status !== 'reading' && (
          <button className="btn" disabled={busy} onClick={() => act(() => onStart(book))}>
            {book.status === 'finished' ? 'Re-read' : 'Start reading'}
          </button>
        )}
        {book.status === 'reading' && (
          <button className="btn success" disabled={busy} onClick={() => act(() => onFinish(book))}>
            Done reading
          </button>
        )}
        <button className="btn ghost danger" disabled={busy} onClick={() => onDelete(book)}>
          Remove
        </button>
      </div>
    </article>
  )
}
