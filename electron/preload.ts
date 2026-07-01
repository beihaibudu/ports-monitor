import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  getPorts: () => ipcRenderer.invoke('get-ports'),
  killProcess: (pid: number) => ipcRenderer.invoke('kill-process', pid),
  openExternal: (url: string) => ipcRenderer.invoke('open-external', url),
  getTheme: () => ipcRenderer.invoke('get-theme'),
  setTheme: (theme: string) => ipcRenderer.invoke('set-theme', theme),
  getViewMode: () => ipcRenderer.invoke('get-view-mode'),

  // Event listeners
  onPortsUpdate: (callback: (ports: any[]) => void) => {
    ipcRenderer.on('ports-update', (_event, ports) => callback(ports))
  },
})
