interface StatusBarProps {
  portCount: number
  totalCount: number
}

export default function StatusBar({ portCount, totalCount }: StatusBarProps) {
  const now = new Date()
  const timeStr = now.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })

  return (
    <div className="status-bar">
      <div className="status-bar-left">
        <span className="status-dot" />
        <span>
          监控中 · 显示 {portCount}/{totalCount} 个端口
        </span>
      </div>
      <span>{timeStr}</span>
    </div>
  )
}
