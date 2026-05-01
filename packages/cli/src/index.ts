#!/usr/bin/env node
'use strict'

import { loadConfig, saveConfig, loadQueue, saveQueue } from './config'
import { ApiClient } from './api-client'
import type { QueuedNote } from './config'

const DEFAULT_SERVER = 'https://global-notes.vercel.app'

function getClient(): ApiClient | null {
  const cfg = loadConfig()
  if (!cfg.apiKey) {
    console.error('No API key set. Run: gn config --set-key <your-api-key>')
    return null
  }
  return new ApiClient(cfg.serverUrl ?? DEFAULT_SERVER, cfg.apiKey)
}

async function flushQueue(client: ApiClient): Promise<void> {
  const queue = loadQueue()
  if (queue.length === 0) return

  const alive = await client.health()
  if (!alive) return

  const failed: QueuedNote[] = []
  for (const item of queue) {
    try {
      await client.createNote(item.content)
    } catch {
      failed.push(item)
    }
  }

  saveQueue(failed)
  if (failed.length < queue.length) {
    console.log(`Flushed ${queue.length - failed.length} queued note(s).`)
  }
}

async function cmdAdd(content: string): Promise<void> {
  const client = getClient()
  if (!client) return

  // Try to flush offline queue first
  await flushQueue(client)

  const alive = await client.health()
  if (!alive) {
    const queue = loadQueue()
    queue.push({ content, source: 'cli', queued_at: new Date().toISOString() })
    saveQueue(queue)
    console.log('Offline — note queued locally. Will sync when connected.')
    return
  }

  try {
    const note = await client.createNote(content)
    console.log(`Saved  ${note.id.slice(0, 8)}  ${new Date(note.created_at).toLocaleTimeString()}`)
  } catch (err) {
    console.error('Failed to save:', (err as Error).message)
    process.exit(1)
  }
}

async function cmdList(): Promise<void> {
  const client = getClient()
  if (!client) return

  const result = await client.listNotes()
  if (result.notes.length === 0) {
    console.log('No notes yet.')
    return
  }

  for (const note of result.notes) {
    const date  = new Date(note.created_at).toLocaleString()
    const tags  = note.tags.length > 0 ? `  ${note.tags.map(t => `#${t}`).join(' ')}` : ''
    const first = note.content.split('\n')[0].slice(0, 80)
    console.log(`${note.id.slice(0, 8)}  ${date}  ${first}${tags}`)
  }

  if (result.has_more) {
    console.log(`\n… ${result.total - result.notes.length} more. Use --page 2 for next page.`)
  }
}

async function cmdSearch(q: string): Promise<void> {
  const client = getClient()
  if (!client) return

  const result = await client.searchNotes(q)
  if (result.notes.length === 0) {
    console.log(`No results for "${q}"`)
    return
  }

  for (const note of result.notes) {
    const date  = new Date(note.created_at).toLocaleString()
    const first = note.content.split('\n')[0].slice(0, 80)
    console.log(`${note.id.slice(0, 8)}  ${date}  ${first}`)
  }
}

function cmdConfig(args: string[]): void {
  const cfg = loadConfig()

  if (args[0] === '--set-key' && args[1]) {
    cfg.apiKey = args[1]
    saveConfig(cfg)
    console.log('API key saved.')
    return
  }

  if (args[0] === '--set-server' && args[1]) {
    cfg.serverUrl = args[1]
    saveConfig(cfg)
    console.log(`Server URL set to: ${args[1]}`)
    return
  }

  if (args[0] === '--show') {
    const key = cfg.apiKey ? `${cfg.apiKey.slice(0, 8)}…` : '(not set)'
    console.log(`API key:    ${key}`)
    console.log(`Server URL: ${cfg.serverUrl ?? DEFAULT_SERVER}`)
    return
  }

  console.log('Usage:')
  console.log('  gn config --set-key <key>')
  console.log('  gn config --set-server <url>')
  console.log('  gn config --show')
}

function printHelp(): void {
  console.log(`
gn — global notes CLI

Usage:
  gn "your thought"        Save a note
  echo "thought" | gn      Pipe text as a note
  gn list                  List recent notes
  gn search <query>        Full-text search
  gn config --set-key <k>  Set API key
  gn config --show         Show current config
  gn --help                Show this help
`.trim())
}

async function main(): Promise<void> {
  const args = process.argv.slice(2)

  // Read from stdin if piped
  if (!process.stdin.isTTY && args.length === 0) {
    const chunks: Buffer[] = []
    for await (const chunk of process.stdin) chunks.push(chunk)
    const content = Buffer.concat(chunks).toString('utf8').trim()
    if (content) await cmdAdd(content)
    return
  }

  const [cmd, ...rest] = args

  if (!cmd || cmd === '--help' || cmd === '-h') { printHelp(); return }

  if (cmd === 'list')   { await cmdList(); return }
  if (cmd === 'search') { await cmdSearch(rest.join(' ')); return }
  if (cmd === 'config') { cmdConfig(rest); return }

  // Default: treat first arg as note content
  await cmdAdd(args.join(' '))
}

main().catch(err => {
  console.error(err.message)
  process.exit(1)
})
