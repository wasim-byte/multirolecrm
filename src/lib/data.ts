export interface Client {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  company: string;
  website?: string;
  servicesNeeded: string;
  projectDescription: string;
  companySummary?: string;
  source: 'webhook' | 'manual';
  sourceId?: string;
  status: 'valid' | 'spam';
  submittedAt: string;
  isActive: boolean;
}

export interface Project {
  id: string;
  clientId: string;
  managerId?: string;
  status: 'pending' | 'active' | 'delivered';
  earnings?: number;
  assignedAt?: string;
  deliveredAt?: string;
  phases: ProjectPhase[];
  createdAt: string;
  clientCredentials?: {
    username: string;
    password: string;
    email: string;
    name: string;
  };
}

export interface ProjectPhase {
  id: string;
  name: string;
  status: 'not_started' | 'in_progress' | 'completed';
  assignedDevelopers: string[];
  startDate?: string;
  endDate?: string;
}

export interface Developer {
  id: string;
  name: string;
  username: string;
  password: string;
  role: string; // UI, AI/ML, R&D, etc.
  managerId: string;
  projectIds: string[];
  isActive: boolean;
  createdAt: string;
}

export interface Task {
  id: string;
  projectId: string;
  developerId: string;
  title: string;
  description: string;
  status: 'todo' | 'in_progress' | 'done';
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
  updatedAt: string;
}

export interface ProgressLog {
  id: string;
  projectId: string;
  developerId: string;
  shortUpdate: string;
  timeTracking: number; // hours
  date: string;
  createdAt: string;
}

export interface Issue {
  id: string;
  projectId: string;
  reporterId: string;
  type: 'bug' | 'blocker' | 'query';
  title: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved';
  attachments?: string[];
  createdAt: string;
  resolvedAt?: string;
}

export interface Message {
  id: string;
  fromUserId: string;
  toUserId: string;
  projectId?: string;
  subject: string;
  content: string;
  isRead: boolean;
  createdAt: string;
}

export class DataService {
  // Clients
  static getClients(): Client[] {
    const stored = localStorage.getItem('nightowl_crm_clients');
    return stored ? JSON.parse(stored) : [];
  }

  static saveClients(clients: Client[]): void {
    localStorage.setItem('nightowl_crm_clients', JSON.stringify(clients));
  }

  static addClient(clientData: Omit<Client, 'id' | 'submittedAt'>): Client {
    const clients = this.getClients();
    const newClient: Client = {
      ...clientData,
      id: `client-${Date.now()}`,
      submittedAt: new Date().toISOString()
    };
    
    clients.push(newClient);
    this.saveClients(clients);
    return newClient;
  }

  // Projects
  static getProjects(): Project[] {
    const stored = localStorage.getItem('nightowl_crm_projects');
    return stored ? JSON.parse(stored) : [];
  }

  static saveProjects(projects: Project[]): void {
    localStorage.setItem('nightowl_crm_projects', JSON.stringify(projects));
  }

  static createProject(clientId: string): Project {
    const projects = this.getProjects();
    const newProject: Project = {
      id: `project-${Date.now()}`,
      clientId,
      status: 'pending',
      phases: [
        { id: 'phase-1', name: 'Phase 1', status: 'not_started', assignedDevelopers: [] },
        { id: 'phase-2', name: 'Phase 2', status: 'not_started', assignedDevelopers: [] },
        { id: 'phase-3', name: 'Phase 3', status: 'not_started', assignedDevelopers: [] },
        { id: 'phase-4', name: 'Phase 4', status: 'not_started', assignedDevelopers: [] }
      ],
      createdAt: new Date().toISOString()
    };
    
    projects.push(newProject);
    this.saveProjects(projects);
    return newProject;
  }

