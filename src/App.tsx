// ============================================
// PREDICTO - Main Application
// ============================================

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { SessionProvider } from './contexts/SessionContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { ToastProvider } from './components/Toast';
import { HomePage } from './pages/HomePage';
import { JoinPage } from './pages/JoinPage';
import { AdminDashboard } from './pages/AdminDashboard';
import { PlayerView } from './pages/PlayerView';
import { Leaderboard } from './pages/Leaderboard';
import { ChallengeManager } from './pages/ChallengeManager';
import './index.css';

function App() {
  return (
    <BrowserRouter>
      <LanguageProvider>
        <AuthProvider>
          <SessionProvider>
            <ToastProvider>
              <Routes>
                {/* Home Page */}
                <Route path="/" element={<HomePage />} />

                {/* Join Session */}
                <Route path="/join/:sessionId" element={<JoinPage />} />

                {/* Admin Dashboard */}
                <Route path="/admin/:sessionId" element={<AdminDashboard />} />
                <Route path="/admin/:sessionId/challenge/:challengeId" element={<ChallengeManager />} />

                {/* Player View */}
                <Route path="/play/:sessionId" element={<PlayerView />} />

                {/* Leaderboard */}
                <Route path="/leaderboard/:sessionId" element={<Leaderboard />} />

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </ToastProvider>
          </SessionProvider>
        </AuthProvider>
      </LanguageProvider>
    </BrowserRouter>
  );
}

export default App;

