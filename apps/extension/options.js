const DEFAULT_SERVER = 'https://global-notes.vercel.app'

async function init() {
  const cfg = await chrome.storage.sync.get({ apiKey: '', serverUrl: DEFAULT_SERVER })
  document.getElementById('apiKey').value    = cfg.apiKey
  document.getElementById('serverUrl').value = cfg.serverUrl || DEFAULT_SERVER

  document.getElementById('save').addEventListener('click', async () => {
    await chrome.storage.sync.set({
      apiKey:    document.getElementById('apiKey').value.trim(),
      serverUrl: document.getElementById('serverUrl').value.trim() || DEFAULT_SERVER,
    })
    const saved = document.getElementById('saved')
    saved.style.display = 'block'
    setTimeout(() => { saved.style.display = 'none' }, 2000)
  })
}

init()
