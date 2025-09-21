-- Insert recruiter user if not exists
INSERT INTO users (id, email, role, created_at) 
VALUES (1, 'recruiter@example.com', 'recruiter', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO NOTHING;

-- Insert some mock job listings (updated to include company values)
INSERT INTO jobs 
(id, recruiter_id, title, description, company, posted_at)
VALUES
(1, 1, 'Senior Frontend Developer', 
'We are looking for an experienced Frontend Developer to join our team. You will be responsible for building user interfaces for our web applications, ensuring they are responsive, accessible, and provide an excellent user experience. Requirements: 5+ years of experience with React, Strong knowledge of TypeScript, Experience with modern CSS frameworks, Understanding of UX/UI principles. Skills: React, TypeScript, CSS, HTML, JavaScript, Tailwind CSS. Location: San Francisco, CA. Salary: $120K - $150K. Type: Full-time. Experience: 5+ years.',
'TechCorp Inc.',
CURRENT_TIMESTAMP - INTERVAL '7 days'),

(2, 1, 'Backend Engineer', 
'We are seeking a talented Backend Engineer to help design and implement our APIs, microservices, and database architecture. The ideal candidate will have experience with Node.js and PostgreSQL. Requirements: 3+ years of experience with Node.js, Experience with SQL and NoSQL databases, Knowledge of RESTful API design, Understanding of microservices architecture. Skills: Node.js, Express, PostgreSQL, MongoDB, Docker, REST API. Location: Remote. Salary: $110K - $140K. Type: Full-time. Experience: 3+ years.',
'DataFlow Systems',
CURRENT_TIMESTAMP - INTERVAL '14 days'),

(3, 1, 'Full Stack Developer', 
'Join our fast-growing team as a Full Stack Developer. You will work on both the frontend and backend of our applications, implementing new features and maintaining existing ones. Requirements: Experience with React and Node.js, Familiarity with databases like PostgreSQL or MongoDB, Knowledge of Git and CI/CD pipelines, Ability to work in an agile environment. Skills: React, Node.js, PostgreSQL, JavaScript, Git, CI/CD. Location: New York, NY. Salary: $100K - $130K. Type: Full-time. Experience: 2+ years.',
'GrowthWave Startups',
CURRENT_TIMESTAMP - INTERVAL '3 days'),

(4, 1, 'Machine Learning Engineer', 
'We are looking for a Machine Learning Engineer to join our team working on cutting-edge AI solutions. The ideal candidate will have experience with natural language processing and machine learning frameworks. Requirements: 4+ years of experience in ML/AI, Proficiency in Python and ML frameworks like PyTorch or TensorFlow, Experience with NLP techniques, Strong mathematics and statistics background. Skills: Python, PyTorch, TensorFlow, NLP, Machine Learning, Statistics. Location: Boston, MA. Salary: $130K - $160K. Type: Full-time. Experience: 4+ years.',
'AI Innovations',
CURRENT_TIMESTAMP - INTERVAL '10 days'),

(5, 1, 'DevOps Engineer', 
'Join our infrastructure team as a DevOps Engineer. You will be responsible for maintaining and improving our cloud infrastructure, CI/CD pipelines, and monitoring systems. Requirements: Experience with AWS or Azure cloud services, Knowledge of containerization with Docker and Kubernetes, Experience with CI/CD tools like Jenkins or GitHub Actions, Understanding of infrastructure as code. Skills: AWS, Docker, Kubernetes, Jenkins, Terraform, Linux. Location: Seattle, WA. Salary: $115K - $145K. Type: Full-time. Experience: 3+ years.',
'CloudOps Technologies',
CURRENT_TIMESTAMP - INTERVAL '5 days')
ON CONFLICT (id) DO UPDATE 
SET title = EXCLUDED.title,
    company = EXCLUDED.company,
    description = EXCLUDED.description,
    posted_at = EXCLUDED.posted_at;

-- Set the sequence to continue from the highest ID
SELECT setval('jobs_id_seq', (SELECT MAX(id) FROM jobs));