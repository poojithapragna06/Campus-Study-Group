import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import StudyGroups from './components/StudyGroups';
import Chat from './components/Chat';
import Sessions from './components/Sessions';
import AdminPanel from './components/AdminPanel';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ActiveView, User } from './types';
import Friends from './components/Friends';

type RealGroup = {
  _id: string;
  group_name: string;
  group_members: string[];
  group_admins: string[];
  requires_permission: boolean;
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 30,
      gcTime: 1000 * 60 * 5,
      refetchOnWindowFocus: false,
    },
    mutations: { retry: 1 },
  },
});

type AuthPage = 'login' | 'signup';

// ─── Authenticated app shell ──────────────────────────────────────────────────
// Decode current user from JWT token
// function getTokenUser() {
//   try {
//     const token = localStorage.getItem('token');
//     if (!token) return { name: 'User', role: 'student', avatar: 'U' };
//     const payload = JSON.parse(atob(token.split('.')[1]));
//     const name = payload.username || payload.name || 'User';
//     return { name, role: "student", avatar: name.slice(0, 2).toUpperCase(), id: payload.Uid };
//   } catch { return { name: 'User', role: "student" , avatar: 'U' }; }
// }
function getTokenUser(): User {
  try {
    const token = localStorage.getItem('token');

    if (!token) {
      return {
        id: 'guest',
        name: 'User',
        role: 'student',
        avatar: 'U',
        email: '',
        department: '',
        year: 0,
        joinedAt: ''
      };
    }

    const payload = JSON.parse(atob(token.split('.')[1]));
    const name = payload.username || payload.name || 'User';

    return {
      id: payload.Uid ?? 'guest',
      name,
      role: 'student',
      avatar: name.slice(0, 2).toUpperCase(),
      email: '',
      department: '',
      year: 0,
      joinedAt: ''
    };

  } catch {
    return {
      id: 'guest',
      name: 'User',
      role: 'student',
      avatar: 'U',
      email: '',
      department: '',
      year: 0,
      joinedAt: ''
    };
  }
}
function AuthenticatedApp() {
  const [activeView, setActiveView] = useState<ActiveView>('dashboard');
  const [user, setUser] = useState<User>(getTokenUser);
  const [selectedGroup, setSelectedGroup] = useState<RealGroup | null>(null);
  const { logout } = useAuth();

  const toggleRole = () => {
    setUser(prev => ({
      ...prev,
      role: prev.role === 'admin' ? 'student' : 'admin'
    }));
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    logout();
    queryClient.clear(); // clear all cached data on logout
  };

  const renderView = () => {
    switch (activeView) {
      case 'dashboard': return <Dashboard setActiveView={setActiveView} />;
      case 'groups':    return <StudyGroups setActiveView={setActiveView} setSelectedGroup={setSelectedGroup} />;
      case 'chat':      return <Chat selectedGroup={selectedGroup} setSelectedGroup={setSelectedGroup} />;
      case 'sessions':  return <Sessions />;
      case 'friends':   return <Friends />;
      case 'admin': return <AdminPanel/>;
      default:          return <Dashboard setActiveView={setActiveView} />;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#0F1623' }}>
      <Sidebar
        activeView={activeView}
        setActiveView={setActiveView}
        currentUser={user as User}
        onRoleSwitch={toggleRole}
        onLogout={handleLogout}
      />
      <main className="flex-1 overflow-y-auto scrollbar-hide">
        {renderView()}
      </main>
    </div>
  );
}

// ─── Auth gate — shows login/signup until authenticated ───────────────────────
function AuthGate() {
  const { isAuthenticated } = useAuth();
  const [authPage, setAuthPage] = useState<AuthPage>('login');

  if (isAuthenticated) return <AuthenticatedApp />;

  return authPage === 'login'
    ? <LoginPage onNavigateToSignup={() => setAuthPage('signup')} />
    : <SignupPage onNavigateToLogin={() => setAuthPage('login')} />;
}

// ─── Root ─────────────────────────────────────────────────────────────────────
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AuthGate />
        {process.env.NODE_ENV === 'development' && (
          <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-right" />
        )}
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
