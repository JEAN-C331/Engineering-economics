/**
 * Optional shared leaderboard (Supabase REST).
 * 1) Create a Supabase project → Table `ee_scores` with columns:
 *    player_name (text), score (int4), total (int4), difficulty (text), created_at (timestamptz, default now())
 * 2) RLS: allow anon SELECT + INSERT on `ee_scores` (classroom demo; tighten for production)
 * 3) Paste URL + anon key below. Leave empty to store rankings on this browser only.
 */
window.ECON_REMOTE = {
  supabaseUrl: "",
  supabaseAnonKey: "",
  scoresTable: "ee_scores",
};
