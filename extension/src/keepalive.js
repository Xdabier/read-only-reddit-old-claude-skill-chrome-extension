const MAX_IDLE_MS = 20_000;

// Extension API calls reset the service worker idle timer (30s).
export const touch = () => chrome.runtime.getPlatformInfo();

export async function sleep(ms) {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    await new Promise((resolve) => setTimeout(resolve, Math.min(MAX_IDLE_MS, end - Date.now())));
    await touch();
  }
}
