// TABSTONE Background Service Worker
// Handles extension lifecycle and cross-component communication

// Extension installation handler
chrome.runtime.onInstalled.addListener((details) => {
  console.log('TABSTONE extension installed:', details.reason);
  
  if (details.reason === 'install') {
    // First time installation
    console.log('Welcome to TABSTONE! Your tab graveyard awaits...');
  }
});

// Message handling infrastructure
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Background received message:', request);
  
  switch (request.action) {
    case 'GET_CURRENT_TABS':
      handleGetCurrentTabs(sendResponse);
      return true;
      
    case 'BURY_ALL_TABS':
      handleBuryAllTabs(request.groupName, sendResponse);
      return true;
      
    case 'BURY_SELECTED_TABS':
      handleBurySelectedTabs(request.groupName, request.tabIds, sendResponse);
      return true;
      
    case 'BURY_SINGLE_TAB':
      handleBurySingleTab(request.groupName, request.tabId, sendResponse);
      return true;
      
    case 'GET_ALL_GROUPS':
      handleGetAllGroups(sendResponse);
      return true;
      
    case 'RESURRECT_TAB':
      handleResurrectTab(request.url, sendResponse);
      return true;
      
    case 'RESURRECT_GROUP':
      handleResurrectGroup(request.groupName, sendResponse);
      return true;
      
    case 'DELETE_GROUP':
      handleDeleteGroup(request.groupName, sendResponse);
      return true;
      
    case 'DELETE_TAB':
      handleDeleteTab(request.groupName, request.tabIndex, sendResponse);
      return true;
      
    case 'OPEN_GRAVEYARD':
      handleOpenGraveyard(sendResponse);
      return true;
      
    default:
      console.error('Unknown action:', request.action);
      sendResponse({ success: false, error: 'Unknown action' });
      return false;
  }
});

// Handle getting current tabs
async function handleGetCurrentTabs(sendResponse) {
  try {
    const tabs = await getCurrentTabs();
    sendResponse({ success: true, tabs });
  } catch (error) {
    console.error('Error getting current tabs:', error);
    sendResponse({ success: false, error: error.message });
  }
}

// Handle burying all tabs (with warning)
async function handleBuryAllTabs(groupName, sendResponse) {
  try {
    console.log('Burying all tabs for group:', groupName);
    
    // Get current tabs
    const tabs = await getCurrentTabs();
    
    if (tabs.length === 0) {
      sendResponse({ success: false, error: 'No tabs to bury' });
      return;
    }
    
    // Save to storage
    await saveTabGroup(groupName, tabs);
    
    // Close tabs
    const tabIds = tabs.map(tab => tab.id);
    await closeTabs(tabIds);
    
    sendResponse({ success: true, message: `Buried ${tabs.length} tabs in "${groupName}"` });
    
  } catch (error) {
    console.error('Error burying all tabs:', error);
    sendResponse({ success: false, error: error.message });
  }
}

// Handle burying selected tabs
async function handleBurySelectedTabs(groupName, tabIds, sendResponse) {
  try {
    console.log('Burying selected tabs for group:', groupName, 'Tab IDs:', tabIds);
    
    if (!tabIds || tabIds.length === 0) {
      sendResponse({ success: false, error: 'No tabs selected' });
      return;
    }
    
    // Get tab details for selected tabs with better error handling
    const tabs = await getTabsByIds(tabIds);
    
    if (tabs.length === 0) {
      sendResponse({ success: false, error: 'No valid tabs found. Some tabs may have been closed or are no longer accessible.' });
      return;
    }
    
    // Validate that we have the expected number of tabs
    if (tabs.length !== tabIds.length) {
      console.warn(`Expected ${tabIds.length} tabs but found ${tabs.length}. Some tabs may have been closed.`);
    }
    
    // Save to storage
    await saveTabGroup(groupName, tabs);
    
    // Close only the tabs that were successfully retrieved
    const validTabIds = tabs.map(tab => tab.id);
    await closeTabs(validTabIds);
    
    sendResponse({ 
      success: true, 
      message: `Buried ${tabs.length} selected tabs in "${groupName}"${tabs.length !== tabIds.length ? ' (some tabs were already closed)' : ''}` 
    });
    
  } catch (error) {
    console.error('Error burying selected tabs:', error);
    sendResponse({ success: false, error: error.message });
  }
}

// Handle burying a single tab
async function handleBurySingleTab(groupName, tabId, sendResponse) {
  try {
    console.log('Burying single tab for group:', groupName, 'Tab ID:', tabId);
    
    // Get tab details
    const tab = await getTabById(tabId);
    
    if (!tab) {
      sendResponse({ success: false, error: 'Tab not found' });
      return;
    }
    
    // Save to storage
    await saveTabGroup(groupName, [tab]);
    
    // Close the tab
    await closeTabs([tabId]);
    
    sendResponse({ success: true, message: `Buried "${tab.title}" in "${groupName}"` });
    
  } catch (error) {
    console.error('Error burying single tab:', error);
    sendResponse({ success: false, error: error.message });
  }
}

// Handle getting all groups
async function handleGetAllGroups(sendResponse) {
  try {
    const groups = await getAllTabGroups();
    sendResponse({ success: true, groups });
  } catch (error) {
    console.error('Error getting groups:', error);
    sendResponse({ success: false, error: error.message });
  }
}

