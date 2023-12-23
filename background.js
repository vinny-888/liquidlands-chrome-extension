// chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
//   // Find the active tab to send a message to its content script
//   chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
//     chrome.tabs.sendMessage(tabs[0].id, {action: request.action});
//   });
// });

chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
      if (request.action === "myItems") {
          console.log("Message received in background script");
          getItems2(request.version).then(items => {
              sendResponse({items: items});
          }).catch(error => {
              console.error(error);
              sendResponse({error: error.message});
          });
      } else if (request.action === "enable" || request.action === "disable") {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
          chrome.tabs.sendMessage(tabs[0].id, {action: request.action});
        });
      }
      return true; // Return true to indicate you wish to send a response asynchronously
  }
);

async function getItems2(version){
  console.log('Get items');

    let res = await fetch("https://liquidlands.io/controller", {
      "headers": {
        "accept": "application/json",
        "cache-control": "no-cache",
        "content-type": "application/json; charset=UTF-8"
      },
      "body": "{\"controller\":\"Blueprints.Cards\",\"fields\":{\"app_version\":\""+version+"\"},\"nonce\":"+Date.now()+",\"debug\":true}",
      "method": "POST"
    });
    let json = await res.json();
    console.log('Get items',json);
    return json.d.cards;
}

function getItems(version) {
  return new Promise((resolve, reject) => {
      console.log('Get items');

      fetch("https://liquidlands.io/controller", {
          "headers": {
              "accept": "application/json",
              "cache-control": "no-cache",
              "content-type": "application/json; charset=UTF-8"
          },
          "body": JSON.stringify({
              "controller": "Blueprints.Cards",
              "fields": {"app_version": version},
              "nonce": Date.now(),
              "debug": true
          }),
          "method": "POST"
      }).then(res => {
          if (res.ok) {
              return res.json();
          } else {
              throw new Error('Network response was not ok.');
          }
      }).then(json => {
          console.log('Get items', json);
          resolve(json.d.cards);
      }).catch(error => {
          console.error('Error:', error);
          reject(error);
      });
  });
}