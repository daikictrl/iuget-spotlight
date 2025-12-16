-- Recreate the view with explicit SECURITY INVOKER to ensure RLS is respected
DROP VIEW IF EXISTS public.public_profiles;

CREATE VIEW public.public_profiles 
WITH (security_invoker = true) AS
SELECT 
  id,
  full_name,
  avatar_url,
  bio,
  followers_count,
  created_at
FROM public.profiles
WHERE is_blocked = false OR is_blocked IS NULL;

-- Grant access to the view
GRANT SELECT ON public.public_profiles TO anon, authenticated;