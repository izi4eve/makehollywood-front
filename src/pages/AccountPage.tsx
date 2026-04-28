import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Layout from '../components/Layout'

const API = '/api/auth'

export default function AccountPage() {
  const { user, signOut, token } = useAuth()
  const navigate = useNavigate()
  const isAdmin = user?.role === 'ROLE_ADMIN'

  // Change password
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const [passwordLoading, setPasswordLoading] = useState(false)

  // Delete account
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)

  // Admin: change role
  const [roleEmail, setRoleEmail] = useState('')
  const [roleValue, setRoleValue] = useState('REGISTERED')
  const [roleMsg, setRoleMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const [roleLoading, setRoleLoading] = useState(false)

  // Admin: cleanup
  const [cleanupMsg, setCleanupMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const [cleanupLoading, setCleanupLoading] = useState(false)

  const handleLogout = () => {
    signOut()
    navigate('/login')
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordMsg(null)
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'err', text: 'New passwords do not match.' })
      return
    }
    if (newPassword.length < 8) {
      setPasswordMsg({ type: 'err', text: 'Password must be at least 8 characters.' })
      return
    }
    setPasswordLoading(true)
    try {
      const res = await fetch(`${API}/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ currentPassword, newPassword }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to change password')
      }
      setPasswordMsg({ type: 'ok', text: 'Password changed successfully.' })
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('')
      setShowPasswordForm(false)
    } catch (err: unknown) {
      setPasswordMsg({ type: 'err', text: err instanceof Error ? err.message : 'Error' })
    } finally {
      setPasswordLoading(false)
    }
  }

  const handleDeleteAccount = async () => {
    setDeleteLoading(true)
    try {
      const res = await fetch(`${API}/delete-account`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Failed to delete account')
      signOut()
      navigate('/login')
    } catch {
      setShowDeleteConfirm(false)
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleSetRole = async (e: React.FormEvent) => {
    e.preventDefault()
    setRoleMsg(null)
    setRoleLoading(true)
    try {
      const res = await fetch('/api/admin/set-role-api', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ email: roleEmail, role: roleValue }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to set role')
      }
      setRoleMsg({ type: 'ok', text: `Role updated for ${roleEmail}` })
      setRoleEmail('')
    } catch (err: unknown) {
      setRoleMsg({ type: 'err', text: err instanceof Error ? err.message : 'Error' })
    } finally {
      setRoleLoading(false)
    }
  }

  const handleCleanup = async () => {
    setCleanupMsg(null)
    setCleanupLoading(true)
    try {
      const res = await fetch('/api/admin/cleanup-users', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Cleanup failed')
      setCleanupMsg({ type: 'ok', text: 'Unconfirmed accounts removed.' })
    } catch (err: unknown) {
      setCleanupMsg({ type: 'err', text: err instanceof Error ? err.message : 'Error' })
    } finally {
      setCleanupLoading(false)
    }
  }

  return (
    <Layout breadcrumbs={[{ label: 'Account' }]}>
      <div className="max-w-2xl mx-auto flex flex-col gap-5">

        {/* Profile card */}
        <div className="bg-white border border-stone-200 rounded-xl px-6 py-5">
          <h2 className="text-base font-semibold text-stone-900 mb-4">Profile</h2>
          <div className="flex flex-col gap-2 text-sm mb-5">
            <div className="flex gap-2">
              <span className="text-stone-400 w-16 shrink-0">Email</span>
              <span className="text-stone-900">{user?.email}</span>
            </div>
            <div className="flex gap-2">
              <span className="text-stone-400 w-16 shrink-0">Role</span>
              <span className="text-stone-500 text-xs bg-stone-100 px-2 py-0.5 rounded-md font-mono">
                {user?.role}
              </span>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            {!user?.provider && (
              <button onClick={() => { setShowPasswordForm(v => !v); setPasswordMsg(null) }}
                className="text-sm border border-stone-200 text-stone-600 hover:bg-stone-50 px-4 py-2 rounded-lg transition">
                {showPasswordForm ? 'Cancel' : 'Change password'}
              </button>
            )}
            <button
              onClick={handleLogout}
              className="text-sm border border-stone-200 text-stone-400 hover:text-red-500 hover:border-red-200 px-4 py-2 rounded-lg transition"
            >
              Log out
            </button>
          </div>

          {/* Сообщение об успехе — снаружи формы */}
          {passwordMsg && !showPasswordForm && (
            <p className={`text-sm mt-3 ${passwordMsg.type === 'ok' ? 'text-teal-600' : 'text-red-500'}`}>
              {passwordMsg.type === 'ok' ? '✓ ' : ''}{passwordMsg.text}
            </p>
          )}

          {showPasswordForm && (
            <form onSubmit={handleChangePassword} className="mt-4 flex flex-col gap-3 border-t border-stone-100 pt-4">
              {/* Current password */}
              <div className="relative">
                <input
                  type={showCurrent ? 'text' : 'password'}
                  placeholder="Current password"
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  required
                  className="w-full bg-stone-50 border border-stone-200 rounded-lg px-4 py-2.5 text-sm pr-10 outline-none focus:ring-2 focus:ring-teal-500 placeholder-stone-400"
                />
                <button type="button" onClick={() => setShowCurrent(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-300 hover:text-stone-500 text-xs">
                  {showCurrent ? 'hide' : 'show'}
                </button>
              </div>
              {/* New password */}
              <div className="relative">
                <input
                  type={showNew ? 'text' : 'password'}
                  placeholder="New password (min 8 chars)"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  required minLength={8}
                  className="w-full bg-stone-50 border border-stone-200 rounded-lg px-4 py-2.5 text-sm pr-10 outline-none focus:ring-2 focus:ring-teal-500 placeholder-stone-400"
                />
                <button type="button" onClick={() => setShowNew(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-300 hover:text-stone-500 text-xs">
                  {showNew ? 'hide' : 'show'}
                </button>
              </div>
              {/* Confirm */}
              <input
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
                className="w-full bg-stone-50 border border-stone-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-teal-500 placeholder-stone-400"
              />
              {passwordMsg && (
                <p className={`text-sm ${passwordMsg.type === 'ok' ? 'text-teal-600' : 'text-red-500'}`}>
                  {passwordMsg.type === 'ok' ? '✓ ' : ''}{passwordMsg.text}
                </p>
              )}
              <button type="submit" disabled={passwordLoading}
                className="bg-teal-600 hover:bg-teal-500 text-white text-sm font-semibold py-2.5 rounded-lg transition disabled:opacity-50 self-start px-5">
                {passwordLoading ? 'Saving…' : 'Save new password'}
              </button>
            </form>
          )}
        </div>

        {/* Danger zone */}
        <div className="bg-white border border-red-100 rounded-xl px-6 py-5">
          <h2 className="text-base font-semibold text-stone-900 mb-1">Danger zone</h2>
          <p className="text-sm text-stone-400 mb-4">This action is permanent and cannot be undone.</p>
          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="text-sm text-red-500 border border-red-200 hover:bg-red-50 px-4 py-2 rounded-lg transition"
            >
              Delete account
            </button>
          ) : (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-stone-700">Are you sure? All your data will be deleted.</p>
              <div className="flex gap-2">
                <button onClick={() => setShowDeleteConfirm(false)}
                  className="text-sm border border-stone-200 text-stone-400 hover:bg-stone-50 px-4 py-2 rounded-lg transition">
                  Cancel
                </button>
                <button onClick={handleDeleteAccount} disabled={deleteLoading}
                  className="text-sm bg-red-500 hover:bg-red-400 text-white font-semibold px-4 py-2 rounded-lg transition disabled:opacity-50">
                  {deleteLoading ? 'Deleting…' : 'Yes, delete my account'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Admin panel */}
        {isAdmin && (
          <div className="bg-white border border-orange-100 rounded-xl px-6 py-5">
            <h2 className="text-base font-semibold text-stone-900 mb-4">
              Admin
              <span className="ml-2 text-xs font-normal text-orange-400 bg-orange-50 px-2 py-0.5 rounded-md">superuser</span>
            </h2>

            {/* Set role */}
            <div className="mb-5">
              <p className="text-sm font-medium text-stone-700 mb-3">Change user role</p>
              <form onSubmit={handleSetRole} className="flex flex-col gap-2">
                <input
                  type="email" placeholder="User email"
                  value={roleEmail} onChange={e => setRoleEmail(e.target.value)} required
                  className="bg-stone-50 border border-stone-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-teal-500 placeholder-stone-400"
                />
                <select value={roleValue} onChange={e => setRoleValue(e.target.value)}
                  className="bg-stone-50 border border-stone-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-teal-500 text-stone-700">
                  <option value="REGISTERED">REGISTERED</option>
                  <option value="MODERATOR">MODERATOR</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
                {roleMsg && (
                  <p className={`text-sm ${roleMsg.type === 'ok' ? 'text-teal-600' : 'text-red-500'}`}>
                    {roleMsg.text}
                  </p>
                )}
                <button type="submit" disabled={roleLoading}
                  className="self-start bg-teal-600 hover:bg-teal-500 text-white text-sm font-semibold px-4 py-2 rounded-lg transition disabled:opacity-50">
                  {roleLoading ? 'Saving…' : 'Set role'}
                </button>
              </form>
            </div>

            {/* Cleanup */}
            <div className="border-t border-stone-100 pt-4">
              <p className="text-sm font-medium text-stone-700 mb-1">Cleanup unconfirmed accounts</p>
              <p className="text-xs text-stone-400 mb-3">Removes users who registered but never confirmed their email.</p>
              {cleanupMsg && (
                <p className={`text-sm mb-2 ${cleanupMsg.type === 'ok' ? 'text-teal-600' : 'text-red-500'}`}>
                  {cleanupMsg.text}
                </p>
              )}
              <button onClick={handleCleanup} disabled={cleanupLoading}
                className="text-sm border border-stone-200 text-stone-600 hover:bg-stone-50 px-4 py-2 rounded-lg transition disabled:opacity-50">
                {cleanupLoading ? 'Running…' : 'Run cleanup'}
              </button>
            </div>
          </div>
        )}

      </div>
    </Layout>
  )
}
