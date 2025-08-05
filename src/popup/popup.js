// TABSTONE Popup JavaScript
// Handles popup UI interactions and communication with background script

// Browser compatibility - Direct browser API detection
const browserAPI = (typeof browser !== 'undefined') ? browser : chrome;

// DOM Elements
const groupNameInput = document.getElementById('groupName');
const selectTabsBtn = document.getElementById('selectTabsBtn');
const buryAllBtn = document.getElementById('buryAllBtn');
const visitGraveyardBtn = document.getElementById('visitGraveyardBtn');
const statusContainer = document.getElementById('statusContainer');
const statusMessage = document.getElementById('statusMessage');
const loadingContainer = document.getElementById('loadingContainer');
const tabsList = document.getElementById('tabsList');
const warningDialog = document.getElementById('warningDialog');
const confirmBuryBtn = document.getElementById('confirmBuryBtn');
const cancelBuryBtn = document.getElementById('cancelBuryBtn');
const tabTemplate = document.getElementById('tabTemplate');

// State
let isLoading = false;
let isSelectionMode = false;
let currentTabs = [];
let selectedTabIds = new Set();

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log('TABSTONE popup loaded');
  
  // Setup logo error handling
  setupLogoErrorHandling();
  
  // Add event listeners
  setupEventListeners();
  
  // Load and display current tabs
  loadCurrentTabs();
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
  // Form submission (Enter key) - only for multiple tabs
  groupNameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (isSelectionMode && selectedTabIds.size > 0) {
        handleBurySelectedTabs();
      } else {
        showWarningDialog();
      }
    }
  });

  // Tab selection controls
  selectTabsBtn.addEventListener('click', handleSelectTabsClick);
  
  // Action buttons
  buryAllBtn.addEventListener('click', showWarningDialog);
  visitGraveyardBtn.addEventListener('click', handleVisitGraveyard);
  
  // Warning dialog
  confirmBuryBtn.addEventListener('click', handleBuryAllTabs);
  cancelBuryBtn.addEventListener('click', hideWarningDialog);
  
  // Input validation
  groupNameInput.addEventListener('input', validateInput);
  
  // Close warning dialog on background click
  warningDialog.addEventListener('click', (e) => {
    if (e.target === warningDialog) {
      hideWarningDialog();
    }
  });
}

// Save group name to storage (for multiple tabs)
async function saveGroupName(groupName) {
  try {
    await browserAPI.storage.local.set({ lastGroupName: groupName });
  } catch (error) {
    console.error('Error saving group name:', error);
  }
}

// Load current tabs from the active window
async function loadCurrentTabs() {
  try {
    setLoading(true);
    
    const response = await sendMessage({
      action: 'GET_CURRENT_TABS'
    });
    
    if (response.success) {
      currentTabs = response.tabs || [];
      
      // Clear any stale tab selections
      const currentTabIds = new Set(currentTabs.map(tab => tab.id));
      const staleSelections = Array.from(selectedTabIds).filter(id => !currentTabIds.has(id));
      staleSelections.forEach(id => selectedTabIds.delete(id));
      
      if (staleSelections.length > 0) {
        console.log(`Cleared ${staleSelections.length} stale tab selections`);
        updateSelectionUI();
      }
      
      renderTabsList();
    } else {
      showStatus('Failed to load tabs', 'error');
    }
  } catch (error) {
    console.error('Error loading tabs:', error);
    showStatus('Error loading tabs', 'error');
  } finally {
    setLoading(false);
  }
}

// Render tabs list
function renderTabsList() {
  tabsList.innerHTML = '';
  
  if (currentTabs.length === 0) {
    tabsList.innerHTML = '<div class="no-tabs">No tabs found</div>';
    return;
  }
  
  currentTabs.forEach((tab, index) => {
    const tabElement = createTabElement(tab, index);
    tabsList.appendChild(tabElement);
  });
}

// Create tab element from template
function createTabElement(tab, index) {
  const template = tabTemplate.content.cloneNode(true);
  const tabItem = template.querySelector('.tab-item');
  const checkbox = template.querySelector('.tab-select');
  const favicon = template.querySelector('.favicon-img');
  const title = template.querySelector('.tab-title');
  const url = template.querySelector('.tab-url');
  const buryBtn = template.querySelector('.btn-bury-tab');
  
  // Set tab data
  title.textContent = tab.title || 'Untitled';
  url.textContent = tab.url || '';
  
  // Set favicon
  if (tab.favIconUrl) {
    favicon.src = tab.favIconUrl;
    favicon.alt = 'Tab favicon';
    
    // Handle favicon load errors
    favicon.addEventListener('error', function() {
      this.classList.add('hidden');
    });
  } else {
    favicon.classList.add('hidden');
  }
  
  // Setup checkbox
  checkbox.checked = selectedTabIds.has(tab.id);
  checkbox.addEventListener('change', (e) => {
    if (e.target.checked) {
      selectedTabIds.add(tab.id);
    } else {
      selectedTabIds.delete(tab.id);
    }
    updateSelectionUI();
  });
  
  // Setup bury button
  buryBtn.addEventListener('click', () => {
    handleBurySingleTab(tab);
  });
  
  // Setup tab item click for selection mode
  tabItem.addEventListener('click', (e) => {
    if (isSelectionMode && e.target !== checkbox && e.target !== buryBtn) {
      checkbox.checked = !checkbox.checked;
      if (checkbox.checked) {
        selectedTabIds.add(tab.id);
      } else {
        selectedTabIds.delete(tab.id);
      }
      updateSelectionUI();
    }
  });
  
  return template;
}

