// TABSTONE Graveyard JavaScript
// Handles graveyard page functionality and tab management

// Browser compatibility - Direct browser API detection
const browserAPI = (typeof browser !== 'undefined') ? browser : chrome;

// DOM Elements
const loadingContainer = document.getElementById('loadingContainer');
const emptyContainer = document.getElementById('emptyContainer');
const groupsContainer = document.getElementById('groupsContainer');
const errorContainer = document.getElementById('errorContainer');
const errorMessage = document.getElementById('errorMessage');
const refreshBtn = document.getElementById('refreshBtn');
const buryTabsBtn = document.getElementById('buryTabsBtn');
const retryBtn = document.getElementById('retryBtn');

// Templates
const groupTemplate = document.getElementById('groupTemplate');
const tabTemplate = document.getElementById('tabTemplate');

// State
let groups = {};
let isLoading = false;

// Initialize graveyard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log('TABSTONE graveyard loaded');
  
  // Setup logo error handling
  setupLogoErrorHandling();
  
  // Setup event listeners
  setupEventListeners();
  
  // Load data
  loadGraveyardData();
});

// Setup logo error handling
function setupLogoErrorHandling() {
  const logoImg = document.querySelector('.logo-img');
  if (logoImg) {
    logoImg.addEventListener('error', function() {
      // Fallback to emoji if image fails to load
      this.style.display = 'none';
      this.parentElement.innerHTML = '🪦';
    });
  }
}

// Setup event listeners
function setupEventListeners() {
  // Refresh button
  refreshBtn.addEventListener('click', loadGraveyardData);
  
  // Bury tabs button (in empty state)
  buryTabsBtn.addEventListener('click', () => {
    window.close();
  });
  
  // Retry button (in error state)
  retryBtn.addEventListener('click', loadGraveyardData);
  
  // Handle window focus to refresh data
  window.addEventListener('focus', () => {
    if (!isLoading) {
      loadGraveyardData();
    }
  });
}

// Load graveyard data
async function loadGraveyardData() {
  if (isLoading) return;
  
  try {
    setLoading(true);
    showLoadingState();
    
    const response = await sendMessage({
      action: 'GET_ALL_GROUPS'
    });
    
    if (response.success) {
      groups = response.groups || {};
      renderGraveyard();
    } else {
      showErrorState(response.error || 'Failed to load graveyard data');
    }
    
  } catch (error) {
    console.error('Error loading graveyard data:', error);
    showErrorState('An error occurred while loading the graveyard');
  } finally {
    setLoading(false);
  }
}

// Render graveyard content
function renderGraveyard() {
  const groupNames = Object.keys(groups);
  // Only keep valid groups (must have a tabs array)
  const validGroupNames = groupNames.filter(
    name => groups[name] && Array.isArray(groups[name].tabs)
  );
  if (validGroupNames.length === 0) {
    showEmptyState();
    return;
  }
  // Sort groups by timestamp (newest first)
  const sortedGroups = validGroupNames.sort((a, b) => {
    const timeA = new Date(groups[a].timestamp).getTime();
    const timeB = new Date(groups[b].timestamp).getTime();
    return timeB - timeA;
  });
  // Clear container
  groupsContainer.innerHTML = '';
  // Render each group
  sortedGroups.forEach(groupName => {
    const groupElement = createGroupElement(groupName, groups[groupName]);
    if (groupElement) groupsContainer.appendChild(groupElement);
  });
  showGroupsState();
}

