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

export async function isUrlMatch(bookmarkUrlString, currentUrlString) {
  try {
    const bookmarkUrl = new URL(bookmarkUrlString);
    const currentUrl = new URL(currentUrlString);
    let count= 0;
    
    // Domain match (using custom logic)
    const domainMatchResult = await isDomainMatch(bookmarkUrlString, currentUrlString);
    const domainMatch = domainMatchResult ? 1.0 : 0.0;
    let totalSimilarity =  domainMatch;
    if (domainMatchResult) {
      count++;
    }

    // Path match (implement Weighted)
    if (bookmarkUrl.pathname && currentUrl.pathname) {
      const wholePathSimilarity =  stringSimilarity.compareTwoStrings(bookmarkUrl.pathname, currentUrl.pathname);
      const lastSegmentBookmark = bookmarkUrl.pathname.split('/').filter(Boolean).slice(-1)[0] || '';
      const lastSegmentCurrent = currentUrl.pathname.split('/').filter(Boolean).slice(-1)[0] || '';
      const lastSegmentMatch = stringSimilarity.compareTwoStrings(lastSegmentBookmark, lastSegmentCurrent);
      totalSimilarity += (wholePathSimilarity + lastSegmentMatch*4) / 5;
      count++;
    }


    if (bookmarkUrl.search && currentUrl.search) {
      console.log('Comparing queries:', bookmarkUrl.search, currentUrl.search);
      totalSimilarity += stringSimilarity.compareTwoStrings(bookmarkUrl.search, currentUrl.search);
      count++;
    }

    if (bookmarkUrl.hash && currentUrl.hash) {
      console.log('Comparing hashes:', bookmarkUrl.hash, currentUrl.hash);
      totalSimilarity += stringSimilarity.compareTwoStrings(bookmarkUrl.hash, currentUrl.hash);
      count++;
    }

    const avgSimilarity = count > 0 ? (totalSimilarity / count) : 0;
    const overallMatch = avgSimilarity > 0.8; // Adjust threshold as needed

    return [overallMatch, avgSimilarity];
  }
  catch (e) {
    // If URL parsing fails (e.g. javascript: URLs), return false
    return [false, 0];
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
export async function findMatchingList(nodes, currentTab,  mode = 'default', match = []) {
  for (const node of nodes) {
    const domainMatch = node.url && await isDomainMatch(node.url, currentTab.url);
    const [titleMatch, similarity] = await isTitleMatch(node.title, currentTab.title);
    const [urlMatch, urlSimilarity] = node.url ? await isUrlMatch(node.url, currentTab.url) : [false, 0];

    if (urlMatch && mode === 'default') {
      const parentInfo = await chrome.bookmarks.get(node.parentId);
      match.push({
        node: node,
        id: node.id,
        name: node.title,
        url: node.url,
        parentId: node.parentId,
        addDate: new Date(node.dateAdded).toISOString().split('T')[0],
        similarity: urlSimilarity.toFixed(2),
        parentInfo: parentInfo[0]
      });
      continue;
    }

    if (domainMatch && titleMatch && mode === 'default') {
      const parentInfo = await chrome.bookmarks.get(node.parentId);
      // Store matches info to results (may need to change by settings, later)
      match.push({
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
    if (mode === 'debug') {
      match.push({
        name: node.title,
        url: node.url,
        addDate: new Date(node.dateAdded).toISOString().split('T')[0],
        urlMatch: domainMatch,
        titleMatch: titleMatch,
        titleSimilarity: similarity.toFixed(2),
      });
    }
    // If it's a folder, search recursively
    if (node.children) {
      await findMatchingList(node.children, currentTab, mode, match);
    }
  }
  return match;
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