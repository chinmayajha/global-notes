// Service worker — offline queue for note capture.
// When a POST to /api/notes fails due to network error,
// it is stored in IndexedDB and retried via Background Sync.

const DB_NAME    = 'gn-offline'
const STORE_NAME = 'queue'

function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => req.result.createObjectStore(STORE_NAME, { autoIncrement: true })
    req.onsuccess = () => resolve(req.result)
    req.onerror   = () => reject(req.error)
  })
}

async function enqueue(body) {
  const db    = await openDb()
  const tx    = db.transaction(STORE_NAME, 'readwrite')
  const store = tx.objectStore(STORE_NAME)
  store.add(body)
  return new Promise((res, rej) => { tx.oncomplete = res; tx.onerror = rej })
}

async function flushQueue() {
  const db    = await openDb()
  const tx    = db.transaction(STORE_NAME, 'readwrite')
  const store = tx.objectStore(STORE_NAME)
  const all   = await new Promise((res, rej) => {
    const req = store.getAll()
    req.onsuccess = () => res(req.result)
    req.onerror   = () => rej(req.error)
  })

  for (const item of all) {
    try {
      await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      })
    } catch {
      return // Still offline, stop
    }
  }

  // Clear queue if all succeeded
  store.clear()
}

self.addEventListener('fetch', event => {
  const req = event.request
  if (req.method !== 'POST' || !req.url.includes('/api/notes')) return

  event.respondWith(
    fetch(req.clone()).catch(async () => {
      const body = await req.json().catch(() => ({}))
      await enqueue(body)
      return new Response(JSON.stringify({ queued: true }), {
        status: 202,
        headers: { 'Content-Type': 'application/json' },
      })
    })
  )
})

self.addEventListener('sync', event => {
  if (event.tag === 'flush-notes') {
    event.waitUntil(flushQueue())
  }
})

self.addEventListener('online', () => flushQueue())
