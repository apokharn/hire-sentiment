
-- 001_create_tables.sql
-- Add pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  role VARCHAR(20) CHECK (role IN ('applicant', 'recruiter')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE applicant_profiles (
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  resume TEXT,
  resume_file_path TEXT,
  github_url VARCHAR(255),
  leetcode_url VARCHAR(255),
  linkedin_url VARCHAR(255),
  profile_image_url VARCHAR(255),
  embedding VECTOR(1536),  -- For OpenAI embeddings
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE jobs (
  id SERIAL PRIMARY KEY,
  recruiter_id INT REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  company VARCHAR(255) NOT NULL,
  location VARCHAR(255),
  type VARCHAR(50),
  salary VARCHAR(100),
  experience VARCHAR(100),
  description TEXT,
  requirements TEXT[],
  skills TEXT[],
  featured BOOLEAN DEFAULT FALSE,
  closed BOOLEAN DEFAULT FALSE,
  posted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE applications (
  id SERIAL PRIMARY KEY,
  job_id INT REFERENCES jobs(id) ON DELETE CASCADE,
  applicant_id INT REFERENCES users(id) ON DELETE CASCADE,
  resume_path TEXT,
  cover_letter TEXT,
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(job_id, applicant_id)
);

-- Add function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = now(); 
   RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers to automatically update the updated_at column
CREATE TRIGGER update_applicant_profile_modtime
BEFORE UPDATE ON applicant_profiles
FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

CREATE TRIGGER update_job_modtime
BEFORE UPDATE ON jobs
FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

CREATE TRIGGER update_application_modtime
BEFORE UPDATE ON applications
FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
