document.addEventListener('DOMContentLoaded', async () => {
  // Load saved API key
  const result = await chrome.storage.local.get('openai_api_key');
  if (result.openai_api_key) {
    document.getElementById('apiKey').value = result.openai_api_key;
  }

  // Save API key when button is clicked
  document.getElementById('saveButton').addEventListener('click', async () => {
    const apiKey = document.getElementById('apiKey').value.trim();
    const status = document.getElementById('status');

    if (!apiKey) {
      showStatus('Please enter an API key', 'error');
      return;
    }

    try {
      await chrome.storage.local.set({ openai_api_key: apiKey });
      showStatus('Settings saved successfully!', 'success');
    } catch (error) {
      showStatus('Error saving settings: ' + error.message, 'error');
    }
  });
});

function showStatus(message, type) {
  const status = document.getElementById('status');
  status.textContent = message;
  status.className = 'status ' + type;
  status.style.display = 'block';
  
  // Hide status after 3 seconds
  setTimeout(() => {
    status.style.display = 'none';
  }, 3000);
} 