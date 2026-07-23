
CREATE OR REPLACE FUNCTION public.svc_get_or_create_referral_code(_uid uuid)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = private, public
AS $$
  SELECT private.get_or_create_referral_code(_uid);
$$;

CREATE OR REPLACE FUNCTION public.svc_apply_referral(_uid uuid, _code text)
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path = private, public
AS $$
  SELECT private.apply_referral(_uid, _code);
$$;

REVOKE ALL ON FUNCTION public.svc_get_or_create_referral_code(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.svc_apply_referral(uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.svc_get_or_create_referral_code(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.svc_apply_referral(uuid, text) TO service_role;