// Create group element
function createGroupElement(groupName, groupData) {
  // Defensive: Only render if groupData and groupData.tabs is an array
  if (!groupData || !Array.isArray(groupData.tabs)) return null;
  const groupElement = groupTemplate.content.cloneNode(true);
  const groupCard = groupElement.querySelector('.group-card');
  
  // Set group name
  const groupNameElement = groupCard.querySelector('.group-name');
  groupNameElement.textContent = groupName;
  
  // Set group metadata
  const groupDateElement = groupCard.querySelector('.group-date');
  const groupCountElement = groupCard.querySelector('.group-count');
  
  const date = new Date(groupData.timestamp);
  console.log(`Group "${groupName}" timestamp:`, groupData.timestamp, 'Parsed date:', date, 'Formatted:', formatDate(date));
  groupDateElement.textContent = `📅 ${formatDate(date)}`;
  groupCountElement.textContent = `📄 ${groupData.tabs.length} tab${groupData.tabs.length !== 1 ? 's' : ''}`;
  
  // Setup group action buttons
  const resurrectAllBtn = groupCard.querySelector('.resurrect-all-btn');
  const deleteGroupBtn = groupCard.querySelector('.delete-group-btn');
  
  resurrectAllBtn.addEventListener('click', () => handleResurrectGroup(groupName));
  deleteGroupBtn.addEventListener('click', () => handleDeleteGroup(groupName));
  
  // Render tabs
  const tabsContainer = groupCard.querySelector('.tabs-container');
  const isSingleTab = groupData.tabs.length === 1;
  
  groupData.tabs.forEach((tab, index) => {
    const tabElement = createTabElement(groupName, tab, index, isSingleTab);
    tabsContainer.appendChild(tabElement);
  });
  
  return groupElement;
}

// Create tab element
function createTabElement(groupName, tab, index, isSingleTab = false) {
  const tabElement = tabTemplate.content.cloneNode(true);
  const tabItem = tabElement.querySelector('.tab-item');
  
  // Set tab title
  const tabTitleElement = tabItem.querySelector('.tab-title');
  tabTitleElement.textContent = tab.title || 'Untitled';
  
  // Set tab URL
  const tabUrlElement = tabItem.querySelector('.tab-url');
  tabUrlElement.href = tab.url;
  tabUrlElement.textContent = new URL(tab.url).hostname;
  tabUrlElement.title = tab.url;
  
  // Set favicon
  const tabFaviconElement = tabItem.querySelector('.tab-favicon');
  if (tab.favIconUrl) {
    tabFaviconElement.src = tab.favIconUrl;
    tabFaviconElement.alt = 'Favicon';
    
    // Handle favicon load errors
    tabFaviconElement.addEventListener('error', function() {
      this.classList.add('hidden');
    });
  } else {
    tabFaviconElement.classList.add('hidden');
  }
  
  // Setup tab action buttons
  const tabActionsElement = tabItem.querySelector('.tab-actions');
  
  if (isSingleTab) {
    // Hide individual tab actions for single tab groups
    tabActionsElement.style.display = 'none';
  } else {
    // Setup individual tab actions for multi-tab groups
    const resurrectTabBtn = tabItem.querySelector('.resurrect-tab-btn');
    const deleteTabBtn = tabItem.querySelector('.delete-tab-btn');
    
    resurrectTabBtn.addEventListener('click', () => handleResurrectTab(tab.url));
    deleteTabBtn.addEventListener('click', () => handleDeleteTab(groupName, index));
  }
  
  return tabElement;
}

// Handle resurrect group
async function handleResurrectGroup(groupName) {
  if (isLoading) return;
  
  try {
    setLoading(true);
    
    const response = await sendMessage({
      action: 'RESURRECT_GROUP',
      groupName: groupName
    });
    
    if (response.success) {
      showNotification(response.message, 'success');
      // Refresh data after resurrection
      setTimeout(() => loadGraveyardData(), 1000);
    } else {
      showNotification(response.error || 'Failed to resurrect group', 'error');
    }
    
  } catch (error) {
    console.error('Error resurrecting group:', error);
    showNotification('An error occurred while resurrecting the group', 'error');
  } finally {
    setLoading(false);
  }
}

// Handle resurrect single tab
async function handleResurrectTab(url) {
  if (isLoading) return;
  
  try {
    setLoading(true);
    
    const response = await sendMessage({
      action: 'RESURRECT_TAB',
      url: url
    });
    
    if (response.success) {
      showNotification('Tab resurrected successfully', 'success');
    } else {
      showNotification(response.error || 'Failed to resurrect tab', 'error');
    }
    
  } catch (error) {
    console.error('Error resurrecting tab:', error);
    showNotification('An error occurred while resurrecting the tab', 'error');
  } finally {
    setLoading(false);
  }
}

