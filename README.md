# Hire Sentiment [Demo](https://www.youtube.com/watch?v=CKlaSQfaLH4&t=10s)

A modern job recruitment platform that connects recruiters with job seekers, featuring sentiment analysis for better matching.

## Features

- Job posting and management for recruiters
- **AI-Powered Candidate Search** - Intelligent candidate matching using Ollama Llama3
- **AI Chat Assistant** - Free AI-powered chat assistant using Ollama Llama3 for intelligent conversation
- Real-time candidate analysis with relevance scoring and insights
- User authentication and profiles
- Interactive dashboards for both applicants and recruiters
- Job application tracking
- Profile management with professional links (GitHub, LinkedIn, LeetCode)
- Smart Hire API with advanced candidate ranking and analysis

## Technology Stack

- **Frontend Framework**: React with TypeScript
- **Build Tool**: Vite
- **UI Components**: shadcn/ui with Radix UI primitives
- **Styling**: Tailwind CSS
- **Forms**: React Hook Form
- **Charts**: Recharts
- **Icons**: Lucide Icons
- **Backend**: Express.js
- **Database**: PostgreSQL
- **Authentication**: JWT
- **File Upload**: Multer
- **API Client**: Axios
- **Form Validation**: Zod
- **AI Integration**: Ollama Llama3 for both candidate analysis and chat assistant

## Project Structure

```
hire-sentiment/
├── backend/                  # Backend codebase
│   ├── migrations/           # Database migrations
│   ├── Persona-Lens/         # AI analysis module
│   ├── routes/               # API routes
│   ├── uploads/              # User uploaded files
│   ├── database.js           # Database connection
│   ├── docker-compose.yml    # Docker setup for PostgreSQL
│   ├── server.js             # Express server
│   └── package.json          # Backend dependencies
├── public/                   # Static assets
├── src/                      # Frontend codebase
│   ├── components/           # Reusable UI components
│   │   └── ui/               # shadcn UI components
│   ├── contexts/             # React context providers
│   ├── data/                 # Mock data and types
│   ├── hooks/                # Custom React hooks
│   ├── lib/                  # Utility functions
│   └── pages/                # Application pages and routes
└── package.json              # Frontend dependencies
```

## Getting Started

### Prerequisites

- Node.js (Latest LTS version recommended)
- npm or Bun package manager
- Docker and Docker Compose (for database)

### Setting Up the Database

1. Navigate to the backend directory:
```bash
cd backend
```

2. Start the PostgreSQL database and Adminer:
```bash
docker-compose up -d
```

This will start:
- PostgreSQL on port 5432
- Adminer (database management UI) on http://localhost:8082

3. Run database migrations:
```bash
npm run run-migrations
```

### Database Migrations in Detail

The project uses a custom migration system for PostgreSQL. Here's how to work with migrations:

1. **Run all migrations:**
```bash
cd backend
npm run run-migrations
```

2. **Run a specific migration file:**
```bash
cd backend
node run-migration.js migrations/filename.sql
```

3. **Available migration files:**
- `001_tables.sql` - Creates the base tables structure
- `002_add_missing_job_columns.sql` - Adds additional columns to jobs table
- `003_profile_analysis.sql` - Adds tables for profile analysis
- `004_seed_jobs.sql` - Adds sample job data

4. **Check schema status:**
```bash
cd backend
node check-schema.js
```

5. **Mark a migration as run without executing it:**
```bash
cd backend
node mark-tables-migration-as-run.js migrations/filename.sql
```

6. **Seed sample job data:**
```bash
cd backend
node seed-jobs.js
```

### Starting the Backend

1. Navigate to the backend directory (if not already there):
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Start the backend server:
```bash
npm run dev
```

The backend API will be available at `http://localhost:5001`

### Starting the Frontend

1. Navigate to the project root directory:
```bash
cd ..
```

2. Install dependencies:
```bash
npm install
# or if using Bun
bun install
```

3. Start the development server:
```bash
npm run dev
# or
bun dev
```

The frontend will be available at `http://localhost:5173`

## AI Configuration

The platform uses Ollama with Llama3 for all AI-powered features. No API keys are required.

### Ollama Setup (Required for AI Features)

1. **Install Ollama**:
   ```bash
   # macOS
   brew install ollama
   
   # Linux
   curl -fsSL https://ollama.ai/install.sh | sh
   ```

2. **Start Ollama Service**:
   ```bash
   # macOS
   brew services start ollama
   
   # Linux
   ollama serve
   ```

3. **Download Llama3 Model**:
   ```bash
   ollama pull llama3
   ```

