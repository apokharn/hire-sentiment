-- Migration for profile analysis functionality

-- Add profile_data column to applications table if it doesn't exist
ALTER TABLE applications ADD COLUMN IF NOT EXISTS profile_data JSONB;

-- Create applicant_profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS applicant_profiles (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  github_url TEXT,
  leetcode_url TEXT,
  linkedin_url TEXT,
  profile_image_url TEXT,
  about TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_applicant_profiles_user_id ON applicant_profiles(user_id);