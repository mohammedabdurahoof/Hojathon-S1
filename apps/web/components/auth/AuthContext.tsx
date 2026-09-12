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
      let role: UserRole = overrideRole || 'STUDENT';
      if (!overrideRole) {
        if (email.toLowerCase().includes('admin')) role = 'ADMIN';
        else if (email.toLowerCase().includes('teacher')) role = 'TEACHER';
        else if (email.toLowerCase().includes('parent')) role = 'PARENT';
        else role = 'STUDENT';
      }

      const formattedName = email.split('@')[0].split('.').map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join(' ');
      const authenticatedUser: User = {
        id: `usr-${Date.now()}`,
        email: email.trim(),
        name: formattedName || 'Platform User',
        role,
      };

      const sessionToken = `jwt_session_${authenticatedUser.role.toLowerCase()}_${Date.now()}`;

      setUser(authenticatedUser);
      setToken(sessionToken);

      localStorage.setItem('remedial_user', JSON.stringify(authenticatedUser));
      localStorage.setItem('remedial_token', sessionToken);

      return true;
    } catch (err) {
      console.error('Login error:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const registerStudent = async (name: string, email: string, grade: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const newStudentUser: User = {
        id: `std-${Date.now()}`,
        email,
        name: `${name} (${grade})`,
        role: 'STUDENT',
      };
      const demoToken = `mock_jwt_token_student_${Date.now()}`;

      setUser(newStudentUser);
      setToken(demoToken);

      localStorage.setItem('remedial_user', JSON.stringify(newStudentUser));
      localStorage.setItem('remedial_token', demoToken);

      return true;
    } catch (err) {
      console.error('Registration error:', err);
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
    if (!user) return;
    const updatedUser: User = { ...user, role };
    setUser(updatedUser);
    localStorage.setItem('remedial_user', JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout, switchRole, registerStudent }}>
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
