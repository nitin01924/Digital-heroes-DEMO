-- Digital Heroes selection-demo schema. Run in Supabase SQL Editor or through
-- `supabase db push` before switching the app from local demo mode to Supabase.
create extension if not exists "pgcrypto";

create type public.app_role as enum ('user', 'admin');
create type public.subscription_status as enum ('active', 'cancelled', 'past_due', 'lapsed');
create type public.draw_state as enum ('draft', 'simulated', 'published', 'completed');
create type public.draw_mode as enum ('random', 'algorithmic');
create type public.verification_status as enum ('pending', 'approved', 'rejected');
create type public.payout_status as enum ('pending', 'paid');

create or replace function public.is_valid_draw_numbers(draw_values smallint[])
returns boolean language sql immutable as $$
  select cardinality(draw_values) in (0, 5)
    and coalesce((select bool_and(value between 1 and 45) from unnest(draw_values) as value), true)
    and cardinality(draw_values) = coalesce((select count(distinct value) from unnest(draw_values) as value), 0);
$$;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text not null default '',
  role public.app_role not null default 'user',
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.charities (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  category text not null,
  description text not null,
  image_path text,
  accent_color text not null default '#7d9c74',
  featured boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.user_charities (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  charity_id uuid not null references public.charities(id) on delete restrict,
  contribution_percent numeric(5,2) not null default 20 check (contribution_percent between 0 and 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  stripe_subscription_id text unique,
  stripe_customer_id text,
  plan text not null check (plan in ('monthly', 'yearly')),
  status public.subscription_status not null default 'active',
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index subscriptions_one_current_per_user on public.subscriptions(user_id) where status in ('active', 'past_due');

create table public.scores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  stableford_score smallint not null check (stableford_score between 1 and 45),
  score_date date not null check (score_date <= current_date),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, score_date)
);
create index scores_user_date_desc_idx on public.scores(user_id, score_date desc);

create table public.draws (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  draw_date date not null unique,
  mode public.draw_mode not null,
  state public.draw_state not null default 'draft',
  draw_numbers smallint[] not null default '{}' check (cardinality(draw_numbers) in (0, 5)),
  configured_pool numeric(12,2) not null default 0 check (configured_pool >= 0),
  jackpot_carried_in numeric(12,2) not null default 0 check (jackpot_carried_in >= 0),
  jackpot_carried_out numeric(12,2) not null default 0 check (jackpot_carried_out >= 0),
  simulated_at timestamptz,
  published_at timestamptz,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (public.is_valid_draw_numbers(draw_numbers))
);

create table public.draw_entries (
  id uuid primary key default gen_random_uuid(),
  draw_id uuid not null references public.draws(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  entry_numbers smallint[] not null check (cardinality(entry_numbers) = 5),
  matches smallint check (matches between 0 and 5),
  created_at timestamptz not null default now(),
  unique(draw_id, user_id)
);
create index draw_entries_draw_idx on public.draw_entries(draw_id);

create table public.prize_pools (
  id uuid primary key default gen_random_uuid(),
  draw_id uuid not null references public.draws(id) on delete cascade,
  match_tier smallint not null check (match_tier in (3,4,5)),
  amount numeric(12,2) not null check (amount >= 0),
  winner_count integer not null default 0 check (winner_count >= 0),
  amount_per_winner numeric(12,2) not null default 0 check (amount_per_winner >= 0),
  rolls_over boolean not null default false,
  created_at timestamptz not null default now(),
  unique(draw_id, match_tier)
);

create table public.winners (
  id uuid primary key default gen_random_uuid(),
  draw_id uuid not null references public.draws(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  match_tier smallint not null check (match_tier in (3,4,5)),
  amount numeric(12,2) not null check (amount >= 0),
  verification public.verification_status not null default 'pending',
  created_at timestamptz not null default now(),
  unique(draw_id, user_id)
);
create index winners_user_idx on public.winners(user_id, created_at desc);

create table public.winner_proofs (
  id uuid primary key default gen_random_uuid(),
  winner_id uuid not null unique references public.winners(id) on delete cascade,
  storage_path text not null unique,
  original_name text not null,
  mime_type text not null,
  bytes integer not null check (bytes > 0 and bytes <= 8388608),
  status public.verification_status not null default 'pending',
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.payouts (
  id uuid primary key default gen_random_uuid(),
  winner_id uuid not null unique references public.winners(id) on delete cascade,
  status public.payout_status not null default 'pending',
  marked_paid_by uuid references public.profiles(id),
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$ begin new.updated_at = now(); return new; end; $$;
create trigger profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();
create trigger charities_updated_at before update on public.charities for each row execute function public.set_updated_at();
create trigger user_charities_updated_at before update on public.user_charities for each row execute function public.set_updated_at();
create trigger subscriptions_updated_at before update on public.subscriptions for each row execute function public.set_updated_at();
create trigger scores_updated_at before update on public.scores for each row execute function public.set_updated_at();
create trigger draws_updated_at before update on public.draws for each row execute function public.set_updated_at();
create trigger payouts_updated_at before update on public.payouts for each row execute function public.set_updated_at();

-- The database, not the UI, retains only the rolling latest five scores.
create or replace function public.retain_latest_five_scores()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  delete from public.scores
  where id in (
    select id from public.scores where user_id = new.user_id
    order by score_date desc, created_at desc offset 5
  );
  return new;
end; $$;
create trigger scores_keep_latest_five after insert or update of score_date on public.scores for each row execute function public.retain_latest_five_scores();

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name)
  draw_values (new.id, coalesce(new.email, ''), coalesce(new.raw_user_meta_data->>'full_name', ''));
  return new;
end; $$;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

alter table public.profiles enable row level security;
alter table public.charities enable row level security;
alter table public.user_charities enable row level security;
alter table public.subscriptions enable row level security;
alter table public.scores enable row level security;
alter table public.draws enable row level security;
alter table public.draw_entries enable row level security;
alter table public.prize_pools enable row level security;
alter table public.winners enable row level security;
alter table public.winner_proofs enable row level security;
alter table public.payouts enable row level security;

create policy "profiles own or admin read" on public.profiles for select using (id = auth.uid() or public.is_admin());
create policy "profiles own update" on public.profiles for update using (id = auth.uid()) with check (id = auth.uid() and role = (select role from public.profiles where id = auth.uid()));
create policy "charities public read" on public.charities for select using (is_active or public.is_admin());
create policy "charities admin write" on public.charities for all using (public.is_admin()) with check (public.is_admin());
create policy "preferences own or admin read" on public.user_charities for select using (user_id = auth.uid() or public.is_admin());
create policy "preferences own write" on public.user_charities for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "subscriptions own or admin read" on public.subscriptions for select using (user_id = auth.uid() or public.is_admin());
create policy "scores own or admin read" on public.scores for select using (user_id = auth.uid() or public.is_admin());
create policy "scores own write" on public.scores for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "draws published or admin read" on public.draws for select using (state in ('published','completed') or public.is_admin());
create policy "draws admin write" on public.draws for all using (public.is_admin()) with check (public.is_admin());
create policy "entries own or admin read" on public.draw_entries for select using (user_id = auth.uid() or public.is_admin());
create policy "entries admin write" on public.draw_entries for all using (public.is_admin()) with check (public.is_admin());
create policy "pools published or admin read" on public.prize_pools for select using (public.is_admin() or exists(select 1 from public.draws d where d.id = draw_id and d.state in ('published','completed')));
create policy "pools admin write" on public.prize_pools for all using (public.is_admin()) with check (public.is_admin());
create policy "winners own or admin read" on public.winners for select using (user_id = auth.uid() or public.is_admin());
create policy "winners admin write" on public.winners for all using (public.is_admin()) with check (public.is_admin());
create policy "proofs owner or admin read" on public.winner_proofs for select using (public.is_admin() or exists(select 1 from public.winners w where w.id = winner_id and w.user_id = auth.uid()));
create policy "proofs owner insert" on public.winner_proofs for insert with check (exists(select 1 from public.winners w where w.id = winner_id and w.user_id = auth.uid()));
create policy "proofs admin review" on public.winner_proofs for update using (public.is_admin()) with check (public.is_admin());
create policy "payouts owner or admin read" on public.payouts for select using (public.is_admin() or exists(select 1 from public.winners w where w.id = winner_id and w.user_id = auth.uid()));
create policy "payouts admin write" on public.payouts for all using (public.is_admin()) with check (public.is_admin());

-- Private score evidence. Client uploads are restricted to the authenticated
-- winner's own folder; signed URLs should be used for administrator review.
insert into storage.buckets (id, name, public) draw_values ('winner-proofs', 'winner-proofs', false) on conflict (id) do nothing;
create policy "proof upload own folder" on storage.objects for insert to authenticated with check (
  bucket_id = 'winner-proofs' and (storage.foldername(name))[1] = auth.uid()::text
);
create policy "proof read own or admin" on storage.objects for select to authenticated using (
  bucket_id = 'winner-proofs' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
);
