export const formatDate = (value) => new Date(value).toLocaleString()

export const getBackendBaseUrl = () => import.meta.env.VITE_BACKEND_URL || 'http://localhost:8085'

export const startGoogleLogin = (role) => {
	if (role) {
		document.cookie = `oauth_role=${role}; Max-Age=300; Path=/; SameSite=Lax`
	}
	window.location.href = `${getBackendBaseUrl()}/oauth2/authorization/google`
}
