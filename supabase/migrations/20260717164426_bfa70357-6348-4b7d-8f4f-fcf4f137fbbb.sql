CREATE OR REPLACE FUNCTION public.redeem_promo(
  _code_id uuid,
  _user_id uuid,
  _order_id text,
  _discount_paise integer
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_code public.promo_codes%ROWTYPE;
  v_count integer;
BEGIN
  SELECT * INTO v_code FROM public.promo_codes WHERE id = _code_id FOR UPDATE;
  IF NOT FOUND OR v_code.active = false THEN RETURN false; END IF;
  IF v_code.expires_at IS NOT NULL AND v_code.expires_at < now() THEN RETURN false; END IF;

  IF v_code.max_redemptions IS NOT NULL THEN
    SELECT COUNT(*) INTO v_count FROM public.promo_redemptions WHERE promo_code_id = _code_id;
    IF v_count >= v_code.max_redemptions THEN RETURN false; END IF;
  END IF;

  IF EXISTS (SELECT 1 FROM public.promo_redemptions WHERE promo_code_id = _code_id AND user_id = _user_id) THEN
    RETURN false;
  END IF;

  INSERT INTO public.promo_redemptions (promo_code_id, user_id, order_id, discount_applied_paise)
  VALUES (_code_id, _user_id, _order_id, _discount_paise);

  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.redeem_promo(uuid, uuid, text, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.redeem_promo(uuid, uuid, text, integer) TO service_role;