  static activateProject(projectId: string, managerId: string, earnings: number, clientCredentials: { username: string; password: string; email: string; name: string }): void {
    const projects = this.getProjects();
    const project = projects.find(p => p.id === projectId);
    if (project) {
      project.status = 'active';
      project.managerId = managerId;
      project.earnings = earnings;
      project.assignedAt = new Date().toISOString();
      project.clientCredentials = clientCredentials;
      this.saveProjects(projects);
      
      // Create client user in auth system
      // Use setTimeout to avoid circular import issues
      setTimeout(() => {
        const { AuthService } = require('../lib/auth');
        AuthService.createUser({
          name: clientCredentials.name,
          username: clientCredentials.username,
          password: clientCredentials.password,
          email: clientCredentials.email,
          role: 'client',
          isActive: true,
          projectId: projectId
        });
      }, 0);
    }
  }

  // Developers
  static getDevelopers(): Developer[] {
    const stored = localStorage.getItem('nightowl_crm_developers');
    return stored ? JSON.parse(stored) : [];
  }

  static saveDevelopers(developers: Developer[]): void {
    localStorage.setItem('nightowl_crm_developers', JSON.stringify(developers));
  }

  // Tasks
  static getTasks(): Task[] {
    const stored = localStorage.getItem('nightowl_crm_tasks');
    return stored ? JSON.parse(stored) : [];
  }

  static saveTasks(tasks: Task[]): void {
    localStorage.setItem('nightowl_crm_tasks', JSON.stringify(tasks));
  }

  // Progress Logs
  static getProgressLogs(): ProgressLog[] {
    const stored = localStorage.getItem('nightowl_crm_progress_logs');
    return stored ? JSON.parse(stored) : [];
  }

  static saveProgressLogs(logs: ProgressLog[]): void {
    localStorage.setItem('nightowl_crm_progress_logs', JSON.stringify(logs));
  }

  // Issues
  static getIssues(): Issue[] {
    const stored = localStorage.getItem('nightowl_crm_issues');
    return stored ? JSON.parse(stored) : [];
  }

  static saveIssues(issues: Issue[]): void {
    localStorage.setItem('nightowl_crm_issues', JSON.stringify(issues));
  }

  // Messages
  static getMessages(): Message[] {
    const stored = localStorage.getItem('nightowl_crm_messages');
    return stored ? JSON.parse(stored) : [];
  }

  static saveMessages(messages: Message[]): void {
    localStorage.setItem('nightowl_crm_messages', JSON.stringify(messages));
  }

  static sendMessage(messageData: Omit<Message, 'id' | 'createdAt' | 'isRead'>): Message {
    const messages = this.getMessages();
    const newMessage: Message = {
      ...messageData,
      id: `msg-${Date.now()}`,
      isRead: false,
      createdAt: new Date().toISOString()
    };
    
    messages.push(newMessage);
    this.saveMessages(messages);
    return newMessage;
  }

  // Generate sample data for demo
  static initializeSampleData(): void {
    if (this.getClients().length === 0) {
      // Add sample clients
      const sampleClients: Omit<Client, 'id' | 'submittedAt'>[] = [
        {
          fullName: "John Smith",
          email: "john@techcorp.com",
          phone: "+1-555-0123",
          company: "TechCorp Inc",
          website: "https://techcorp.com",
          servicesNeeded: "Web Development, Mobile App",
          projectDescription: "E-commerce platform with mobile app",
          companySummary: "Leading technology solutions provider",
          source: "webhook",
          sourceId: "webhook-123",
          status: "valid",
          isActive: true
        },
        {
          fullName: "Sarah Johnson",
          email: "sarah@startup.io",
          phone: "+1-555-0456",
          company: "Startup Solutions",
          servicesNeeded: "AI/ML Development",
          projectDescription: "Machine learning dashboard for analytics",
          source: "manual",
          status: "valid",
          isActive: true
        }
      ];

      sampleClients.forEach(client => this.addClient(client));
      
      // Create projects for sample clients
      const clients = this.getClients();
      clients.forEach(client => this.createProject(client.id));
    }
  }
}