import PortItem from './PortItem'
import { Server } from 'lucide-react'

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

interface PortListProps {
  ports: PortInfo[]
  loading: boolean
  onKill: (pid: number) => void
  onOpen: (port: number) => void
}

export default function PortList({ ports, loading, onKill, onOpen }: PortListProps) {
  if (loading) {
    return (
      <div className="port-list">
        <div className="port-list-empty">
          <div className="spinner" />
          <span>正在扫描端口...</span>
        </div>
      </div>
    )
  }

  if (ports.length === 0) {
    return (
      <div className="port-list">
        <div className="port-list-empty">
          <Server />
          <span>没有发现监听的端口</span>
        </div>
      </div>
    )
  }

  return (
    <div className="port-list">
      {ports.map((port) => (
        <PortItem
          key={`${port.port}-${port.protocol}`}
          port={port}
          onKill={() => onKill(port.pid)}
          onOpen={() => onOpen(port.port)}
        />
      ))}
    </div>
  )
}
