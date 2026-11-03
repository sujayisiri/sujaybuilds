import { supabase } from '../supabaseClient'
import { toDateKey } from '../lib/dates'

function unwrap({ data, error }) {
  if (error) {
    if (error.code === '23505') throw new Error('That book is already on your shelf.')
    throw new Error(error.message)
  }
  return data
}

export async function fetchBooks() {
  return unwrap(await supabase.from('books').select('*').order('created_at', { ascending: false }))
}

export async function fetchLogs() {
  return unwrap(await supabase.from('reading_logs').select('*').order('log_date', { ascending: true }))
}

export async function addBook(book, status = 'want_to_read') {
  const { isbn, title, authors, cover_url, page_count, subjects, publish_year } = book
  const started_at = status === 'reading' ? new Date().toISOString() : null
  return unwrap(
    await supabase
      .from('books')
      .insert({ isbn, title, authors, cover_url, page_count, subjects, publish_year, status, started_at })
      .select()
      .single(),
  )
}

export async function updateBook(id, patch) {
  return unwrap(await supabase.from('books').update(patch).eq('id', id).select().single())
}

export async function deleteBook(id) {
  return unwrap(await supabase.from('books').delete().eq('id', id))
}

export async function addLog(bookId, pages, date = new Date()) {
  return unwrap(
    await supabase
      .from('reading_logs')
      .insert({ book_id: bookId, pages, log_date: toDateKey(date) })
      .select()
      .single(),
  )
}
