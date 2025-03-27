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
      
        async function processShort(shortIndex) {
          const MAX_SHORTS = 3;
          if (shortIndex >= MAX_SHORTS) {
            console.log("Reached maximum shorts to process");
            window.location.reload();
            return;
          }
      
          return new Promise((resolve, reject) => {
            const shortsContainers = document.querySelectorAll('div#title-container.style-scope.ytd-reel-shelf-renderer');
            
            if (shortsContainers.length === 0) {
              console.log("No Shorts containers found");
              resolve();
              return;
            }
      
            const shortsSection = shortsContainers[0].closest('ytd-reel-shelf-renderer');
            
            if (!shortsSection) {
              console.log("Shorts section not found");
              resolve();
              return;
            }
      
            const actionMenuButtons = shortsSection.querySelectorAll('button[aria-label="More actions"].yt-spec-button-shape-next.yt-spec-button-shape-next--text.yt-spec-button-shape-next--mono.yt-spec-button-shape-next--size-m.yt-spec-button-shape-next--icon-button');
            
            if (actionMenuButtons.length === 0) {
              console.log("No action menu buttons found");
              resolve();
              return;
            }
      
            const currentActionButton = actionMenuButtons[shortIndex];
            
            if (!currentActionButton) {
              console.log(`No action button found for short index ${shortIndex}`);
              resolve();
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
                  console.log(`Processed short ${shortIndex + 1}`);
                  processShort(shortIndex + 1)
                    .then(resolve)
                    .catch(reject);
                }, 1000);
              } else {
                console.log("Remove button not found");
                resolve();
              }
            }, 500);
          });
        }
      
        processShort(0).then(() => {
          console.log("Shorts history cleaning completed");
        }).catch(error => {
          console.error("Error in cleaning process:", error);
        });
      }
      
      
      
});
