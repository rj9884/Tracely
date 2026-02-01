window.addEventListener('message', (event) => {
  if (event.origin !== 'http://localhost:5173') {
    return
  }

  if (event.data.type === 'TRACELY_SYNC_TOKEN') {
    chrome.runtime.sendMessage({
      type: 'SYNC_TOKEN',
      token: event.data.token,
    }, (response) => {
      if (response && response.success) {
        console.log('[Tracely] Token synced with extension')
      }
    })
  } else if (event.data.type === 'TRACELY_LOGOUT') {
    chrome.runtime.sendMessage({
      type: 'LOGOUT',
    }, (response) => {
      if (response && response.success) {
        console.log('[Tracely] Logged out from extension')
      }
    })
  }
})

window.postMessage({ type: 'TRACELY_EXTENSION_READY' }, '*')
