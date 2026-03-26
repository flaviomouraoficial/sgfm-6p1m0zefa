DO $$
BEGIN
  -- Insert default main record for settings_store to avoid client fetch issues
  INSERT INTO public.settings_store (id, data) 
  VALUES ('main', '{}'::jsonb) 
  ON CONFLICT (id) DO NOTHING;

  -- Insert default main record for forecasts_store to avoid client fetch issues
  INSERT INTO public.forecasts_store (id, data) 
  VALUES ('main', '[]'::jsonb) 
  ON CONFLICT (id) DO NOTHING;
END $$;

-- Fix RLS warning for SGFM table by adding basic policies
DROP POLICY IF EXISTS "allow_all_authenticated" ON public."SGFM";
CREATE POLICY "allow_all_authenticated" ON public."SGFM"
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