// Handle select tabs button click
function handleSelectTabsClick() {
  if (!isSelectionMode) {
    // Enter selection mode
    isSelectionMode = true;
    updateSelectTabsButton();
    showCheckboxes();
    enableGroupNameInput();
  } else {
    // Check if any tabs are selected
    if (selectedTabIds.size > 0) {
      // If tabs are selected, bury them
      handleBurySelectedTabs();
    } else {
      // If no tabs selected, exit selection mode
      exitSelectionMode();
    }
  }
}

// Update the select tabs button text and style
function updateSelectTabsButton() {
  if (!isSelectionMode) {
    selectTabsBtn.textContent = 'select tabs';
    selectTabsBtn.classList.remove('btn-primary');
    selectTabsBtn.classList.add('btn-secondary');
  } else {
    const selectedCount = selectedTabIds.size;
    if (selectedCount > 0) {
      selectTabsBtn.textContent = `bury selected (${selectedCount})`;
      selectTabsBtn.classList.remove('btn-secondary');
      selectTabsBtn.classList.add('btn-primary');
    } else {
      selectTabsBtn.textContent = 'select tabs';
      selectTabsBtn.classList.remove('btn-primary');
      selectTabsBtn.classList.add('btn-secondary');
    }
  }
}

// Show checkboxes for tab selection
function showCheckboxes() {
  document.querySelectorAll('.tab-checkbox').forEach(checkbox => {
    checkbox.classList.remove('hidden');
  });
}

// Hide checkboxes
function hideCheckboxes() {
  document.querySelectorAll('.tab-checkbox').forEach(checkbox => {
    checkbox.classList.add('hidden');
  });
}

// Enable group name input
function enableGroupNameInput() {
  const input = document.getElementById('groupName');
  input.disabled = false;
  input.placeholder = 'name your tab group';
}

// Disable group name input
function disableGroupNameInput() {
  const input = document.getElementById('groupName');
  input.disabled = true;
  input.placeholder = 'name your tab group';
}

// Exit selection mode
function exitSelectionMode() {
  isSelectionMode = false;
  selectedTabIds.clear();
  updateSelectTabsButton();
  hideCheckboxes();
  disableGroupNameInput();
  renderTabsList(); // Re-render to update checkbox states
}

// Update selection UI when tabs are selected/deselected
function updateSelectionUI() {
  updateSelectTabsButton();
}

// Validate input
function validateInput() {
  const groupName = groupNameInput.value.trim();
  const isValid = groupName.length > 0 && groupName.length <= 50;
  
  // Always keep bury all button enabled (unless loading)
  buryAllBtn.disabled = isLoading;
  
  // Update select tabs button based on current state
  updateSelectTabsButton();
  
  // Visual feedback for input length
  if (isSelectionMode && groupName.length > 50) {
    groupNameInput.style.borderColor = 'var(--color-error)';
  } else {
    groupNameInput.style.borderColor = '';
  }
}

// Show warning dialog
function showWarningDialog() {
  // Only validate group name if in selection mode (multiple tabs)
  if (isSelectionMode) {
    const groupName = groupNameInput.value.trim();
    
    if (!groupName) {
      showStatus('Please enter a group name', 'error');
      groupNameInput.focus();
      return;
    }
    
    if (groupName.length > 50) {
      showStatus('Group name must be 50 characters or less', 'error');
      groupNameInput.focus();
      return;
    }
  }
  
  warningDialog.classList.remove('hidden');
}

// Hide warning dialog
function hideWarningDialog() {
  warningDialog.classList.add('hidden');
}

// Handle bury all tabs
async function handleBuryAllTabs() {
  hideWarningDialog();
  
  const groupName = groupNameInput.value.trim();
  
  // Prevent multiple submissions
  if (isLoading) return;
  
  try {
    setLoading(true);
    
    // Save group name for future use if provided
    if (groupName) {
      await saveGroupName(groupName);
    }
    
    // Send message to background script
    const response = await sendMessage({
      action: 'BURY_ALL_TABS',
      groupName: groupName
    });
    
    if (response.success) {
      showStatus(response.message, 'success');
      // Clear input after successful burial
      groupNameInput.value = '';
      validateInput();
      // Refresh the tab list to show updated state (though all tabs should be gone)
      await loadCurrentTabs();
    } else {
      showStatus(response.error || 'Failed to bury tabs', 'error');
    }
    
  } catch (error) {
    console.error('Error burying tabs:', error);
    showStatus('An error occurred while burying tabs', 'error');
  } finally {
    setLoading(false);
  }
}

