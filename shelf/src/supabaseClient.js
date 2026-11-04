import { createClient } from "@supabase/supabase-js";

const url =
  import.meta.env.VITE_SUPABASE_URL ?? import.meta.env.NEXT_PUBLIC_SUPABASE_URL;
const key =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
  import.meta.env.VITE_SUPABASE_ANON_KEY ??
  import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isConfigured = Boolean(
  url && key && !url.includes("your-project"),
);

export const supabase = isConfigured ? createClient(url, key) : null;

if (typeof window !== "undefined") {
  window.supabase = supabase;
  window.__shelfDebug = {
    async getAuthState() {
      if (!supabase) {
        return { configured: false, session: null, user: null };
      }

      const [sessionResult, userResult] = await Promise.all([
        supabase.auth.getSession(),
        supabase.auth.getUser(),
      ]);

      return {
        configured: true,
        hasSession: !!sessionResult.data.session,
        hasUser: !!userResult.data.user,
        session: sessionResult.data.session,
        user: userResult.data.user,
        sessionError: sessionResult.error?.message ?? null,
        userError: userResult.error?.message ?? null,
      };
    },
  };
}
