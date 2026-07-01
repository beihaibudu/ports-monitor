import { Sun, Moon } from 'lucide-react'

interface HeaderProps {
  theme: 'light' | 'dark'
  onToggleTheme: () => void
  portCount: number
  mode: 'tray' | 'window'
}

export default function Header({ theme, onToggleTheme, portCount, mode }: HeaderProps) {
  return (
    <div className="header">
      <div className="header-left">
        <div className="header-logo">P</div>
        <div>
          <div className="header-title">Ports</div>
          {mode === 'tray' && (
            <div className="header-subtitle">
              {portCount} 个端口监听中
            </div>
          )}
        </div>
      </div>
      <div className="header-right">
        <button
          className="icon-btn tooltip"
          onClick={onToggleTheme}
          data-tooltip={theme === 'dark' ? '切换亮色模式' : '切换暗色模式'}
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </div>
    </div>
  )
}
