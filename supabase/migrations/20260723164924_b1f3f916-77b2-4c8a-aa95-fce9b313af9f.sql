
create table public.user_referral_codes (
  user_id uuid primary key references auth.users(id) on delete cascade,
  code text unique not null,
  created_at timestamptz not null default now()
);
grant select on public.user_referral_codes to authenticated;
grant all on public.user_referral_codes to service_role;
alter table public.user_referral_codes enable row level security;
create policy "users read own referral code" on public.user_referral_codes
  for select to authenticated using (auth.uid() = user_id);

create table public.referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_user_id uuid not null,
  referred_user_id uuid not null unique,
  code text not null,
  reward_days integer not null default 30,
  created_at timestamptz not null default now()
);
create index referrals_referrer_idx on public.referrals(referrer_user_id);
grant select on public.referrals to authenticated;
grant all on public.referrals to service_role;
alter table public.referrals enable row level security;
create policy "referrer reads own referrals" on public.referrals
  for select to authenticated using (auth.uid() = referrer_user_id);

create or replace function public.get_or_create_referral_code()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  _uid uuid := auth.uid();
  _code text;
begin
  if _uid is null then raise exception 'not authenticated'; end if;
  select code into _code from public.user_referral_codes where user_id = _uid;
  if _code is not null then return _code; end if;
  _code := upper(substr(replace(_uid::text, '-', ''), 1, 8));
  insert into public.user_referral_codes(user_id, code)
    values (_uid, _code)
  on conflict (user_id) do update set code = excluded.code
  returning code into _code;
  return _code;
end;
$$;
revoke all on function public.get_or_create_referral_code() from public;
grant execute on function public.get_or_create_referral_code() to authenticated;

create or replace function public.grant_pro_days(_user uuid, _days integer)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.subscriptions
    (user_id, plan, status, provider, billing_interval, current_period_end, cancel_at_period_end)
  values
    (_user, 'pro', 'active', 'razorpay', 'monthly', now() + make_interval(days => _days), false)
  on conflict (user_id) do update set
    plan = 'pro',
    status = 'active',
    current_period_end = greatest(coalesce(public.subscriptions.current_period_end, now()), now())
      + make_interval(days => _days),
    cancel_at_period_end = false,
    updated_at = now();
end;
$$;
revoke all on function public.grant_pro_days(uuid, integer) from public;

create or replace function public.apply_referral(_code text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  _uid uuid := auth.uid();
  _referrer uuid;
  _reward integer := 30;
begin
  if _uid is null then
    return jsonb_build_object('ok', false, 'error', 'not_authenticated');
  end if;
  if _code is null or length(trim(_code)) = 0 then
    return jsonb_build_object('ok', false, 'error', 'invalid_code');
  end if;
  select user_id into _referrer from public.user_referral_codes where code = upper(trim(_code));
  if _referrer is null then
    return jsonb_build_object('ok', false, 'error', 'invalid_code');
  end if;
  if _referrer = _uid then
    return jsonb_build_object('ok', false, 'error', 'self_referral');
  end if;
  if exists(select 1 from public.referrals where referred_user_id = _uid) then
    return jsonb_build_object('ok', false, 'error', 'already_redeemed');
  end if;
  insert into public.referrals(referrer_user_id, referred_user_id, code, reward_days)
    values (_referrer, _uid, upper(trim(_code)), _reward);
  perform public.grant_pro_days(_referrer, _reward);
  perform public.grant_pro_days(_uid, _reward);
  return jsonb_build_object('ok', true, 'reward_days', _reward);
end;
$$;
revoke all on function public.apply_referral(text) from public;
grant execute on function public.apply_referral(text) to authenticated;
