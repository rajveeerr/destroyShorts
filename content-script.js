function initClearYouTubeHistory() {
    console.log("Initializing Shorts history cleaner");

    chrome.storage.local.get(['shortsCleaningActive'], function (result) {
        if (result.shortsCleaningActive) {
            console.log("Cleaning process is active, starting/continuing cleaning");

            setTimeout(() => {
                clearYouTubeHistory();
            }, 1000);
        } else {
            console.log("No active cleaning process found");
        }
    });

    function clearYouTubeHistory() {

        async function processShortBatch() {
            return new Promise((resolve, reject) => {
                const MAX_SHORTS_PER_BATCH = 3;
                let processedShortsCount = 0;

                function processSingleShort(shortIndex) {
                    if (shortIndex >= MAX_SHORTS_PER_BATCH) {
                        console.log("Batch processing completed");
                        resolve(processedShortsCount);
                        return;
                    }

                    const shortsContainers = document.querySelectorAll('div#title-container.style-scope.ytd-reel-shelf-renderer');

                    if (shortsContainers.length === 0) {
                        console.log("No Shorts containers found");
                        resolve(processedShortsCount);
                        return;
                    }

                    const shortsSection = shortsContainers[0].closest('ytd-reel-shelf-renderer');

                    if (!shortsSection) {
                        console.log("Shorts section not found");
                        resolve(processedShortsCount);
                        return;
                    }

                    const actionMenuButtons = shortsSection.querySelectorAll('button[aria-label="More actions"].yt-spec-button-shape-next.yt-spec-button-shape-next--text.yt-spec-button-shape-next--mono.yt-spec-button-shape-next--size-m.yt-spec-button-shape-next--icon-button');

                    if (actionMenuButtons.length === 0) {
                        console.log("No action menu buttons found");
                        resolve(processedShortsCount);
                        return;
                    }

                    const currentActionButton = actionMenuButtons[shortIndex];

                    if (!currentActionButton) {
                        console.log(`No action button found for short index ${shortIndex}`);
                        processSingleShort(shortIndex + 1);
                        return;
                    }

                    currentActionButton.click();

                    setTimeout(() => {
                        const removeButtons = Array.from(document.querySelectorAll('yt-list-item-view-model'))
                            .filter(el => el.textContent.includes('Remove from watch history'));

                        if (removeButtons.length > 0) {
                            console.log("Found remove from watch history button");
                            removeButtons[0].click();

                            setTimeout(() => {
                                processedShortsCount++;
                                console.log(`Processed short ${shortIndex + 1}`);

                                processSingleShort(shortIndex + 1);
                            }, 1000);
                        } else {
                            console.log("Remove button not found, skipping to next");
                            processSingleShort(shortIndex + 1);
                        }
                    }, 500);
                }

                processSingleShort(0);
            });
        }

        async function continuousCleaning() {
            try {
                const processedCount = await processShortBatch();

                const remainingShortsContainers = document.querySelectorAll('div#title-container.style-scope.ytd-reel-shelf-renderer');

                if (processedCount === 0 && remainingShortsContainers.length === 0) {
                    console.log("No more shorts to remove. Cleaning complete.");

                    chrome.storage.local.set({ shortsCleaningActive: false }, function () {
                        console.log('Shorts cleaning process completed and deactivated');
                        alert('YouTube Shorts history cleaning completed!');
                    });

                    return;
                }

                console.log("Refreshing page to continue cleaning...");

                chrome.storage.local.set({ shortsCleaningActive: true }, function () {
                    window.location.reload();
                });
            } catch (error) {
                console.error("Error in continuous cleaning:", error);

                chrome.storage.local.set({ shortsCleaningActive: true }, function () {
                    console.log("Attempting to recover by refreshing...");
                    window.location.reload();
                });
            }
        }

        continuousCleaning();
    }
}

window.initClearYouTubeHistory = initClearYouTubeHistory;


function checkAndRunCleaner() {

    chrome.storage.local.get(['shortsCleaningActive'], function (result) {
        if (result.shortsCleaningActive) {
            if (window.location.href.includes('youtube.com/feed/history')) {

                setTimeout(() => {
                    initClearYouTubeHistory();
                }, 3000);
            } else {
                console.log("Not on history page, redirecting");
                window.location.href = 'https://www.youtube.com/feed/history';
            }
        } else {
            console.log("No active shorts cleaning process");
        }
    });
}

if (document.readyState === 'complete') {
    checkAndRunCleaner();
} else {
    window.addEventListener('load', function () {
        setTimeout(checkAndRunCleaner, 2000);
    });
}