// Shared utility functions

export function isCustomMatch(currentUrlString, bookmarkUrlString) {
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
