const DEFAULT_SERVER = 'https://global-notes.vercel.app'

async function getConfig() {
  return chrome.storage.sync.get({ apiKey: '', serverUrl: DEFAULT_SERVER })
}

async function init() {
  const cfg = await getConfig()

  if (!cfg.apiKey) {
    document.getElementById('main').style.display = 'none'
    document.getElementById('not-configured').style.display = 'block'
    document.getElementById('open-options').addEventListener('click', () => {
      chrome.runtime.openOptionsPage()
    })
    return
  }

  const textarea = document.getElementById('content')
  const btn      = document.getElementById('save')
  const status   = document.getElementById('status')

  // Pre-fill with page title + URL
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  if (tab) {
    const title = tab.title ?? ''
    const url   = tab.url  ?? ''
    // Check if there's selected text via message to content script
    try {
      const resp = await chrome.tabs.sendMessage(tab.id, { type: 'GET_SELECTION' })
      if (resp?.selection) {
        textarea.value = `${resp.selection}\n\n${title}\n${url}`
      } else {
        textarea.value = `${title}\n${url}`
      }
    } catch {
      textarea.value = `${title}\n${url}`
    }
    textarea.select()
  }

  const save = async () => {
    const content = textarea.value.trim()
    if (!content) return

    btn.disabled = true
    status.textContent = 'Saving…'

    try {
      const res = await fetch(`${cfg.serverUrl}/api/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${cfg.apiKey}`,
        },
        body: JSON.stringify({
          content,
          source: 'extension',
          source_url: tab?.url ?? null,
          source_title: tab?.title ?? null,
        }),
      })

      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      status.textContent = 'Saved!'
      setTimeout(() => window.close(), 600)
    } catch (err) {
      status.textContent = `Error: ${err.message}`
      btn.disabled = false
    }
  }

  btn.addEventListener('click', save)

  document.addEventListener('keydown', e => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault()
      save()
    }
    if (e.key === 'Escape') window.close()
  })
}

init()
