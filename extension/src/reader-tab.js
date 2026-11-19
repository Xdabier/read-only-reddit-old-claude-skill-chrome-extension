import { LOAD_TIMEOUT_MS } from './config.js';

const TAB_KEY = 'readerTabId';

async function createTab() {
  try {
    return await chrome.tabs.create({ url: 'about:blank', active: false });
  } catch {
    const win = await chrome.windows.create({ url: 'about:blank', focused: false });
    return win.tabs[0];
  }
}

async function settle(tabId) {
  while ((await chrome.tabs.get(tabId)).status !== 'complete') {
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
}

// One dedicated background tab is reused for every page.
async function ensureTab() {
  const { [TAB_KEY]: saved } = await chrome.storage.session.get(TAB_KEY);
  if (saved !== undefined) {
    try {
      await chrome.tabs.get(saved);
      return saved;
    } catch {
      // tab was closed, make a new one
    }
  }
  const tab = await createTab();
  await settle(tab.id);
  await chrome.storage.session.set({ [TAB_KEY]: tab.id });
  return tab.id;
}

function waitForLoad(tabId) {
  return new Promise((resolve, reject) => {
    let sawLoading = false;
    const finish = (settlePromise, value) => {
      clearTimeout(timer);
      chrome.tabs.onUpdated.removeListener(onUpdated);
      chrome.tabs.onRemoved.removeListener(onRemoved);
      settlePromise(value);
    };
    const onUpdated = (id, info) => {
      if (id !== tabId) return;
      if (info.status === 'loading') sawLoading = true;
      if (info.status === 'complete' && sawLoading) finish(resolve);
    };
    const onRemoved = (id) => {
      if (id === tabId) finish(reject, new Error('Reader tab was closed while loading.'));
    };
    const timer = setTimeout(
      () => finish(reject, new Error('Page load timed out.')),
      LOAD_TIMEOUT_MS,
    );
    chrome.tabs.onUpdated.addListener(onUpdated);
    chrome.tabs.onRemoved.addListener(onRemoved);
  });
}

export async function openInReaderTab(url) {
  const tabId = await ensureTab();
  const loaded = waitForLoad(tabId);
  await chrome.tabs.update(tabId, { url });
  await loaded;

  // tab.url is only visible for hosts in host_permissions, so landedUrl is
  // undefined when the page ended up somewhere else.
  const tab = await chrome.tabs.get(tabId);
  return { tabId, landedUrl: tab.url };
}

export async function runInTab(tabId, func, args = []) {
  const [{ result }] = await chrome.scripting.executeScript({ target: { tabId }, func, args });
  return result;
}
