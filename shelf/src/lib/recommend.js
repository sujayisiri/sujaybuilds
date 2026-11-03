import { searchBooks } from '../api/openLibrary'

const STATUS_WEIGHT = { finished: 3, reading: 2, want_to_read: 1 }
const GENERIC = new Set(['fiction', 'general', 'novel', 'novels', 'literature', 'large type books', 'accessible book', 'protected daisy', 'in library'])

function topKeys(counts, n) {
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([k]) => k)
}

/** Builds a taste profile from the shelf: favourite subjects and authors, weighted by status. */
export function buildProfile(books) {
  const subjects = {}
  const authors = {}
  for (const b of books) {
    const w = STATUS_WEIGHT[b.status] || 1
    for (const s of b.subjects || []) {
      const key = s.toLowerCase().trim()
      if (!key || key.length > 40 || key.includes(':') || GENERIC.has(key)) continue
      subjects[key] = (subjects[key] || 0) + w
    }
    for (const a of b.authors || []) authors[a] = (authors[a] || 0) + w
  }
  return { subjects: topKeys(subjects, 3), authors: topKeys(authors, 2) }
}

export async function getRecommendations(books, profile) {
  const owned = new Set(books.flatMap((b) => [b.isbn, b.title.toLowerCase()]))
  const queries = [
    ...profile.subjects.map((s) => ({ params: { subject: s }, reason: `Because you read ${s}` })),
    ...profile.authors.map((a) => ({ params: { author: a }, reason: `More by ${a}` })),
  ]
  if (queries.length === 0) queries.push({ params: { subject: 'classics' }, reason: 'Popular classic' })

  const results = await Promise.allSettled(queries.map((q) => searchBooks(q.params, 15)))
  const byKey = new Map()

  results.forEach((r, i) => {
    if (r.status !== 'fulfilled') return
    for (const doc of r.value) {
      const isbn = (doc.isbn || []).find((x) => x.length === 13) || doc.isbn?.[0]
      if (!isbn || !doc.title || owned.has(doc.title.toLowerCase()) || doc.isbn.some((x) => owned.has(x))) continue
      const existing = byKey.get(doc.key)
      if (existing) {
        existing.score += 1
        continue
      }
      byKey.set(doc.key, {
        key: doc.key,
        title: doc.title,
        authors: doc.author_name || [],
        coverId: doc.cover_i,
        year: doc.first_publish_year,
        isbn,
        reason: queries[i].reason,
        score: 1 + (doc.cover_i ? 0.5 : 0),
      })
    }
  })

  return [...byKey.values()].sort((a, b) => b.score - a.score).slice(0, 12)
}
