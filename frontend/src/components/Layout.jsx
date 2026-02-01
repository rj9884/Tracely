import { Link } from 'react-router-dom'
import { Menu, X, Shield, User, LogOut, ChevronDown } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import AuthModal from './AuthModal'

export default function Layout({ children }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false)
  const { user, logout, isAuthenticated } = useAuth()

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <nav className="sticky top-0 z-50 glass border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center gap-2">
              <Shield className="w-8 h-8 text-privacy-600" />
              <span className="gradient-text text-xl font-bold">Tracely</span>
            </Link>

            <div className="hidden md:flex items-center gap-8">
              <Link
                to="/"
                className="text-gray-700 hover:text-privacy-600 transition-colors font-medium"
              >
                Dashboard
              </Link>
              <Link
                to="/analytics"
                className="text-gray-700 hover:text-privacy-600 transition-colors font-medium"
              >
                Analytics
              </Link>
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-700 hover:text-privacy-600 transition-colors font-medium"
              >
                GitHub
              </a>
              
              {isAuthenticated ? (
                <div className="flex items-center gap-4 relative">
                  <button
                    onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-300 transition-colors cursor-pointer bg-gray-200"
                  >
                    <User className="w-4 h-4 text-gray-700" />
                    <span className="text-sm font-medium text-gray-700">{user?.name || user?.email}</span>
                    <ChevronDown className="w-4 h-4 text-gray-700" />
                  </button>
                  
                  {profileDropdownOpen && (
                    <div className="absolute top-12 right-0 bg-white border border-gray-200 rounded-lg shadow-lg w-48 z-50">
                      <div className="px-4 py-3 border-b border-gray-200">
                        <p className="text-xs text-gray-500">Logged in as</p>
                        <p className="text-sm font-medium text-gray-800">{user?.name || user?.email}</p>
                      </div>
                      <button
                        onClick={() => {
                          logout()
                          setProfileDropdownOpen(false)
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 flex items-center gap-2 transition-colors font-medium"
                      >
                        <LogOut className="w-4 h-4" />
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => setAuthModalOpen(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors shadow-lg"
                >
                  Login
                </button>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden pb-4 space-y-2">
              <Link
                to="/"
                className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                onClick={() => setMobileMenuOpen(false)}
              >
                Dashboard
              </Link>
              <Link
                to="/analytics"
                className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                onClick={() => setMobileMenuOpen(false)}
              >
                Analytics
              </Link>
              
              {isAuthenticated ? (
                <>
                  <div className="px-4 py-2 text-gray-700 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    <span className="text-sm font-medium">{user?.name || user?.email}</span>
                  </div>
                  <button
                    onClick={() => {
                      logout()
                      setMobileMenuOpen(false)
                    }}
                    className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </>
              ) : (
                <button
                  onClick={() => {
                    setAuthModalOpen(true)
                    setMobileMenuOpen(false)
                  }}
                  className="w-full text-left px-4 py-2 bg-privacy-600 text-white hover:bg-privacy-700 rounded-lg"
                >
                  Login
                </button>
              )}
            </div>
          )}
        </div>
      </nav>

      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      <footer className="bg-white border-t border-gray-200 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-600 text-sm">
              © 2024 Tracely. Accountability for websites.
            </p>
            <div className="flex gap-6">
              <a href="#" className="text-gray-600 hover:text-privacy-600 text-sm">
                Privacy Policy
              </a>
              <a href="#" className="text-gray-600 hover:text-privacy-600 text-sm">
                Terms
              </a>
              <a href="#" className="text-gray-600 hover:text-privacy-600 text-sm">
                Contact
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
