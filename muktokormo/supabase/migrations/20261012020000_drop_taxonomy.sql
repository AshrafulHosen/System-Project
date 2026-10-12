-- MuktoKormo: drop unused taxonomy tables.
--
-- Categories and skills are served from static mock data in the app, so the
-- `categories` and `skills` tables created in
-- 20261012000000_phase3_live_data.sql are no longer needed.
--
-- Run after 20261012000000_phase3_live_data.sql (and after the follow-up).
-- Dropping a table automatically removes its RLS policies and FK constraints.

drop table if exists public.skills cascade;
drop table if exists public.categories cascade;
