export function saveUserToken(token) {
  return new Promise((resolve) => {
    chrome.storage.local.set({ userToken: token }, () => {
      console.log('[Tracely] User token saved')
      resolve()
    })
  })
}

export function getUserToken() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['userToken'], (result) => {
      resolve(result.userToken || null)
    })
  })
}

export function removeUserToken() {
  return new Promise((resolve) => {
    chrome.storage.local.remove(['userToken'], () => {
      console.log('[Tracely] User token removed')
      resolve()
    })
  })
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'SYNC_TOKEN') {
    saveUserToken(request.token).then(() => {
      sendResponse({ success: true })
    })
    return true
  } else if (request.type === 'LOGOUT') {
    removeUserToken().then(() => {
      sendResponse({ success: true })
    })
    return true
  }
})
