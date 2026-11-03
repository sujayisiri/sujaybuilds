import { useState } from 'react'
import { lookupIsbn } from '../api/openLibrary'

export default function AddBookForm({ onAdd }) {
  const [isbn, setIsbn] = useState('')
  const [preview, setPreview] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [missingIsbn, setMissingIsbn] = useState(null)

  const lookup = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    setMissingIsbn(null)
    setPreview(null)
    try {
      setPreview(await lookupIsbn(isbn))
    } catch (err) {
      setError(err.message)
      if (err.notFound) setMissingIsbn(err.isbn)
    } finally {
      setBusy(false)
    }
  }

  const enterManually = (bookIsbn = null) => {
    setPreview({ isbn: bookIsbn, title: '', authorsText: '', authors: [], cover_url: null, page_count: '', subjects: [], publish_year: null, manual: true })
    setError('')
    setMissingIsbn(null)
  }

  const add = async (status) => {
    const authors = preview.manual
      ? preview.authorsText.split(',').map((a) => a.trim()).filter(Boolean)
      : preview.authors
    setBusy(true)
    const ok = await onAdd({ ...preview, title: preview.title.trim(), authors, page_count: Number(preview.page_count) || null }, status)
    setBusy(false)
    if (ok) {
      setPreview(null)
      setIsbn('')
    }
  }

  return (
    <div className="card">
      <div className="card-head">
        <h3>Add a book</h3>
        <span className="muted">Open Library · Google Books</span>
      </div>
      <form className="row" onSubmit={lookup}>
        <input
          placeholder="ISBN, e.g. 9780441172719"
          value={isbn}
          onChange={(e) => setIsbn(e.target.value)}
          inputMode="numeric"
          aria-label="ISBN"
          required
        />
        <button className="btn primary" disabled={busy || !isbn.trim()}>
          {busy && !preview ? 'Searching…' : 'Look up'}
        </button>
      </form>
      {error && <p className="error">{error}</p>}
      {missingIsbn ? (
        <button className="link" onClick={() => enterManually(missingIsbn)}>
          Enter the details manually instead
        </button>
      ) : (
        !preview?.manual && (
          <button className="link small no-isbn" onClick={() => enterManually()}>
            No ISBN? Add a book manually
          </button>
        )
      )}

      {preview && (
        <div className="preview">
          {preview.cover_url ? <img src={preview.cover_url} alt="" /> : <div className="cover-placeholder">📕</div>}
          <div className="preview-body">
            {preview.manual ? (
              <>
                <label className="small">
                  Title
                  <input value={preview.title} onChange={(e) => setPreview({ ...preview, title: e.target.value })} required />
                </label>
                <label className="small">
                  Author(s), comma separated
                  <input value={preview.authorsText} onChange={(e) => setPreview({ ...preview, authorsText: e.target.value })} />
                </label>
              </>
            ) : (
              <>
                <strong>{preview.title}</strong>
                <span className="muted">{preview.authors.join(', ') || 'Unknown author'}</span>
              </>
            )}
            {preview.publish_year && <span className="muted small">Published {preview.publish_year}</span>}
            <label className="small">
              Pages
              <input
                type="number"
                min="1"
                value={preview.page_count ?? ''}
                onChange={(e) => setPreview({ ...preview, page_count: e.target.value })}
                placeholder="Unknown"
              />
            </label>
            <div className="row wrap">
              <button className="btn primary" disabled={busy || !preview.title.trim()} onClick={() => add('reading')}>
                Start reading
              </button>
              <button className="btn" disabled={busy || !preview.title.trim()} onClick={() => add('want_to_read')}>
                Want to read
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
