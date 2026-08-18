const toggle = document.getElementById('toggle');
const status = document.getElementById('status');

function render(enabled) {
  toggle.checked = enabled;
  status.textContent = enabled
    ? 'Replacing on this and every page'
    : 'Paused — reload tabs to restore original text';
}

chrome.storage.sync.get({ enabled: true }, (data) => {
  render(data.enabled !== false);
});

toggle.addEventListener('change', () => {
  const enabled = toggle.checked;
  chrome.storage.sync.set({ enabled }, () => {
    render(enabled);
  });
});
