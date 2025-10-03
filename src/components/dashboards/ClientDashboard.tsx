import { useState, useEffect } from "react";
import { DataService, Project, ProgressLog, Issue } from "@/lib/data";
import { AuthService } from "@/lib/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Users, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  Star,
  MessageSquare,
  Calendar,
  TrendingUp
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function ClientDashboard() {
  const [project, setProject] = useState<Project | null>(null);
  const [progressLogs, setProgressLogs] = useState<ProgressLog[]>([]);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [showReportIssue, setShowReportIssue] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedback, setFeedback] = useState<any[]>([]);
  const { toast } = useToast();

  const currentUser = AuthService.getCurrentUser();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    if (!currentUser) return;

    // Find client's project using client credentials or email
    const projects = DataService.getProjects();
    let clientProject: Project | null = null;

    // First try to find by client credentials (for users logged in via manager-created credentials)
    if (currentUser.role === 'client') {
      clientProject = projects.find(p => 
        p.clientCredentials?.username === currentUser.username ||
        p.clientCredentials?.email === currentUser.email
      ) || null;
    }

    // Fallback: try to find by client record (for legacy or manual matches)
    if (!clientProject) {
      const clients = DataService.getClients();
      const clientRecord = clients.find(c => c.email === currentUser.email);
      if (clientRecord) {
        clientProject = projects.find(p => p.clientId === clientRecord.id) || null;
      }
    }

    setProject(clientProject);
    
    if (clientProject) {
      // Get progress logs for the project
      const allLogs = DataService.getProgressLogs();
      const projectLogs = allLogs.filter(log => log.projectId === clientProject.id);
      setProgressLogs(projectLogs);
      
      // Get issues for the project
      const allIssues = DataService.getIssues();
      const projectIssues = allIssues.filter(issue => issue.projectId === clientProject.id);
      setIssues(projectIssues);
      
      // Get feedback
      const storedFeedback = JSON.parse(localStorage.getItem('nightowl_crm_feedback') || '[]');
      const projectFeedback = storedFeedback.filter((f: any) => f.projectId === clientProject.id);
      setFeedback(projectFeedback);
    }
  };

  const handleReportIssue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !project) return;

    const formData = new FormData(e.target as HTMLFormElement);
    
    const issueData = {
      id: `issue-${Date.now()}`,
      projectId: project.id,
      reporterId: currentUser.id,
      type: 'query' as const,
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      status: 'open' as const,
      createdAt: new Date().toISOString()
    };

    const allIssues = DataService.getIssues();
    allIssues.push(issueData);
    DataService.saveIssues(allIssues);

    AuthService.logActivity('client_issue_reported', `Client reported issue: ${issueData.title}`);
    
    setShowReportIssue(false);
    loadData();
    toast({
      title: "Issue Reported",
      description: "Your issue has been reported to the development team.",
    });
  };

  const handleSubmitFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !project) return;

    const formData = new FormData(e.target as HTMLFormElement);
    
    const feedbackData = {
      id: `feedback-${Date.now()}`,
      projectId: project.id,
      clientId: currentUser.id,
      phase: formData.get('phase') as string,
      rating: parseInt(formData.get('rating') as string),
      comments: formData.get('comments') as string,
      createdAt: new Date().toISOString()
    };

    const allFeedback = JSON.parse(localStorage.getItem('nightowl_crm_feedback') || '[]');
    allFeedback.push(feedbackData);
    localStorage.setItem('nightowl_crm_feedback', JSON.stringify(allFeedback));

    AuthService.logActivity('client_feedback_submitted', `Client submitted feedback for phase ${feedbackData.phase}`);
    
    setShowFeedback(false);
    loadData();
    toast({
      title: "Feedback Submitted",
      description: "Thank you for your feedback!",
    });
  };

  if (!project) {
    return (
      <div className="p-6">
        <div className="flex items-center space-x-2 mb-6">
          <Users className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold gradient-text">Client Dashboard</h1>
        </div>
        <Card className="glass-card">
          <CardContent className="p-6 text-center">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No project found for your account.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const client = DataService.getClients().find(c => c.id === project.clientId);
  
  const stats = {
    projectStatus: project.status,
    completedPhases: project.phases.filter(p => p.status === 'completed').length,
    totalPhases: project.phases.length,
    totalHours: progressLogs.reduce((sum, log) => sum + log.timeTracking, 0),
    openIssues: issues.filter(i => i.status === 'open').length,
    resolvedIssues: issues.filter(i => i.status === 'resolved').length,
    feedbackCount: feedback.length
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-2">
        <Users className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold gradient-text">Client Dashboard</h1>
      </div>

      {/* Project Overview */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Project Overview</span>
            <Badge variant={
              project.status === 'active' ? 'default' : 
              project.status === 'delivered' ? 'secondary' : 'outline'
            } className="text-sm">
              {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
            </Badge>
          </CardTitle>
          <CardDescription>
            {client?.projectDescription}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">{stats.completedPhases}/{stats.totalPhases}</p>
              <p className="text-sm text-muted-foreground">Phases Completed</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-success">{stats.totalHours}</p>
              <p className="text-sm text-muted-foreground">Hours Logged</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-accent">{stats.resolvedIssues}/{stats.openIssues + stats.resolvedIssues}</p>
              <p className="text-sm text-muted-foreground">Issues Resolved</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => setShowReportIssue(true)} className="crm-button-primary">
          <MessageSquare className="h-4 w-4 mr-2" />
          Report Issue
        </Button>
        <Button onClick={() => setShowFeedback(true)} className="crm-button-ghost">
          <Star className="h-4 w-4 mr-2" />
          Provide Feedback
        </Button>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="timeline" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="progress">Progress</TabsTrigger>
          <TabsTrigger value="issues">Issues</TabsTrigger>
          <TabsTrigger value="feedback">Feedback</TabsTrigger>
        </TabsList>

        {/* Timeline Tab */}
        <TabsContent value="timeline" className="space-y-4">
          <h2 className="text-2xl font-semibold">Project Timeline</h2>
          
          <div className="space-y-4">
            {project.phases.map((phase, index) => (
              <Card key={phase.id} className="glass-card">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        phase.status === 'completed' ? 'bg-success text-success-foreground' :
                        phase.status === 'in_progress' ? 'bg-primary text-primary-foreground' :
                        'bg-muted text-muted-foreground'
                      }`}>
                        {phase.status === 'completed' ? (
                          <CheckCircle className="h-5 w-5" />
                        ) : phase.status === 'in_progress' ? (
                          <Clock className="h-5 w-5" />
                        ) : (
                          <span className="text-sm font-bold">{index + 1}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold">{phase.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {phase.assignedDevelopers.length} developer(s) assigned
                      </p>
                      {phase.startDate && (
                        <p className="text-xs text-muted-foreground">
                          Started: {new Date(phase.startDate).toLocaleDateString()}
                        </p>
                      )}
                      {phase.endDate && (
                        <p className="text-xs text-muted-foreground">
                          Completed: {new Date(phase.endDate).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <Badge variant={
                      phase.status === 'completed' ? 'default' :
                      phase.status === 'in_progress' ? 'secondary' : 'outline'
                    }>
                      {phase.status.replace('_', ' ')}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Progress Tab */}
        <TabsContent value="progress" className="space-y-4">
          <h2 className="text-2xl font-semibold">Development Progress</h2>
          
          <div className="space-y-2">
            {progressLogs.length === 0 ? (
              <Card className="glass-card">
                <CardContent className="p-6 text-center">
                  <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No progress updates available yet</p>
                </CardContent>
              </Card>
            ) : (
              progressLogs
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .map((log) => {
                  const developers = DataService.getDevelopers();
                  const developer = developers.find(d => d.id === log.developerId);
                  
                  return (
                    <Card key={log.id} className="glass-card">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium">{developer?.name || 'Developer'}</h4>
                            <p className="text-sm mt-2">{log.shortUpdate}</p>
                          </div>
                          <div className="text-right">
                            <Badge variant="outline">{log.timeTracking}h logged</Badge>
                            <p className="text-xs text-muted-foreground mt-1">
                              {new Date(log.date).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
            )}
          </div>
        </TabsContent>

        {/* Issues Tab */}
        <TabsContent value="issues" className="space-y-4">
          <h2 className="text-2xl font-semibold">Issues & Queries</h2>
          
          <div className="space-y-2">
            {issues.length === 0 ? (
              <Card className="glass-card">
                <CardContent className="p-6 text-center">
                  <CheckCircle className="h-12 w-12 text-success mx-auto mb-4" />
                  <p className="text-muted-foreground">No issues reported</p>
                </CardContent>
              </Card>
            ) : (
              issues
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .map((issue) => (
                  <Card key={issue.id} className="glass-card">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">{issue.title}</h4>
                          <p className="text-sm mt-2">{issue.description}</p>
                        </div>
                        <div className="text-right space-y-1">
                          <Badge variant={
                            issue.type === 'bug' ? 'destructive' :
                            issue.type === 'blocker' ? 'destructive' : 'default'
                          }>
                            {issue.type}
                          </Badge>
                          <Badge variant={
                            issue.status === 'resolved' ? 'default' :
                            issue.status === 'in_progress' ? 'secondary' : 'outline'
                          }>
                            {issue.status.replace('_', ' ')}
                          </Badge>
                          <p className="text-xs text-muted-foreground">
                            {new Date(issue.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
            )}
          </div>
        </TabsContent>

        {/* Feedback Tab */}
        <TabsContent value="feedback" className="space-y-4">
          <h2 className="text-2xl font-semibold">My Feedback</h2>
          
          <div className="space-y-2">
            {feedback.length === 0 ? (
              <Card className="glass-card">
                <CardContent className="p-6 text-center">
                  <Star className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No feedback submitted yet</p>
                </CardContent>
              </Card>
            ) : (
              feedback
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .map((fb) => (
                  <Card key={fb.id} className="glass-card">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">{fb.phase}</h4>
                          <div className="flex items-center space-x-1 my-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star 
                                key={star} 
                                className={`h-4 w-4 ${star <= fb.rating ? 'text-warning fill-current' : 'text-muted-foreground'}`} 
                              />
                            ))}
                            <span className="text-sm text-muted-foreground ml-2">({fb.rating}/5)</span>
                          </div>
                          <p className="text-sm">{fb.comments}</p>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {new Date(fb.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Issue Report Modal */}
      {showReportIssue && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="glass-card w-full max-w-md">
            <CardHeader>
              <CardTitle>Report Issue</CardTitle>
              <CardDescription>Describe any issues or queries you have</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleReportIssue} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Issue Title</Label>
                  <Input id="title" name="title" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" name="description" required />
                </div>
                <div className="flex space-x-2">
                  <Button type="submit" className="crm-button-primary">Submit Issue</Button>
                  <Button type="button" variant="outline" onClick={() => setShowReportIssue(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Feedback Modal */}
      {showFeedback && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="glass-card w-full max-w-md">
            <CardHeader>
              <CardTitle>Provide Feedback</CardTitle>
              <CardDescription>Rate and comment on project phases</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmitFeedback} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="phase">Phase</Label>
                  <select id="phase" name="phase" className="w-full p-2 bg-input border border-border rounded-md" required>
                    <option value="">Select a phase</option>
                    {project.phases.map(phase => (
                      <option key={phase.id} value={phase.name}>{phase.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rating">Rating (1-5)</Label>
                  <select id="rating" name="rating" className="w-full p-2 bg-input border border-border rounded-md" required>
                    <option value="">Select rating</option>
                    <option value="5">5 - Excellent</option>
                    <option value="4">4 - Good</option>
                    <option value="3">3 - Average</option>
                    <option value="2">2 - Poor</option>
                    <option value="1">1 - Very Poor</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="comments">Comments</Label>
                  <Textarea id="comments" name="comments" required />
                </div>
                <div className="flex space-x-2">
                  <Button type="submit" className="crm-button-primary">Submit Feedback</Button>
                  <Button type="button" variant="outline" onClick={() => setShowFeedback(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}