4. **Verify Installation**:
   ```bash
   ollama list
   ```

### AI Features

The platform provides two main AI-powered features using Ollama Llama3:

#### 1. AI Chat Assistant
- **Intelligent conversation** with context understanding
- **Technology-specific guidance** for React, Python, DevOps, Mobile, Data Science, Blockchain, Security
- **Recruitment expertise** with best practices for technical interviews
- **Experience level recognition** (junior, mid-level, senior, lead)
- **No API key required** - runs completely locally

#### 2. AI-Powered Candidate Search
- **Intelligent candidate matching** with relevance scoring
- **Detailed analysis** with strengths and concerns for each candidate
- **Smart ranking algorithm** with match categorization (excellent, strong, moderate, limited)
- **Real-time database integration** with PostgreSQL
- **No API key required** - runs completely locally

## API Documentation

### Authentication Endpoints

- **POST /api/auth/register** - Register a new user
  - Body: `{ email, password, role }`
  - Response: `{ success, token, user }`

- **POST /api/auth/login** - Login an existing user
  - Body: `{ email, password }`
  - Response: `{ success, token, user }`

### Profile Endpoints

- **GET /api/profile** - Get current user profile
  - Headers: `Authorization: Bearer {token}`
  - Response: User profile data

- **PUT /api/profile** - Update user profile
  - Headers: `Authorization: Bearer {token}`
  - Body: Profile data
  - Response: Updated profile

### Jobs Endpoints

- **GET /api/jobs** - List all jobs
  - Query params: `featured`, `company`, etc.
  - Response: List of job listings

- **POST /api/jobs** - Create new job (recruiter only)
  - Headers: `Authorization: Bearer {token}`
  - Body: Job details
  - Response: Created job

- **GET /api/jobs/:id** - Get job details
  - Response: Job details

### Applications Endpoints

- **POST /api/applications** - Submit job application
  - Headers: `Authorization: Bearer {token}`
  - Body: `{ jobId, resumePath, coverLetter }`
  - Response: Application confirmation

- **GET /api/applications** - Get user applications
  - Headers: `Authorization: Bearer {token}`
  - Response: List of applications

### Smart Hire API

- **POST /api/smart-hire/search** - Basic candidate search with keyword matching
  - Headers: `Authorization: Bearer {token}`
  - Body: `{ query }`
  - Response: Ranked candidate list with basic analysis

- **POST /api/ai-candidates/search** - AI-powered candidate search with advanced analysis
  - Headers: `Authorization: Bearer {token}`
  - Body: `{ query }`
  - Response: AI-analyzed candidates with relevance scores, strengths, concerns, and insights
  - Features: 
    - **Llama3 integration** for intelligent candidate analysis (no API key required)
    - **Smart ranking algorithm** with relevance scoring (0-100)
    - **Match categorization** (excellent, strong, moderate, limited matches)
    - **Detailed match reasoning** for each candidate
    - **Strengths and concerns analysis** for informed hiring decisions
    - **Real-time database integration** with PostgreSQL

### AI Chat Assistant API

- **POST /api/ai-chat/assistant** - AI-powered chat assistant for intelligent conversation
  - Headers: `Authorization: Bearer {token}`
  - Body: `{ message, conversationHistory? }`
  - Response: AI-generated response with context understanding
  - Features: 
    - **Ollama Llama3 integration** with advanced AI reasoning
    - **Clean, professional responses** with automatic removal of internal reasoning tags
    - **Technology-specific guidance** for React, Python, DevOps, Mobile, Data Science, Blockchain, Security
    - **Context-aware conversation understanding** with conversation history tracking
    - **Recruitment expertise** with technical interview best practices and candidate screening
    - **Experience level recognition** (junior, mid-level, senior, lead)
    - **Integration with candidate search** functionality
    - **No API key required** - runs completely locally with Ollama

## Database Structure

The database uses PostgreSQL and includes the following tables:

### Users Table
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  role VARCHAR(20) CHECK (role IN ('applicant', 'recruiter')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Applicant Profiles Table
```sql
CREATE TABLE applicant_profiles (
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  resume TEXT,
  resume_file_path TEXT,
  github_url VARCHAR(255),
  leetcode_url VARCHAR(255),
  linkedin_url VARCHAR(255),
  profile_image_url VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Jobs Table
```sql
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
```

### Applications Table
```sql
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
```

## Available Scripts

### Frontend
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Backend
- `npm run dev` - Start backend server
- `npm run start` - Start backend server in production
- `npm run run-migrations` - Run all database migrations

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request
