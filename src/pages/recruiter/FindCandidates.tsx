
import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { searchAICandidates, sendChatMessage } from "@/lib/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { SendHorizontal, Star, AlertCircle, CheckCircle } from "lucide-react";

interface Message {
  text: string;
  sender: "user" | "ai";
  timestamp: number;
}

interface AICandidate {
  id: string;
  email: string;
  resume: string;
  github_url: string;
  linkedin_url: string;
  leetcode_url: string;
  created_at: string;
  relevance_score: number;
  match_reasoning: string;
  strengths: string[];
  concerns: string[];
}

interface AIResponse {
  query: string;
  candidates: AICandidate[];
  analysis: string;
  ai_insights: string;
  total_candidates: number;
}

const FindCandidates = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      text: "Hello! I'm your AI talent assistant. Ask me to find candidates matching specific skills or requirements.",
      sender: "ai",
      timestamp: Date.now(),
    },
  ]);
  const [results, setResults] = useState<AICandidate[]>([]);
  const [aiInsights, setAiInsights] = useState<string>("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Helper function to scroll to bottom
  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      const container = messagesContainerRef.current;
      container.scrollTop = container.scrollHeight;
    }
    // Fallback: also try scrollIntoView on the last message
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  };

  // Auto-scroll to bottom when new messages are added or loading state changes
  useEffect(() => {
    // Use requestAnimationFrame for better timing
    requestAnimationFrame(() => {
      setTimeout(scrollToBottom, 50);
    });
  }, [messages, loading]);

  // Force scroll when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages.length]);

  // Additional scroll trigger for any message changes
  useEffect(() => {
    const timer = setTimeout(scrollToBottom, 100);
    return () => clearTimeout(timer);
  }, [messages]);

  // Handle URL search parameters for pre-filled queries
  useEffect(() => {
    const jobQuery = searchParams.get('query');
    if (jobQuery) {
      setQuery(jobQuery);
      // Automatically submit the query if it's from a job listing
      setTimeout(async () => {
        if (!jobQuery.trim()) return;
        
        const userMessage: Message = {
          text: jobQuery,
          sender: "user",
          timestamp: Date.now(),
        };
        
        setMessages(prev => [...prev, userMessage]);
        setLoading(true);
        
        try {
          // Send chat message first
          const chatResponse = await sendChatMessage(jobQuery, []);
          
          if (chatResponse.data.success) {
            const aiMessage: Message = {
              text: chatResponse.data.response.message,
              sender: "ai",
              timestamp: Date.now(),
            };
            setMessages(prev => [...prev, aiMessage]);
          }
          
          // Check if it's a candidate search request
          const isCandidateSearch = /top\s+\d+|find|search|candidates?|developers?|engineers?/i.test(jobQuery);
          
          if (isCandidateSearch) {
            // Also search for candidates
            const searchResponse = await searchAICandidates(jobQuery);
            
            if (searchResponse.data.success) {
              const aiResponse = searchResponse.data.results;
              setResults(aiResponse.candidates || []);
              setAiInsights(aiResponse.ai_insights || "");
              
              // Add the match counts as a separate message after the generic response
              const matchCountsMessage: Message = {
                text: aiResponse.ai_insights || aiResponse.analysis || "No match details available",
                sender: "ai",
                timestamp: Date.now() + 1, // Slightly later timestamp to ensure order
              };
              
              setMessages(prev => [...prev, matchCountsMessage]);
            }
          }
        } catch (error) {
          console.error('Error processing query:', error);
          const errorMessage: Message = {
            text: "Sorry, I encountered an error. Please try again.",
            sender: "ai",
            timestamp: Date.now(),
          };
          setMessages(prev => [...prev, errorMessage]);
        } finally {
          setLoading(false);
        }
      }, 500);
    }
  }, [searchParams]);

  if (!user || user.role !== "recruiter") {
    return (
      <div className="container mx-auto py-10">
        <p>You don't have access to this page. Please login as a recruiter.</p>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    const userMessage: Message = {
      text: query,
      sender: "user",
      timestamp: Date.now(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setLoading(true);
    
    // Immediately scroll to bottom after adding user message
    setTimeout(scrollToBottom, 50);
    
    try {
      // First, get AI chat response for context understanding
      const chatResponse = await sendChatMessage(query, messages);
      let aiChatMessage = "";
      
      if (chatResponse.data.success) {
        aiChatMessage = chatResponse.data.response.message;
      }
      
      // Check if the query seems like a candidate search request
      const isCandidateSearch = query.toLowerCase().includes('find') || 
                               query.toLowerCase().includes('search') || 
                               query.toLowerCase().includes('candidate') ||
                               query.toLowerCase().includes('developer') ||
                               query.toLowerCase().includes('engineer') ||
                               query.toLowerCase().includes('react') ||
                               query.toLowerCase().includes('python') ||
                               query.toLowerCase().includes('java') ||
                               query.toLowerCase().includes('devops') ||
                               query.toLowerCase().includes('mobile') ||
                               query.toLowerCase().includes('frontend') ||
                               query.toLowerCase().includes('backend');
      
      if (isCandidateSearch) {
        // Also perform candidate search
        const searchResponse = await searchAICandidates(query);
        
        if (searchResponse.data.success) {
          const aiResponse: AIResponse = searchResponse.data.results;
          
          setResults(aiResponse.candidates);
          setAiInsights(aiResponse.ai_insights);
          
          // First, add the generic AI chat response
          const genericMessage: Message = {
            text: aiChatMessage,
            sender: "ai",
            timestamp: Date.now(),
          };
          
          setMessages(prev => [...prev, genericMessage]);
          
          // Then, add the match counts as a separate message
          const matchCountsMessage: Message = {
            text: aiResponse.ai_insights || aiResponse.analysis || "No match details available",
            sender: "ai",
            timestamp: Date.now() + 1, // Slightly later timestamp to ensure order
          };
          
          setMessages(prev => [...prev, matchCountsMessage]);
          
          // Scroll to bottom after adding AI message
          setTimeout(scrollToBottom, 50);
        } else {
          // Use only AI chat response if search fails
          const aiMessage: Message = {
            text: aiChatMessage,
            sender: "ai",
            timestamp: Date.now(),
          };
          
          setMessages(prev => [...prev, aiMessage]);
          
          // Scroll to bottom after adding AI message
          setTimeout(scrollToBottom, 50);
        }
      } else {
        // Just use AI chat response for general conversation
        const aiMessage: Message = {
          text: aiChatMessage,
          sender: "ai",
          timestamp: Date.now(),
        };
        
        setMessages(prev => [...prev, aiMessage]);
        
        // Scroll to bottom after adding AI message
        setTimeout(() => {
          if (messagesContainerRef.current) {
            messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
          }
        }, 50);
      }
      
      setQuery("");
    } catch (error) {
      console.error("Error in AI assistant:", error);
      
      const errorMessage: Message = {
        text: "Sorry, I encountered an error. Please try again.",
        sender: "ai",
        timestamp: Date.now(),
      };
      
      setMessages(prev => [...prev, errorMessage]);
      
      // Scroll to bottom after adding error message
      setTimeout(scrollToBottom, 50);
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (email: string) => {
    const name = email.split('@')[0];
    return name
      .split(/[._-]/)
      .map(part => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Helper function to get profile image URL for candidates
  const getProfileImageUrl = (candidate: AICandidate) => {
    // In a real app, this would be an actual image URL from LinkedIn
    // For now, we're using a placeholder image based on the candidate's id
    const candidateIdNum = parseInt(candidate.id);
    return `https://randomuser.me/api/portraits/${candidateIdNum % 2 === 0 ? 'men' : 'women'}/${candidateIdNum % 10}.jpg`;
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600 bg-green-100";
    if (score >= 60) return "text-yellow-600 bg-yellow-100";
    if (score >= 40) return "text-orange-600 bg-orange-100";
    return "text-red-600 bg-red-100";
  };

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-8">Find Candidates</h1>
      
      <div className="grid grid-cols-1 gap-8">
        <Card className="flex flex-col h-[calc(120vh-520px)] max-h-[800px]">
          <CardHeader className="flex-shrink-0">
            <CardTitle>AI Talent Assistant</CardTitle>
          </CardHeader>
          <Tabs defaultValue="chat" className="flex-1 flex flex-col min-h-0">
            <TabsList className="mx-4 flex-shrink-0">
              <TabsTrigger value="chat">Chat</TabsTrigger>
              <TabsTrigger value="candidates">
                Candidates
                {results.length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {results.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>
            
            <CardContent className="flex-1 flex flex-col min-h-0 p-0">
              <TabsContent value="chat" className="flex-1 flex flex-col space-y-0 mt-0 data-[state=active]:flex data-[state=active]:flex-col p-0 min-h-0">
                <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 min-h-0 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                  <div className="space-y-4">
                    {messages.map((message, index) => (
                      <div 
                        key={index} 
                        className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
                      >
                        <div 
                          className={`max-w-[80%] rounded-lg p-3 break-words ${
                            message.sender === "user" 
                              ? "bg-primary text-primary-foreground" 
                              : "bg-muted"
                          }`}
                        >
                          <p className="whitespace-pre-wrap">{message.text}</p>
                        </div>
                      </div>
                    ))}
                    {loading && (
                      <div className="flex justify-start">
                        <div className="bg-muted max-w-[80%] rounded-lg p-3">
                          <div className="flex space-x-2">
                            <div className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "0ms" }}></div>
                            <div className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "150ms" }}></div>
                            <div className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "300ms" }}></div>
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                </div>
                
                <div className="flex items-center gap-2 p-4 border-t flex-shrink-0 bg-white">
                  <form onSubmit={handleSubmit} className="flex-1 flex gap-2">
                    <Input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Type a query like 'Find me top Python developers'"
                      disabled={loading}
                      className="flex-1"
                    />
                    <Button type="submit" size="icon" disabled={loading}>
                      <SendHorizontal className="h-4 w-4" />
                    </Button>
                  </form>
                </div>
              </TabsContent>
              
              <TabsContent value="candidates" className="flex flex-col mt-0 data-[state=active]:flex data-[state=active]:flex-col p-0 min-h-0">
                {/* Fixed AI Insights Section */}
                {aiInsights && (
                  <div className="flex-shrink-0 p-4 pb-0">
                    <Card className="p-4 bg-blue-50 border-blue-200">
                      <div className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                        <div>
                          <h4 className="font-medium text-blue-900 mb-1">AI Insights</h4>
                          <p className="text-sm text-blue-800">{aiInsights}</p>
                        </div>
                      </div>
                    </Card>
                  </div>
                )}
                
                {/* Scrollable Candidates List */}
                <div className="flex-1 overflow-y-auto p-4 min-h-0 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                  <div className="space-y-4">
                    {results.length > 0 ? (
                    results.map((candidate, index) => (
                      <Card key={candidate.id} className="p-4">
                        <div className="flex flex-col md:flex-row gap-4">
                          <div className="flex flex-col items-center gap-2">
                            <Avatar className="h-16 w-16">
                              <AvatarImage src={getProfileImageUrl(candidate)} alt={candidate.email} />
                              <AvatarFallback className="text-lg">
                                {getInitials(candidate.email)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex items-center gap-1">
                              <Star className="h-4 w-4 text-yellow-500" />
                              <span className="text-sm font-medium">#{index + 1}</span>
                            </div>
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2 mb-3">
                              <div>
                                <h3 className="text-xl font-semibold">{candidate.email.split('@')[0].replace(/[._-]/g, ' ')}</h3>
                                <p className="text-sm text-muted-foreground">{candidate.email}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge className={`px-2 py-1 ${getScoreColor(candidate.relevance_score)}`}>
                                  {candidate.relevance_score}% Match
                                </Badge>
                              </div>
                            </div>
                            
                            <div className="mb-3">
                              <h4 className="font-medium text-sm mb-1">AI Analysis</h4>
                              <p className="text-sm text-muted-foreground">{candidate.match_reasoning}</p>
                            </div>
                            
                            <div className="grid md:grid-cols-2 gap-4 mb-4">
                              <div>
                                <h4 className="font-medium text-sm mb-2 flex items-center gap-1">
                                  <CheckCircle className="h-4 w-4 text-green-600" />
                                  Strengths
                                </h4>
                                <div className="flex flex-wrap gap-1">
                                  {candidate.strengths.map((strength, idx) => (
                                    <Badge key={idx} variant="secondary" className="font-normal bg-green-100 text-green-800">
                                      {strength}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                              
                              {candidate.concerns.length > 0 && (
                                <div>
                                  <h4 className="font-medium text-sm mb-2 flex items-center gap-1">
                                    <AlertCircle className="h-4 w-4 text-orange-600" />
                                    Considerations
                                  </h4>
                                  <div className="flex flex-wrap gap-1">
                                    {candidate.concerns.map((concern, idx) => (
                                      <Badge key={idx} variant="secondary" className="font-normal bg-orange-100 text-orange-800">
                                        {concern}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                            
                            <div className="mb-4">
                              <h4 className="font-medium text-sm mb-2">Resume Summary</h4>
                              <p className="text-sm text-muted-foreground line-clamp-3">{candidate.resume}</p>
                            </div>
                            
                            <div>
                              <h4 className="font-medium text-sm mb-2">Profiles</h4>
                              <div className="flex flex-wrap gap-2">
                                {candidate.github_url && (
                                  <a href={candidate.github_url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">
                                    GitHub
                                  </a>
                                )}
                                {candidate.linkedin_url && (
                                  <a href={candidate.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">
                                    LinkedIn
                                  </a>
                                )}
                                {candidate.leetcode_url && (
                                  <a href={candidate.leetcode_url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">
                                    LeetCode
                                  </a>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-muted-foreground">No candidates found. Try searching with different criteria.</p>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
};

export default FindCandidates;
