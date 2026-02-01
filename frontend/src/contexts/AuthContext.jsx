import { createContext, useContext, useState, useEffect } from 'react'
import { privacyAPI } from '../utils/api'

const AuthContext = createContext(null)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(true)

  const syncTokenWithExtension = (token) => {
    try {
      window.postMessage({ type: 'TRACELY_SYNC_TOKEN', token }, '*')
      console.log('[Tracely] Token synced with extension')
    } catch (err) {
      console.log('[Tracely] Extension not available:', err)
    }
  }

  const notifyExtensionLogout = () => {
    try {
      window.postMessage({ type: 'TRACELY_LOGOUT' }, '*')
      console.log('[Tracely] Logout synced with extension')
    } catch (err) {
      console.log('[Tracely] Extension not available:', err)
    }
  }

  useEffect(() => {
    const storedToken = localStorage.getItem('token')
    const storedUser = localStorage.getItem('user')
    
    if (storedToken && storedUser) {
      try {
        setToken(storedToken)
        setUser(JSON.parse(storedUser))
        
        syncTokenWithExtension(storedToken)
      } catch (err) {
        console.error('Error parsing stored user:', err)
        localStorage.removeItem('token')
        localStorage.removeItem('user')
      }
    }
    setLoading(false)
  }, [])

  const login = async (email, password) => {
    try {
      const response = await privacyAPI.login({ email, password })
      const { user: userData, token: userToken } = response.data.data
      
      setUser(userData)
      setToken(userToken)
      localStorage.setItem('token', userToken)
      localStorage.setItem('user', JSON.stringify(userData))
      
      // Sync token with extension
      syncTokenWithExtension(userToken)
      
      return { success: true }
    } catch (err) {
      console.error('Login error:', err)
      return { 
        success: false, 
        error: err.response?.data?.error || 'Login failed' 
      }
    }
  }

  const register = async (email, password, name) => {
    try {
      const response = await privacyAPI.register({ email, password, name })
      const { user: userData, token: userToken } = response.data.data
      
      setUser(userData)
      setToken(userToken)
      localStorage.setItem('token', userToken)
      localStorage.setItem('user', JSON.stringify(userData))
      
      // Sync token with extension
      syncTokenWithExtension(userToken)
      
      return { success: true }
    } catch (err) {
      console.error('Registration error:', err)
      return { 
        success: false, 
        error: err.response?.data?.error || 'Registration failed' 
      }
    }
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    
    notifyExtensionLogout()
  }

  const isAuthenticated = !!user && !!token

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    isAuthenticated,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

function syncTokenWithExtension(token) {
  try {
    window.postMessage({ type: 'TRACELY_SYNC_TOKEN', token }, '*')
    console.log('[Tracely] Token synced with extension')
  } catch (err) {
    console.log('[Tracely] Extension not available:', err)
  }
}

function notifyExtensionLogout() {
  try {
    window.postMessage({ type: 'TRACELY_LOGOUT' }, '*')
    console.log('[Tracely] Logout synced with extension')
  } catch (err) {
    console.log('[Tracely] Extension not available:', err)
  }
}
