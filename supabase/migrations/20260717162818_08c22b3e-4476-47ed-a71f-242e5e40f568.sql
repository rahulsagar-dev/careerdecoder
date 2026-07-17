
DROP FUNCTION IF EXISTS public.redeem_promo(uuid, uuid, text, integer);

CREATE SCHEMA IF NOT EXISTS private;

CREATE OR REPLACE FUNCTION private.redeem_promo(
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
  _row public.promo_codes%ROWTYPE;
BEGIN
  SELECT * INTO _row FROM public.promo_codes WHERE id = _code_id FOR UPDATE;
  IF NOT FOUND OR NOT _row.active THEN RETURN false; END IF;
  IF _row.expires_at IS NOT NULL AND _row.expires_at < now() THEN RETURN false; END IF;
  IF _row.max_redemptions IS NOT NULL AND _row.redemption_count >= _row.max_redemptions THEN
    RETURN false;
  END IF;

  BEGIN
    INSERT INTO public.promo_redemptions(promo_code_id, user_id, order_id, discount_applied_paise)
      VALUES (_code_id, _user_id, _order_id, _discount_paise);
  EXCEPTION WHEN unique_violation THEN
    RETURN false;
  END;

  UPDATE public.promo_codes SET redemption_count = redemption_count + 1 WHERE id = _code_id;
  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION private.redeem_promo(uuid, uuid, text, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.redeem_promo(uuid, uuid, text, integer) TO service_role;
