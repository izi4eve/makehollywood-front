import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import LoginPage from './pages/LoginPage'
import AccountPage from './pages/AccountPage'
import IdeasPage from './pages/IdeasPage'
import ShortsPage from './pages/ShortsPage'
import SeriesPage from './pages/SeriesPage'
import VoicePage from './pages/VoicePage'
import VideoPage from './pages/VideoPage'
import DirectorPage from './pages/DirectorPage'
import WrapPage from './pages/WrapPage'

function Protected({ children }: { children: React.ReactNode }) {
  return <ProtectedRoute>{children}</ProtectedRoute>
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/account" element={<Protected><AccountPage /></Protected>} />

          <Route path="/ideas" element={<Protected><IdeasPage /></Protected>} />

          <Route path="/shorts" element={<Protected><ShortsPage /></Protected>} />
          <Route path="/shorts/new" element={<Protected><ShortsPage /></Protected>} />
          <Route path="/shorts/:id" element={<Protected><ShortsPage /></Protected>} />

          <Route path="/series" element={<Protected><SeriesPage /></Protected>} />
          <Route path="/series/new" element={<Protected><SeriesPage /></Protected>} />
          <Route path="/series/:id" element={<Protected><SeriesPage /></Protected>} />

          <Route path="/voice" element={<Protected><VoicePage /></Protected>} />
          <Route path="/video" element={<Protected><VideoPage /></Protected>} />
          <Route path="/director" element={<Protected><DirectorPage /></Protected>} />
          <Route path="/director/new" element={<Protected><DirectorPage /></Protected>} />
          <Route path="/wrap" element={<Protected><WrapPage /></Protected>} />

          <Route path="*" element={<Navigate to="/ideas" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
