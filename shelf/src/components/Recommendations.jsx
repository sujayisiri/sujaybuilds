import { useEffect, useMemo, useState } from 'react'
import { coverUrl } from '../api/openLibrary'
import { buildProfile, getRecommendations } from '../lib/recommend'

export default function Recommendations({ books, onAdd }) {
  const profile = useMemo(() => buildProfile(books), [books])
  const profileKey = JSON.stringify(profile)
  const [recs, setRecs] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [adding, setAdding] = useState(null)
  const [nonce, setNonce] = useState(0)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')
    getRecommendations(books, profile)
      .then((r) => !cancelled && setRecs(r))
      .catch((e) => !cancelled && setError(e.message))
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
    // Only refetch when the taste profile changes, not on every log entry.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileKey, nonce])

  const add = async (rec) => {
    setAdding(rec.key)
    try {
      if (await onAdd(rec.isbn)) setRecs((r) => r.filter((x) => x.key !== rec.key))
    } catch (e) {
      setError(e.message)
    } finally {
      setAdding(null)
    }
  }

  const basis = [...profile.subjects, ...profile.authors]

  return (
    <section>
      <div className="section-head">
        <div className="section-title">
          <h2>✨ Recommended for you</h2>
        </div>
        <button className="btn" onClick={() => setNonce((n) => n + 1)} disabled={loading}>
          ↻ Refresh
        </button>
      </div>
      <p className="muted small">
        {basis.length ? `Based on: ${basis.join(' · ')}` : 'Add and finish books to personalise these picks.'}
      </p>
      {error && <p className="error">{error}</p>}
      {loading ? (
        <div className="rec-grid">
          {Array.from({ length: 6 }, (_, i) => (
            <div className="skeleton" key={i} />
          ))}
        </div>
      ) : recs.length === 0 ? (
        <div className="empty" style={{ marginTop: '0.75rem' }}>
          <span className="empty-icon">🔍</span>
          <strong>No recommendations right now</strong>
        </div>
      ) : (
        <div className="rec-grid">
          {recs.map((r) => (
            <div className="card rec" key={r.key}>
              {r.coverId ? (
                <img src={coverUrl(r.coverId)} alt={`Cover of ${r.title}`} loading="lazy" />
              ) : (
                <div className="cover-placeholder">📗</div>
              )}
              <strong title={r.title}>{r.title}</strong>
              <span className="muted small">{r.authors.slice(0, 2).join(', ')}</span>
              <span className="reason">{r.reason}</span>
              <button className="btn small-btn" disabled={adding === r.key} onClick={() => add(r)}>
                {adding === r.key ? 'Adding…' : '+ Want to read'}
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
