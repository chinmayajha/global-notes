import { homedir } from 'os'
import { join } from 'path'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'

const CONFIG_DIR  = join(homedir(), '.config', 'globalnotes')
const CONFIG_FILE = join(CONFIG_DIR, 'config.json')
const QUEUE_FILE  = join(CONFIG_DIR, 'queue.json')

export interface Config {
  apiKey?: string
  serverUrl?: string
}

export interface QueuedNote {
  content: string
  source: string
  queued_at: string
}

export function loadConfig(): Config {
  if (!existsSync(CONFIG_FILE)) return {}
  try {
    return JSON.parse(readFileSync(CONFIG_FILE, 'utf8'))
  } catch {
    return {}
  }
}

export function saveConfig(cfg: Config): void {
  mkdirSync(CONFIG_DIR, { recursive: true })
  writeFileSync(CONFIG_FILE, JSON.stringify(cfg, null, 2))
}

export function loadQueue(): QueuedNote[] {
  if (!existsSync(QUEUE_FILE)) return []
  try {
    return JSON.parse(readFileSync(QUEUE_FILE, 'utf8'))
  } catch {
    return []
  }
}

export function saveQueue(queue: QueuedNote[]): void {
  mkdirSync(CONFIG_DIR, { recursive: true })
  writeFileSync(QUEUE_FILE, JSON.stringify(queue, null, 2))
}
