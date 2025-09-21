// backend/server.js
const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const OpenAI = require('openai');
const { HfInference } = require('@huggingface/inference');
const { Ollama } = require('ollama');
const app = express();
const pool = require('./database'); // Import PostgreSQL connection

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'your-openai-api-key-here'
});

// Initialize Hugging Face Inference API (free tier)
const hf = new HfInference(process.env.HUGGINGFACE_API_KEY || 'hf_demo_key');

// Initialize Ollama
const ollama = new Ollama({
  host: 'http://localhost:11434'
});
const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profile');
const applicationsRoutes = require('./routes/applications');
const personaLensRoutes = require('./routes/persona-lens');
const jobsRoutes = require('./routes/jobs');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
const resumesDir = path.join(uploadsDir, 'resumes');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}
if (!fs.existsSync(resumesDir)) {
  fs.mkdirSync(resumesDir);
}

// Configure multer storage for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Save resumes in the resumes subdirectory
    cb(null, resumesDir);
  },
  filename: function (req, file, cb) {
    // Create unique filename with timestamp and original extension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

// File filter to only allow specific file types
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/png',
    'image/jpeg'
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, DOC, PNG or JPEG are allowed.'), false);
  }
};

// Initialize multer upload
const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB max file size
  }
});

// Make upload available to routes
app.locals.upload = upload;

// Middleware
app.use(cors({ 
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5173', 
      'http://localhost:8080',
      'http://localhost:8081',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:8080',
      'http://127.0.0.1:8081'
    ];
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
})); 
app.use(express.json()); // Parse JSON request bodies

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Use routes
app.use('/api/auth', authRoutes);
app.use(profileRoutes);
app.use('/api/applications', applicationsRoutes);
app.use('/api/persona-lens', personaLensRoutes);
app.use('/api/jobs', jobsRoutes);

