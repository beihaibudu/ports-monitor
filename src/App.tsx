import { useState, useEffect, useMemo, useCallback } from 'react'
import Header from './components/Header'
import FilterBar from './components/FilterBar'
import PortList from './components/PortList'
import SearchBar from './components/SearchBar'
import StatsRow from './components/StatsRow'
import StatusBar from './components/StatusBar'

interface PortInfo {
  port: number
  protocol: string
  address: string
  pid: number
  processName: string
  cpu: number
  memory: number
  uptime: number
  framework: string
}

interface AppProps {
  mode: 'tray' | 'window'
}

export default function App({ mode }: AppProps) {
  const [ports, setPorts] = useState<PortInfo[]>([])
  const [activeFilter, setActiveFilter] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [theme, setTheme] = useState<'light' | 'dark'>('dark')
  const [loading, setLoading] = useState(true)

  // Initialize theme
  useEffect(() => {
    if (window.electronAPI) {
      window.electronAPI.getTheme().then((t: string) => {
        setTheme(t as 'light' | 'dark')
      })

      // Listen for port updates from main process
      window.electronAPI.onPortsUpdate((newPorts: PortInfo[]) => {
        setPorts(newPorts)
        setLoading(false)
      })
    }
  }, [])

  // Toggle theme
  const toggleTheme = useCallback(() => {
    const newTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(newTheme)
    if (window.electronAPI) {
      window.electronAPI.setTheme(newTheme)
    }
  }, [theme])

  // Kill process
  const handleKill = useCallback(async (pid: number) => {
    if (window.electronAPI) {
      await window.electronAPI.killProcess(pid)
    }
  }, [])

  // Open in browser
  const handleOpen = useCallback((port: number) => {
    if (window.electronAPI) {
      window.electronAPI.openExternal(`http://localhost:${port}`)
    }
  }, [])

  // Get unique frameworks with counts
  const frameworkCounts = useMemo(() => {
    const counts: Record<string, number> = { All: ports.length }
    for (const port of ports) {
      const fw = port.framework || 'Other'
      counts[fw] = (counts[fw] || 0) + 1
    }
    return counts
  }, [ports])

  // Filter ports
  const filteredPorts = useMemo(() => {
    let result = ports

    // Framework filter
    if (activeFilter !== 'All') {
      result = result.filter(
        (p) => (p.framework || 'Other') === activeFilter
      )
    }

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (p) =>
          p.processName.toLowerCase().includes(q) ||
          String(p.port).includes(q) ||
          String(p.pid).includes(q) ||
          (p.framework || '').toLowerCase().includes(q)
      )
    }

    return result
  }, [ports, activeFilter, searchQuery])

  // Stats
  const stats = useMemo(() => {
    const totalPorts = ports.length
    const totalProcesses = new Set(ports.map((p) => p.pid)).size
    const totalMemory = ports.reduce((sum, p) => sum + p.memory, 0)
    const totalCpu = ports.reduce((sum, p) => sum + p.cpu, 0)
    return { totalPorts, totalProcesses, totalMemory, totalCpu }
  }, [ports])

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  const isTray = mode === 'tray'

  return (
    <div className={`app-container ${isTray ? 'tray-mode' : ''}`}>
      {/* Title bar drag region for window mode */}
      {!isTray && <div className="title-bar-drag" />}

      <Header
        theme={theme}
        onToggleTheme={toggleTheme}
        portCount={ports.length}
        mode={mode}
      />

      {isTray && (
        <SearchBar value={searchQuery} onChange={setSearchQuery} />
      )}

      <FilterBar
        counts={frameworkCounts}
        activeFilter={activeFilter}
        onSelect={setActiveFilter}
      />

      {!isTray && (
        <>
          <SearchBar value={searchQuery} onChange={setSearchQuery} />
          <StatsRow
            totalPorts={stats.totalPorts}
            totalProcesses={stats.totalProcesses}
            totalMemory={stats.totalMemory}
            totalCpu={stats.totalCpu}
          />
        </>
      )}

      <PortList
        ports={filteredPorts}
        loading={loading}
        onKill={handleKill}
        onOpen={handleOpen}
      />

      <StatusBar portCount={filteredPorts.length} totalCount={ports.length} />
    </div>
  )
}
