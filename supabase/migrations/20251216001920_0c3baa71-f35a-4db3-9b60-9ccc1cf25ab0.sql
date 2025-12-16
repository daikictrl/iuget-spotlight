-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

-- Create policy: Users can view their own full profile
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

-- Create policy: Admins can view all profiles
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create a public view with only non-sensitive columns
CREATE VIEW public.public_profiles AS
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