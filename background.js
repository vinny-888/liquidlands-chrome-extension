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
          getItems(request.version).then(items => {
              sendResponse({items: items});
          }).catch(error => {
              console.error(error);
              sendResponse({error: error.message});
          });
      } else if (request.action === "enable" || request.action === "disable") {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
          chrome.tabs.sendMessage(tabs[0].id, {action: request.action});
        });
      } else if (request.action === "saveCities"){
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
          chrome.tabs.sendMessage(tabs[0].id, {action: request.action, cities: request.cities});
        });
      } else if (request.action === "removeAttacks") {
        console.log("Message received in background script");
        chrome.storage.local.get("version",function(res) {
          console.log("Message received in background script with version:", res);
          removeAttackItems(res.version);
        });
    } 
      return true; // Return true to indicate you wish to send a response asynchronously
  }
);

async function getItems(version){
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

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function removeAttackItems(version){
  fetch("https://liquidlands.io/controller", {
    "headers": {
      "accept": "application/json, text/javascript, */*; q=0.01",
      "content-type": "application/json; charset=UTF-8",
    },
    "body": "{\"controller\":\"Explorers.Cards\",\"fields\":{\"max\":10,\"app_version\":\""+version+"\"},\"nonce\":"+Date.now()+",\"debug\":true}",
    "method": "POST",
  }).then((res)=>{
    return res.json();
  }).then(async (res)=>{

    for(let i=0; i< res.d.cards.length; i++){
      let card = res.d.cards[i];
      console.log('Get Bricks and Items: ', i);
      await sleep(100);
      await fetch("https://liquidlands.io/controller", {
        "headers": {
          "accept": "application/json, text/javascript, */*; q=0.01",
          "cache-control": "no-cache",
          "content-type": "application/json; charset=UTF-8",
        },
        "body": "{\"controller\":\"Explorers.CardEditBricks\",\"fields\":{\"id\":"+card.id+",\"app_version\":\""+version+"\"},\"nonce\":"+Date.now()+",\"debug\":true}",
        "method": "POST"
      }).then((res)=>{
          return res.json();
      }).then(async (res)=>{
        let bricks = res.d.bricks;
        let items = res.d.items;

        if(bricks.length > 0){
          for(let j=0; j< bricks.length; j++){
            let brick = bricks[j];
            if(brick.attack > 12 && brick.defence == 0){
              await sleep(100);
              console.log('Removing Brick:', brick);
              await fetch("https://liquidlands.io/controller", {
                "headers": {
                  "accept": "application/json, text/javascript, */*; q=0.01",
                  "content-type": "application/json; charset=UTF-8",
                },
                "body": "{\"controller\":\"Explorers.CardToggleBrick\",\"fields\":{\"id\":"+card.id+",\"brick_id\":"+brick.id+",\"enable\":false,\"app_version\":\""+version+"\"},\"nonce\":"+Date.now()+",\"debug\":true}",
                "method": "POST",
              }).then((res)=>{
                return res.json();
              }).then(async (res)=>{
                console.log('remove brick res:', res);
              });
            }
          }
        }

        if(items.length > 0){
          for(let j=0; j< items.length; j++){
            let item = items[j];
            if((item.attack > 0 || (item.invincibility > 0 && item.invincibility != 4)) && item.defence == 0){
              await sleep(100);
              await fetch("https://liquidlands.io/controller", {
                "headers": {
                  "accept": "application/json, text/javascript, */*; q=0.01",
                  "content-type": "application/json; charset=UTF-8",
                },
                "body": "{\"controller\":\"Explorers.CardToggleItem\",\"fields\":{\"id\":"+card.id+",\"item_id\":"+item.id+",\"enable\":false,\"app_version\":\""+version+"\"},\"nonce\":"+Date.now()+",\"debug\":true}",
                "method": "POST",
              }).then((res)=>{
                return res.json();
              }).then(async (res)=>{
                console.log('remove item res:', res);
              });
            }
          }
        }
      });
    }
  });
}

