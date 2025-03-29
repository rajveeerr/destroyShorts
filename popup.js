document.addEventListener('DOMContentLoaded', function () {
    const clearButton = document.getElementById('clearHistory');
    const statusDiv = document.getElementById('status');

    chrome.storage.local.get(['shortsCleaningActive'], function (result) {
        if (result.shortsCleaningActive) {
            statusDiv.textContent = 'Cleaning process is currently running on YouTube...';
        }
    });

    clearButton.addEventListener('click', function () {
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            const currentTab = tabs[0];
            console.log(currentTab);

            if (!currentTab.url.includes('youtube.com')) {
                statusDiv.textContent = 'Please open YouTube first!';
                return;
            }

            chrome.storage.local.set({ shortsCleaningActive: true }, function () {
                console.log('Shorts cleaning process activated');
                statusDiv.textContent = 'Watch history cleaning started!';

                chrome.scripting.executeScript({
                    target: { tabId: currentTab.id },
                    function: () => {
                        if (typeof window.initClearYouTubeHistory === 'function') {
                            window.initClearYouTubeHistory();
                        } else {
                            if (!window.location.href.includes('youtube.com/feed/history')) {
                                window.location.href = 'https://www.youtube.com/feed/history';
                            } else {
                                window.location.reload();
                            }
                        }
                    }
                });

                if (!currentTab.url.includes('youtube.com/feed/history')) {
                    chrome.tabs.update(currentTab.id, { url: 'https://www.youtube.com/feed/history' });
                }
            });
        });
    });
});

//todos=>
//another approach-> click arrow button and click the arrow button
// button to stop execution of the script
//removed count: add it to localstorage