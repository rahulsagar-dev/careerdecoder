
-- 1. Allow users to read their own promo redemptions
grant select on public.promo_redemptions to authenticated;
create policy "users read own promo redemptions" on public.promo_redemptions
  for select to authenticated using (auth.uid() = user_id);

-- 2. Allow referred users to see their own referral record
create policy "referred user reads own referral" on public.referrals
  for select to authenticated using (auth.uid() = referred_user_id);

-- 3. Cap referral rewards per referrer to prevent farming
create or replace function private.apply_referral(_uid uuid, _code text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  _referrer uuid;
  _reward integer := 30;
  _max_referrals constant integer := 10;
  _referrer_count integer;
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

  -- Cap: max N successful referrals per referrer
  select count(*) into _referrer_count from public.referrals where referrer_user_id = _referrer;
  if _referrer_count >= _max_referrals then
    -- Still record the referral (so the referred user can't retry endlessly) but do not reward
    insert into public.referrals(referrer_user_id, referred_user_id, code, reward_days)
      values (_referrer, _uid, upper(trim(_code)), 0);
    return jsonb_build_object('ok', false, 'error', 'referrer_cap_reached');
  end if;

  insert into public.referrals(referrer_user_id, referred_user_id, code, reward_days)
    values (_referrer, _uid, upper(trim(_code)), _reward);
  perform private.grant_pro_days(_referrer, _reward);
  perform private.grant_pro_days(_uid, _reward);
  return jsonb_build_object('ok', true, 'reward_days', _reward);
end;
$$;

revoke all on function private.apply_referral(uuid, text) from public, anon, authenticated;
grant execute on function private.apply_referral(uuid, text) to service_role;