// Handle bury selected tabs
async function handleBurySelectedTabs() {
  const groupName = groupNameInput.value.trim();
  
  // Validate input
  if (!groupName) {
    showStatus('Please enter a group name', 'error');
    groupNameInput.focus();
    return;
  }
  
  if (groupName.length > 50) {
    showStatus('Group name must be 50 characters or less', 'error');
    groupNameInput.focus();
    return;
  }
  
  if (selectedTabIds.size === 0) {
    showStatus('Please select at least one tab', 'error');
    return;
  }
  
  // Prevent multiple submissions
  if (isLoading) return;
  
  try {
    setLoading(true);
    
    // Refresh current tabs to ensure we have the latest data
    await loadCurrentTabs();
    
    // Validate that selected tabs still exist
    const validSelectedTabs = currentTabs.filter(tab => selectedTabIds.has(tab.id));
    if (validSelectedTabs.length === 0) {
      showStatus('Selected tabs are no longer available. Please refresh and try again.', 'error');
      selectedTabIds.clear();
      updateSelectionUI();
      return;
    }
    
    // Save group name for future use
    await saveGroupName(groupName);
    
    // Send message to background script
    const response = await sendMessage({
      action: 'BURY_SELECTED_TABS',
      groupName: groupName,
      tabIds: Array.from(selectedTabIds)
    });
    
    if (response.success) {
      showStatus(response.message, 'success');
      // Clear input and exit selection mode after successful burial
      groupNameInput.value = '';
      exitSelectionMode();
      // Refresh the tab list to show updated state
      await loadCurrentTabs();
    } else {
      showStatus(response.error || 'Failed to bury selected tabs', 'error');
    }
    
  } catch (error) {
    console.error('Error burying selected tabs:', error);
    showStatus('An error occurred while burying selected tabs', 'error');
  } finally {
    setLoading(false);
  }
}

// Handle bury single tab
async function handleBurySingleTab(tab) {
  // Prevent multiple submissions
  if (isLoading) return;
  
  try {
    setLoading(true);
    
    // Create default group name: "date - tab name"
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    const defaultGroupName = `${dateStr} - ${tab.title}`;
    
    // Send message to background script
    const response = await sendMessage({
      action: 'BURY_SINGLE_TAB',
      groupName: defaultGroupName,
      tabId: tab.id
    });
    
    if (response.success) {
      showStatus(response.message, 'success');
      // Refresh the tab list to show updated state after successful burial
      await loadCurrentTabs();
    } else {
      showStatus(response.error || 'Failed to bury tab', 'error');
    }
    
  } catch (error) {
    console.error('Error burying tab:', error);
    showStatus('An error occurred while burying tab', 'error');
  } finally {
    setLoading(false);
  }
}

// Handle visit graveyard
async function handleVisitGraveyard() {
  if (isLoading) return;
  
  try {
    setLoading(true);
    
    const response = await sendMessage({
      action: 'OPEN_GRAVEYARD'
    });
    
    if (response.success) {
      // Close popup after opening graveyard
      window.close();
    } else {
      showStatus(response.error || 'Failed to open graveyard', 'error');
    }
    
  } catch (error) {
    console.error('Error opening graveyard:', error);
    showStatus('An error occurred while opening graveyard', 'error');
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
  
  if (loading) {
    buryAllBtn.disabled = true;
    visitGraveyardBtn.disabled = true;
    selectTabsBtn.disabled = true;
    loadingContainer.classList.remove('hidden');
    statusContainer.classList.add('hidden');
  } else {
    validateInput();
    visitGraveyardBtn.disabled = false;
    selectTabsBtn.disabled = false;
    loadingContainer.classList.add('hidden');
  }
}

// Show status message
function showStatus(message, type = 'info') {
  statusMessage.textContent = message;
  statusMessage.className = `status-message ${type}`;
  statusContainer.classList.remove('hidden');
  
  // Auto-hide success messages after 3 seconds
  if (type === 'success') {
    setTimeout(() => {
      statusContainer.classList.add('hidden');
    }, 3000);
  }
}

// Clear status message
function clearStatus() {
  statusContainer.classList.add('hidden');
}

// Handle popup window focus
window.addEventListener('focus', () => {
  // Re-validate input when popup gains focus
  validateInput();
  // Reload tabs when popup gains focus
  loadCurrentTabs();
});

// Handle popup window blur
window.addEventListener('blur', () => {
  // Clear status when popup loses focus
  clearStatus();
});

// Error handling for unhandled errors
window.addEventListener('error', (event) => {
  console.error('Popup error:', event.error);
  showStatus('An unexpected error occurred', 'error');
});

// Handle unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  showStatus('An unexpected error occurred', 'error');
  event.preventDefault();
}); 