-- add_missing_job_columns.sql
-- Add missing columns to the jobs table

-- Add company column
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS company VARCHAR(255);

-- Add location column
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS location VARCHAR(255);

-- Add type column
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS type VARCHAR(50);

-- Add salary column
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS salary VARCHAR(100);

-- Add experience column
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS experience VARCHAR(100);

-- Add requirements column (array)
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS requirements TEXT[];

-- Add skills column (array)
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS skills TEXT[];

-- Add featured column
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT FALSE;

-- Add closed column
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS closed BOOLEAN DEFAULT FALSE;

-- Add updated_at column if not exists
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Update any existing records to have non-null company values
UPDATE jobs SET company = 'Unknown Company' WHERE company IS NULL;

-- Then make the company column NOT NULL
ALTER TABLE jobs ALTER COLUMN company SET NOT NULL;

-- add created at column if not exists
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;