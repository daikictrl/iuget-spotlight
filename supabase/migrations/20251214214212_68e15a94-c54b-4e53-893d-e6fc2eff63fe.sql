-- Change default video status from 'pending' to 'published'
ALTER TABLE public.videos ALTER COLUMN status SET DEFAULT 'published';

-- Add is_blocked column to profiles for account blocking
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_blocked boolean DEFAULT false;

-- Drop the old approval-based RLS policy
DROP POLICY IF EXISTS "Approved videos are viewable by everyone" ON public.videos;

-- Create new policy: Videos are visible unless removed or from blocked users
CREATE POLICY "Published videos are viewable by everyone" 
ON public.videos 
FOR SELECT 
USING (
  status != 'removed' 
  AND NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = videos.user_id 
    AND profiles.is_blocked = true
  )
);

-- Allow admins to delete any video
CREATE POLICY "Admins can delete any video" 
ON public.videos 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to update profiles (for blocking accounts)
CREATE POLICY "Admins can update any profile" 
ON public.profiles 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role));