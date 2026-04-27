import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import LoginPage from './pages/LoginPage'
import AccountPage from './pages/AccountPage'
import IdeasPage from './pages/IdeasPage'
import NewIdeaPage from './pages/NewIdeaPage'
import ScriptsPage from './pages/ScriptsPage'
import NewScriptPage from './pages/NewScriptPage'
import LongformPage from './pages/LongformPage'
import VoicePage from './pages/VoicePage'
import VideoPage from './pages/VideoPage'
import DirectorPage from './pages/DirectorPage'
import WrapPage from './pages/WrapPage'
import NewLongformPage from './pages/NewLongformPage'

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
          <Route path="/ideas/new" element={<Protected><NewIdeaPage /></Protected>} />

          <Route path="/scripts" element={<Protected><ScriptsPage /></Protected>} />
          <Route path="/scripts/new" element={<Protected><NewScriptPage /></Protected>} />
          <Route path="/scripts/:id" element={<Protected><NewScriptPage /></Protected>} />

          <Route path="/longform" element={<Protected><LongformPage /></Protected>} />
          <Route path="/longform/new" element={<Protected><NewLongformPage /></Protected>} />
          <Route path="/longform/:id" element={<Protected><LongformPage /></Protected>} />

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
