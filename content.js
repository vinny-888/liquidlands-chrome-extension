let myItems = [];
let selectedItem = '';
let cities = [];
document.addEventListener('DOMContentLoaded', function() {
    chrome.storage.local.get("enabled",function(res1) {
        if(res1.enabled){
            chrome.storage.local.get("cities",function(res2) {
                if(res2.cities){
                    cities = res2.cities;
                }
                chrome.storage.local.get("selectedItem",function(res3) {
                    selectedItem = res3.selectedItem;
                    console.log('selectedItem:', selectedItem);
                    if(res3){
                        let offset = 10;
                        if(window.location.href.indexOf('blueprints') == -1){
                            offset = 60;
                        } else {
                            if(window.location.href.indexOf('blueprints') != -1){
                                recheck();
                            }
                        }
                    }
                });
            });
            injectScript(chrome.runtime.getURL('injectedScript.js'), 'body');

            recheckVersion();
        } else {
            var headups = document.getElementById('headsup');
            if(headups){
                headups.innerHTML = '';
            }
        }
    });
});

function getItems(version){
    chrome.runtime.sendMessage({action: "myItems", version: version}, function(response) {
        if (chrome.runtime.lastError) {
            // Handle any error that might have occurred during message passing
            console.error(chrome.runtime.lastError.message);
        } else {
            console.log('Response from background:', response);
            myItems = response.items;
            if(selectedItem){
                buildItem(selectedItem, myItems);
            }
        }
        // console.log(response.reply);
    });
}

function recheck(){
    let cards = document.getElementById('DeckCards');
    if(!cards){
        setTimeout(()=>{
            recheck();
        }, 200)
    } else {
        addButtons();
    }
}

function recheckVersion(){
    let version = document.getElementById('app_version');
    if(!version){
        setTimeout(()=>{
            recheckVersion();
        }, 200)
    } else {
        getItems(version.value);
    }
}

chrome.runtime.onMessage.addListener((request) => {
    if(request.action == 'enable'){
        // chrome.storage.sync.set({"enabled":true});
        chrome.storage.local.set({ enabled: true }, function() {
            console.log('Value is set to ' + 'value');
        });
        if(window.location.href.indexOf('blueprints') != -1){
            addButtons();
        }
    } else if (request.action == 'disable'){
        // chrome.storage.sync.set({"enabled":false});
        chrome.storage.local.set({ enabled: false }, function() {
            console.log('Value is set to ' + 'value');
        });
        close();
    } else if(request.action == 'myItems'){
        console.log('items: ', request.items);
    } else if(request.action == 'saveCities'){
        console.log('saveCities: ', request.cities);
        chrome.storage.local.set({ cities: request.cities }, function() {
            console.log('Cities set');
        });
    }

});

function addButtons(){
    let whiteLay = document.getElementById('WhiteLay');
        whiteLay.style.userSelect = 'all';
        let cards = document.getElementById('DeckCards');

        let offset = 10;
        if(window.location.href.indexOf('blueprints') == -1){
            offset = 60;
        } 

        let items = Array.from(cards.childNodes);
        let scriptContent = '';
        items.forEach((item, index)=>{
            let itemName = 'Borg Hive';
            let subItems = Array.from(item.childNodes);
            subItems.forEach((subItem)=>{
                if(subItem.className == 'title'){
                    // console.log('Index: ' + index + ' Title: ' + subItem.innerHTML);
                    itemName = subItem.innerHTML;
                    itemName = itemName.substring(1, itemName.length-1);
                }
            })
            // Create a new div element
            var newDiv = document.createElement("div"); 
            newDiv.innerHTML = `
                <div style="position:absolute;top:10px;left:10px;z-index:1000;">
                    <input id="build_${index}" style="background-color: #ccc;cursor: pointer;padding: 10px;border-radius: 4px;width: 50px;height: 34px;" type="button" value="Build" onclick="buildItem('${itemName}', ${offset})">
                </div>`;
            newDiv.style.cssText = '';

            item.appendChild(newDiv);
        });
}

// content.js
function injectScript(file, node) {
    const th = document.getElementsByTagName(node)[0];
    const s = document.createElement('script');
    s.setAttribute('type', 'text/javascript');
    s.setAttribute('src', file);
    th.appendChild(s);
}


// content.js
document.addEventListener('myCustomEvent', function(e) {
    // Call your function here
    buildItem(e.detail);
});

// content.js
window.addEventListener('message', function(event) {
    // Check if the message is from your webpage
    if (event.source === window && event.data && event.data.type === 'FROM_PAGE') {
        console.log('Message received in content script:', event.data);
        // buildItem(event.data.message);
        chrome.storage.local.set({"selectedItem":event.data.message});
    }
});

function buildItem(itemName, items){
    // Append the div to the body

    let itemCounts = items.map((item)=> {
        return {title: item.title, count: item.owner_item_available_count}
    });
    let paramStr = '';
    itemCounts.forEach((item)=>{
        if(item.count > 0){
            paramStr += item.title+':'+item.count+',';
        }
    })

    if(paramStr.length > 0){
        paramStr = paramStr.substring(0, paramStr.length-1)
    }

    var headups = document.getElementById('headsup');
    if(!headups){
        headups = document.createElement("div"); 
    }
    headups.id = 'headsup';
    let citiesStr = cities ? cities.join(',') : '';
    headups.innerHTML = `
        <div style="background-color:white;z-index:1000;padding:0px;border: 1px solid #fff;">
            <div style="background-color: #1f2932;width: 100%;height: 24px;padding:4px;">
                <div id="refreshBtn" style="font-weight: bold;text-align: center;color: #000;cursor: pointer;float:left;background-color: #00c5ff;margin-left: 6px;">
                    Refresh Counts
                </div>
                <div id="closeBtn" style="font-weight: bold;text-align: center;color: #F00;width: 20px;height: 20px;cursor: pointer;float:right;">
                    X
                </div>
            </div>

            <div id="iframe_div" style="width: 500px;height: 600px;">
                <iframe style="display: block;width:100%;height: 100%;" src="https://vinny-888.github.io/LiquidLandsThematicMaps/items/item_small.html?item=${itemName}&cities=${citiesStr}&items=${paramStr}"></iframe>
            </div>
        </div>`;
    headups.style.cssText = `position:fixed;top:70px;right:10px;z-index: 9999;`;
    body.appendChild(headups);
    document.getElementById('refreshBtn').addEventListener("click", ()=>{
        recheckVersion();
    });
    document.getElementById('closeBtn').addEventListener("click", ()=>{
        close();
    });
}

function close(){
    // chrome.storage.sync.set({"enabled":false});
    chrome.storage.local.set({ enabled: false }, function() {
        console.log('Value is set to ' + 'value');
    });
    let headsup = document.getElementById('iframe_div');

    if(headsup){
        // headsup.parentNode.removeChild(headsup);
        if(headsup.style.display == 'block'){
            headsup.style.display = 'none';
        } else {
            headsup.style.display = 'block';
        }
    }
}