
create schema if not exists private;

-- Drop public exposures
drop function if exists public.get_or_create_referral_code();
drop function if exists public.apply_referral(text);
drop function if exists public.grant_pro_days(uuid, integer);

create or replace function private.grant_pro_days(_user uuid, _days integer)
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

create or replace function private.get_or_create_referral_code(_uid uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  _code text;
begin
  if _uid is null then raise exception 'user required'; end if;
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

create or replace function private.apply_referral(_uid uuid, _code text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
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
  perform private.grant_pro_days(_referrer, _reward);
  perform private.grant_pro_days(_uid, _reward);
  return jsonb_build_object('ok', true, 'reward_days', _reward);
end;
$$;

revoke all on schema private from public, anon, authenticated;
revoke all on all functions in schema private from public, anon, authenticated;
grant usage on schema private to service_role;
grant execute on all functions in schema private to service_role;
