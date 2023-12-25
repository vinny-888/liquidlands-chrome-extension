document.addEventListener('DOMContentLoaded', function () {
    let toggle = document.getElementById('toggle');
    toggle.addEventListener("click", function() {
        toggleUI();
    });
    let citiesSave = document.getElementById('citiesSave');
    citiesSave.addEventListener("click", function() {
        saveCities();
    });
    let removeAttacksBtn = document.getElementById('removeAttacks');
    removeAttacksBtn.addEventListener("click", function() {
        removeAttacks();
    });

    let getBuildableItemsBtn = document.getElementById('getBuildableItems');
    getBuildableItemsBtn.addEventListener("click", function() {
        getBuildableItems();
    });

    let buildItemBtn = document.getElementById('buildItem');
    buildItemBtn.addEventListener("click", function() {
        buildItem();
    });

    chrome.storage.local.get(['enabled'], function(res) {
        if(res.enabled){
            toggle.value = 'Disable';
        } else {
            toggle.value = 'Enable';
        }
    });

    chrome.storage.local.get(['cities'], function(res) {
        if(res.cities){
            document.getElementById('cities').value = res.cities.join(',');
        } else {
            document.getElementById('cities').value = '';
        }
    });

    
});

function getBuildableItems(){
    chrome.runtime.sendMessage({action: "getBuildableItems"}, function(response) {
        console.log("getBuildableItems complete", response.items);
        let select = document.getElementById('buildableItems');
        let sortedItems = response.items.sort((a,b)=> (a.title > b.title) ? 1 : ((b.title > a.title) ? -1 : 0));
        sortedItems.forEach(item => {
            let option = document.createElement('option');
            option.value = item.title;
            option.innerHTML = item.title;
            select.appendChild(option);
        });
    });
}
function buildItem(){
    let info = document.getElementById('build_info');
    info.innerHTML = 'Building please wait...';
    let select = document.getElementById('buildableItems');
    var value = select.options[select.selectedIndex].value;
    let cities = document.getElementById('cities').value;
    cities = cities.split(',');
    chrome.runtime.sendMessage({action: "buildItem", item: value, cities: cities}, function(response) {
        let info = document.getElementById('build_info');
        let failed = '';
        let outOfFunds = '';
        Object.keys(response.results).forEach((key)=>{
            if(response.results[key] != 'Success'){
                if(outOfFunds == '' && response.results[key] == "Fail_InsufficientFunds"){
                    outOfFunds = 'Not enough Bricks';
                }
                failed += ` - ${key} Failed!
`
            }
        })
        let status = failed.length == 0 ? "Complete" : "Failed";
        info.innerHTML = `<pre>Building ${status}! ${outOfFunds}
${failed}
</pre>`;
        // setTimeout(()=>{
        //     info.innerHTML = '';
        // },10000);
        console.log("buildItem complete", response);
    });
}

function saveCities(){
    let cities = document.getElementById('cities').value;
    cities = cities.split(',');
    chrome.runtime.sendMessage({action: "saveCities", cities: cities}, function(response) {
        console.log("saveCities complete");
    });
}

function removeAttacks(){
    chrome.runtime.sendMessage({action: "removeAttacks"}, function(response) {
        console.log("removeAttacks complete");
        aler('Item Built!')
    });
}

function toggleUI(){
    let toggle = document.getElementById('toggle').value;
    if(toggle == "Enable"){
        document.getElementById('toggle').value = 'Disable';
        chrome.runtime.sendMessage({action: "enable"}, function(response) {
            console.log("toggle enabled");
        });
    } else {
        document.getElementById('toggle').value = 'Enable';
        chrome.runtime.sendMessage({action: "disable"}, function(response) {
            console.log("toggle disabled");
        });
    }
}