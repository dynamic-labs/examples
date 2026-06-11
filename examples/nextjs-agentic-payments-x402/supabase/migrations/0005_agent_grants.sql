-- Self-hosted device-authorization grants for the agent.
--
-- When the agent wants to act on a wallet, it starts a grant: we mint a short
-- user_code (shown to the user) and a long grant_code (the agent's poll secret,
-- stored only as a SHA-256 hash). The wallet owner opens /authorize, signs in
-- with Dynamic, and approves — which sets status='approved' after we verify
-- their JWT owns the wallet. The agent polls until approved/denied/expired.
--
-- Access is via the Supabase service-role key (server only); RLS blocks anon.

create table if not exists public.agent_grants (
  id               uuid        primary key default gen_random_uuid(),
  -- short visual code shown to the user (e.g. ABCD-EFGH)
  user_code        text        not null unique,
  -- SHA-256 hex of the grant_code (the agent's poll secret); the secret itself is never stored
  grant_code_hash  text        not null unique,
  -- wallet the agent is requesting access to
  address          text        not null,
  chain            text        not null default 'EVM',
  -- pending | approved | denied
  status           text        not null default 'pending',
  -- Dynamic user id that approved (set on approval)
  approved_user_id text,
  created_at       timestamptz not null default now(),
  expires_at       timestamptz not null
);

create index if not exists agent_grants_grant_code_hash_idx
  on public.agent_grants (grant_code_hash);

alter table public.agent_grants enable row level security;
-- No policies: only the service-role key (server) may read/write.
