export default function LoginPage({ onGoogleLogin, error }) {
  return (
    <div className="auth-screen">
      <div className="auth-panel">
        <div className="auth-brand" aria-label="Shelf home">
          <span className="logo">📚</span>
          <span>Shelf</span>
        </div>

        <div className="auth-copy">
          <span className="auth-kicker">Welcome back</span>
          <h1>Track every book you love to read.</h1>
          <p>
            Keep your reading life in one place, from books you want to read to
            pages logged today.
          </p>
        </div>

        <div className="auth-card">
          <div className="auth-card-head">
            <span className="muted small">Sign in</span>
          </div>

          <button
            className="btn google-btn"
            type="button"
            onClick={onGoogleLogin}
          >
            <span className="google-mark" aria-hidden="true">
              G
            </span>
            Continue with Google
          </button>

          {error && (
            <div className="error auth-error" role="alert">
              {error}
            </div>
          )}

          <p className="auth-footnote">
            Only Google sign-in is enabled for this app.
          </p>
        </div>
      </div>
    </div>
  );
}
