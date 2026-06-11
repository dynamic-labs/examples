-- Persistent agent session tokens.
--
-- After a user approves a device grant, the agent mints a long-lived token
-- (stored here as a SHA-256 hash). On subsequent runs the agent presents the
-- raw token; the server hashes it, looks it up, and verifies the underlying
-- delegation still exists — so revoking delegation automatically invalidates
-- all tokens for that address.
--
-- Access is via the Supabase service-role key (server only); RLS blocks anon.

create table if not exists public.agent_tokens (
  id         uuid        primary key default gen_random_uuid(),
  token_hash text        not null unique,
  address    text        not null,
  chain      text        not null default 'EVM',
  created_at timestamptz not null default now()
);

create index if not exists agent_tokens_token_hash_idx
  on public.agent_tokens (token_hash);

create index if not exists agent_tokens_address_chain_idx
  on public.agent_tokens (address, chain);

alter table public.agent_tokens enable row level security;
-- No policies: only the service-role key (server) may read/write.
