/// <reference types="vite/client" />

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

interface Window {
  electronAPI: {
    getPorts: () => Promise<PortInfo[]>
    killProcess: (pid: number) => Promise<boolean>
    openExternal: (url: string) => Promise<void>
    getTheme: () => Promise<string>
    setTheme: (theme: string) => Promise<void>
    onViewMode: (callback: (mode: string) => void) => void
    onPortsUpdate: (callback: (ports: PortInfo[]) => void) => void
  }
}
