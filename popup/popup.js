// filepath: c:\Users\jim.pau\vscode\superBM\popup\popup.js
import { isCustomMatch } from '../utils.js';

document.getElementById('checkBookmarks').addEventListener('click', () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const currentUrl = tabs[0].url;

        chrome.bookmarks.getTree()
            .then((bookmarkTreeNodes) => {
            
                const matches = findMatchingBookmarks(bookmarkTreeNodes, currentUrl);
                console.log('Bookmark Tree:', bookmarkTreeNodes); // Log the entire bookmark tree for debugging
                // Log bookmarks to console
                console.log('Current URL:', currentUrl);
                console.log('Matching bookmarks:', matches);

                // Display results
                const resultTitle = document.getElementById('result_title');
                const resultList = document.getElementById('result_list');

                if (matches.length > 0) {
                    resultTitle.textContent = `Found ${matches.length} matching bookmark(s)`;
                    resultList.innerHTML = matches
                        .map((bm) => `<li><strong>${bm.name}</strong><br><small>${bm.url}</small></li>`)
                        .join('');
                } else {
                    resultTitle.textContent = 'No matching bookmarks found';
                    resultList.innerHTML = '';
                }
            });
    });
});

function findMatchingBookmarks(nodes, currentUrl, results = []) {
    for (const node of nodes) {
        if (node.url && isCustomMatch(currentUrl, node.url)) {
            results.push({ 
                node: node,
                Id: node.id,
                name: node.title,
                url: node.url, 
                parentId: node.parentId});
        }
        if (node.children) {
            findMatchingBookmarks(node.children, currentUrl, results);
        }
    }
    return results;
}