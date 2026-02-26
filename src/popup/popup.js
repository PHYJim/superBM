import { isCustomMatch, createTimer, findMatchingList } from '../utils.js';

//  Main function to run the bookmark check and display results in the popup
async function runBookmarkCheck() {
    try {
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        const currentTab = tabs[0];

        const bookmarkTreeNodes = await chrome.bookmarks.getTree();

        const timer = createTimer('Find Matching Bookmarks'); // Start timer for matching
        const matches = await findMatchingList(bookmarkTreeNodes, currentTab);
        timer.end(); // Log time taken for matching

        console.log('Bookmark Tree:', bookmarkTreeNodes);
        console.log('Current URL:', currentTab.url);
        console.log('Current Title:', currentTab.title);
        console.log('Matching bookmarks:', matches);

        // Display results
        const resultTitle = document.getElementById('result_title');
        const resultList = document.getElementById('result_list');

        if (matches.length > 0) {
            // Display matches in the popup
            resultTitle.textContent = `Found ${matches.length} matching bookmark(s)`;
            resultList.innerHTML = matches
                .map((bm) => `<li><strong>${bm.name}</strong><br><small>URL: ${bm.url}</small><br><small>Parent folder: ${bm.parentInfo.title}</small><br><small>Added date: ${bm.addDate}</small></li>`)
                .join('');
        } else {
            // No matches
            resultTitle.textContent = 'No matching bookmarks found';
            resultList.innerHTML = '';
        }

    } catch (error) {
        console.error("error:", error);
    }
}


// Add event listener to button and run on popup open
document.getElementById('checkBookmarks').addEventListener('click', runBookmarkCheck);
document.addEventListener('DOMContentLoaded', runBookmarkCheck); // Run on popup open as well