// Handle resurrecting a single tab
async function handleResurrectTab(url, sendResponse) {
  try {
    await openTab(url);
    sendResponse({ success: true });
  } catch (error) {
    console.error('Error resurrecting tab:', error);
    sendResponse({ success: false, error: error.message });
  }
}

// Handle resurrecting an entire group
async function handleResurrectGroup(groupName, sendResponse) {
  try {
    const group = await getTabGroup(groupName);
    if (!group) {
      sendResponse({ success: false, error: 'Group not found' });
      return;
    }
    
    const urls = group.tabs.map(tab => tab.url);
    await openMultipleTabs(urls);
    
    sendResponse({ success: true, message: `Resurrected ${urls.length} tabs from "${groupName}"` });
  } catch (error) {
    console.error('Error resurrecting group:', error);
    sendResponse({ success: false, error: error.message });
  }
}

// Handle deleting a group
async function handleDeleteGroup(groupName, sendResponse) {
  try {
    await deleteTabGroup(groupName);
    sendResponse({ success: true, message: `Deleted group "${groupName}"` });
  } catch (error) {
    console.error('Error deleting group:', error);
    sendResponse({ success: false, error: error.message });
  }
}

// Handle deleting a tab from a group
async function handleDeleteTab(groupName, tabIndex, sendResponse) {
  try {
    await deleteTabFromGroup(groupName, tabIndex);
    sendResponse({ success: true });
  } catch (error) {
    console.error('Error deleting tab:', error);
    sendResponse({ success: false, error: error.message });
  }
}

// Handle opening the graveyard page
async function handleOpenGraveyard(sendResponse) {
  try {
    const graveyardUrl = chrome.runtime.getURL('graveyard/graveyard.html');
    await openTab(graveyardUrl);
    sendResponse({ success: true });
  } catch (error) {
    console.error('Error opening graveyard:', error);
    sendResponse({ success: false, error: error.message });
  }
}

// Tab management functions
async function getCurrentTabs() {
  const tabs = await chrome.tabs.query({ currentWindow: true });
  return tabs.map(tab => ({
    id: tab.id,
    title: tab.title,
    url: tab.url,
    favIconUrl: tab.favIconUrl || null,
    buriedAt: new Date().toISOString()
  }));
}

async function getTabsByIds(tabIds) {
  try {
    const tabs = [];
    // chrome.tabs.query doesn't support tabIds parameter, so we need to get each tab individually
    for (const tabId of tabIds) {
      try {
        const tab = await chrome.tabs.get(tabId);
        tabs.push({
          id: tab.id,
          title: tab.title,
          url: tab.url,
          favIconUrl: tab.favIconUrl || null,
          buriedAt: new Date().toISOString()
        });
      } catch (error) {
        console.warn(`Tab with ID ${tabId} not found or inaccessible:`, error.message);
        // Skip this tab and continue with others
      }
    }
    return tabs;
  } catch (error) {
    console.error('Error getting tabs by IDs:', error);
    // Return empty array if query fails, let the calling function handle it
    return [];
  }
}

async function getTabById(tabId) {
  try {
    const tab = await chrome.tabs.get(tabId);
    return {
      id: tab.id,
      title: tab.title,
      url: tab.url,
      favIconUrl: tab.favIconUrl || null,
      buriedAt: new Date().toISOString()
    };
  } catch (error) {
    console.warn(`Tab with ID ${tabId} not found or inaccessible:`, error.message);
    return null;
  }
}

async function closeTabs(tabIds) {
  try {
    await chrome.tabs.remove(tabIds);
  } catch (error) {
    console.warn('Error closing tabs (some may already be closed):', error);
    // Don't throw the error - some tabs might already be closed
    // This is expected behavior when tabs are closed by the user or other extensions
  }
}

async function openTab(url) {
  await chrome.tabs.create({ url });
}

async function openMultipleTabs(urls) {
  for (const url of urls) {
    await chrome.tabs.create({ url });
  }
}

// Storage management functions
async function saveTabGroup(groupName, tabs, preserveTimestamp = false) {
  let timestamp;
  
  if (preserveTimestamp) {
    // Preserve existing timestamp when updating a group
    const existing = await chrome.storage.local.get(groupName);
    timestamp = existing[groupName]?.timestamp || new Date().toISOString();
  } else {
    // Create new timestamp for new groups
    timestamp = new Date().toISOString();
  }
  
  const groupData = {
    timestamp: timestamp,
    tabs: tabs
  };
  // Merge with existing groups
  const existing = await chrome.storage.local.get(null);
  existing[groupName] = groupData;
  await chrome.storage.local.set(existing);
}

async function getAllTabGroups() {
  const result = await chrome.storage.local.get(null);
  return result;
}

async function getTabGroup(groupName) {
  const result = await chrome.storage.local.get(groupName);
  return result[groupName];
}

async function deleteTabGroup(groupName) {
  await chrome.storage.local.remove(groupName);
}

async function deleteTabFromGroup(groupName, tabIndex) {
  const group = await getTabGroup(groupName);
  if (!group) {
    throw new Error('Group not found');
  }
  
  group.tabs.splice(tabIndex, 1);
  
  if (group.tabs.length === 0) {
    // If no tabs left, delete the entire group
    await deleteTabGroup(groupName);
  } else {
    // Update the group with remaining tabs, preserving the original timestamp
    await saveTabGroup(groupName, group.tabs, true);
  }
} 