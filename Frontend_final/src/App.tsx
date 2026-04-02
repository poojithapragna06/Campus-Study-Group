import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import StudyGroups from './components/StudyGroups';
import Chat from './components/Chat';
import Sessions from './components/Sessions';
import SharedFiles from './components/SharedFiles';
import AdminPanel from './components/AdminPanel';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ActiveView, StudyGroup } from './types';
import { currentUser, adminUser, studyGroups } from './data/mockData';

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
function AuthenticatedApp() {
  const [activeView, setActiveView] = useState<ActiveView>('dashboard');
  const [user, setUser] = useState(currentUser);
  const [selectedGroup, setSelectedGroup] = useState<StudyGroup>(studyGroups[0]);
  const { logout } = useAuth();

  const toggleRole = () => {
    setUser(u => (u.role === 'student' ? adminUser : currentUser));
  };

  const handleLogout = () => {
    logout();
    queryClient.clear(); // clear all cached data on logout
  };

  const renderView = () => {
    switch (activeView) {
      case 'dashboard': return <Dashboard setActiveView={setActiveView} />;
      case 'groups':    return <StudyGroups setActiveView={setActiveView} setSelectedGroup={setSelectedGroup} />;
      case 'chat':      return <Chat selectedGroup={selectedGroup} setSelectedGroup={setSelectedGroup} />;
      case 'sessions':  return <Sessions />;
      case 'files':     return <SharedFiles />;
      case 'admin':     return user.role === 'admin' ? <AdminPanel /> : <Dashboard setActiveView={setActiveView} />;
      default:          return <Dashboard setActiveView={setActiveView} />;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#0F1623' }}>
      <Sidebar
        activeView={activeView}
        setActiveView={setActiveView}
        currentUser={user}
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
