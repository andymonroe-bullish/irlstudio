-- Persist each user's light/dark mode choice on their account so it
-- follows them across browsers and devices.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS theme_preference text
  CHECK (theme_preference IN ('light', 'dark'));
