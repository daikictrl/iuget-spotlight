-- Add policy to allow viewing basic profile info for video display purposes
-- The application code will only select non-sensitive columns (full_name, avatar_url)
CREATE POLICY "Anyone can view basic profile info for video display"
ON public.profiles
FOR SELECT
USING (true);