document.addEventListener('DOMContentLoaded', function () {
    const clearButton = document.getElementById('clearHistory');
    const statusDiv = document.getElementById('status');


    //todo: if not on history page open it
    clearButton.addEventListener('click', function () {
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            const currentTab = tabs[0];
            console.log(currentTab);

            if (!currentTab.url.includes('youtube.com')) {
                statusDiv.textContent = 'Please open YouTube first!';
                return;
            }

            // chrome.tabs.update('https://www.youtube.com/feed/history')

            chrome.scripting.executeScript({
                target: { tabId: currentTab.id },
                function: clearYouTubeHistory
            }, (results) => {
                statusDiv.textContent = 'Watch history clearing completed!';
            });
        });
    });
    function clearYouTubeHistory() {
        console.log("Cleaning Shorts history started");
      
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
                resolve(processedShortsCount);
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
                  console.log("Remove button not found");
                  resolve(processedShortsCount);
                }
              }, 500);
            }
      
            processSingleShort(0);
          });
        }
      
        async function continuousCleaning() {
          try {
            const processedCount = await processShortBatch();
      
            if (processedCount === 0) {
              console.log("No more shorts to remove. Cleaning complete.");
              return;
            }
      
            window.location.reload();
      
            await new Promise(resolve => setTimeout(resolve, 2000));
      
            await continuousCleaning();
          } catch (error) {
            console.error("Error in continuous cleaning:", error);
          }
        }
      

        continuousCleaning();
      }
});
