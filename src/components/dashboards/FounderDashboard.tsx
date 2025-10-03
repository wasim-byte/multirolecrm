import { useState, useEffect } from "react";
import { DataService, Client, Project } from "@/lib/data";
import { AuthService, User } from "@/lib/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Users, 
  UserCheck, 
  UserX, 
  UserPlus, 
  TrendingUp, 
  DollarSign,
  Activity,
  Plus,
  Crown,
  Shield,
  CheckCircle,
  Clock,
  Trash2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function FounderDashboard() {
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [managers, setManagers] = useState<User[]>([]);
  const [showAddClient, setShowAddClient] = useState(false);
  const [showAddManager, setShowAddManager] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    DataService.initializeSampleData();
    setClients(DataService.getClients());
    setProjects(DataService.getProjects());
    
    const allUsers = AuthService.getAllUsers();
    setManagers(allUsers.filter(u => u.role === 'manager'));
  };

  const stats = {
    totalClients: clients.length,
    validClients: clients.filter(c => c.status === 'valid').length,
    spamClients: clients.filter(c => c.status === 'spam').length,
    manualClients: clients.filter(c => c.source === 'manual').length,
    activeProjects: projects.filter(p => p.status === 'active').length,
    totalEarnings: projects.reduce((sum, p) => sum + (p.earnings || 0), 0)
  };

  const handleAddClient = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    
    const clientData = {
      fullName: formData.get('fullName') as string,
      email: formData.get('email') as string,
      phone: formData.get('phone') as string,
      company: formData.get('company') as string,
      website: formData.get('website') as string,
      servicesNeeded: formData.get('servicesNeeded') as string,
      projectDescription: formData.get('projectDescription') as string,
      companySummary: formData.get('companySummary') as string,
      source: 'manual' as const,
      status: 'valid' as const,
      isActive: true
    };

    const newClient = DataService.addClient(clientData);
    DataService.createProject(newClient.id);
    
    AuthService.logActivity('client_added', `Manual client added: ${clientData.fullName}`);
    
    setShowAddClient(false);
    loadData();
    toast({
      title: "Client Added",
      description: `${clientData.fullName} has been added successfully.`,
    });
  };

  const handleAddManager = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    
    const managerData = {
      name: formData.get('name') as string,
      username: formData.get('username') as string,
      password: formData.get('password') as string,
      role: 'manager' as const,
      email: formData.get('email') as string,
      isActive: true
    };

    AuthService.createUser(managerData);
    
    setShowAddManager(false);
    loadData();
    toast({
      title: "Manager Added",
      description: `${managerData.name} has been added as a manager.`,
    });
  };

  const handleActivateProject = (projectId: string, managerId: string, earnings: number, clientCredentials: { username: string; password: string; email: string; name: string }) => {
    DataService.activateProject(projectId, managerId, earnings, clientCredentials);
    AuthService.logActivity('project_activated', `Project ${projectId} activated with manager ${managerId}`);
    
    loadData();
    setSelectedProject(null);
    toast({
      title: "Project Activated",
      description: `Project activated! Client credentials: Username: ${clientCredentials.username}, Password: ${clientCredentials.password}`,
    });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-2">
        <Crown className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold gradient-text">Founder Dashboard</h1>
      </div>

      {/* KPI Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="metric-card">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Users className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{stats.totalClients}</p>
                <p className="text-sm text-muted-foreground">Total Clients</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="metric-card">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <UserCheck className="h-8 w-8 text-success" />
              <div>
                <p className="text-2xl font-bold">{stats.validClients}</p>
                <p className="text-sm text-muted-foreground">Valid Clients</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="metric-card">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <UserX className="h-8 w-8 text-destructive" />
              <div>
                <p className="text-2xl font-bold">{stats.spamClients}</p>
                <p className="text-sm text-muted-foreground">Spam Clients</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="metric-card">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-8 w-8 text-warning" />
              <div>
                <p className="text-2xl font-bold">${stats.totalEarnings.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Total Earnings</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="clients" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="clients">Clients</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="managers">Managers</TabsTrigger>
          <TabsTrigger value="audit">Audit Logs</TabsTrigger>
        </TabsList>

        {/* Clients Tab */}
        <TabsContent value="clients" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold">Client Management</h2>
            <Button onClick={() => setShowAddClient(true)} className="crm-button-primary">
              <Plus className="h-4 w-4 mr-2" />
              Add Client
            </Button>
          </div>

          {showAddClient && (
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Add New Client</CardTitle>
                <CardDescription>Enter client details to add them manually</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddClient} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name *</Label>
                    <Input id="fullName" name="fullName" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input id="email" name="email" type="email" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone *</Label>
                    <Input id="phone" name="phone" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company">Company *</Label>
                    <Input id="company" name="company" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="website">Website</Label>
                    <Input id="website" name="website" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="servicesNeeded">Services Needed *</Label>
                    <Input id="servicesNeeded" name="servicesNeeded" required />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="projectDescription">Project Description *</Label>
                    <Textarea id="projectDescription" name="projectDescription" required />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="companySummary">Company Summary</Label>
                    <Textarea id="companySummary" name="companySummary" />
                  </div>
                  <div className="md:col-span-2 flex space-x-2">
                    <Button type="submit" className="crm-button-primary">Add Client</Button>
                    <Button type="button" variant="outline" onClick={() => setShowAddClient(false)}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 gap-4">
            {clients.map((client) => (
              <Card key={client.id} className="glass-card">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-semibold">{client.fullName}</h3>
                      <p className="text-muted-foreground">{client.company}</p>
                      <p className="text-sm">{client.email} • {client.phone}</p>
                      <p className="text-sm text-muted-foreground mt-2">{client.projectDescription}</p>
                    </div>
                    <div className="text-right space-y-2">
                      <Badge variant={client.status === 'valid' ? 'default' : 'destructive'}>
                        {client.status}
                      </Badge>
                      <Badge variant="outline">
                        {client.source}
                      </Badge>
                      <p className="text-xs text-muted-foreground">
                        {new Date(client.submittedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Projects Tab */}
        <TabsContent value="projects" className="space-y-4">
          <h2 className="text-2xl font-semibold">Project Management</h2>
          
          <div className="grid grid-cols-1 gap-4">
            {projects.map((project) => {
              const client = clients.find(c => c.id === project.clientId);
              const manager = managers.find(m => m.id === project.managerId);
              
              return (
                <Card key={project.id} className="glass-card">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-semibold">{client?.fullName} - {client?.company}</h3>
                        <p className="text-muted-foreground">{client?.projectDescription}</p>
                        {manager && (
                          <p className="text-sm mt-2">Manager: {manager.name}</p>
                        )}
                        {project.earnings && (
                          <p className="text-sm font-semibold text-success">
                            Earnings: ${project.earnings.toLocaleString()}
                          </p>
                        )}
                      </div>
                      <div className="text-right space-y-2">
                        <Badge variant={
                          project.status === 'active' ? 'default' : 
                          project.status === 'delivered' ? 'secondary' : 'outline'
                        }>
                          {project.status}
                        </Badge>
                        {project.status === 'pending' && (
                          <div>
                            <Button 
                              size="sm" 
                              onClick={() => setSelectedProject(project)}
                              className="crm-button-primary"
                            >
                              Activate
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Managers Tab */}
        <TabsContent value="managers" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold">Manager Management</h2>
            <Button onClick={() => setShowAddManager(true)} className="crm-button-primary">
              <Plus className="h-4 w-4 mr-2" />
              Add Manager
            </Button>
          </div>

          {showAddManager && (
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Add New Manager</CardTitle>
                <CardDescription>Create manager account with login credentials</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddManager} className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <div className="md:col-span-2 flex space-x-2">
                    <Button type="submit" className="crm-button-primary">Add Manager</Button>
                    <Button type="button" variant="outline" onClick={() => setShowAddManager(false)}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {managers.map((manager) => (
              <Card key={manager.id} className="glass-card">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3">
                    <Shield className="h-8 w-8 text-primary" />
                    <div>
                      <h3 className="font-semibold">{manager.name}</h3>
                      <p className="text-sm text-muted-foreground">@{manager.username}</p>
                      {manager.email && (
                        <p className="text-xs text-muted-foreground">{manager.email}</p>
                      )}
                      <Badge variant={manager.isActive ? 'default' : 'secondary'} className="mt-2">
                        {manager.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Audit Logs Tab */}
        <TabsContent value="audit" className="space-y-4">
          <h2 className="text-2xl font-semibold">Audit Trail</h2>
          <AuditLogsView />
        </TabsContent>
      </Tabs>

      {/* Project Activation Modal */}
      {selectedProject && (
        <ProjectActivationModal
          project={selectedProject}
          managers={managers}
          onActivate={handleActivateProject}
          onClose={() => setSelectedProject(null)}
        />
      )}
    </div>
  );
}

// Audit Logs Component
function AuditLogsView() {
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    const auditLogs = JSON.parse(localStorage.getItem('nightowl_crm_audit_logs') || '[]');
    setLogs(auditLogs.reverse()); // Show newest first
  }, []);

  return (
    <div className="space-y-2">
      {logs.length === 0 ? (
        <Card className="glass-card">
          <CardContent className="p-6 text-center">
            <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No audit logs available</p>
          </CardContent>
        </Card>
      ) : (
        logs.map((log) => (
          <Card key={log.id} className="glass-card">
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium">{log.description}</p>
                  <p className="text-sm text-muted-foreground">
                    {log.username} ({log.userRole})
                  </p>
                </div>
                <div className="text-right">
                  <Badge variant="outline">{log.action}</Badge>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(log.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}

// Project Activation Modal Component
function ProjectActivationModal({ 
  project, 
  managers, 
  onActivate, 
  onClose 
}: { 
  project: Project; 
  managers: User[]; 
  onActivate: (projectId: string, managerId: string, earnings: number, clientCredentials: { username: string; password: string; email: string; name: string }) => void; 
  onClose: () => void; 
}) {
  const [selectedManager, setSelectedManager] = useState('');
  const [earnings, setEarnings] = useState('');
  const [clientUsername, setClientUsername] = useState('');
  const [clientPassword, setClientPassword] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientName, setClientName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedManager && earnings && clientUsername && clientPassword && clientEmail && clientName) {
      onActivate(project.id, selectedManager, parseFloat(earnings), {
        username: clientUsername,
        password: clientPassword,
        email: clientEmail,
        name: clientName
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <Card className="w-full max-w-lg mx-4 glass-card max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle>Activate Project</CardTitle>
          <CardDescription>Assign manager, set earnings, and create client credentials</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="manager">Select Manager *</Label>
              <select 
                id="manager"
                value={selectedManager} 
                onChange={(e) => setSelectedManager(e.target.value)}
                className="w-full p-2 rounded-md border border-input bg-background"
                required
              >
                <option value="">Select a manager</option>
                {managers.filter(m => m.isActive).map(manager => (
                  <option key={manager.id} value={manager.id}>
                    {manager.name} (@{manager.username})
                  </option>
                ))}
              </select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="earnings">Project Earnings ($) *</Label>
              <Input
                id="earnings"
                type="number"
                value={earnings}
                onChange={(e) => setEarnings(e.target.value)}
                placeholder="5000"
                required
              />
            </div>
            
            <div className="border-t pt-4">
              <h4 className="font-semibold mb-3 text-primary">Client Portal Credentials</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="clientName">Client Name *</Label>
                  <Input
                    id="clientName"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="John Doe"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="clientEmail">Client Email *</Label>
                  <Input
                    id="clientEmail"
                    type="email"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    placeholder="john@company.com"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="clientUsername">Client Username *</Label>
                  <Input
                    id="clientUsername"
                    value={clientUsername}
                    onChange={(e) => setClientUsername(e.target.value)}
                    placeholder="johndoe"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="clientPassword">Client Password *</Label>
                  <Input
                    id="clientPassword"
                    type="password"
                    value={clientPassword}
                    onChange={(e) => setClientPassword(e.target.value)}
                    placeholder="secure123"
                    required
                  />
                </div>
              </div>
            </div>
            
            <div className="flex space-x-2 pt-4">
              <Button type="submit" className="crm-button-primary flex-1">
                Activate Project
              </Button>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}