// Handle delete group
async function handleDeleteGroup(groupName) {
  if (isLoading) return;
  
  if (!confirm(`Are you sure you want to delete the group "${groupName}" and all its tabs?`)) {
    return;
  }
  
  try {
    setLoading(true);
    
    const response = await sendMessage({
      action: 'DELETE_GROUP',
      groupName: groupName
    });
    
    if (response.success) {
      showNotification(response.message, 'success');
      // Refresh data after deletion
      setTimeout(() => loadGraveyardData(), 1000);
    } else {
      showNotification(response.error || 'Failed to delete group', 'error');
    }
    
  } catch (error) {
    console.error('Error deleting group:', error);
    showNotification('An error occurred while deleting the group', 'error');
  } finally {
    setLoading(false);
  }
}

// Handle delete single tab
async function handleDeleteTab(groupName, tabIndex) {
  if (isLoading) return;
  
  try {
    setLoading(true);
    
    const response = await sendMessage({
      action: 'DELETE_TAB',
      groupName: groupName,
      tabIndex: tabIndex
    });
    
    if (response.success) {
      showNotification('Tab deleted successfully', 'success');
      // Refresh data after deletion
      setTimeout(() => loadGraveyardData(), 1000);
    } else {
      showNotification(response.error || 'Failed to delete tab', 'error');
    }
    
  } catch (error) {
    console.error('Error deleting tab:', error);
    showNotification('An error occurred while deleting the tab', 'error');
  } finally {
    setLoading(false);
  }
}

// Send message to background script
function sendMessage(message) {
  return new Promise((resolve, reject) => {
    browserAPI.runtime.sendMessage(message, (response) => {
      if (browserAPI.runtime.lastError) {
        reject(new Error(browserAPI.runtime.lastError.message));
      } else {
        resolve(response);
      }
    });
  });
}

// Set loading state
function setLoading(loading) {
  isLoading = loading;
  
  // Disable buttons during loading
  const buttons = document.querySelectorAll('.btn');
  buttons.forEach(btn => {
    btn.disabled = loading;
  });
}

// Show loading state
function showLoadingState() {
  loadingContainer.classList.remove('hidden');
  emptyContainer.classList.add('hidden');
  groupsContainer.classList.add('hidden');
  errorContainer.classList.add('hidden');
}

// Show empty state
function showEmptyState() {
  loadingContainer.classList.add('hidden');
  emptyContainer.classList.remove('hidden');
  groupsContainer.classList.add('hidden');
  errorContainer.classList.add('hidden');
}

// Show groups state
function showGroupsState() {
  loadingContainer.classList.add('hidden');
  emptyContainer.classList.add('hidden');
  groupsContainer.classList.remove('hidden');
  errorContainer.classList.add('hidden');
}

// Show error state
function showErrorState(message) {
  loadingContainer.classList.add('hidden');
  emptyContainer.classList.add('hidden');
  groupsContainer.classList.add('hidden');
  errorContainer.classList.remove('hidden');
  
  errorMessage.textContent = message;
}

// Show notification
function showNotification(message, type = 'info') {
  // Create notification element
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.textContent = message;
  
  // Add styles
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 12px 16px;
    border-radius: 6px;
    color: white;
    font-size: 14px;
    font-weight: 500;
    z-index: 1000;
    animation: slideIn 0.3s ease;
    max-width: 300px;
    word-wrap: break-word;
  `;
  
  // Set background color based on type
  switch (type) {
    case 'success':
      notification.style.background = 'var(--success-color)';
      break;
    case 'error':
      notification.style.background = 'var(--error-color)';
      break;
    case 'warning':
      notification.style.background = 'var(--warning-color)';
      break;
    default:
      notification.style.background = 'var(--accent-color)';
  }
  
  // Add to page
  document.body.appendChild(notification);
  
  // Remove after 3 seconds
  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 300);
  }, 3000);
}

// Format date
function formatDate(date) {
  const now = new Date();
  const diff = now - date;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor(diff / (1000 * 60));
  
  if (days === 0) {
    if (hours === 0) {
      if (minutes === 0) {
        return 'Just now';
      } else {
        return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
      }
    } else {
      return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    }
  } else if (days === 1) {
    return 'Yesterday';
  } else if (days < 7) {
    return `${days} days ago`;
  } else {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }
}

// Add CSS animations for notifications
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  @keyframes slideOut {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(100%);
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);

// Error handling for unhandled errors
window.addEventListener('error', (event) => {
  console.error('Graveyard error:', event.error);
  showNotification('An unexpected error occurred', 'error');
});

// Handle unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  showNotification('An unexpected error occurred', 'error');
  event.preventDefault();
}); 