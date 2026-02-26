import { isCustomMatch, createTimer, findMatchingList, findMatchingBoolean } from './utils.js';



// Main function to run the check
async function checkCurrentTab(tabId, currentTab) {
  if (!currentTab.url) return;

  const timer = createTimer('Check Current Tab');
  const bookmarkTreeNodes = await chrome.bookmarks.getTree();
  const isSaved = await findMatchingBoolean(bookmarkTreeNodes, currentTab);
  timer.end();

  if (isSaved) {
    // Change icon to indicate "SAVED" (e.g., Green icon or badge)
    chrome.action.setBadgeText({ text: "YES", tabId: tabId });
    chrome.action.setBadgeBackgroundColor({ color: "green", tabId: tabId });
  } else {
    // Clear badge
    chrome.action.setBadgeText({ text: "", tabId: tabId });
  }
}

// Listeners
// Trigger when a tab is updated (e.g., user types a new URL)
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  try {
    if (changeInfo.status === 'complete' && tab.url) {
      checkCurrentTab(tabId, tab).catch(error => console.error("Error checking tab (on update):", error));
    }
  } catch (error) {
    console.error("Error fetching tab info (on update):", error);
  }
});

// Trigger when user switches tabs
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  try {
    const currentTab = await chrome.tabs.get(activeInfo.tabId);
    if (currentTab.url) {
      checkCurrentTab(activeInfo.tabId, currentTab).catch(error => console.error("Error checking tab (on activation):", error));
    }
  } catch (error) {
    console.error("Error fetching tab info (on activation):", error);
  }
});