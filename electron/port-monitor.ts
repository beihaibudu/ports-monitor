import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export interface PortData {
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

interface PortTracking {
  firstSeen: number
  lastCpuTime: number
  lastCpuTimestamp: number
}

interface ProcessInfo {
  name: string
  cpu: number
  memory: number
  cpuTime: number
}

const FRAMEWORK_KEYWORDS: Record<string, string[]> = {
  Node: ['node', 'node.exe'],
  Vite: ['vite'],
  Next: ['next'],
  React: ['react-scripts', 'create-react-app'],
  Vue: ['vue-cli-service', 'vue'],
  Nuxt: ['nuxt'],
  Angular: ['ng', 'angular'],
  Svelte: ['svelte-kit', 'svelte'],
  Python: ['python', 'python3', 'python.exe', 'python3.exe'],
  Django: ['django', 'manage.py', 'uvicorn', 'gunicorn'],
  Flask: ['flask'],
  Rails: ['rails', 'ruby', 'puma', 'thin'],
  Go: ['go', 'go.exe'],
  Bun: ['bun', 'bun.exe'],
  Deno: ['deno', 'deno.exe'],
  Java: ['java', 'java.exe'],
  PHP: ['php', 'php.exe', 'artisan'],
  Rust: ['cargo', 'rust'],
  '.NET': ['dotnet', 'dotnet.exe'],
  Docker: ['docker', 'docker-proxy', 'com.docker'],
}

function detectFramework(processName: string, commandLine?: string): string {
  const name = processName.toLowerCase()
  const cmd = (commandLine || '').toLowerCase()
  const combined = `${name} ${cmd}`

  // Check specific frameworks first (more specific matches)
  for (const [framework, keywords] of Object.entries(FRAMEWORK_KEYWORDS)) {
    if (framework === 'Node') continue // Check Node last as fallback
    for (const keyword of keywords) {
      if (combined.includes(keyword.toLowerCase())) {
        return framework
      }
    }
  }

  // Fallback to Node
  if (name.includes('node')) return 'Node'

  return 'Other'
}

export class PortScanner {
  private portTracking: Map<string, PortTracking> = new Map()
  private previousProcessCpu: Map<number, { cpuTime: number; timestamp: number }> = new Map()

  async scan(): Promise<PortData[]> {
    try {
      const ports = await this.getListeningPorts()
      const processes = await this.getProcessInfoMap()

      const now = Date.now()
      const result: PortData[] = []

      for (const port of ports) {
        const proc = processes.get(port.pid)
        if (!proc) continue

        const key = `${port.port}-${port.protocol}`

        // Track port for uptime
        let tracking = this.portTracking.get(key)
        if (!tracking) {
          tracking = {
            firstSeen: now,
            lastCpuTime: proc.cpuTime,
            lastCpuTimestamp: now,
          }
          this.portTracking.set(key, tracking)
        }

        // Calculate CPU usage
        let cpuUsage = 0
        const prevCpu = this.previousProcessCpu.get(port.pid)
        if (prevCpu && proc.cpuTime > 0) {
          const cpuDelta = proc.cpuTime - prevCpu.cpuTime
          const timeDelta = (now - prevCpu.timestamp) / 1000
          if (timeDelta > 0) {
            cpuUsage = Math.max(0, (cpuDelta / timeDelta) * 100)
          }
        }
        this.previousProcessCpu.set(port.pid, {
          cpuTime: proc.cpuTime,
          timestamp: now,
        })

        const uptime = now - tracking.firstSeen

        result.push({
          port: port.port,
          protocol: port.protocol,
          address: port.address,
          pid: port.pid,
          processName: proc.name,
          cpu: cpuUsage,
          memory: proc.memory,
          uptime,
          framework: detectFramework(proc.name),
        })
      }

      // Clean up tracking for ports no longer active
      const activeKeys = new Set(result.map(p => `${p.port}-${p.protocol}`))
      for (const key of this.portTracking.keys()) {
        if (!activeKeys.has(key)) {
          this.portTracking.delete(key)
        }
      }

      // Sort by port number
      result.sort((a, b) => a.port - b.port)
      return result
    } catch (error) {
      console.error('Port scan error:', error)
      return []
    }
  }

  private async getListeningPorts(): Promise<
    Array<{ port: number; protocol: string; address: string; pid: number }>
  > {
    const { stdout } = await execAsync('netstat -ano -p TCP', {
      windowsHide: true,
    })

    const ports: Array<{
      port: number
      protocol: string
      address: string
      pid: number
    }> = []

    const lines = stdout.split('\n').map(l => l.trim()).filter(Boolean)

    for (const line of lines) {
      // Match lines with LISTENING state
      if (!line.includes('LISTENING')) continue

      const parts = line.split(/\s+/)
      if (parts.length < 5) continue

      const protocol = parts[0]
      const localAddr = parts[1]
      const state = parts[3]
      const pid = parseInt(parts[4])

      if (state !== 'LISTENING' || isNaN(pid) || pid === 0) continue

      const lastColon = localAddr.lastIndexOf(':')
      if (lastColon === -1) continue

      const address = localAddr.substring(0, lastColon)
      const port = parseInt(localAddr.substring(lastColon + 1))

      if (isNaN(port)) continue

      ports.push({ port, protocol, address, pid })
    }

    return ports
  }

  private async getProcessInfoMap(): Promise<Map<number, ProcessInfo>> {
    const processes = new Map<number, ProcessInfo>()

    try {
      const { stdout } = await execAsync(
        'tasklist /FO CSV /NH',
        { windowsHide: true, maxBuffer: 10 * 1024 * 1024 }
      )

      const lines = stdout.split('\n').filter(l => l.trim())

      for (const line of lines) {
        // Parse CSV: "name","pid","session","sessionNum","memUsage"
        const parts = line.split('","').map(s => s.replace(/^"|"$/g, ''))
        if (parts.length < 5) continue

        const name = parts[0]
        const pid = parseInt(parts[1])
        const memStr = parts[4].replace(/[^\d]/g, '')
        const memory = parseInt(memStr) * 1024 // Convert KB to bytes

        if (isNaN(pid)) continue

        processes.set(pid, {
          name,
          cpu: 0,
          memory: isNaN(memory) ? 0 : memory,
          cpuTime: 0,
        })
      }
    } catch (e) {
      console.error('tasklist error:', e)
    }

    // Try to get CPU time via wmic
    try {
      const { stdout } = await execAsync(
        'wmic process get ProcessId,KernelModeTime,UserModeTime /FORMAT:CSV',
        { windowsHide: true, maxBuffer: 10 * 1024 * 1024 }
      )

      const lines = stdout.split('\n').filter(l => l.trim())
      for (const line of lines) {
        const parts = line.split(',').map(s => s.trim())
        // CSV format: Node, KernelModeTime, ProcessId, UserModeTime
        if (parts.length < 4) continue

        const kernelTime = parseInt(parts[1]) || 0
        const pid = parseInt(parts[2])
        const userTime = parseInt(parts[3]) || 0
        const cpuTime = (kernelTime + userTime) / 10000000 // Convert 100ns to seconds

        if (isNaN(pid)) continue

        const proc = processes.get(pid)
        if (proc) {
          proc.cpuTime = cpuTime
        }
      }
    } catch (e) {
      console.error('wmic error:', e)
    }

    return processes
  }

  async killProcess(pid: number): Promise<boolean> {
    try {
      await execAsync(`taskkill /PID ${pid} /F /T`, { windowsHide: true })
      return true
    } catch {
      return false
    }
  }
}
