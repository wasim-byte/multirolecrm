import { useState, useEffect } from "react";
import { DataService, Project, Task, ProgressLog, Issue } from "@/lib/data";
import { AuthService } from "@/lib/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Code, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  Plus,
  Play,
  Pause,
  RotateCcw
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function DeveloperDashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [progressLogs, setProgressLogs] = useState<ProgressLog[]>([]);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [showAddTask, setShowAddTask] = useState(false);
  const [showLogProgress, setShowLogProgress] = useState(false);
  const [showReportIssue, setShowReportIssue] = useState(false);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const { toast } = useToast();

  const currentUser = AuthService.getCurrentUser();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    if (!currentUser) return;

    // Get developer record
    const developers = DataService.getDevelopers();
    const developerRecord = developers.find(d => d.username === currentUser.username);
    
    if (developerRecord) {
      // Get assigned projects
      const allProjects = DataService.getProjects();
      const assignedProjects = allProjects.filter(project => 
        project.phases.some(phase => 
          phase.assignedDevelopers.includes(developerRecord.id)
        )
      );
      setProjects(assignedProjects);
      
      // Get tasks for assigned projects
      const allTasks = DataService.getTasks();
      const myTasks = allTasks.filter(task => 
        task.developerId === developerRecord.id ||
        assignedProjects.some(p => p.id === task.projectId)
      );
      setTasks(myTasks);
      
      // Get progress logs
      const allLogs = DataService.getProgressLogs();
      const myLogs = allLogs.filter(log => log.developerId === developerRecord.id);
      setProgressLogs(myLogs);
      
      // Get issues
      const allIssues = DataService.getIssues();
      const projectIssues = allIssues.filter(issue => 
        assignedProjects.some(p => p.id === issue.projectId)
      );
      setIssues(projectIssues);
    }
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !selectedProject) return;

    const formData = new FormData(e.target as HTMLFormElement);
    const developers = DataService.getDevelopers();
    const developerRecord = developers.find(d => d.username === currentUser.username);
    
    if (!developerRecord) return;

    const taskData = {
      id: `task-${Date.now()}`,
      projectId: selectedProject,
      developerId: developerRecord.id,
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      status: 'todo' as const,
      priority: formData.get('priority') as 'low' | 'medium' | 'high',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const allTasks = DataService.getTasks();
    allTasks.push(taskData);
    DataService.saveTasks(allTasks);

    AuthService.logActivity('task_created', `Task created: ${taskData.title}`);
    
    setShowAddTask(false);
    setSelectedProject('');
    loadData();
    toast({
      title: "Task Created",
      description: `Task "${taskData.title}" has been added.`,
    });
  };

  const handleLogProgress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !selectedProject) return;

    const formData = new FormData(e.target as HTMLFormElement);
    const developers = DataService.getDevelopers();
    const developerRecord = developers.find(d => d.username === currentUser.username);
    
    if (!developerRecord) return;

    const logData = {
      id: `log-${Date.now()}`,
      projectId: selectedProject,
      developerId: developerRecord.id,
      shortUpdate: formData.get('shortUpdate') as string,
      timeTracking: parseFloat(formData.get('timeTracking') as string),
      date: formData.get('date') as string,
      createdAt: new Date().toISOString()
    };

    const allLogs = DataService.getProgressLogs();
    allLogs.push(logData);
    DataService.saveProgressLogs(allLogs);

    AuthService.logActivity('progress_logged', `Progress logged for project ${selectedProject}`);
    
    setShowLogProgress(false);
    setSelectedProject('');
    loadData();
    toast({
      title: "Progress Logged",
      description: "Your progress update has been recorded.",
    });
  };

  const handleReportIssue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !selectedProject) return;

    const formData = new FormData(e.target as HTMLFormElement);
    const developers = DataService.getDevelopers();
    const developerRecord = developers.find(d => d.username === currentUser.username);
    
    if (!developerRecord) return;

    const issueData = {
      id: `issue-${Date.now()}`,
      projectId: selectedProject,
      reporterId: developerRecord.id,
      type: formData.get('type') as 'bug' | 'blocker' | 'query',
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      status: 'open' as const,
      createdAt: new Date().toISOString()
    };

    const allIssues = DataService.getIssues();
    allIssues.push(issueData);
    DataService.saveIssues(allIssues);

    AuthService.logActivity('issue_reported', `Issue reported: ${issueData.title}`);
    
    setShowReportIssue(false);
    setSelectedProject('');
    loadData();
    toast({
      title: "Issue Reported",
      description: `Issue "${issueData.title}" has been reported.`,
    });
  };

  const updateTaskStatus = (taskId: string, newStatus: 'todo' | 'in_progress' | 'done') => {
    const allTasks = DataService.getTasks();
    const task = allTasks.find(t => t.id === taskId);
    
    if (task) {
      task.status = newStatus;
      task.updatedAt = new Date().toISOString();
      DataService.saveTasks(allTasks);
      
      AuthService.logActivity('task_updated', `Task status updated: ${task.title} → ${newStatus}`);
      loadData();
      toast({
        title: "Task Updated",
        description: `Task moved to ${newStatus.replace('_', ' ')}.`,
      });
    }
  };

  const stats = {
    totalProjects: projects.length,
    totalTasks: tasks.length,
    todoTasks: tasks.filter(t => t.status === 'todo').length,
    inProgressTasks: tasks.filter(t => t.status === 'in_progress').length,
    completedTasks: tasks.filter(t => t.status === 'done').length,
    totalHours: progressLogs.reduce((sum, log) => sum + log.timeTracking, 0),
    openIssues: issues.filter(i => i.status === 'open').length
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-2">
        <Code className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold gradient-text">Developer Dashboard</h1>
      </div>

      {/* KPI Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="metric-card">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Code className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{stats.totalProjects}</p>
                <p className="text-sm text-muted-foreground">Assigned Projects</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="metric-card">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-8 w-8 text-success" />
              <div>
                <p className="text-2xl font-bold">{stats.completedTasks}</p>
                <p className="text-sm text-muted-foreground">Completed Tasks</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="metric-card">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Clock className="h-8 w-8 text-accent" />
              <div>
                <p className="text-2xl font-bold">{stats.totalHours}</p>
                <p className="text-sm text-muted-foreground">Hours Logged</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="metric-card">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-8 w-8 text-warning" />
              <div>
                <p className="text-2xl font-bold">{stats.openIssues}</p>
                <p className="text-sm text-muted-foreground">Open Issues</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => setShowAddTask(true)} className="crm-button-primary">
          <Plus className="h-4 w-4 mr-2" />
          Add Task
        </Button>
        <Button onClick={() => setShowLogProgress(true)} className="crm-button-ghost">
          <Clock className="h-4 w-4 mr-2" />
          Log Progress
        </Button>
        <Button onClick={() => setShowReportIssue(true)} className="crm-button-ghost">
          <AlertTriangle className="h-4 w-4 mr-2" />
          Report Issue
        </Button>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="tasks" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="tasks">Task Board</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="progress">Progress</TabsTrigger>
          <TabsTrigger value="issues">Issues</TabsTrigger>
        </TabsList>

        {/* Task Board Tab */}
        <TabsContent value="tasks" className="space-y-4">
          <h2 className="text-2xl font-semibold">Task Board</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* To Do Column */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <RotateCcw className="h-5 w-5" />
                  <span>To Do ({stats.todoTasks})</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {tasks.filter(t => t.status === 'todo').map(task => (
                  <TaskCard 
                    key={task.id} 
                    task={task} 
                    onUpdateStatus={updateTaskStatus}
                    projects={projects}
                  />
                ))}
              </CardContent>
            </Card>

            {/* In Progress Column */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Play className="h-5 w-5" />
                  <span>In Progress ({stats.inProgressTasks})</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {tasks.filter(t => t.status === 'in_progress').map(task => (
                  <TaskCard 
                    key={task.id} 
                    task={task} 
                    onUpdateStatus={updateTaskStatus}
                    projects={projects}
                  />
                ))}
              </CardContent>
            </Card>

            {/* Done Column */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5" />
                  <span>Done ({stats.completedTasks})</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {tasks.filter(t => t.status === 'done').map(task => (
                  <TaskCard 
                    key={task.id} 
                    task={task} 
                    onUpdateStatus={updateTaskStatus}
                    projects={projects}
                  />
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Projects Tab */}
        <TabsContent value="projects" className="space-y-4">
          <h2 className="text-2xl font-semibold">Assigned Projects</h2>
          
          <div className="grid grid-cols-1 gap-4">
            {projects.map((project) => {
              const clients = DataService.getClients();
              const client = clients.find(c => c.id === project.clientId);
              
              return (
                <Card key={project.id} className="glass-card">
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-lg font-semibold">{client?.fullName} - {client?.company}</h3>
                          <p className="text-muted-foreground">{client?.projectDescription}</p>
                        </div>
                        <Badge variant={
                          project.status === 'active' ? 'default' : 
                          project.status === 'delivered' ? 'secondary' : 'outline'
                        }>
                          {project.status}
                        </Badge>
                      </div>

                      {/* My Phases */}
                      <div className="space-y-2">
                        <h4 className="font-medium">My Assigned Phases</h4>
                        {project.phases
                          .filter(phase => {
                            const developers = DataService.getDevelopers();
                            const myDev = developers.find(d => d.username === currentUser?.username);
                            return myDev && phase.assignedDevelopers.includes(myDev.id);
                          })
                          .map((phase) => (
                            <div key={phase.id} className="flex items-center justify-between p-3 bg-muted/30 rounded">
                              <p className="font-medium">{phase.name}</p>
                              <Badge variant={
                                phase.status === 'completed' ? 'default' :
                                phase.status === 'in_progress' ? 'secondary' : 'outline'
                              }>
                                {phase.status.replace('_', ' ')}
                              </Badge>
                            </div>
                          ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Progress Tab */}
        <TabsContent value="progress" className="space-y-4">
          <h2 className="text-2xl font-semibold">My Progress Logs</h2>
          
          <div className="space-y-2">
            {progressLogs.map((log) => {
              const project = projects.find(p => p.id === log.projectId);
              const client = DataService.getClients().find(c => c.id === project?.clientId);
              
              return (
                <Card key={log.id} className="glass-card">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium">{client?.company} Project</h4>
                        <p className="text-sm mt-2">{log.shortUpdate}</p>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline">{log.timeTracking}h</Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(log.date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Issues Tab */}
        <TabsContent value="issues" className="space-y-4">
          <h2 className="text-2xl font-semibold">Project Issues</h2>
          
          <div className="space-y-2">
            {issues.map((issue) => {
              const project = projects.find(p => p.id === issue.projectId);
              const client = DataService.getClients().find(c => c.id === project?.clientId);
              
              return (
                <Card key={issue.id} className="glass-card">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium">{issue.title}</h4>
                        <p className="text-sm text-muted-foreground">{client?.company} Project</p>
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
              );
            })}
          </div>
        </TabsContent>
      </Tabs>

      {/* Modals */}
      {showAddTask && (
        <TaskModal
          title="Add New Task"
          projects={projects}
          onSubmit={handleAddTask}
          onClose={() => setShowAddTask(false)}
          selectedProject={selectedProject}
          setSelectedProject={setSelectedProject}
        />
      )}

      {showLogProgress && (
        <ProgressModal
          projects={projects}
          onSubmit={handleLogProgress}
          onClose={() => setShowLogProgress(false)}
          selectedProject={selectedProject}
          setSelectedProject={setSelectedProject}
        />
      )}

      {showReportIssue && (
        <IssueModal
          projects={projects}
          onSubmit={handleReportIssue}
          onClose={() => setShowReportIssue(false)}
          selectedProject={selectedProject}
          setSelectedProject={setSelectedProject}
        />
      )}
    </div>
  );
}

// Task Card Component
function TaskCard({ 
  task, 
  onUpdateStatus, 
  projects 
}: { 
  task: Task; 
  onUpdateStatus: (taskId: string, status: 'todo' | 'in_progress' | 'done') => void;
  projects: Project[];
}) {
  const project = projects.find(p => p.id === task.projectId);
  const client = DataService.getClients().find(c => c.id === project?.clientId);

  return (
    <Card className="glass-card border-border/30">
      <CardContent className="p-3">
        <div className="space-y-2">
          <h4 className="font-medium text-sm">{task.title}</h4>
          <p className="text-xs text-muted-foreground">{client?.company}</p>
          <p className="text-xs">{task.description}</p>
          <div className="flex items-center justify-between">
            <Badge variant={
              task.priority === 'high' ? 'destructive' :
              task.priority === 'medium' ? 'secondary' : 'outline'
            } className="text-xs">
              {task.priority}
            </Badge>
            <div className="flex space-x-1">
              {task.status !== 'todo' && (
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => onUpdateStatus(task.id, 'todo')}
                  className="p-1 h-6 w-6"
                >
                  <RotateCcw className="h-3 w-3" />
                </Button>
              )}
              {task.status !== 'in_progress' && (
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => onUpdateStatus(task.id, 'in_progress')}
                  className="p-1 h-6 w-6"
                >
                  <Play className="h-3 w-3" />
                </Button>
              )}
              {task.status !== 'done' && (
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => onUpdateStatus(task.id, 'done')}
                  className="p-1 h-6 w-6"
                >
                  <CheckCircle className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Modal Components
function TaskModal({ title, projects, onSubmit, onClose, selectedProject, setSelectedProject }: any) {
  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="glass-card w-full max-w-md">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="project">Project</Label>
              <select 
                id="project" 
                value={selectedProject} 
                onChange={(e) => setSelectedProject(e.target.value)}
                className="w-full p-2 bg-input border border-border rounded-md"
                required
              >
                <option value="">Select a project</option>
                {projects.map((project: Project) => {
                  const client = DataService.getClients().find(c => c.id === project.clientId);
                  return (
                    <option key={project.id} value={project.id}>
                      {client?.company} Project
                    </option>
                  );
                })}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="title">Task Title</Label>
              <Input id="title" name="title" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" name="description" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <select id="priority" name="priority" className="w-full p-2 bg-input border border-border rounded-md" required>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div className="flex space-x-2">
              <Button type="submit" className="crm-button-primary">Add Task</Button>
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function ProgressModal({ projects, onSubmit, onClose, selectedProject, setSelectedProject }: any) {
  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="glass-card w-full max-w-md">
        <CardHeader>
          <CardTitle>Log Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="project">Project</Label>
              <select 
                id="project" 
                value={selectedProject} 
                onChange={(e) => setSelectedProject(e.target.value)}
                className="w-full p-2 bg-input border border-border rounded-md"
                required
              >
                <option value="">Select a project</option>
                {projects.map((project: Project) => {
                  const client = DataService.getClients().find(c => c.id === project.clientId);
                  return (
                    <option key={project.id} value={project.id}>
                      {client?.company} Project
                    </option>
                  );
                })}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="shortUpdate">Short Update</Label>
              <Textarea id="shortUpdate" name="shortUpdate" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="timeTracking">Time Spent (hours)</Label>
              <Input id="timeTracking" name="timeTracking" type="number" step="0.5" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input id="date" name="date" type="date" defaultValue={new Date().toISOString().split('T')[0]} required />
            </div>
            <div className="flex space-x-2">
              <Button type="submit" className="crm-button-primary">Log Progress</Button>
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function IssueModal({ projects, onSubmit, onClose, selectedProject, setSelectedProject }: any) {
  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="glass-card w-full max-w-md">
        <CardHeader>
          <CardTitle>Report Issue</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="project">Project</Label>
              <select 
                id="project" 
                value={selectedProject} 
                onChange={(e) => setSelectedProject(e.target.value)}
                className="w-full p-2 bg-input border border-border rounded-md"
                required
              >
                <option value="">Select a project</option>
                {projects.map((project: Project) => {
                  const client = DataService.getClients().find(c => c.id === project.clientId);
                  return (
                    <option key={project.id} value={project.id}>
                      {client?.company} Project
                    </option>
                  );
                })}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Issue Type</Label>
              <select id="type" name="type" className="w-full p-2 bg-input border border-border rounded-md" required>
                <option value="bug">Bug</option>
                <option value="blocker">Blocker</option>
                <option value="query">Query</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="title">Issue Title</Label>
              <Input id="title" name="title" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" name="description" required />
            </div>
            <div className="flex space-x-2">
              <Button type="submit" className="crm-button-primary">Report Issue</Button>
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}