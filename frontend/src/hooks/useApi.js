import { useState, useEffect } from 'react'
import { privacyAPI } from '../utils/api'

export const useSites = (startWithGlobal = false) => {
  const [sites, setSites] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [mode, setMode] = useState(startWithGlobal ? 'global' : 'personal')

  useEffect(() => {
    // Update mode when startWithGlobal changes (e.g., when user logs in/out)
    setMode(startWithGlobal ? 'global' : 'personal')
  }, [startWithGlobal])

  useEffect(() => {
    const fetchSites = async (isInitial = false) => {
      try {
        if (isInitial) setLoading(true)
        const apiCall = mode === 'global' ? privacyAPI.getGlobalStats() : privacyAPI.getAllSites()
        const response = await apiCall
        setSites(response.data.data || [])
      } catch (err) {
        setError(err.message)
        console.error('Error fetching sites:', err)
      } finally {
        if (isInitial) setLoading(false)
      }
    }

    // Fetch immediately
    fetchSites(true)

    // Poll every 15 seconds for new data
    const interval = setInterval(fetchSites, 15000)

    return () => clearInterval(interval)
  }, [mode])

  const toggleMode = () => {
    setMode(mode === 'personal' ? 'global' : 'personal')
  }

  return { sites, loading, error, mode, toggleMode }
}

export const useSiteDetail = (domain) => {
  const [site, setSite] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchSiteDetail = async () => {
    try {
      setLoading(true)
      const response = await privacyAPI.getSiteDetails(domain)
      setSite(response.data.data)
    } catch (err) {
      setError(err.message)
      console.error('Error fetching site detail:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!domain) return
    fetchSiteDetail()
  }, [domain])

  return { site, loading, error, refetch: fetchSiteDetail }
}

export const useTrackers = () => {
  const [trackers, setTrackers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchTrackers = async () => {
      try {
        setLoading(true)
        const response = await privacyAPI.getTrackers()
        setTrackers(response.data.data || [])
      } catch (err) {
        setError(err.message)
        console.error('Error fetching trackers:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchTrackers()
  }, [])

  return { trackers, loading, error }
}
