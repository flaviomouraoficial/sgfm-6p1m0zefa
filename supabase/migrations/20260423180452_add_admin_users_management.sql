-- Add plan column
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'básico';

-- Function to check if current user is admin securely
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $func$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role FROM public.profiles WHERE id = auth.uid();
  RETURN COALESCE(user_role = 'admin', false);
END;
$func$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update trigger to include plan
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $func$
BEGIN
  INSERT INTO public.profiles (id, email, role, plan)
  VALUES (
    NEW.id,
    NEW.email,
    CASE WHEN NEW.email = 'flavio@trendconsultoria.com.br' THEN 'admin' ELSE 'mentee' END,
    'básico'
  );
  RETURN NEW;
END;
$func$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Policies for profiles (Ensure they are dropped first)
DROP POLICY IF EXISTS "profiles_read_self" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_self" ON public.profiles;
DROP POLICY IF EXISTS "profiles_read_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete_policy" ON public.profiles;

-- Everyone can read their own, Admins can read all
CREATE POLICY "profiles_read_policy" ON public.profiles
  FOR SELECT TO authenticated
  USING ( auth.uid() = id OR public.is_admin() );

-- Everyone can update their own, Admins can update all
CREATE POLICY "profiles_update_policy" ON public.profiles
  FOR UPDATE TO authenticated
  USING ( auth.uid() = id OR public.is_admin() )
  WITH CHECK ( auth.uid() = id OR public.is_admin() );

-- Admins can delete
CREATE POLICY "profiles_delete_policy" ON public.profiles
  FOR DELETE TO authenticated
  USING ( public.is_admin() );
