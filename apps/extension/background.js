// Set up context menu on install
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'save-selection',
    title: 'Save selection as note',
    contexts: ['selection'],
  })

  chrome.contextMenus.create({
    id: 'save-page',
    title: 'Save page as note',
    contexts: ['page'],
  })
})

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  const cfg = await chrome.storage.sync.get({ apiKey: '', serverUrl: 'https://global-notes.vercel.app' })
  if (!cfg.apiKey) {
    chrome.runtime.openOptionsPage()
    return
  }

  let content = ''
  if (info.menuItemId === 'save-selection' && info.selectionText) {
    content = `${info.selectionText}\n\n${tab?.title ?? ''}\n${info.pageUrl}`
  } else {
    content = `${tab?.title ?? ''}\n${info.pageUrl}`
  }

  await fetch(`${cfg.serverUrl}/api/notes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${cfg.apiKey}`,
    },
    body: JSON.stringify({
      content: content.trim(),
      source: 'extension',
      source_url: info.pageUrl ?? null,
      source_title: tab?.title ?? null,
    }),
  })
})
