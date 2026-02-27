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




// add context menu item
chrome.runtime.onInstalled.addListener(async () => {
  chrome.contextMenus.create({
    id: "checkCurrentText",
    title: "Check '%s' in Bookmarks",
    contexts: ["selection", "link"]
    // icons: "xxx"
  });
});

chrome.contextMenus.onClicked.addListener(async (Info, tab) => {
  try {
    console.log("Context menu clicked with info:", Info);
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: getLinksFromSelection,
    });
    const list = results[0].result; // Get the returned links from the content script
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: showModal,
      args: [list]
    });

    console.log("Links from selection:", results);
  } catch (error) {
    console.error("Error handling context menu click:", error);
  }
});


function getLinksFromSelection() {
  const selection = window.getSelection();
  // Create a temporary container to hold the HTML of the selection
  const container = document.createElement("div");
  for (let i = 0; i < selection.rangeCount; i++) {
    container.appendChild(selection.getRangeAt(i).cloneContents());
  }

  // Find all links inside that selection
  const links = container.querySelectorAll("a");
  
  // Return an array of objects with text and href
  return Array.from(links).map(link => ({
    title: link.innerText,
    url: link.href
  }));
}


// ==========================================
// FUNCTION 2: Show Modal UI (Runs in Page)
// ==========================================
function showModal(links) {
  // 1. Remove existing modal if open
  const existing = document.getElementById('superbm-host');
  if (existing) existing.remove();

  // 2. Create Host for Shadow DOM (isolates styles)
  const host = document.createElement('div');
  host.id = "superbm-host";
  // Ensure it's on top of everything
  host.style.position = 'fixed';
  host.style.zIndex = '2147483647'; 
  host.style.top = '0';
  host.style.left = '0';
  document.body.appendChild(host);

  // 3. Attach Shadow DOM
  const shadow = host.attachShadow({ mode: 'open' });

  // 4. Define CSS for the modal
  const style = document.createElement('style');
  style.textContent = `
    .modal-overlay {
      position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
      background: rgba(0,0,0,0.5);
      display: flex; justify-content: center; align-items: center;
    }
    .modal-box {
      background: white; padding: 20px; border-radius: 8px;
      width: 400px; max-height: 80vh; overflow-y: auto;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      font-family: sans-serif;
    }
    h2 { margin-top: 0; color: #333; font-size: 18px; }
    ul { list-style: none; padding: 0; }
    li { border-bottom: 1px solid #eee; padding: 8px 0; }
    a { color: #007bff; text-decoration: none; word-break: break-all; }
    a:hover { text-decoration: underline; }
    .close-btn {
      margin-top: 15px; padding: 8px 16px; background: #333; 
      color: white; border: none; border-radius: 4px; cursor: pointer; float: right;
    }
    .close-btn:hover { background: #555; }
    .label { font-weight: bold; font-size: 12px; color: #666; display: block; }
  `;

  // 5. Build HTML Content
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  
  const box = document.createElement('div');
  box.className = 'modal-box';

  const title = document.createElement('h2');
  title.textContent = `Found ${links.length} Links`;
  
  const list = document.createElement('ul');
  
  if (links.length === 0) {
    list.innerHTML = `<li style="color: #666; text-align: center;">No links in selection</li>`;
  } else {
    links.forEach(link => {
      const li = document.createElement('li');
      li.innerHTML = `
        <span class="label">${link.title}</span>
        <a href="${link.url}" target="_blank">${link.url}</a>
      `;
      list.appendChild(li);
    });
  }

  const closeBtn = document.createElement('button');
  closeBtn.className = 'close-btn';
  closeBtn.textContent = 'Close';
  
  // Close Logic
  closeBtn.onclick = () => host.remove();
  overlay.onclick = (e) => {
    if (e.target === overlay) host.remove();
  };

  // Assemble
  box.appendChild(title);
  box.appendChild(list);
  box.appendChild(closeBtn);
  overlay.appendChild(box);
  shadow.appendChild(style);
  shadow.appendChild(overlay);
}