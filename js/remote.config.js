/**
 * Optional shared leaderboard (Supabase REST).
 *
 * SETUP (Supabase SQL Editor — run once):
 *   create table public.ee_scores (
 *     id bigint generated always as identity primary key,
 *     player_name text not null,
 *     score int not null,
 *     total int not null,
 *     difficulty text not null,
 *     created_at timestamptz not null default now()
 *   );
 *   alter table public.ee_scores enable row level security;
 *   create policy "ee_scores_select_anon" on public.ee_scores for select to anon using (true);
 *   create policy "ee_scores_insert_anon" on public.ee_scores for insert to anon with check (true);
 *
 * If the site shows "Cloud sync failed" under Leaderboard, open DevTools → Network,
 * find the request to .../rest/v1/ee_scores and read the response (401 = wrong key;
 * 404 = wrong URL or table name; 42501 or RLS = policies missing).
 *
 * Everyone must use the SAME deployed site (or same remote.config.js). Opening only
 * index.html from disk on two PCs is OK if both files include these keys.
 */
window.ECON_REMOTE = {
  supabaseUrl: "https://laahpzdmlmalklkleosq.supabase.co",
  supabaseAnonKey:
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhYWhwemRta2xtYWxsa2xlb3NxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg3NjgyODAsImV4cCI6MjA5NDM0NDI4MH0.kXT2vGbUb_C62wIZIbmlnYr0KnqtS3sGdSvofIoPMzc",
  scoresTable: "ee_scores",
};
