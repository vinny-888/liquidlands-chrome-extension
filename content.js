let myItems = [];
let selectedItem = '';
let cities = [];
let base_url = 'https://vinny-888.github.io/LiquidLandsThematicMaps/';
// let base_url = 'http://127.0.0.1:8080/';
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

function removeAttacks(version){
    chrome.runtime.sendMessage({action: "myItems", version: version}, function(response) {
        if (chrome.runtime.lastError) {
            // Handle any error that might have occurred during message passing
            console.error(chrome.runtime.lastError.message);
        } else {
            console.log('Response from background:', response);
        }
    });
}

function getItems(version){
    chrome.runtime.sendMessage({action: "myItems", version: version}, function(response) {
        if (chrome.runtime.lastError) {
            // Handle any error that might have occurred during message passing
            console.error(chrome.runtime.lastError.message);
        } else {
            console.log('Response from background:', response);
            myItems = response.items;
            if(selectedItem){
                let citiesStr = cities ? cities.join(',') : '';

                let itemCounts = myItems.map((item)=> {
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
                buildItemExt(selectedItem, paramStr, citiesStr);
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
        console.log('Version Set:', version.value);
        chrome.storage.local.set({"version":version.value});
        getItems(version.value);
    }
}

chrome.runtime.onMessage.addListener((request) => {
    if(request.action == 'enable'){
        // chrome.storage.sync.set({"enabled":true});
        chrome.storage.local.set({ enabled: true }, function() {
            console.log('Value is set to ' + 'value');
        });
        window.location.reload();
        // if(window.location.href.indexOf('blueprints') != -1){
        //     addButtons();
        // }
    } else if (request.action == 'disable'){
        // chrome.storage.sync.set({"enabled":false});
        chrome.storage.local.set({ enabled: false }, function() {
            console.log('Value is set to ' + 'value');
        });
        close();
        window.location.reload();
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
            let citiesStr = cities ? cities.join(',') : '';
            let itemCounts = myItems.map((item)=> {
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

            newDiv.innerHTML = `
                <div style="position:absolute;top:10px;left:10px;z-index:1000;">
                    <input id="build_${index}" style="background-color: #ccc;cursor: pointer;padding: 10px;border-radius: 4px;width: 50px;height: 34px;" type="button" value="Build" onclick="buildItemExt('${itemName}', '${paramStr}', '${citiesStr}')">
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
    buildItemExt(e.detail);
});

// content.js
window.addEventListener('message', function(event) {
    // Check if the message is from your webpage
    if (event.source === window && event.data && event.data.type === 'FROM_PAGE') {
        console.log('Message received in content script:', event.data);
        // buildItemExt(event.data.message);
        chrome.storage.local.set({"selectedItem":event.data.message});
    }
});

function buildItemExt(itemName, items, citiesStr){
    // Append the div to the body
    chrome.storage.local.get("quantity",function(res) {
        let quantity = 1;
        if(res.quantity){
            quantity = res.quantity;
        }
        var headups = document.getElementById('headsup');
        if(!headups){
            headups = document.createElement("div"); 
        }
        headups.id = 'headsup';
        // let citiesStr = cities ? cities.join(',') : '';
        headups.innerHTML = `
            <div style="background-color:white;z-index:1000;padding:0px;border: 1px solid #fff;">
                <div style="background-color: #1f2932;width: 100%;height: 30px;padding:4px;">
                    <div id="refreshBtn" style="display: inline-block;float: left;width: 80px;padding: 4px;font-weight: bold;text-align: center;color: #000;cursor: pointer;background-color: #dbdbdb;margin-left: 6px;">
                        Refresh
                    </div>
                    <div id="harvestBtn" style="display: inline-block;float: left;width: 80px;padding: 4px;font-weight: bold;text-align: center;color: #000;cursor: pointer;background-color: #dbdbdb;margin-left: 6px;">
                        Harvest
                    </div>
                    <div id="expandAll" style="display: inline-block;float: left;width: 90px;padding: 4px;font-weight: bold;text-align: center;color: #000;cursor: pointer;background-color: #dbdbdb;margin-left: 6px;">
                        Show Att
                    </div>
                    <div style="display: inline-block;float: left;color: #FFF;margin-top: 4px;font-weight: bold;text-align: center;margin-left: 6px;">
                        Quantity: <input style="background-color: #FFF;width: 30px;" id="quantity" type="number" value="${quantity}">
                    </div>
                    <div id="closeBtn" style="font-weight: bold;text-align: center;color: #F00;width: 20px;height: 20px;cursor: pointer;float:right;">
                        X
                    </div>
                </div>

                <div id="iframe_div" style="width: 520px;height: 600px;">
                    <iframe style="display: block;width:100%;height: 100%;" src="${base_url}/items/item_small.html?v=0.6&item=${itemName}&cities=${citiesStr}&items=${items}&quantity=${quantity}"></iframe>
                </div>
            </div>`;
        headups.style.cssText = `position:fixed;top:70px;right:10px;z-index: 9999;`;
        body.appendChild(headups);
        setTimeout(()=>{
            document.getElementById('refreshBtn').addEventListener("click", ()=>{
                recheckVersion();
            });
            document.getElementById('closeBtn').addEventListener("click", ()=>{
                close();
            });
            document.getElementById('quantity').addEventListener("click", ()=>{
                updateQuantity();
            });
            document.getElementById('harvestBtn').addEventListener("click", ()=>{
                harvestAll();
            });
            document.getElementById('expandAll').addEventListener("click", ()=>{
                expandAll();
            });
            
        }, 0)
    });
}

function close(){
    // chrome.storage.sync.set({"enabled":false});
    try{
        chrome.storage.local.set({ enabled: false }, function() {
            console.log('Value is set to false');
        });
    } catch(err){
        console.log('Error setting enabled to false:', err);
    }
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

function updateQuantity(){

    let quantity = document.getElementById('quantity').value;
    // chrome.storage.sync.set({"enabled":false});
    try{
        chrome.storage.local.set({ quantity: quantity}, function() {
            console.log('quantity is set to ' + quantity);
            recheckVersion();
        });
    } catch(err){
        console.log('Error setting quantity to : '+quantity, err);
    }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function harvestAll(){
    let harvestBtns = document.getElementsByClassName('action');
    if(harvestBtns){
        let actions = Array.from(harvestBtns)
        for(let i=0;i<actions.length; i++){
            let action = actions[i];
            action.click();
            await sleep(50);
        }
        alert('Items harvested');
    } else {
        alert('Must be on harvest screen');
    }
}

async function expandAll(){
    let elm = {};
    while(elm){
        let elms = Array.from(document.getElementsByClassName('addon_more'));
        if(elms.length > 0){
            elm = elms[0];
            elm.click();
        } else {
            elm = null;
        }
        await sleep(250);
    }
    console.log('Done expanding')
    await sleep(1500);
    let cards = document.getElementById('DeckCards').childNodes;
    let removeCards = [];
    cards.forEach((card)=>{
        let action = card.querySelector('.action');
        if(action){
            removeCards.push(card)
        }
    })
    console.log('Removing')
    removeCards.forEach((card)=>{
        card.parentNode.removeChild(card);
    });
}