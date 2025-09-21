import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { getJobs } from "@/lib/api";
import { PlusCircle, Search, Users, Briefcase, TrendingUp, Award } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const RecruiterDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        setLoading(true);
        const response = await getJobs();
        if (response.data.success) {
          setJobs(response.data.jobs);
        } else {
          setError('Failed to fetch jobs');
        }
      } catch (err) {
        console.error('Error fetching jobs:', err);
        setError('Failed to fetch jobs');
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, []);

  if (!user || user.role !== "recruiter") {
    return (
      <div className="container mx-auto py-10">
        <p>You don't have access to this page. Please login as a recruiter.</p>
      </div>
    );
  }

  // Analytics data based on real jobs
  const dashboardStats = {
    totalJobs: jobs.length,
    activeJobs: jobs.filter(job => !job.closed).length,
    totalApplicants: 87, // This would come from applications API
    newApplications: 12, // This would come from applications API
  };

  // Mock applicant demographics
  const applicantDemographics = {
    experienceLevels: [
      { label: "0-2 years", count: 34, percentage: 39 },
      { label: "3-5 years", count: 28, percentage: 32 },
      { label: "5+ years", count: 25, percentage: 29 },
    ],
    educationLevels: [
      { label: "Undergraduate", count: 22, percentage: 25 },
      { label: "Graduate", count: 51, percentage: 59 },
      { label: "PhD", count: 14, percentage: 16 },
    ]
  };

  return (
    <div className="container mx-auto py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Recruiter Dashboard</h1>
        <p className="text-muted-foreground">Welcome back! Here's an overview of your hiring activities.</p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <Card className="bg-gradient-to-br from-primary/80 to-primary hover:from-primary hover:to-primary/90 transition-colors group">
          <CardContent className="p-6">
            <div className="flex flex-col h-full space-y-4">
              <div className="rounded-full bg-white/20 p-3 w-fit">
                <Search className="h-6 w-6 text-white" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-white">Smart Hire - AI Powered Candidate Search</h3>
                <p className="text-white/80">Find the perfect candidates using our advanced AI matching technology.</p>
              </div>
              <Button 
                onClick={() => navigate("/recruiter/find-candidates")} 
                variant="secondary" 
                className="mt-auto w-full group-hover:translate-y-0 translate-y-1 transition-transform"
              >
                <Search className="mr-2 h-4 w-4" />
                Find Candidates
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col h-full space-y-4">
              <div className="rounded-full bg-primary/10 p-3 w-fit">
                <PlusCircle className="h-6 w-6 text-primary" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold">Post a New Job</h3>
                <p className="text-muted-foreground">Create a new job listing to attract top talent.</p>
              </div>
              <Button 
                onClick={() => navigate("/recruiter/post-job")} 
                variant="outline" 
                className="mt-auto w-full"
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                Post New Job
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Jobs</p>
                <h4 className="text-2xl font-bold mt-1">{dashboardStats.totalJobs}</h4>
              </div>
              <div className="rounded-full bg-blue-100 p-2 dark:bg-blue-900">
                <Briefcase className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {dashboardStats.activeJobs} currently active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Applicants</p>
                <h4 className="text-2xl font-bold mt-1">{dashboardStats.totalApplicants}</h4>
              </div>
              <div className="rounded-full bg-green-100 p-2 dark:bg-green-900">
                <Users className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              +{dashboardStats.newApplications} new this week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Average Experience</p>
                <h4 className="text-2xl font-bold mt-1">4.2 yrs</h4>
              </div>
              <div className="rounded-full bg-purple-100 p-2 dark:bg-purple-900">
                <TrendingUp className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              +0.5 yrs from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Top Skill</p>
                <h4 className="text-2xl font-bold mt-1">React</h4>
              </div>
              <div className="rounded-full bg-amber-100 p-2 dark:bg-amber-900">
                <Award className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              72% of applicants
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Applicant Demographics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Experience Levels</CardTitle>
            <CardDescription>Distribution of applicants by years of experience</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {applicantDemographics.experienceLevels.map(level => (
                <div key={level.label}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium">{level.label}</span>
                    <span className="text-sm text-muted-foreground">{level.count} applicants ({level.percentage}%)</span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2.5">
                    <div 
                      className="bg-primary h-2.5 rounded-full" 
                      style={{ width: `${level.percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Education Background</CardTitle>
            <CardDescription>Distribution of applicants by education level</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {applicantDemographics.educationLevels.map(level => (
                <div key={level.label}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium">{level.label}</span>
                    <span className="text-sm text-muted-foreground">{level.count} applicants ({level.percentage}%)</span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2.5">
                    <div 
                      className="bg-primary h-2.5 rounded-full" 
                      style={{ width: `${level.percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Job Listings */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Your Job Listings</CardTitle>
            <CardDescription>Manage your active job listings</CardDescription>
          </div>
          <Button onClick={() => navigate("/recruiter/post-job")} size="sm">
            <PlusCircle className="mr-1 h-4 w-4" />
            Post Job
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-muted-foreground">Loading jobs...</div>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-red-500">Error: {error}</div>
              </div>
            ) : jobs.length > 0 ? (
              jobs.map((job) => (
                <div key={job.id} className="border rounded-lg p-4 hover:bg-accent/30 transition-colors">
                  <div className="flex flex-col md:flex-row justify-between md:items-center gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-lg">{job.title}</h3>
                        {job.featured && (
                          <Badge variant="outline" className={job.featured ? "bg-yellow-100" : ""}>
                            {job.featured ? "Featured" : "Standard"}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{job.company} • {job.location || 'Location not specified'}</p>
                      <p className="text-sm mt-2 line-clamp-1">{job.description}</p>
                      
                      <div className="flex items-center gap-3 mt-2">
                        <Badge variant="outline" className="bg-blue-50">
                          <Users className="h-3 w-3 mr-1" /> 0 Applicants
                        </Badge>
                        <Badge variant="outline" className="bg-green-50">
                          <Award className="h-3 w-3 mr-1" /> 0 Matches
                        </Badge>
                        <Badge variant="outline" className="bg-gray-50">
                          Posted: {new Date(job.created_at).toLocaleDateString()}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex gap-2 md:flex-col lg:flex-row">
                      <Button variant="outline" size="sm" onClick={() => navigate(`/recruiter/job/${job.id}`)}>
                        View Details
                      </Button>
                      <Button 
                        variant="secondary" 
                        size="sm" 
                        onClick={() => {
                          const jobDescription = `Job Title: ${job.title}\nCompany: ${job.company}\nLocation: ${job.location || 'Not specified'}\nDescription: ${job.description}\nRequirements: ${job.requirements || 'Not specified'}\nSkills: ${job.skills || 'Not specified'}`;
                          const query = `Give me top 5 candidates for this job description: ${job.description}`;
                          navigate(`/recruiter/find-candidates?query=${encodeURIComponent(query)}`);
                        }}
                      >
                        <Search className="h-3 w-3 mr-1" />
                        Find Matches
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground">You haven't posted any jobs yet.</p>
            )}
          </div>
        </CardContent>
        <CardFooter>
          <p className="text-sm text-muted-foreground">
            Posted jobs will appear here. Click on a job to view details and applicants.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default RecruiterDashboard;
