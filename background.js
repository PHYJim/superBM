// background.js
import { isCustomMatch } from './utils.js';

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