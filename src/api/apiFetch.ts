const signOutAndRedirect = () => {
  localStorage.removeItem('auth_user')
  window.location.href = '/login'
}

export async function apiFetch(
  url: string,
  options: RequestInit,
  token: string
): Promise<Response> {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    },
  })

  if (res.status === 401 || res.status === 403) {
    signOutAndRedirect()
    throw new Error('unauthorized')
  }

  return res
}