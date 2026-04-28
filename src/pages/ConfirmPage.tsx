import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function ConfirmPage() {
    const [status, setStatus] = useState<'loading' | 'ok' | 'err'>('loading')
    const navigate = useNavigate()

    useEffect(() => {
        const token = new URLSearchParams(window.location.search).get('token')
        if (!token) { setStatus('err'); return }

        fetch(`/api/auth/confirm?token=${token}`)
            .then(r => { if (!r.ok) throw new Error(); setStatus('ok') })
            .catch(() => setStatus('err'))
    }, [])

    return (
        <div className="min-h-screen bg-stone-50 flex items-center justify-center px-4">
            <div className="bg-white p-8 rounded-2xl shadow-lg border border-stone-200 text-center max-w-sm w-full">
                {status === 'loading' && <p className="text-stone-400 text-sm">Confirming your email…</p>}
                {status === 'ok' && (
                    <>
                        <p className="text-teal-600 font-semibold mb-3">✓ Email confirmed!</p>
                        <p className="text-stone-400 text-sm mb-5">You can now sign in.</p>
                        <button onClick={() => navigate('/login')}
                            className="bg-teal-600 hover:bg-teal-500 text-white font-semibold py-2.5 px-6 rounded-lg text-sm transition">
                            Go to Sign In
                        </button>
                    </>
                )}
                {status === 'err' && (
                    <>
                        <p className="text-red-500 font-semibold mb-3">Confirmation failed</p>
                        <p className="text-stone-400 text-sm mb-5">The link may have expired. Try registering again.</p>
                        <button onClick={() => navigate('/login')}
                            className="border border-stone-200 text-stone-600 hover:bg-stone-50 py-2.5 px-6 rounded-lg text-sm transition">
                            Back to Sign In
                        </button>
                    </>
                )}
            </div>
        </div>
    )
}