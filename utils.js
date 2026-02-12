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
