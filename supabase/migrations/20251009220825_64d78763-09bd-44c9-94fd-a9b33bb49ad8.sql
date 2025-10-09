-- Add is_favorite column to medical_reports table
ALTER TABLE public.medical_reports 
ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT false;