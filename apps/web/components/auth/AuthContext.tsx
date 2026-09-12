'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export type UserRole = 'ADMIN' | 'TEACHER' | 'STUDENT' | 'PARENT';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatarUrl?: string;
  studentId?: string; // For parent linking
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password?: string, role?: UserRole) => Promise<boolean>;
  logout: () => void;
  switchRole: (role: UserRole) => void;
  registerStudent: (name: string, email: string, grade: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEMO_USERS: Record<UserRole, User> = {
  ADMIN: {
    id: 'admin-001',
    email: 'admin@remedial.edu',
    name: 'Dr. Sarah Connor (Administrator)',
    role: 'ADMIN',
  },
  TEACHER: {
    id: 'teacher-001',
    email: 'teacher@remedial.edu',
    name: 'Prof. Marcus Vance (Math Department)',
    role: 'TEACHER',
  },
  STUDENT: {
    id: 'student-001',
    email: 'student@remedial.edu',
    name: 'Alex Johnson (Grade 6 Student)',
    role: 'STUDENT',
  },
  PARENT: {
    id: 'parent-001',
    email: 'parent@remedial.edu',
    name: 'Eleanor Johnson (Parent of Alex)',
    role: 'PARENT',
    studentId: 'student-001',
  },
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // Restore session from localStorage on mount
    try {
      const storedUser = localStorage.getItem('remedial_user');
      const storedToken = localStorage.getItem('remedial_token');

      if (storedUser && storedToken) {
        setUser(JSON.parse(storedUser));
        setToken(storedToken);
      }
    } catch (error) {
      console.error('Failed to restore auth session:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password?: string, overrideRole?: UserRole): Promise<boolean> => {
    setIsLoading(true);

    try {
      // Determine role from override or email
      let role: UserRole = overrideRole || 'STUDENT';
      if (!overrideRole) {
        if (email.includes('admin')) role = 'ADMIN';
        else if (email.includes('teacher')) role = 'TEACHER';
        else if (email.includes('parent')) role = 'PARENT';
        else role = 'STUDENT';
      }

      const selectedUser = DEMO_USERS[role] || {
        id: `user-${Date.now()}`,
        email,
        name: email.split('@')[0].replace('.', ' ').toUpperCase(),
        role,
      };

      const demoToken = `mock_jwt_token_${selectedUser.role.toLowerCase()}_${Date.now()}`;

      setUser(selectedUser);
      setToken(demoToken);

      localStorage.setItem('remedial_user', JSON.stringify(selectedUser));
      localStorage.setItem('remedial_token', demoToken);

      return true;
    } catch (err) {
      console.error('Login error:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('remedial_user');
    localStorage.removeItem('remedial_token');
  };

  const switchRole = (role: UserRole) => {
    const newUser = DEMO_USERS[role];
    setUser(newUser);
    localStorage.setItem('remedial_user', JSON.stringify(newUser));
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout, switchRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
