
CREATE TABLE public.promo_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  discount_type text NOT NULL CHECK (discount_type IN ('percent','flat','free_extension','free_upgrade')),
  discount_value integer NOT NULL DEFAULT 0,
  applies_to text NOT NULL DEFAULT 'any' CHECK (applies_to IN ('monthly','yearly','any')),
  max_redemptions integer,
  redemption_count integer NOT NULL DEFAULT 0,
  expires_at timestamptz,
  active boolean NOT NULL DEFAULT true,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.promo_codes TO authenticated;
GRANT ALL ON public.promo_codes TO service_role;
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authenticated can read active codes" ON public.promo_codes
  FOR SELECT TO authenticated USING (active = true);

CREATE TRIGGER promo_codes_updated_at BEFORE UPDATE ON public.promo_codes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.promo_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  promo_code_id uuid NOT NULL REFERENCES public.promo_codes(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  order_id text,
  discount_applied_paise integer NOT NULL DEFAULT 0,
  redeemed_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX promo_redemptions_unique_user ON public.promo_redemptions(promo_code_id, user_id);

GRANT ALL ON public.promo_redemptions TO service_role;
ALTER TABLE public.promo_redemptions ENABLE ROW LEVEL SECURITY;
-- no permissive policies: only service_role (edge functions) may access

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

REVOKE ALL ON FUNCTION public.redeem_promo(uuid, uuid, text, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.redeem_promo(uuid, uuid, text, integer) TO service_role;
