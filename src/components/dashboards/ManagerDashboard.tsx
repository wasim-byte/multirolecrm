import { useState, useEffect } from "react";
import { DataService, Project, Developer, ProgressLog, Issue } from "@/lib/data";
import { AuthService, User } from "@/lib/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Shield, 
  Users, 
  Code, 
  Activity, 
  Plus, 
  Clock,
  CheckCircle,
  AlertTriangle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function ManagerDashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [developers, setDevelopers] = useState<Developer[]>([]);
  const [progressLogs, setProgressLogs] = useState<ProgressLog[]>([]);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [showAddDeveloper, setShowAddDeveloper] = useState(false);
  const [showActivateProject, setShowActivateProject] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const { toast } = useToast();

  const currentUser = AuthService.getCurrentUser();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const allProjects = DataService.getProjects();
    const managerProjects = allProjects.filter(p => p.managerId === currentUser?.id);
    setProjects(managerProjects);
    
    const allDevelopers = DataService.getDevelopers();
    const managerDevelopers = allDevelopers.filter(d => d.managerId === currentUser?.id);
    setDevelopers(managerDevelopers);
    
    setProgressLogs(DataService.getProgressLogs());
    setIssues(DataService.getIssues());
  };

  const handleAddDeveloper = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    const formData = new FormData(e.target as HTMLFormElement);
    
    const developerData = {
      name: formData.get('name') as string,
      username: formData.get('username') as string,
      password: formData.get('password') as string,
      role: formData.get('role') as string,
      managerId: currentUser.id,
      projectIds: [],
      isActive: true,
      createdAt: new Date().toISOString()
    };

    // Create user account
    AuthService.createUser({
      ...developerData,
      role: 'developer',
      email: formData.get('email') as string || undefined,
      isActive: true
    });

    // Save developer record
    const developers = DataService.getDevelopers();
    developers.push({
      ...developerData,
      id: `dev-${Date.now()}`
    });
    DataService.saveDevelopers(developers);

    AuthService.logActivity('developer_added', `Developer added: ${developerData.name}`);
    
    setShowAddDeveloper(false);
    loadData();
    toast({
      title: "Developer Added",
      description: `${developerData.name} has been added as a developer.`,
    });
  };

  const assignDeveloperToProject = (projectId: string, developerId: string, phase: string) => {
    const allProjects = DataService.getProjects();
    const project = allProjects.find(p => p.id === projectId);
    
    if (project) {
      const phaseObj = project.phases.find(p => p.id === phase);
      if (phaseObj && !phaseObj.assignedDevelopers.includes(developerId)) {
        phaseObj.assignedDevelopers.push(developerId);
        DataService.saveProjects(allProjects);
        
        // Update developer's project list
        const allDevelopers = DataService.getDevelopers();
        const developer = allDevelopers.find(d => d.id === developerId);
        if (developer && !developer.projectIds.includes(projectId)) {
          developer.projectIds.push(projectId);
          DataService.saveDevelopers(allDevelopers);
        }
        
        AuthService.logActivity('developer_assigned', `Developer assigned to project ${projectId}`);
        loadData();
        toast({
          title: "Developer Assigned",
          description: "Developer has been assigned to the project phase.",
        });
      }
    }
  };

  const handleActivateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !selectedProject) return;

    const formData = new FormData(e.target as HTMLFormElement);
    
    const clientCredentials = {
      username: formData.get('clientUsername') as string,
      password: formData.get('clientPassword') as string,
      email: formData.get('clientEmail') as string,
      name: formData.get('clientName') as string,
    };

    // Create client user account
    AuthService.createUser({
      username: clientCredentials.username,
      password: clientCredentials.password,
      role: 'client',
      name: clientCredentials.name,
      email: clientCredentials.email,
      isActive: true
    });

    // Update project status to active
    const allProjects = DataService.getProjects();
    const project = allProjects.find(p => p.id === selectedProject.id);
    if (project) {
      project.status = 'active';
      project.clientCredentials = {
        username: clientCredentials.username,
        password: clientCredentials.password,
        email: clientCredentials.email,
        name: clientCredentials.name
      };
      DataService.saveProjects(allProjects);
    }

    AuthService.logActivity('project_activated', `Project activated for ${clientCredentials.name} with client portal access`);
    
    setShowActivateProject(false);
    setSelectedProject(null);
    loadData();
    toast({
      title: "Project Activated",
      description: `Client portal access created for ${clientCredentials.name}`,
    });
  };

  const stats = {
    totalProjects: projects.length,
    activeProjects: projects.filter(p => p.status === 'active').length,
    totalDevelopers: developers.length,
    activeDevelopers: developers.filter(d => d.isActive).length,
    openIssues: issues.filter(i => i.status === 'open').length,
    recentLogs: progressLogs.filter(log => {
      const logDate = new Date(log.date);
      const today = new Date();
      return logDate.toDateString() === today.toDateString();
    }).length
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-2">
        <Shield className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold gradient-text">Manager Dashboard</h1>
      </div>

      {/* KPI Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="metric-card">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Activity className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{stats.activeProjects}</p>
                <p className="text-sm text-muted-foreground">Active Projects</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="metric-card">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Code className="h-8 w-8 text-success" />
              <div>
                <p className="text-2xl font-bold">{stats.activeDevelopers}</p>
                <p className="text-sm text-muted-foreground">Active Developers</p>
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

        <Card className="metric-card">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Clock className="h-8 w-8 text-accent" />
              <div>
                <p className="text-2xl font-bold">{stats.recentLogs}</p>
                <p className="text-sm text-muted-foreground">Today's Updates</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="projects" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="developers">Developers</TabsTrigger>
          <TabsTrigger value="progress">Progress</TabsTrigger>
          <TabsTrigger value="issues">Issues</TabsTrigger>
        </TabsList>

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
                          {project.earnings && (
                            <p className="text-sm font-semibold text-success mt-2">
                              Budget: ${project.earnings.toLocaleString()}
                            </p>
                          )}
                        </div>
                        <Badge variant={
                          project.status === 'active' ? 'default' : 
                          project.status === 'delivered' ? 'secondary' : 'outline'
                        }>
                          {project.status}
                        </Badge>
                      </div>

                      {/* Project Phases */}
                      <div className="space-y-2">
                        <h4 className="font-medium">Project Phases</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {project.phases.map((phase) => (
                            <div key={phase.id} className="flex items-center justify-between p-3 bg-muted/30 rounded">
                              <div>
                                <p className="font-medium">{phase.name}</p>
                                <p className="text-sm text-muted-foreground">
                                  {phase.assignedDevelopers.length} developer(s) assigned
                                </p>
                              </div>
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

                      {/* Project Actions */}
                      <div className="flex items-center space-x-2 flex-wrap">
                        {project.status === 'pending' && (
                          <Button 
                            onClick={() => {
                              setSelectedProject(project);
                              setShowActivateProject(true);
                            }}
                            className="crm-button-primary"
                            size="sm"
                          >
                            Activate Project
                          </Button>
                        )}
                        
                        {project.status === 'active' && (
                          <select 
                            onChange={(e) => {
                              const [devId, phaseId] = e.target.value.split('|');
                              if (devId && phaseId) {
                                assignDeveloperToProject(project.id, devId, phaseId);
                                e.target.value = '';
                              }
                            }}
                            className="p-2 bg-input border border-border rounded-md text-sm"
                          >
                            <option value="">Assign developer to phase...</option>
                            {developers.filter(d => d.isActive).map(dev => (
                              project.phases.map(phase => (
                                <option key={`${dev.id}-${phase.id}`} value={`${dev.id}|${phase.id}`}>
                                  {dev.name} → {phase.name}
                                </option>
                              ))
                            ))}
                          </select>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Developers Tab */}
        <TabsContent value="developers" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold">Developer Management</h2>
            <Button onClick={() => setShowAddDeveloper(true)} className="crm-button-primary">
              <Plus className="h-4 w-4 mr-2" />
              Add Developer
            </Button>
          </div>

          {showAddDeveloper && (
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Add New Developer</CardTitle>
                <CardDescription>Create developer account with login credentials</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddDeveloper} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name *</Label>
                    <Input id="name" name="name" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" name="email" type="email" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="username">Username *</Label>
                    <Input id="username" name="username" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password *</Label>
                    <Input id="password" name="password" type="password" required />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="role">Specialization *</Label>
                    <select id="role" name="role" required className="w-full p-2 bg-input border border-border rounded-md">
                      <option value="">Select specialization</option>
                      <option value="UI/UX Developer">UI/UX Developer</option>
                      <option value="Frontend Developer">Frontend Developer</option>
                      <option value="Backend Developer">Backend Developer</option>
                      <option value="Full Stack Developer">Full Stack Developer</option>
                      <option value="AI/ML Developer">AI/ML Developer</option>
                      <option value="DevOps Engineer">DevOps Engineer</option>
                      <option value="R&D Specialist">R&D Specialist</option>
                    </select>
                  </div>
                  <div className="md:col-span-2 flex space-x-2">
                    <Button type="submit" className="crm-button-primary">Add Developer</Button>
                    <Button type="button" variant="outline" onClick={() => setShowAddDeveloper(false)}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {developers.map((developer) => (
              <Card key={developer.id} className="glass-card">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3">
                    <Code className="h-8 w-8 text-primary" />
                    <div>
                      <h3 className="font-semibold">{developer.name}</h3>
                      <p className="text-sm text-muted-foreground">@{developer.username}</p>
                      <p className="text-xs text-muted-foreground">{developer.role}</p>
                      <div className="flex items-center space-x-2 mt-2">
                        <Badge variant={developer.isActive ? 'default' : 'secondary'}>
                          {developer.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                        <Badge variant="outline">
                          {developer.projectIds.length} project(s)
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Progress Tab */}
        <TabsContent value="progress" className="space-y-4">
          <h2 className="text-2xl font-semibold">Developer Progress</h2>
          
          <div className="space-y-2">
            {progressLogs.length === 0 ? (
              <Card className="glass-card">
                <CardContent className="p-6 text-center">
                  <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No progress logs available</p>
                </CardContent>
              </Card>
            ) : (
              progressLogs
                .filter(log => {
                  const project = projects.find(p => p.id === log.projectId);
                  return project !== undefined;
                })
                .map((log) => {
                  const project = projects.find(p => p.id === log.projectId);
                  const developer = developers.find(d => d.id === log.developerId);
                  const client = DataService.getClients().find(c => c.id === project?.clientId);
                  
                  return (
                    <Card key={log.id} className="glass-card">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium">{developer?.name}</h4>
                            <p className="text-sm text-muted-foreground">{client?.company} Project</p>
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
          <h2 className="text-2xl font-semibold">Issues & Reports</h2>
          
          <div className="space-y-2">
            {issues
              .filter(issue => {
                const project = projects.find(p => p.id === issue.projectId);
                return project !== undefined;
              })
              .map((issue) => {
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

      {/* Activate Project Modal */}
      {showActivateProject && selectedProject && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="glass-card w-full max-w-md">
            <CardHeader>
              <CardTitle>Activate Project & Create Client Portal</CardTitle>
              <CardDescription>
                Create client credentials for {DataService.getClients().find(c => c.id === selectedProject.clientId)?.fullName}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleActivateProject} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="clientName">Client Full Name *</Label>
                  <Input 
                    id="clientName" 
                    name="clientName" 
                    defaultValue={DataService.getClients().find(c => c.id === selectedProject.clientId)?.fullName}
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clientEmail">Client Email *</Label>
                  <Input 
                    id="clientEmail" 
                    name="clientEmail" 
                    type="email"
                    defaultValue={DataService.getClients().find(c => c.id === selectedProject.clientId)?.email}
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clientUsername">Client Username *</Label>
                  <Input 
                    id="clientUsername" 
                    name="clientUsername"
                    placeholder="e.g., john_client"
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clientPassword">Client Password *</Label>
                  <Input 
                    id="clientPassword" 
                    name="clientPassword" 
                    type="password"
                    placeholder="Secure password for client portal"
                    required 
                  />
                </div>
                <div className="flex space-x-2">
                  <Button type="submit" className="crm-button-primary">
                    Activate Project
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      setShowActivateProject(false);
                      setSelectedProject(null);
                    }}
                  >
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