import { ExternalLink, Power, Cpu, HardDrive, Clock, Server } from 'lucide-react'
import { useState } from 'react'

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

interface PortItemProps {
  port: PortInfo
  onKill: () => void
  onOpen: () => void
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

function formatUptime(ms: number): string {
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) return `${days}d ${hours % 24}h`
  if (hours > 0) return `${hours}h ${minutes % 60}m`
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`
  return `${seconds}s`
}

function formatCpu(cpu: number): string {
  if (cpu < 0.1) return '0%'
  return cpu.toFixed(1) + '%'
}

function cleanProcessName(name: string): string {
  return name.replace(/\.exe$/i, '')
}

export default function PortItem({ port, onKill, onOpen }: PortItemProps) {
  const [killing, setKilling] = useState(false)

  const handleKill = async () => {
    setKilling(true)
    try {
      await onKill()
    } finally {
      setTimeout(() => setKilling(false), 300)
    }
  }

  return (
    <div className="port-item">
      {/* Icon */}
      <div className="port-item-icon">
        <Server />
      </div>

      {/* Info */}
      <div className="port-item-info">
        <div className="port-item-top">
          <span className="port-item-name">{cleanProcessName(port.processName)}</span>
          {port.framework !== 'Other' && (
            <span className="port-item-badge">{port.framework}</span>
          )}
        </div>
        <div className="port-item-bottom">
          <span className="port-number">:{port.port}</span>
          <span className="port-meta-divider">·</span>
          <span className="port-meta">
            PID {port.pid}
          </span>
          <span className="port-meta-divider">·</span>
          <span className="port-meta">
            <Clock size={11} />
            {formatUptime(port.uptime)}
          </span>
          <span className="port-meta-divider">·</span>
          <span className="port-meta">
            <Cpu size={11} />
            {formatCpu(port.cpu)}
          </span>
          <span className="port-meta-divider">·</span>
          <span className="port-meta">
            <HardDrive size={11} />
            {formatBytes(port.memory)}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="port-actions">
        <button
          className="port-action-btn tooltip"
          data-tooltip="在浏览器中打开"
          onClick={onOpen}
        >
          <ExternalLink />
        </button>
        <button
          className="port-action-btn kill tooltip"
          data-tooltip="终止进程"
          onClick={handleKill}
          disabled={killing}
          style={{ opacity: killing ? 0.5 : 1 }}
        >
          <Power />
        </button>
      </div>
    </div>
  )
}
