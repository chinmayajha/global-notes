// Respond to selection queries from popup
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type === 'GET_SELECTION') {
    const selection = window.getSelection()?.toString().trim() ?? ''
    sendResponse({ selection })
  }
  return true
})
