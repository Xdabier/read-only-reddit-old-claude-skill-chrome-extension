import { runBridgeLoop } from './bridge-client.js';

const RETRY_ALARM = 'bridge-retry';

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === RETRY_ALARM) runBridgeLoop();
});

chrome.alarms.get(RETRY_ALARM).then((alarm) => {
  if (!alarm) chrome.alarms.create(RETRY_ALARM, { periodInMinutes: 0.5 });
});

runBridgeLoop();
