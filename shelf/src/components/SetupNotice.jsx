export default function SetupNotice() {
  return (
    <div className="center">
      <div className="card narrow">
        <div className="brand" style={{ marginBottom: '1rem' }}>
          <span className="logo">📚</span> Shelf setup
        </div>
        <p className="muted" style={{ marginBottom: '0.5rem' }}>Three quick steps and you're reading:</p>
        <ol className="steps">
          <li>
            Open <code>.env</code> and set <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code>.
          </li>
          <li>
            Run <code>supabase/schema.sql</code> in the Supabase SQL editor.
          </li>
          <li>Restart the dev server (<code>npm run dev</code>).</li>
        </ol>
      </div>
    </div>
  )
}
