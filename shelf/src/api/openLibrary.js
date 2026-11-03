import { lookupGoogleBooks } from './googleBooks'

const BASE = 'https://openlibrary.org'

export const coverUrl = (coverId, size = 'M') => `https://covers.openlibrary.org/b/id/${coverId}-${size}.jpg`

export function normalizeIsbn(raw) {
  return String(raw).replace(/[^0-9Xx]/g, '').toUpperCase()
}

export function isValidIsbn(isbn) {
  return /^\d{9}[\dX]$/.test(isbn) || /^\d{13}$/.test(isbn)
}

function parseYear(text) {
  const m = /\d{4}/.exec(text || '')
  return m ? Number(m[0]) : null
}

async function getJson(url) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Open Library request failed (${res.status})`)
  return res.json()
}

export async function lookupIsbn(raw) {
  const isbn = normalizeIsbn(raw)
  if (!isValidIsbn(isbn)) throw new Error('Enter a valid 10 or 13 digit ISBN.')

  const json = await getJson(`${BASE}/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=data`)
  const d = json[`ISBN:${isbn}`]
  if (!d) {
    const google = await lookupGoogleBooks(isbn)
    if (google) return google
    const err = new Error('No details found for that ISBN on Open Library or Google Books.')
    err.notFound = true
    err.isbn = isbn
    throw err
  }

  return {
    isbn,
    title: d.subtitle ? `${d.title}: ${d.subtitle}` : d.title,
    authors: (d.authors || []).map((a) => a.name),
    cover_url: d.cover?.large || d.cover?.medium || null,
    page_count: d.number_of_pages || null,
    subjects: (d.subjects || []).map((s) => s.name).slice(0, 20),
    publish_year: parseYear(d.publish_date),
  }
}

const SEARCH_FIELDS = 'key,title,author_name,cover_i,isbn,first_publish_year'

export async function searchBooks(params, limit = 15) {
  const qs = new URLSearchParams({ ...params, fields: SEARCH_FIELDS, limit: String(limit) })
  const json = await getJson(`${BASE}/search.json?${qs}`)
  return json.docs || []
}
