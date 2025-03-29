chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.local.set({shortsCleaningActive: false});
});