getVersion();

function getVersion(){
    if(!$$.app.version){
        setTimeout(()=>{
            getVersion();
        }, 200);
    } else {
        let div = document.createElement('div');
        div.innerHTML = `<input id="app_version" type="hidden" value="${$$.app.version}">`;
        document.body.appendChild(div);
    }
}

function buildItem(itemName, items, citiesStr){
    // Append the div to the body
    window.postMessage({ type: 'FROM_PAGE', message: itemName }, '*');
    var headups = document.getElementById('headsup');
    if(!headups){
        headups = document.createElement("div"); 
    }
    headups.id = 'headsup';

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
            <iframe style="display: block;width:100%;height: 100%;" src="https://vinny-888.github.io/LiquidLandsThematicMaps/items/item_small.html?item=${itemName}&items=${items}&cities=${citiesStr}"></iframe>
            </div>
            
        </div>`;
    headups.style.cssText = `position:fixed;top:70px;right:10px;z-index: 9999;`;
    body.appendChild(headups);
    setTimeout(()=>{
        document.getElementById('closeBtn').addEventListener("click", ()=>{
            close();
        });
    },0)
}

function close(){
    chrome.storage.sync.set({"enabled":false});
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