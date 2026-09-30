-- Run once in this project's Supabase SQL Editor.
begin;
create table public.watchlist (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  player_name text not null check (char_length(trim(player_name)) between 1 and 80),
  team text not null check (char_length(trim(team)) between 1 and 80),
  position text not null check (position in ('QB','RB','WR','TE','OL','DL','LB','CB','S','K','P')),
  notes text not null default '' check (char_length(notes) <= 1000),
  status text not null default 'watching' check (status in ('watching','favorite')),
  created_at timestamptz not null default now()
);
create index watchlist_owner_created_idx on public.watchlist(owner_id, created_at desc);
alter table public.watchlist enable row level security;
revoke all on public.watchlist from anon;
grant select, insert, update, delete on public.watchlist to authenticated;
create policy "Read own players" on public.watchlist for select to authenticated using ((select auth.uid()) = owner_id);
create policy "Add own players" on public.watchlist for insert to authenticated with check ((select auth.uid()) = owner_id);
create policy "Edit own players" on public.watchlist for update to authenticated using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
create policy "Delete own players" on public.watchlist for delete to authenticated using ((select auth.uid()) = owner_id);
commit;
