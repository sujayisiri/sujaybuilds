const KEY = import.meta.env.VITE_GOOGLE_BOOKS_API_KEY

function parseYear(text) {
  const m = /\d{4}/.exec(text || '')
  return m ? Number(m[0]) : null
}

/** Returns book details from Google Books, or null if not found / unavailable. */
export async function lookupGoogleBooks(isbn) {
  const qs = new URLSearchParams({ q: `isbn:${isbn}` })
  if (KEY) qs.set('key', KEY)
  try {
    const res = await fetch(`https://www.googleapis.com/books/v1/volumes?${qs}`)
    if (!res.ok) return null
    const v = (await res.json()).items?.[0]?.volumeInfo
    if (!v) return null
    const img = v.imageLinks?.thumbnail || v.imageLinks?.smallThumbnail
    return {
      isbn,
      title: v.subtitle ? `${v.title}: ${v.subtitle}` : v.title,
      authors: v.authors || [],
      cover_url: img ? img.replace(/^http:/, 'https:') : null,
      page_count: v.pageCount || null,
      subjects: v.categories || [],
      publish_year: parseYear(v.publishedDate),
    }
  } catch {
    return null
  }
}
