// Shared utility functions

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

export async function isCustomMatch(currentUrlString, bookmarkUrlString) {
  try {
    const currentUrl = new URL(currentUrlString);
    const bookmarkUrl = new URL(bookmarkUrlString);

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


// Function to find matches list
export async function findMatchingList(nodes, currentUrl, results = []) {
  for (const node of nodes) {
    if (node.url && await isCustomMatch(currentUrl, node.url)) {
      const parentInfo = await chrome.bookmarks.get(node.parentId);
      // Store matches info to results (may need to change by settings, later)
      results.push({
        node: node,
        id: node.id,
        name: node.title,
        url: node.url,
        parentId: node.parentId,
        addDate: new Date(node.dateAdded).toISOString().split('T')[0],
        parentInfo: parentInfo[0]
      });
    }
    // If it's a folder, search recursively
    if (node.children) {
      await findMatchingList(node.children, currentUrl, results);
    }
  }
  return results;
}

// Functtion to find matches (yes or no)
export async function findMatchingBoolean(nodes, currentUrl) {
  for (const node of nodes) {
    if (node.url && await isCustomMatch(currentUrl, node.url)) {
      return true; // Match found!
    }
    // If it's a folder, search recursively
    if (node.children) {
      const foundInChildren = await findMatchingBoolean(node.children, currentUrl);
      if (foundInChildren) return true;
    }
  }
  return false;
}