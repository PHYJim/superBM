// Shared utility functions
import stringSimilarity from 'string-similarity';


// Timer utility for performance measurement
export function createTimer(label = 'Operation') {
  const start = performance.now();

  return {
    end: () => {
      const end = performance.now();
      const duration = (end - start).toFixed(2);
      console.log(`⏱️ [${label}] took ${duration}ms`);
      return duration;
    }
  };
}

export async function isCustomMatch(bookmarkUrlString, currentUrlString) {
  try {
    const bookmarkUrl = new URL(bookmarkUrlString);
    const currentUrl = new URL(currentUrlString);

    // simplistic approach: check if the last two parts match (example.com)
    // Note: This is where you write your complex logic
    const currentDomain = currentUrl.hostname.split('.').slice(-2).join('.');
    const bookmarkDomain = bookmarkUrl.hostname.split('.').slice(-2).join('.');

    return currentDomain === bookmarkDomain && currentUrl.pathname === bookmarkUrl.pathname;

  } catch (e) {
    // If URL parsing fails (e.g. javascript: URLs), return false
    return false;
  }
}

export async function isDomainMatch(bookmarkUrlString, currentUrlString) {
  try {
    const bookmarkUrl = new URL(bookmarkUrlString);
    const currentUrl = new URL(currentUrlString);

    const currentDomain = currentUrl.hostname.split('.').slice(-2).join('.');
    const bookmarkDomain = bookmarkUrl.hostname.split('.').slice(-2).join('.');

    return currentDomain === bookmarkDomain;

  } catch (e) {
    // If URL parsing fails (e.g. javascript: URLs), return false
    return false;
  }
}

export async function isTitleMatch(bookmarkTitle, currentTitle, threshold = 0.85) {
  try {
    const similarity = stringSimilarity.compareTwoStrings(bookmarkTitle, currentTitle);
    return [similarity > threshold, similarity]; // Adjust threshold as needed
  } catch (e) {
    // If comparison fails, return false
    return [false, 0];
  }
}

// Function to find matches list
export async function findMatchingList(nodes, currentTab, results = []) {
  for (const node of nodes) {

    const domainMatch = node.url && await isDomainMatch(node.url, currentTab.url);
    const [titleMatch, similarity] = await isTitleMatch(node.title, currentTab.title);

    if (domainMatch && titleMatch) {
      const parentInfo = await chrome.bookmarks.get(node.parentId);
      // Store matches info to results (may need to change by settings, later)
      results.push({
        node: node,
        id: node.id,
        name: node.title,
        url: node.url,
        parentId: node.parentId,
        addDate: new Date(node.dateAdded).toISOString().split('T')[0],
        similarity: similarity.toFixed(2),
        parentInfo: parentInfo[0]
      });
    }
    // If it's a folder, search recursively
    if (node.children) {
      await findMatchingList(node.children, currentTab, results);
    }
  }
  return results;
}

// Function to find matches (yes or no)
export async function findMatchingBoolean(nodes, currentTab) {
  for (const node of nodes) {
    
    const domainMatch = node.url && await isDomainMatch(node.url, currentTab.url);
    const [titleMatch, similarity] = await isTitleMatch(node.title, currentTab.title);

    if (domainMatch && titleMatch) {
      return true; // Match found!
    }
    // If it's a folder, search recursively
    if (node.children) {
      const foundInChildren = await findMatchingBoolean(node.children, currentTab);
      if (foundInChildren) return true;
    }
  }
  return false;
}