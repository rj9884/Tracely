import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Search, BarChart3, TrendingUp, Globe } from 'lucide-react'
import SiteCard from '../components/SiteCard'
import PrivacyScore from '../components/PrivacyScore'
import { useSites } from '../hooks/useApi'
import { useAuth } from '../contexts/AuthContext'

export default function Dashboard() {
  const { isAuthenticated } = useAuth()
  // When authenticated, show personal data. When not, show global data
  const { sites, loading, mode, toggleMode } = useSites(!isAuthenticated)
  const [filteredSites, setFilteredSites] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('score')

  useEffect(() => {
    let filtered = [...sites] // Create a copy to avoid mutating original

    if (searchQuery) {
      filtered = filtered.filter((site) =>
        site.domain.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    if (sortBy === 'score') {
      filtered.sort((a, b) => b.score - a.score)
    } else if (sortBy === 'trackers') {
      filtered.sort((a, b) => b.trackerCount - a.trackerCount)
    } else if (sortBy === 'name') {
      filtered.sort((a, b) => a.domain.localeCompare(b.domain))
    }

    setFilteredSites(filtered)
  }, [sites, searchQuery, sortBy])

  const avgScore = filteredSites.length > 0
    ? Math.round(filteredSites.reduce((sum, site) => sum + site.score, 0) / filteredSites.length)
    : 0
  const totalTrackers = filteredSites.reduce((sum, site) => sum + site.trackerCount, 0)

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="glass p-8 md:p-12 rounded-2xl border border-gray-200 bg-gradient-to-br from-privacy-50 to-transparent">
        <div className="max-w-2xl">
          <h1 className="gradient-text text-4xl md:text-5xl font-bold mb-4">
            See what websites actually learn about you
          </h1>
          <p className="text-gray-700 text-lg mb-6">
            Tracely reveals how sites change tracking behavior over time. No blocking. Just accountability.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <button className="bg-privacy-600 hover:bg-privacy-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors">
              Install Extension
            </button>
            <Link
              to="/analytics"
              className="border-2 border-privacy-600 text-privacy-600 hover:bg-privacy-50 font-semibold py-3 px-6 rounded-lg transition-colors text-center"
            >
              Learn More
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass p-6 rounded-xl border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <p className="text-gray-600 text-sm font-medium">Sites Monitored</p>
            <BarChart3 className="w-5 h-5 text-privacy-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{filteredSites.length}</p>
          <p className="text-xs text-gray-500 mt-2">Active tracking insights</p>
        </div>

        <div className="glass p-6 rounded-xl border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <p className="text-gray-600 text-sm font-medium">Avg. Risk Score</p>
            <TrendingUp className="w-5 h-5 text-privacy-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{avgScore}</p>
          <p className="text-xs text-gray-500 mt-2">Out of 100</p>
        </div>

        <div className="glass p-6 rounded-xl border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <p className="text-gray-600 text-sm font-medium">Total Trackers</p>
            <BarChart3 className="w-5 h-5 text-privacy-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{totalTrackers}</p>
          <p className="text-xs text-gray-500 mt-2">Detected across sites</p>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search websites..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-privacy-600 focus:ring-2 focus:ring-privacy-100"
          />
        </div>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-privacy-600"
        >
          <option value="score">Sort by Risk Score</option>
          <option value="trackers">Sort by Trackers</option>
          <option value="name">Sort by Name</option>
        </select>
        
        {/* Data Mode Toggle - Only show when authenticated */}
        {isAuthenticated && (
          <button
            onClick={toggleMode}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all border-2 ${
              mode === 'personal'
                ? 'bg-privacy-600 text-white border-privacy-600 hover:bg-privacy-700'
                : 'bg-white text-privacy-600 border-privacy-600 hover:bg-privacy-50'
            }`}
          >
            <Globe className="w-4 h-4" />
            {mode === 'personal' ? 'My Data' : 'Global Stats'}
          </button>
        )}
      </div>

      {/* Sites Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="glass p-6 rounded-xl border border-gray-200 animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-2/3 mb-4"></div>
              <div className="h-12 bg-gray-200 rounded w-1/3"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSites.map((site) => (
            <SiteCard key={site.domain} {...site} />
          ))}
        </div>
      )}

      {filteredSites.length === 0 && !loading && (
        <div className="glass p-12 rounded-xl border border-gray-200 text-center">
          <p className="text-gray-600 text-lg">No websites found. Install the extension to start monitoring.</p>
        </div>
      )}
    </div>
  )
}
