-- Drop password-based at-rest protection.
--
-- Owner authorization moved to a device-authorization grant approved in the web
-- app (see migration 0005 + lib/shared/agent-grants.ts), so the per-wallet
-- password columns from 0003 are no longer used. Shares are encrypted with the
-- server master key (AES-256-GCM) as before.

alter table public.delegations
  drop column if exists secured,
  drop column if exists secret_salt;
