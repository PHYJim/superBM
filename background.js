// background.js

// 1. YOUR CUSTOM LOGIC HERE
// This function compares the current Tab URL vs a Bookmark URL
function isCustomMatch(currentUrlString, bookmarkUrlString) {
  try {
    const currentUrl = new URL(currentUrlString);
    const bookmarkUrl = new URL(bookmarkUrlString);

    // Example Logic: Ignore the subdomains (www, uk, etc.) and protocol
    // So 'https://www.google.com/maps' matches 'http://uk.google.com/maps'
    
    // Get host parts (e.g., ["www", "example", "com"])
    const currentHostParts = currentUrl.hostname.split('.');
    const bookmarkHostParts = bookmarkUrl.hostname.split('.');

    // simplistic approach: check if the last two parts match (example.com)
    // Note: This is where you write your complex logic
    const currentDomain = currentHostParts.slice(-2).join('.');
    const bookmarkDomain = bookmarkHostParts.slice(-2).join('.');

    const domainMatch = currentDomain === bookmarkDomain;
    const pathMatch = currentUrl.pathname === bookmarkUrl.pathname;

    return domainMatch && pathMatch;

  } catch (e) {
    // If URL parsing fails (e.g. javascript: URLs), return false
    return false;
  }
}

// 2. Function to traverse the Bookmark Tree
function searchBookmarks(bookmarkNodes, currentUrl) {
  for (const node of bookmarkNodes) {
    // If it's a URL (leaf node)
    if (node.url) {
      if (isCustomMatch(currentUrl, node.url)) {
        return true; // Match found!
      }
    }
    // If it's a folder, search recursively
    if (node.children) {
      const foundInChildren = searchBookmarks(node.children, currentUrl);
      if (foundInChildren) return true;
    }
  }
  return false;
}

// 3. Main function to run the check
function checkCurrentTab(tabId, tabUrl) {
  if (!tabUrl) return;

  chrome.bookmarks.getTree((bookmarkTreeNodes) => {
    const isSaved = searchBookmarks(bookmarkTreeNodes, tabUrl);

    if (isSaved) {
      // Change icon to indicate "SAVED" (e.g., Green icon or badge)
      chrome.action.setBadgeText({ text: "YES", tabId: tabId });
      chrome.action.setBadgeBackgroundColor({ color: "green", tabId: tabId });
    } else {
      // Clear badge or set to "NO"
      chrome.action.setBadgeText({ text: "", tabId: tabId });
    }
  });
}

// 4. Listeners
// Trigger when a tab is updated (e.g., user types a new URL)
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    checkCurrentTab(tabId, tab.url);
  }
});

// Trigger when user switches tabs
chrome.tabs.onActivated.addListener((activeInfo) => {
  chrome.tabs.get(activeInfo.tabId, (tab) => {
    if (tab.url) {
      checkCurrentTab(activeInfo.tabId, tab.url);
    }
  });
});