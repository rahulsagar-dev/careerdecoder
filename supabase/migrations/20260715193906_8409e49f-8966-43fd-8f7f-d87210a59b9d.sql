CREATE OR REPLACE FUNCTION private.prevent_is_admin_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.is_admin IS DISTINCT FROM OLD.is_admin
     AND current_setting('role', true) <> 'service_role' THEN
    NEW.is_admin := OLD.is_admin;
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION private.prevent_is_admin_escalation() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS prevent_is_admin_escalation ON public.profiles;
CREATE TRIGGER prevent_is_admin_escalation
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION private.prevent_is_admin_escalation();

CREATE OR REPLACE FUNCTION private.prevent_is_admin_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.is_admin IS TRUE
     AND current_setting('role', true) <> 'service_role' THEN
    NEW.is_admin := false;
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION private.prevent_is_admin_insert() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS prevent_is_admin_insert ON public.profiles;
CREATE TRIGGER prevent_is_admin_insert
BEFORE INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION private.prevent_is_admin_insert();