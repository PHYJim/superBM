// filepath: c:\Users\jim.pau\vscode\superBM\popup\popup.js
import { isCustomMatch } from '../utils.js';

document.getElementById('checkBookmarks').addEventListener('click', async () => {
    try {
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        const currentUrl = tabs[0].url;

        const bookmarkTreeNodes = await chrome.bookmarks.getTree();

        const matches = await findMatchingBookmarks(bookmarkTreeNodes, currentUrl);

        console.log('Bookmark Tree:', bookmarkTreeNodes);
        console.log('Current URL:', currentUrl);
        console.log('Matching bookmarks:', matches);

        // Display results
        const resultTitle = document.getElementById('result_title');
        const resultList = document.getElementById('result_list');

            if (matches.length > 0) {
                resultTitle.textContent = `Found ${matches.length} matching bookmark(s)`;
                resultList.innerHTML = matches
                    .map((bm) => `<li><strong>${bm.name}</strong><br><small>${bm.url}</small><br><small>Parent: ${bm.parentInfo.title}</small></li>`)
                    .join('');
            } else {
                resultTitle.textContent = 'No matching bookmarks found';
                resultList.innerHTML = '';
            }

        } catch (error) {
            // 使用 async/await 的好處是可以用 try/catch 抓錯誤
            console.error("發生錯誤:", error);
        }
    });

async function findMatchingBookmarks(nodes, currentUrl, results = []) {
    for (const node of nodes) {
        if (node.url && await isCustomMatch(currentUrl, node.url)) {
            const parentInfo = await chrome.bookmarks.get(node.parentId);
            results.push({ 
                node: node,
                Id: node.id,
                name: node.title,
                url: node.url, 
                parentId: node.parentId, 
                parentInfo: parentInfo[0]
            });
        }
        if (node.children) {
            await findMatchingBookmarks(node.children, currentUrl, results);
        }
    }
    return results;
}