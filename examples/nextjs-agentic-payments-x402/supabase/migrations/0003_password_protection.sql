-- Owner-only password protection for delegated wallets.
--
-- When a user "secures" their wallet (sets a password on the funding page), the
-- stored key share is re-encrypted with a key derived from BOTH the server
-- master key AND the user's password:
--
--   aesKey = HMAC-SHA256(masterKey, PBKDF2-SHA256(password, secret_salt, 600k))
--
-- so spending requires both the master key (server/agent) and the wallet's
-- password (only the owner knows it). See lib/shared/delegation-store.ts.
--
-- `secured` flags which rows use the password-derived key; legacy rows
-- (secured = false, secret_salt null) stay decryptable with the master key
-- alone for backward compatibility.

alter table public.delegations
  add column if not exists secret_salt text,
  add column if not exists secured boolean not null default false;
