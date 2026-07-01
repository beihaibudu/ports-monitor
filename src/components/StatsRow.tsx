interface StatsRowProps {
  totalPorts: number
  totalProcesses: number
  totalMemory: number
  totalCpu: number
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

export default function StatsRow({
  totalPorts,
  totalProcesses,
  totalMemory,
  totalCpu,
}: StatsRowProps) {
  return (
    <div className="stats-row">
      <div className="stat-card">
        <span className="stat-card-label">活跃端口</span>
        <span className="stat-card-value">{totalPorts}</span>
        <span className="stat-card-sub">正在监听</span>
      </div>
      <div className="stat-card">
        <span className="stat-card-label">进程数</span>
        <span className="stat-card-value">{totalProcesses}</span>
        <span className="stat-card-sub">独立进程</span>
      </div>
      <div className="stat-card">
        <span className="stat-card-label">内存占用</span>
        <span className="stat-card-value">{formatBytes(totalMemory)}</span>
        <span className="stat-card-sub">总计</span>
      </div>
      <div className="stat-card">
        <span className="stat-card-label">CPU 使用</span>
        <span className="stat-card-value">{totalCpu.toFixed(1)}%</span>
        <span className="stat-card-sub">总计</span>
      </div>
    </div>
  )
}
