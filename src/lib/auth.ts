export type UserRole = 'founder' | 'manager' | 'developer' | 'client';

export interface User {
  id: string;
  username: string;
  password: string; // In real app, this would be hashed
  role: UserRole;
  name: string;
  email?: string;
  createdAt: string;
  isActive: boolean;
  projectId?: string; // For client users
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}

const STORAGE_KEY = 'nightowl_crm_auth';

export class AuthService {
  static getCurrentUser(): User | null {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const authState: AuthState = JSON.parse(stored);
        return authState.user;
      }
    } catch (error) {
      console.error('Error getting current user:', error);
    }
    return null;
  }

  static isAuthenticated(): boolean {
    return this.getCurrentUser() !== null;
  }

  static hasRole(role: UserRole): boolean {
    const user = this.getCurrentUser();
    return user?.role === role || false;
  }

  static login(username: string, password: string): { success: boolean; user?: User; error?: string } {
    try {
      const users = this.getAllUsers();
      let user = users.find(u => u.username === username && u.password === password && u.isActive);
      
      // If not found in users, check if it's a client credential
      if (!user) {
        // Import DataService here to avoid circular dependency
        const stored = localStorage.getItem('nightowl_crm_projects');
        if (stored) {
          const projects = JSON.parse(stored);
          const project = projects.find((p: any) => 
            p.clientCredentials?.username === username && 
            p.status === 'active'
          );
          
          // Also check if password matches from the user accounts (created by manager)
          if (project && project.clientCredentials) {
            const clientUser = users.find(u => 
              u.username === username && 
              u.password === password && 
              u.role === 'client' && 
              u.isActive
            );
            
            if (clientUser) {
              user = clientUser;
            }
          }
        }
      }
      
      if (user) {
        const authState: AuthState = { user, isAuthenticated: true };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(authState));
        this.logActivity('login', `User ${username} logged in`);
        return { success: true, user };
      }
      
      return { success: false, error: 'Invalid credentials' };
    } catch (error) {
      return { success: false, error: 'Login failed' };
    }
  }

  static logout(): void {
    const user = this.getCurrentUser();
    if (user) {
      this.logActivity('logout', `User ${user.username} logged out`);
    }
    localStorage.removeItem(STORAGE_KEY);
  }

  static getAllUsers(): User[] {
    try {
      const stored = localStorage.getItem('nightowl_crm_users');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error getting users:', error);
    }
    
    // Initialize with default founder account
    const defaultUsers: User[] = [
      {
        id: 'founder-1',
        username: 'founder',
        password: 'founder123',
        role: 'founder',
        name: 'Founder Admin',
        email: 'founder@nightowlcrm.com',
        createdAt: new Date().toISOString(),
        isActive: true
      }
    ];
    
    this.saveUsers(defaultUsers);
    return defaultUsers;
  }

  static saveUsers(users: User[]): void {
    localStorage.setItem('nightowl_crm_users', JSON.stringify(users));
  }

  static createUser(userData: Omit<User, 'id' | 'createdAt'>): User {
    const users = this.getAllUsers();
    const newUser: User = {
      ...userData,
      id: `${userData.role}-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    
    users.push(newUser);
    this.saveUsers(users);
    this.logActivity('user_created', `New ${userData.role} created: ${userData.username}`);
    
    return newUser;
  }

  static logActivity(action: string, description: string): void {
    try {
      const logs = JSON.parse(localStorage.getItem('nightowl_crm_audit_logs') || '[]');
      const currentUser = this.getCurrentUser();
      
      logs.push({
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        userId: currentUser?.id || 'system',
        username: currentUser?.username || 'system',
        action,
        description,
        userRole: currentUser?.role || 'system'
      });
      
      // Keep only last 1000 logs
      if (logs.length > 1000) {
        logs.splice(0, logs.length - 1000);
      }
      
      localStorage.setItem('nightowl_crm_audit_logs', JSON.stringify(logs));
    } catch (error) {
      console.error('Error logging activity:', error);
    }
  }
}
