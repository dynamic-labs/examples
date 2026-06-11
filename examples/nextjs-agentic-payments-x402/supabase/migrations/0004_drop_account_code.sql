-- Remove the account-code concept entirely.
--
-- The agent now addresses a user's wallet by its wallet address (shown on the
-- funding page), so the derived short "account code" is no longer used.

drop index if exists public.delegations_code_idx;

alter table public.delegations drop column if exists code;
