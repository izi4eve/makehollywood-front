import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import LoginPage from './pages/LoginPage'
import AccountPage from './pages/AccountPage'
import ProjectsPage from './pages/ProjectsPage'
import NewProjectPage from './pages/NewProjectPage'
import ScriptPage from './pages/editor/ScriptPage'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/account" element={
            <ProtectedRoute><AccountPage /></ProtectedRoute>
          } />
          <Route path="/projects" element={
            <ProtectedRoute><ProjectsPage /></ProtectedRoute>
          } />
          <Route path="/projects/new" element={
            <ProtectedRoute><NewProjectPage /></ProtectedRoute>
          } />
          <Route path="/projects/:id/script" element={
            <ProtectedRoute><ScriptPage /></ProtectedRoute>
          } />
          <Route path="*" element={<Navigate to="/projects" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}