// Test database connection endpoint
app.get('/api/test-db', async (req, res) => {
  try {
    // Query PostgreSQL for current timestamp
    const result = await pool.query('SELECT NOW()');
    res.json({
      success: true,
      message: 'Database connection successful!',
      timestamp: result.rows[0].now
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// AI-Powered Candidate Search API
app.post('/api/ai-candidates/search', async (req, res) => {
  try {
    const { query } = req.body;
    
    if (!query || query.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Search query is required'
      });
    }
    
    console.log('AI Candidate search query:', query);
    
    // First, get all candidates from the database
    const candidatesResult = await pool.query(`
      SELECT 
        u.id,
        u.email,
        ap.resume,
        ap.github_url,
        ap.linkedin_url,
        ap.leetcode_url,
        ap.created_at
      FROM users u
      LEFT JOIN applicant_profiles ap ON u.id = ap.user_id
      WHERE u.role = 'applicant' 
        AND ap.resume IS NOT NULL
    `);
    
    const candidates = candidatesResult.rows;
    
    if (candidates.length === 0) {
      return res.json({
        success: true,
        results: {
          query: query,
          candidates: [],
          analysis: "No candidates found in the database.",
          ai_insights: "The database currently has no candidate profiles. Please add some candidates first."
        }
      });
    }
    
    // Use OpenAI to analyze and rank candidates
    const aiAnalysis = await analyzeCandidatesWithAI(query, candidates);
    
    // Simulate some processing time for realistic UX
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    res.json({
      success: true,
      results: {
        query: query,
        candidates: aiAnalysis.rankedCandidates,
        analysis: aiAnalysis.analysis,
        ai_insights: aiAnalysis.insights,
        total_candidates: aiAnalysis.rankedCandidates.length
      }
    });
  } catch (error) {
    console.error('Error in AI candidate search:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// AI Chat Assistant API - provides intelligent chat responses using free AI models
app.post('/api/ai-chat/assistant', async (req, res) => {
  try {
    const { message, conversationHistory = [] } = req.body;
    
    if (!message || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Message is required'
      });
    }
    
    console.log('AI Chat Assistant message:', message);
    
    // Analyze the message using AI
    const aiResponse = await analyzeChatMessage(message, conversationHistory);
    
    // Simulate some processing time for realistic UX
    await new Promise(resolve => setTimeout(resolve, 500));
    
    res.json({
      success: true,
      response: {
        message: aiResponse,
        timestamp: new Date().toISOString(),
        model: 'huggingface-dialogpt'
      }
    });
  } catch (error) {
    console.error('Error in AI chat assistant:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Smart Hire API route - searches real candidate data from database
app.post('/api/smart-hire/search', async (req, res) => {
  try {
    const { query } = req.body;
    
    if (!query || query.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Search query is required'
      });
    }
    
    console.log('Smart Hire search query:', query);
    
    // Search for candidates based on the query
    // This searches through resumes, skills, and other profile data
    const searchQuery = `
      SELECT 
        u.id,
        u.email,
        ap.resume,
        ap.github_url,
        ap.linkedin_url,
        ap.leetcode_url,
        ap.created_at,
        -- Calculate relevance score based on keyword matches
        (
          CASE WHEN LOWER(ap.resume) LIKE LOWER($1) THEN 10 ELSE 0 END +
          CASE WHEN LOWER(ap.resume) LIKE LOWER($2) THEN 5 ELSE 0 END +
          CASE WHEN LOWER(ap.resume) LIKE LOWER($3) THEN 3 ELSE 0 END +
          CASE WHEN LOWER(ap.resume) LIKE LOWER($4) THEN 2 ELSE 0 END +
          CASE WHEN LOWER(ap.resume) LIKE LOWER($5) THEN 1 ELSE 0 END
        ) as relevance_score
      FROM users u
      LEFT JOIN applicant_profiles ap ON u.id = ap.user_id
      WHERE u.role = 'applicant' 
        AND ap.resume IS NOT NULL
        AND (
          LOWER(ap.resume) LIKE LOWER($1) OR
          LOWER(ap.resume) LIKE LOWER($2) OR
          LOWER(ap.resume) LIKE LOWER($3) OR
          LOWER(ap.resume) LIKE LOWER($4) OR
          LOWER(ap.resume) LIKE LOWER($5)
        )
      ORDER BY relevance_score DESC, ap.created_at DESC
      LIMIT 20
    `;
    
    // Split query into keywords for better matching
    const keywords = query.toLowerCase().split(/\s+/).filter(word => word.length > 2);
    const searchTerms = [
      `%${query.toLowerCase()}%`, // Full query
      ...keywords.slice(0, 4).map(keyword => `%${keyword}%`) // Individual keywords
    ];
    
    // Pad with empty strings if we have fewer than 5 terms
    while (searchTerms.length < 5) {
      searchTerms.push('%');
    }
    
    const result = await pool.query(searchQuery, searchTerms);
    const candidates = result.rows;
    
    // Generate analysis based on search results
    const analysis = generateSearchAnalysis(query, candidates);
    
    // Simulate some processing time for realistic UX
    await new Promise(resolve => setTimeout(resolve, 800));
    
    res.json({
      success: true,
      results: {
        query: query,
        candidates: candidates.map(candidate => ({
          id: candidate.id,
          email: candidate.email,
          resume: candidate.resume,
          github_url: candidate.github_url,
          linkedin_url: candidate.linkedin_url,
          leetcode_url: candidate.leetcode_url,
          relevance_score: candidate.relevance_score,
          profile_created: candidate.created_at
        })),
        total_candidates: candidates.length,
        analysis: analysis
      }
    });
  } catch (error) {
    console.error('Error in Smart Hire search:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Helper function to generate search analysis
function generateSearchAnalysis(query, candidates) {
  if (candidates.length === 0) {
    return `No candidates found matching "${query}". Try broadening your search terms or using different keywords.`;
  }
  
  const topSkills = extractTopSkills(candidates);
  const experienceLevels = analyzeExperienceLevels(candidates);
  
  let analysis = `Found ${candidates.length} candidate${candidates.length === 1 ? '' : 's'} matching "${query}". `;
  
  if (topSkills.length > 0) {
    analysis += `Top skills found: ${topSkills.slice(0, 3).join(', ')}. `;
  }
  
  if (experienceLevels.length > 0) {
    analysis += `Experience levels: ${experienceLevels.join(', ')}. `;
  }
  
  analysis += `Candidates are ranked by relevance to your search criteria.`;
  
  return analysis;
}

// Helper function to extract top skills from candidate resumes
function extractTopSkills(candidates) {
  const skillCounts = {};
  const commonSkills = [
    'react', 'javascript', 'python', 'node.js', 'typescript', 'java', 'c++', 'c#',
    'aws', 'docker', 'kubernetes', 'postgresql', 'mongodb', 'mysql', 'redis',
    'machine learning', 'ai', 'deep learning', 'tensorflow', 'pytorch', 'nlp',
    'devops', 'ci/cd', 'terraform', 'ansible', 'jenkins', 'git', 'github',
    'frontend', 'backend', 'full-stack', 'mobile', 'ios', 'android', 'flutter'
  ];
  
  candidates.forEach(candidate => {
    const resume = candidate.resume.toLowerCase();
    commonSkills.forEach(skill => {
      if (resume.includes(skill)) {
        skillCounts[skill] = (skillCounts[skill] || 0) + 1;
      }
    });
  });
  
  return Object.entries(skillCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([skill]) => skill);
}

// Helper function to analyze experience levels
function analyzeExperienceLevels(candidates) {
  const levels = [];
  candidates.forEach(candidate => {
    const resume = candidate.resume.toLowerCase();
    if (resume.includes('senior') || resume.includes('lead') || resume.includes('5+') || resume.includes('6+') || resume.includes('7+')) {
      levels.push('Senior');
    } else if (resume.includes('junior') || resume.includes('entry') || resume.includes('0-2') || resume.includes('1-2')) {
      levels.push('Junior');
    } else if (resume.includes('mid') || resume.includes('3+') || resume.includes('4+')) {
      levels.push('Mid-level');
    }
  });
  
  return [...new Set(levels)]; // Remove duplicates
}

// Helper function to extract number from query (e.g., "top 3", "top 1", "5 candidates")
function extractNumberFromQuery(query) {
  const queryLower = query.toLowerCase();
  
  // Look for patterns like "top 3", "top 1", "5 candidates", "2 developers", etc.
  const patterns = [
    /top\s+(\d+)/,           // "top 3", "top 1"
    /(\d+)\s+candidates?/,   // "3 candidates", "1 candidate"
    /(\d+)\s+developers?/,   // "2 developers", "1 developer"
    /(\d+)\s+engineers?/,    // "4 engineers", "1 engineer"
    /(\d+)\s+people/,        // "2 people"
    /(\d+)\s+professionals?/ // "3 professionals"
  ];
  
  for (const pattern of patterns) {
    const match = queryLower.match(pattern);
    if (match) {
      const num = parseInt(match[1]);
      if (num > 0 && num <= 20) { // Reasonable limit
        return num;
      }
    }
  }
  
  // Default to 5 if no number found
  return 5;
}

// AI-powered candidate analysis function using Llama3
async function analyzeCandidatesWithAI(query, candidates) {
  try {
    console.log('Using Llama3 for candidate analysis:', query);
    
    // Extract the number of candidates requested
    const requestedCount = extractNumberFromQuery(query);
    console.log(`Requested ${requestedCount} candidates for query: "${query}"`);
    
    // First, get the fallback analysis to calculate scores
    const fallbackAnalysis = createFallbackAnalysis(query, candidates, requestedCount);
    
    // Get the requested number of candidates with their scores
    const topCandidates = fallbackAnalysis.rankedCandidates;
    
    // Use the analysis from createFallbackAnalysis which has the correct match counting
    const matchSummary = fallbackAnalysis.analysis;
    
    // Try to get AI insights from Llama3
    const systemPrompt = `You are an AI recruiter analyzing candidates from our PostgreSQL database. You ONLY analyze the actual candidates in our database. Do NOT provide general advice, salary information, or external recommendations. Focus solely on the candidates we have in our system.`;
    
    const analysisPrompt = `
Search Query: "${query}"
Top ${requestedCount} Candidates: ${topCandidates.length}

Provide ONLY a simple match count summary in this exact format:
"${matchSummary}"

Do NOT provide any other text, explanations, or advice. Only the match count summary.
`;

    const response = await ollama.chat({
      model: 'llama3',
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: analysisPrompt
        }
      ],
      options: {
        temperature: 0.3,
        max_tokens: 300
      }
    });

    let aiAnalysis = matchSummary;
    let aiInsights = matchSummary;
    
    if (response.message && response.message.content) {
      console.log('Llama3 candidate analysis response received successfully');
      const cleanedResponse = cleanAIResponse(response.message.content);
      // Use the cleaned response if it matches our expected format
      if (cleanedResponse.includes('strong match') && cleanedResponse.includes('moderate match')) {
        aiAnalysis = cleanedResponse;
        aiInsights = cleanedResponse;
      }
    }

    // Return the analysis with requested number of candidates
    return {
      ...fallbackAnalysis,
      analysis: aiAnalysis,
      insights: aiInsights
    };

  } catch (error) {
    console.error('Error in Llama3 candidate analysis:', error);
    // Fallback to basic analysis if AI fails
    const requestedCount = extractNumberFromQuery(query);
    return createFallbackAnalysis(query, candidates, requestedCount);
  }
}

// Extract job information from query
function extractJobInfo(query) {
  const jobInfo = {
    title: null,
    skills: [],
    experienceLevel: null,
    education: null,
    company: null,
    location: null
  };
  
  // Extract job title
  const titleMatch = query.match(/Job Title:\s*([^\n]+)/i);
  if (titleMatch) {
    jobInfo.title = titleMatch[1].trim();
  }
  
  // Extract skills
  const skillsMatch = query.match(/Skills:\s*([^\n]+)/i);
  if (skillsMatch) {
    const skillsText = skillsMatch[1].trim();
    if (skillsText !== 'Not specified') {
      jobInfo.skills = skillsText.split(',').map(skill => skill.trim()).filter(skill => skill.length > 0);
    }
  }
  
  // Extract requirements for additional skills
  const requirementsMatch = query.match(/Requirements:\s*([^\n]+)/i);
  if (requirementsMatch) {
    const requirementsText = requirementsMatch[1].trim();
    if (requirementsText !== 'Not specified') {
      // Extract technologies and skills from requirements
      const techKeywords = ['java', 'javascript', 'python', 'react', 'angular', 'vue', 'node.js', 'aws', 'azure', 'kubernetes', 'docker', 'sql', 'mongodb', 'postgresql', 'redis', 'git', 'jenkins', 'terraform', 'ansible'];
      techKeywords.forEach(tech => {
        if (requirementsText.toLowerCase().includes(tech) && !jobInfo.skills.includes(tech)) {
          jobInfo.skills.push(tech);
        }
      });
    }
  }
  
  // Determine experience level
  const queryLower = query.toLowerCase();
  if (queryLower.includes('senior') || queryLower.includes('lead') || queryLower.includes('principal')) {
    jobInfo.experienceLevel = 'senior';
  } else if (queryLower.includes('junior') || queryLower.includes('entry') || queryLower.includes('graduate')) {
    jobInfo.experienceLevel = 'junior';
  } else if (queryLower.includes('mid') || queryLower.includes('intermediate')) {
    jobInfo.experienceLevel = 'mid';
  }
  
  // Extract education requirements
  if (queryLower.includes('bachelor') || queryLower.includes('degree')) {
    jobInfo.education = 'Bachelor';
  } else if (queryLower.includes('master') || queryLower.includes('mba')) {
    jobInfo.education = 'Master';
  } else if (queryLower.includes('phd') || queryLower.includes('doctorate')) {
    jobInfo.education = 'PhD';
  }
  
  return jobInfo;
}

// Extract technology stack from query
function extractTechStack(query) {
  const techStack = [];
  const technologies = [
    'react', 'angular', 'vue', 'javascript', 'typescript', 'node.js', 'express',
    'python', 'django', 'flask', 'fastapi', 'java', 'spring', 'hibernate',
    'c#', '.net', 'asp.net', 'php', 'laravel', 'symfony',
    'aws', 'azure', 'gcp', 'kubernetes', 'docker', 'terraform',
    'mysql', 'postgresql', 'mongodb', 'redis', 'elasticsearch',
    'react native', 'flutter', 'swift', 'kotlin', 'android', 'ios',
    'machine learning', 'ai', 'tensorflow', 'pytorch', 'pandas', 'numpy',
    'blockchain', 'solidity', 'web3', 'ethereum',
    'devops', 'ci/cd', 'jenkins', 'gitlab', 'github actions'
  ];
  
  technologies.forEach(tech => {
    if (query.includes(tech)) {
      techStack.push(tech);
    }
  });
  
  return techStack;
}

// Fallback analysis function when AI is unavailable
function createFallbackAnalysis(query, candidates, requestedCount = 5) {
  const queryLower = query.toLowerCase();
  
  // Extract job information from query
  const jobInfo = extractJobInfo(query);
  
  console.log('Job Info extracted:', jobInfo);
  console.log('Total candidates to analyze:', candidates.length);
  
  // Enhanced keyword-based ranking with job-specific analysis
  const rankedCandidates = candidates.map(candidate => {
    const resume = candidate.resume.toLowerCase();
    let score = 0;
    let reasoning = "";
    const strengths = [];
    const concerns = [];
    
    // 1. Job Title Matching (High Priority)
    if (jobInfo.title) {
      const titleKeywords = jobInfo.title.toLowerCase().split(/\s+/);
      titleKeywords.forEach(keyword => {
        if (resume.includes(keyword)) {
          score += 15; // Reduced weight for job title matches
        }
      });
    }
    
    // 2. Required Skills Matching (High Priority)
    if (jobInfo.skills && jobInfo.skills.length > 0) {
      jobInfo.skills.forEach(skill => {
        if (resume.includes(skill.toLowerCase())) {
          score += 12; // Reduced weight for required skills
          strengths.push(`${skill} experience`);
        }
      });
    }
    
    // 3. Technology Stack Matching
    const techStack = extractTechStack(queryLower);
    techStack.forEach(tech => {
      if (resume.includes(tech)) {
        score += 10;
        strengths.push(`${tech} proficiency`);
      }
    });
    
    // 4. Experience Level Matching
    if (jobInfo.experienceLevel) {
      if (jobInfo.experienceLevel === 'senior' && (resume.includes('senior') || resume.includes('lead') || resume.includes('principal'))) {
        score += 8;
        strengths.push('Senior level experience');
      } else if (jobInfo.experienceLevel === 'mid' && (resume.includes('3+') || resume.includes('4+') || resume.includes('5+'))) {
        score += 6;
        strengths.push('Mid-level experience');
      } else if (jobInfo.experienceLevel === 'junior' && (resume.includes('junior') || resume.includes('entry') || resume.includes('graduate'))) {
        score += 4;
        strengths.push('Junior level experience');
      }
    }
    
    // 5. General keyword matching (Lower Priority)
    const keywords = queryLower.split(/\s+/).filter(word => word.length > 3);
    keywords.forEach(keyword => {
      if (resume.includes(keyword)) {
        score += 3; // Reduced weight for general keywords
      }
    });
    
    // 6. Education and Certification Matching
    if (jobInfo.education && resume.includes(jobInfo.education.toLowerCase())) {
      score += 5;
      strengths.push('Relevant education');
    }
    
    // 7. Experience Duration Matching
    if (resume.includes('5+') || resume.includes('6+') || resume.includes('7+')) {
      score += 6;
      strengths.push('Extensive experience');
    } else if (resume.includes('3+') || resume.includes('4+')) {
      score += 4;
      strengths.push('Good experience');
    }
    
    // 8. Specialized Skills Bonus
    const specializedSkills = ['aws', 'azure', 'kubernetes', 'docker', 'machine learning', 'ai', 'blockchain', 'devops'];
    specializedSkills.forEach(skill => {
      if (resume.includes(skill)) {
        score += 8;
        strengths.push(`${skill} expertise`);
      }
    });
    
    // Generate reasoning based on score and matches
    if (score > 50) {
      reasoning = "Excellent match with strong alignment to job requirements";
    } else if (score > 35) {
      reasoning = "Strong match with good alignment to job requirements";
    } else if (score > 20) {
      reasoning = "Moderate match with some relevant skills and experience";
    } else if (score > 10) {
      reasoning = "Limited match, may require additional training";
      concerns.push('Limited relevant experience');
    } else {
      reasoning = "Poor match, significant training required";
      concerns.push('Limited relevant experience');
    }
    
    return {
      ...candidate,
      relevance_score: Math.min(score, 100),
      match_reasoning: reasoning,
      strengths: strengths.length > 0 ? strengths : ['Technical background'],
      concerns: concerns
    };
  }).sort((a, b) => b.relevance_score - a.relevance_score);
  
  // Debug: Log the top candidates with their scores
  console.log('Top candidates after ranking:');
  rankedCandidates.slice(0, 5).forEach((candidate, index) => {
    console.log(`${index + 1}. ${candidate.email} - Score: ${candidate.relevance_score} - ${candidate.match_reasoning}`);
  });
  
  // Get top N candidates based on request
  const topCandidates = rankedCandidates.slice(0, requestedCount);
  
  // Count matches only from the requested number of candidates
  const excellentMatches = topCandidates.filter(c => c.relevance_score > 50).length;
  const strongMatches = topCandidates.filter(c => c.relevance_score > 35 && c.relevance_score <= 50).length;
  const moderateMatches = topCandidates.filter(c => c.relevance_score > 20 && c.relevance_score <= 35).length;
  const limitedMatches = topCandidates.filter(c => c.relevance_score > 10 && c.relevance_score <= 20).length;
  
  // Create the match summary string
  const matchSummary = [
    excellentMatches > 0 ? `${excellentMatches} excellent match${excellentMatches > 1 ? 'es' : ''}` : null,
    strongMatches > 0 ? `${strongMatches} strong match${strongMatches > 1 ? 'es' : ''}` : null,
    moderateMatches > 0 ? `${moderateMatches} moderate match${moderateMatches > 1 ? 'es' : ''}` : null,
    limitedMatches > 0 ? `${limitedMatches} limited match${limitedMatches > 1 ? 'es' : ''}` : null
  ].filter(Boolean).join(', ');
  
  return {
    rankedCandidates: topCandidates,
    analysis: matchSummary,
    insights: matchSummary
  };
}

// Function to clean AI response by removing <think> tags and their content
function cleanAIResponse(response) {
  if (!response) return '';
  
  // Remove <think>...</think> tags and their content
  let cleaned = response.replace(/<think>[\s\S]*?<\/think>/gi, '');
  
  // Remove any remaining <think> tags without closing tags
  cleaned = cleaned.replace(/<think>[\s\S]*$/gi, '');
  
  // Clean up any extra whitespace
  cleaned = cleaned.replace(/\n\s*\n\s*\n/g, '\n\n');
  
  return cleaned.trim();
}

// AI Chat Assistant Analysis Function using Ollama Llama3
async function analyzeChatMessage(message, conversationHistory = []) {
  try {
    console.log('Using Ollama Llama3 for AI analysis:', message);
    
    // Build conversation context
    const conversationContext = conversationHistory
      .map(msg => `${msg.sender}: ${msg.text}`)
      .join('\n');
    
    const systemPrompt = `You are an AI talent assistant. You ONLY provide brief, friendly responses.

For candidate search requests (like "top 5 react developers", "find python developers", etc.), respond with a VARIED positive message each time. Use different phrases like:
- "Perfect! I've found some great candidates for you!"
- "Excellent! Here are some top candidates I found!"
- "Awesome! I've got some amazing candidates for you!"
- "Fantastic! I found some talented candidates!"
- "Wonderful! Here are some excellent candidates!"
- "Great! I've discovered some top talent for you!"
- "Brilliant! I found some skilled candidates!"
- "Outstanding! Here are some quality candidates!"

For general questions, provide brief 1-2 sentence answers only. Do NOT provide detailed explanations, lists, or advice.`;

    const fullPrompt = conversationContext 
      ? `${systemPrompt}\n\nPrevious conversation:\n${conversationContext}\n\nCurrent message: ${message}`
      : `${systemPrompt}\n\nCurrent message: ${message}`;

    // Use Ollama with Llama3 model
    const response = await ollama.chat({
      model: 'llama3',
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: message
        }
      ],
      options: {
        temperature: 0.3,
        max_tokens: 50
      }
    });

    if (response.message && response.message.content) {
      console.log('Llama3 response received successfully');
      // Clean the response by removing <think> tags and their content
      const cleanedResponse = cleanAIResponse(response.message.content);
      return cleanedResponse.trim();
    } else {
      throw new Error('No response content from Llama3');
    }
    
  } catch (error) {
    console.error('Error in Ollama Llama3 analysis:', error);
    
    // Fallback to enhanced rule-based responses
    return generateEnhancedFallbackChatResponse(message, conversationHistory);
  }
}

// Advanced AI Response Generator with Pattern Matching and Context Analysis
function generateAdvancedAIResponse(message, conversationHistory = []) {
  const messageLower = message.toLowerCase();
  
  // Analyze conversation context
  const recentMessages = conversationHistory.slice(-5); // Last 5 messages
  const conversationContext = analyzeConversationContext(recentMessages);
  
  // Advanced pattern matching with multiple keywords
  const patterns = {
    // Technology-specific patterns
    frontend: ['react', 'javascript', 'typescript', 'vue', 'angular', 'frontend', 'ui', 'ux', 'css', 'html'],
    backend: ['python', 'java', 'node', 'backend', 'api', 'server', 'database', 'sql', 'nosql'],
    devops: ['devops', 'aws', 'azure', 'kubernetes', 'docker', 'ci/cd', 'cloud', 'infrastructure'],
    mobile: ['mobile', 'ios', 'android', 'react native', 'flutter', 'swift', 'kotlin'],
    data: ['data', 'machine learning', 'ai', 'python', 'tensorflow', 'pytorch', 'analytics', 'sql'],
    blockchain: ['blockchain', 'solidity', 'web3', 'crypto', 'defi', 'nft', 'ethereum'],
    security: ['security', 'cybersecurity', 'penetration', 'vulnerability', 'compliance'],
    
    // Intent patterns
    search: ['find', 'search', 'look for', 'need', 'want', 'hiring', 'recruit'],
    help: ['help', 'how', 'what', 'can you', 'assist', 'support'],
    greeting: ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening'],
    thanks: ['thank', 'thanks', 'appreciate', 'grateful'],
    
    // Experience patterns
    senior: ['senior', 'lead', 'principal', 'architect', '5+', '6+', '7+', '8+', '10+'],
    junior: ['junior', 'entry', 'graduate', '0-2', '1-2', '2-3', '3-4'],
    mid: ['mid', 'intermediate', '3-5', '4-6', '5-7']
  };
  
  // Score patterns to determine the best response
  const scores = {};
  for (const [category, keywords] of Object.entries(patterns)) {
    scores[category] = keywords.reduce((score, keyword) => {
      return score + (messageLower.includes(keyword) ? 1 : 0);
    }, 0);
  }
  
  // Determine the primary intent and technology
  const primaryIntent = Object.keys(scores).reduce((a, b) => scores[a] > scores[b] ? a : b);
  const maxScore = Math.max(...Object.values(scores));
  
  // Generate contextual response based on analysis
  if (maxScore > 0) {
    return generateContextualResponse(primaryIntent, message, conversationContext, scores);
  }
  
  // Default intelligent response
  return generateIntelligentDefaultResponse(message, conversationContext);
}

// Analyze conversation context
function analyzeConversationContext(recentMessages) {
  const context = {
    hasSearchHistory: false,
    technologies: [],
    experienceLevel: null,
    intent: 'general'
  };
  
  recentMessages.forEach(msg => {
    const text = msg.text.toLowerCase();
    
    // Check for search history
    if (text.includes('find') || text.includes('search') || text.includes('candidate')) {
      context.hasSearchHistory = true;
    }
    
    // Extract technologies mentioned
    const techKeywords = ['react', 'python', 'java', 'devops', 'aws', 'mobile', 'data', 'blockchain'];
    techKeywords.forEach(tech => {
      if (text.includes(tech) && !context.technologies.includes(tech)) {
        context.technologies.push(tech);
      }
    });
    
    // Extract experience level
    if (text.includes('senior') || text.includes('lead')) {
      context.experienceLevel = 'senior';
    } else if (text.includes('junior') || text.includes('entry')) {
      context.experienceLevel = 'junior';
    } else if (text.includes('mid') || text.includes('intermediate')) {
      context.experienceLevel = 'mid';
    }
  });
  
  return context;
}

// Generate contextual response based on analysis
function generateContextualResponse(intent, message, context, scores) {
  const responses = {
    frontend: [
      "Great! I can help you find frontend developers. We have excellent candidates with React, JavaScript, TypeScript, Vue.js, and Angular experience. Would you like me to search for React developers specifically?",
      "Perfect! Frontend development is a key area. I can find candidates with modern JavaScript frameworks, responsive design skills, and UI/UX experience. What specific frontend technologies are you looking for?",
      "Excellent choice! I can help you find frontend developers with experience in React, Vue, Angular, or other modern frameworks. Would you like me to search our database?"
    ],
    backend: [
      "Excellent! I can help you find backend developers. We have candidates with Python, Java, Node.js, and other backend technologies. Would you like me to search for Python developers specifically?",
      "Great! Backend development is crucial for any application. I can find candidates with API development, database design, and server-side programming experience. What backend technologies do you need?",
      "Perfect! I can help you find backend engineers with experience in Python, Java, Node.js, or other server-side technologies. Would you like me to search our database?"
    ],
    devops: [
      "Perfect! I can help you find DevOps and cloud engineers. We have candidates with AWS, Azure, Kubernetes, Docker, and other DevOps tools. Would you like me to search for DevOps engineers?",
      "Excellent! DevOps is essential for modern software development. I can find candidates with cloud platforms, containerization, CI/CD, and infrastructure automation experience. What cloud platforms do you use?",
      "Great choice! I can help you find DevOps engineers with experience in AWS, Azure, Kubernetes, Docker, and other cloud technologies. Would you like me to search our database?"
    ],
    mobile: [
      "Great choice! I can help you find mobile developers. We have candidates with iOS, Android, React Native, and Flutter experience. Would you like me to search for mobile developers?",
      "Excellent! Mobile development is a growing field. I can find candidates with native iOS/Android development, cross-platform frameworks, and mobile UI/UX experience. What mobile platforms do you need?",
      "Perfect! I can help you find mobile developers with experience in iOS, Android, React Native, Flutter, or other mobile technologies. Would you like me to search our database?"
    ],
    data: [
      "Excellent! I can help you find data scientists and ML engineers. We have candidates with Python, TensorFlow, PyTorch, and other data science tools. Would you like me to search for data scientists?",
      "Great! Data science and machine learning are in high demand. I can find candidates with Python, R, statistical analysis, and ML model development experience. What type of data work do you need?",
      "Perfect! I can help you find data scientists with experience in Python, TensorFlow, PyTorch, statistical analysis, and machine learning. Would you like me to search our database?"
    ],
    blockchain: [
      "Excellent! I can help you find blockchain developers. We have candidates with Solidity, Web3.js, and blockchain platform experience. Would you like me to search for blockchain developers?",
      "Great! Blockchain development is a specialized field. I can find candidates with smart contract development, DeFi protocols, and blockchain integration experience. What blockchain platforms do you work with?",
      "Perfect! I can help you find blockchain developers with experience in Solidity, Web3.js, Ethereum, and other blockchain technologies. Would you like me to search our database?"
    ],
    security: [
      "Excellent! I can help you find cybersecurity engineers. We have candidates with penetration testing, security architecture, and compliance experience. Would you like me to search for security engineers?",
      "Great! Cybersecurity is critical for any organization. I can find candidates with security assessment, vulnerability management, and security operations experience. What security areas do you need?",
      "Perfect! I can help you find cybersecurity professionals with experience in penetration testing, security architecture, and compliance frameworks. Would you like me to search our database?"
    ],
    search: [
      "I can help you find the right candidates! Based on your query, I can search our database for candidates with the specific skills and experience you need. What type of role are you looking to fill?",
      "Great! I'm here to help you find the best candidates. I can search by skills, experience level, technologies, or specific requirements. What would you like to search for?",
      "Perfect! I can help you find candidates that match your requirements. I can search our database using various criteria like skills, experience, and technologies. What are you looking for?"
    ],
    help: [
      "I'm your AI talent assistant! I can help you:\n• Find candidates with specific skills (React, Python, DevOps, etc.)\n• Search by experience level (junior, senior, lead)\n• Analyze candidate pools and provide insights\n• Suggest search strategies\n\nJust tell me what you're looking for!",
      "I'm here to help you with candidate search and recruitment! I can:\n• Search for candidates by technology stack\n• Filter by experience level and skills\n• Provide insights about our candidate pool\n• Help refine your search criteria\n\nWhat can I help you with today?",
      "I'm your AI recruitment assistant! I can help you:\n• Find candidates with specific technical skills\n• Search by experience level and location\n• Get insights about candidate availability\n• Suggest alternative search strategies\n\nWhat would you like to search for?"
    ],
    greeting: [
      "Hello! I'm your AI talent assistant. I can help you find and analyze candidates for your open positions. What can I help you with today?",
      "Hi there! I'm here to help you with candidate search and recruitment. I can find candidates with specific skills, analyze our candidate pool, and provide recruitment insights. What are you looking for?",
      "Hey! I'm your AI recruitment assistant. I can help you find the right candidates for your team. What type of role are you looking to fill?"
    ],
    thanks: [
      "You're welcome! I'm here to help you find the best candidates. Is there anything else you'd like to search for?",
      "My pleasure! I'm always happy to help with your recruitment needs. What else can I assist you with?",
      "Glad I could help! I'm here whenever you need assistance with finding candidates or recruitment insights. What's next?"
    ]
  };
  
  // Get appropriate response based on intent
  const intentResponses = responses[intent] || responses.help;
  const response = intentResponses[Math.floor(Math.random() * intentResponses.length)];
  
  // Add context-aware suggestions if we have conversation history
  if (context.hasSearchHistory && context.technologies.length > 0) {
    return response + `\n\nI notice you've been looking for ${context.technologies.join(', ')} candidates. Would you like me to refine your search or try a different approach?`;
  }
  
  return response;
}

// Generate intelligent default response
function generateIntelligentDefaultResponse(message, context) {
  const responses = [
    "I'm here to help you with candidate search and recruitment. You can ask me to:\n• Find candidates with specific skills (e.g., 'React developers', 'Python engineers')\n• Search by technology stack (e.g., 'AWS DevOps', 'Mobile developers')\n• Get insights about our candidate pool\n• Refine your search criteria\n\nWhat would you like to search for?",
    "I'm your AI talent assistant! I can help you find the right candidates for your open positions. You can search by:\n• Technical skills and technologies\n• Experience level (junior, senior, lead)\n• Specific roles (frontend, backend, DevOps, etc.)\n• Location and availability\n\nWhat type of candidate are you looking for?",
    "I'm here to help you with recruitment! I can assist you with:\n• Finding candidates with specific technical skills\n• Analyzing our candidate database\n• Providing recruitment insights and suggestions\n• Refining your search criteria\n\nWhat can I help you find today?"
  ];
  
  return responses[Math.floor(Math.random() * responses.length)];
}

// Enhanced fallback chat response with conversation context
function generateEnhancedFallbackChatResponse(message, conversationHistory = []) {
  const messageLower = message.toLowerCase();
  
  // Analyze conversation context
  const recentMessages = conversationHistory.slice(-3); // Last 3 messages
  const hasRecentSearch = recentMessages.some(msg => 
    msg.text.toLowerCase().includes('find') || 
    msg.text.toLowerCase().includes('search') ||
    msg.text.toLowerCase().includes('candidate')
  );
  
  // Intent detection based on keywords and context
  if (messageLower.includes('find') || messageLower.includes('search') || messageLower.includes('candidate')) {
    if (hasRecentSearch) {
      return "I can help you refine your search! You can search for candidates by specific skills, technologies, or experience levels. What specific requirements are you looking for?";
    }
    return "I can help you find candidates! Try searching for specific skills like 'React developer', 'Python engineer', or 'DevOps specialist'. What type of candidate are you looking for?";
  }
  
  if (messageLower.includes('react') || messageLower.includes('javascript') || messageLower.includes('frontend')) {
    return "Great! I can help you find frontend developers. We have candidates with React, JavaScript, TypeScript, and other frontend technologies. Would you like me to search for React developers specifically?";
  }
  
  if (messageLower.includes('python') || messageLower.includes('java') || messageLower.includes('backend')) {
    return "Excellent! I can help you find backend developers. We have candidates with Python, Java, Node.js, and other backend technologies. Would you like me to search for Python developers specifically?";
  }
  
  if (messageLower.includes('devops') || messageLower.includes('aws') || messageLower.includes('cloud')) {
    return "Perfect! I can help you find DevOps and cloud engineers. We have candidates with AWS, Azure, Kubernetes, Docker, and other DevOps tools. Would you like me to search for DevOps engineers?";
  }
  
  if (messageLower.includes('mobile') || messageLower.includes('ios') || messageLower.includes('android')) {
    return "Great choice! I can help you find mobile developers. We have candidates with iOS, Android, React Native, and Flutter experience. Would you like me to search for mobile developers?";
  }
  
  if (messageLower.includes('data') || messageLower.includes('machine learning') || messageLower.includes('ai')) {
    return "Excellent! I can help you find data scientists and ML engineers. We have candidates with Python, TensorFlow, PyTorch, and other data science tools. Would you like me to search for data scientists?";
  }
  
  if (messageLower.includes('skill') || messageLower.includes('experience') || messageLower.includes('requirement')) {
    return "I can search our candidate database based on skills and experience. Please describe the technical skills, years of experience, or specific requirements you're looking for.";
  }
  
  if (messageLower.includes('help') || messageLower.includes('how')) {
    return "I'm your AI talent assistant! I can help you:\n• Find candidates with specific skills (React, Python, DevOps, etc.)\n• Search by experience level (junior, senior, lead)\n• Analyze candidate pools and provide insights\n• Suggest search strategies\n\nJust tell me what you're looking for!";
  }
  
  if (messageLower.includes('hello') || messageLower.includes('hi') || messageLower.includes('hey')) {
    return "Hello! I'm your AI talent assistant. I can help you find and analyze candidates. What can I help you with today?";
  }
  
  if (messageLower.includes('thank') || messageLower.includes('thanks')) {
    return "You're welcome! I'm here to help you find the best candidates. Is there anything else you'd like to search for?";
  }
  
  // Default response with more helpful suggestions
  return "I'm here to help you with candidate search and recruitment. You can ask me to:\n• Find candidates with specific skills (e.g., 'React developers', 'Python engineers')\n• Search by technology stack (e.g., 'AWS DevOps', 'Mobile developers')\n• Get insights about our candidate pool\n• Refine your search criteria\n\nWhat would you like to search for?";
}

// Fallback chat response when AI is unavailable (legacy function)
function generateFallbackChatResponse(message) {
  return generateEnhancedFallbackChatResponse(message, []);
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error'
  });
});

// Start server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
