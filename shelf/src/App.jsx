import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useNavigate,
} from "react-router-dom";
import { isConfigured, supabase } from "./supabaseClient";
import * as db from "./api/db";
import { lookupIsbn } from "./api/openLibrary";
import { computeStats } from "./lib/stats";
import SetupNotice from "./components/SetupNotice";
import StatsCards from "./components/StatsCards";
import ActivityChart from "./components/ActivityChart";
import AddBookForm from "./components/AddBookForm";
import BookCard from "./components/BookCard";
import Recommendations from "./components/Recommendations";
import LoginPage from "./components/LoginPage";

export default function App() {
  if (!isConfigured) return <SetupNotice />;

  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

function AppRoutes() {
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;

    async function loadSession() {
      if (!supabase) {
        setAuthLoading(false);
        return;
      }

      const {
        data: { session: currentSession },
        error: sessionError,
      } = await supabase.auth.getSession();
      if (!active) return;

      if (sessionError) {
        setError(sessionError.message);
      }

      setSession(currentSession ?? null);
      setAuthLoading(false);
    }

    loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (!active) return;

      console.log("auth state change", {
        event,
        path: window.location.pathname,
        hasSession: !!nextSession,
        email: nextSession?.user?.email ?? null,
      });

      if (
        event === "SIGNED_IN" ||
        event === "INITIAL_SESSION" ||
        event === "TOKEN_REFRESHED" ||
        nextSession
      ) {
        setSession(nextSession);
        setAuthLoading(false);
        return;
      }

      if (event === "SIGNED_OUT" || event === "USER_DELETED" || !nextSession) {
        setSession(null);
        setAuthLoading(false);
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleGoogleLogin = async () => {
    if (!supabase) return;

    setError("");

    try {
      const redirectTo =
        import.meta.env.VITE_OAUTH_REDIRECT_URL ||
        `${window.location.origin}/oauth/consent`;

      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });

      if (oauthError) throw oauthError;
    } catch (e) {
      setError(e.message);
    }
  };

  const handleSignOut = async () => {
    if (!supabase) return;

    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      navigate("/login", { replace: true });
    } catch (e) {
      setError(e.message);
    }
  };

  if (authLoading) {
    return (
      <div className="center auth-shell">
        <div className="card narrow">
          <p className="muted">Loading your shelf…</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={
          session ? (
            <Navigate to="/" replace />
          ) : (
            <LoginPage onGoogleLogin={handleGoogleLogin} error={error} />
          )
        }
      />
      <Route path="/oauth/consent" element={<OAuthConsentScreen />} />
      <Route
        path="/"
        element={
          session ? (
            <Tracker
              onSignOut={handleSignOut}
              error={error}
              setError={setError}
            />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route
        path="*"
        element={<Navigate to={session ? "/" : "/login"} replace />}
      />
    </Routes>
  );
}

function OAuthConsentScreen() {
  const navigate = useNavigate();

  useEffect(() => {
    if (!supabase) {
      navigate("/login", { replace: true });
      return;
    }

    let active = true;

    const finalizeAuth = async () => {
      console.log("oauth consent loaded", { path: window.location.pathname });

      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (!active) return;

      console.log("callback session check", {
        hasSession: !!session,
        email: session?.user?.email ?? null,
        error: error?.message ?? null,
      });

      if (error) {
        console.error("Supabase session restore failed:", error);
      }

      if (session) {
        navigate("/", { replace: true });
        return;
      }

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (!active) return;

      console.log("callback user check", {
        hasUser: !!user,
        email: user?.email ?? null,
        error: userError?.message ?? null,
      });

      if (userError) {
        console.error("Supabase user lookup failed:", userError);
      }

      if (user) {
        navigate("/", { replace: true });
      } else {
        navigate("/login", { replace: true });
      }
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (!active) return;

      if (
        event === "SIGNED_IN" ||
        event === "INITIAL_SESSION" ||
        event === "TOKEN_REFRESHED" ||
        nextSession
      ) {
        navigate("/", { replace: true });
        return;
      }

      if (event === "SIGNED_OUT" || event === "USER_DELETED" || !nextSession) {
        navigate("/login", { replace: true });
      }
    });

    finalizeAuth();

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [navigate]);

  return (
    <div className="center auth-shell">
      <div className="card narrow">
        <p className="muted">Finalizing your Google sign-in…</p>
      </div>
    </div>
  );
}

const TABS = [
  { id: "want_to_read", label: "Want to read" },
  { id: "finished", label: "Finished" },
];

function greeting() {
  const h = new Date().getHours();
  if (h < 5) return "Still up reading?";
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function Hero({ stats }) {
  let message;
  if (stats.today > 0) {
    message = `You've read ${stats.today} page${stats.today === 1 ? "" : "s"} today. Keep the momentum going!`;
  } else if (stats.streak > 0) {
    message = `Log a few pages today to keep your ${stats.streak}-day streak alive.`;
  } else {
    message = "Pick up a book and log your first pages to start a streak.";
  }

  return (
    <section className="hero">
      <div className="hero-text">
        <span className="hero-eyebrow">
          {new Date().toLocaleDateString(undefined, {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}
        </span>
        <h1>{greeting()}, reader.</h1>
        <p>{message}</p>
        <div className="hero-chips">
          <span className="chip">🔥 {stats.streak} day streak</span>
          <span className="chip">
            📈 {stats.avgPerDay.toFixed(1)} pages/day
          </span>
          <span className="chip">
            🏁 {stats.finishedThisYear} finished this year
          </span>
        </div>
      </div>
      <div className="hero-art" aria-hidden="true">
        <span className="spine" />
        <span className="spine" />
        <span className="spine" />
        <span className="spine" />
        <span className="spine" />
      </div>
    </section>
  );
}

function Tracker({ onSignOut, error, setError }) {
  const [books, setBooks] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("want_to_read");

  const refresh = useCallback(async () => {
    try {
      const [b, l] = await Promise.all([db.fetchBooks(), db.fetchLogs()]);
      setBooks(b);
      setLogs(l);
      setError("");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const stats = useMemo(() => computeStats(books, logs), [books, logs]);

  const run = async (fn) => {
    try {
      await fn();
      await refresh();
      return true;
    } catch (e) {
      setError(e.message);
      return false;
    }
  };

  const actions = {
    onStart: (b) =>
      run(() =>
        db.updateBook(b.id, {
          status: "reading",
          started_at: new Date().toISOString(),
          finished_at: null,
        }),
      ),
    onFinish: (b) =>
      run(() =>
        db.updateBook(b.id, {
          status: "finished",
          finished_at: new Date().toISOString(),
        }),
      ),
    onDelete: (b) => {
      if (window.confirm(`Remove "${b.title}" and its reading history?`))
        run(() => db.deleteBook(b.id));
    },
    onLog: (b, pages) => run(() => db.addLog(b.id, pages)),
  };

  const addBook = (book, status) => run(() => db.addBook(book, status));
  const addByIsbn = async (isbn) =>
    addBook(await lookupIsbn(isbn), "want_to_read");

  const reading = books.filter((b) => b.status === "reading");
  const shelf = books.filter((b) => b.status === tab);

  return (
    <div className="app">
      <header className="topbar">
        <div className="topbar-inner">
          <div className="brand">
            <span className="logo">📚</span> Shelf
          </div>
          <div className="topbar-actions">
            <span className="topbar-date">
              {books.length} book{books.length === 1 ? "" : "s"} ·{" "}
              {stats.totalPages.toLocaleString()} pages read
            </span>
            <button
              className="btn ghost small-btn"
              type="button"
              onClick={onSignOut}
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="container">
        {error && (
          <div className="alert" role="alert">
            <span>{error}</span>
            <button className="link" onClick={() => setError("")}>
              Dismiss
            </button>
          </div>
        )}

        <Hero stats={stats} />

        <StatsCards stats={stats} />

        <div className="grid-2">
          <ActivityChart series={stats.series} avgPerDay={stats.avgPerDay} />
          <AddBookForm onAdd={addBook} />
        </div>

        <section>
          <div className="section-head">
            <div className="section-title">
              <h2>Currently reading</h2>
              {!loading && reading.length > 0 && (
                <span className="pill-count">{reading.length}</span>
              )}
            </div>
          </div>
          {loading ? (
            <div className="book-grid">
              <div className="skeleton" />
              <div className="skeleton" />
            </div>
          ) : reading.length === 0 ? (
            <div className="empty">
              <span className="empty-icon">📖</span>
              <strong>Nothing in progress</strong>
              <span className="small">Add a book and hit “Start reading”.</span>
            </div>
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
            <div className="section-title">
              <h2>My shelf</h2>
            </div>
            <div className="tabs" role="tablist">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  role="tab"
                  aria-selected={tab === t.id}
                  className={`tab ${tab === t.id ? "active" : ""}`}
                  onClick={() => setTab(t.id)}
                >
                  {t.label}{" "}
                  <span className="count">
                    {books.filter((b) => b.status === t.id).length}
                  </span>
                </button>
              ))}
            </div>
          </div>
          {shelf.length === 0 ? (
            <div className="empty">
              <span className="empty-icon">
                {tab === "finished" ? "🏆" : "🔖"}
              </span>
              <strong>No books here yet</strong>
              <span className="small">
                {tab === "finished"
                  ? "Finished books will show up here."
                  : "Books you want to read later will live here."}
              </span>
            </div>
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
  );
}
