import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import SiteDetail from './pages/SiteDetail'
import Analytics from './pages/Analytics'
import ResearcherMode from './pages/ResearcherMode'
import { AuthProvider } from './contexts/AuthContext'
import './App.css'

function App() {
  return (
    <AuthProvider>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/site/:domain" element={<SiteDetail />} />
            <Route path="/site/:domain/researcher" element={<ResearcherMode />} />
            <Route path="/analytics" element={<Analytics />} />
          </Routes>
        </Layout>
      </Router>
    </AuthProvider>
  )
}

export default App
