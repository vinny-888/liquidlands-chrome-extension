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
    let explorerItemsBtn = document.getElementById('explorerItems');
    explorerItemsBtn.addEventListener("click", function() {
        explorerItems();
    });

    let getBuildableItemsBtn = document.getElementById('getBuildableItems');
    getBuildableItemsBtn.addEventListener("click", function() {
        getBuildableItems();
    });

    let buildItemBtn = document.getElementById('buildItem');
    buildItemBtn.addEventListener("click", function() {
        buildItem();
    });

    let soldItemsBtn = document.getElementById('getSoldCounts');
    soldItemsBtn.addEventListener("click", function() {
        soldItems();
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
    let bricks_min = document.getElementById('bricks_min').value;
    let bricks_max = document.getElementById('bricks_max').value;
    chrome.runtime.sendMessage({action: "getBuildableItems"}, function(response) {
        console.log("getBuildableItems complete", response.items);
        let select = document.getElementById('buildableItems');
        select.innerHTML = '';
        let sortedItems = response.items.sort((a,b)=> (a.title > b.title) ? 1 : ((b.title > a.title) ? -1 : 0));
        sortedItems = sortedItems.filter((item)=>item.difficulty <= bricks_max && item.difficulty >= bricks_min);
        sortedItems.forEach(item => {
            let option = document.createElement('option');
            option.value = item.title;
            let values = ' b:' + item.difficulty;
            if(item.attack != 0){
                values += ' a: ' + item.attack
            }

            if(item.defence != 0){
                values += ' d: ' + item.defence
            }

            if(item.raid != 0){
                values += ' r: ' + item.raid
            }

            if(item.invincibility != 0){
                values += ' i: ' + item.invincibility
            }

            if(item.leave != 0){
                values += ' l: ' + item.leave
            }
            option.innerHTML = item.title + values;
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

function soldItems(){
    let info = document.getElementById('build_info');
    info.innerHTML = 'Calculating please wait...';
    chrome.runtime.sendMessage({action: "soldItems"}, function(response) {
        let info = document.getElementById('build_info');
        let stats = '';
        let total = 0;
        let count = 0;
        response.soldCounts.forEach((item)=>{
            stats += `${item.count} x ${item.name} - ${item.bricks} Bricks
`
            total+=parseFloat(item.bricks);
            count+=item.count;
        })

        let bricksPercent = (total / response.total).toFixed(3) + '%';
        info.innerHTML = `<pre>Sales Stats: 
Buildings: ${response.count} Bricks: ${response.total} Return: ${bricksPercent}

Total: ${count} Items for ${total.toFixed(1)} Bricks

${stats}</pre>`;
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
    let info = document.getElementById('build_info');
    info.innerHTML = 'Removing Attacks please wait...';
    chrome.runtime.sendMessage({action: "removeAttacks"}, function(response) {
        console.log("removeAttacks complete");
        let info = document.getElementById('build_info');
        info.innerHTML = 'Remove Attacks Complete!';
    });
}

function explorerItems(){
    let info = document.getElementById('build_info');
    info.innerHTML = 'Getting all items please wait...';
    chrome.runtime.sendMessage({action: "explorerItems"}, function(response) {
        console.log("explorer items complete");
        let stats = response.stats;
        let total = (stats.ranges['3.0'].count * 3) 
            + (stats.ranges['2.0'].count * 2)
            + (stats.ranges['1.5'].count * 1.5)
            + (stats.ranges['1.0'].count * 1.0)
            + (stats.ranges['0.7'].count * 0.7)
            + (stats.ranges['0.5'].count * 0.5)
            + (stats.ranges['0.4'].count * 0.4)
            + (stats.ranges['0.3'].count * 0.3)
            + (stats.ranges['0.2'].count * 0.2)
            + (stats.ranges['0.1'].count * 0.1);
        let results = 
`Bricks: ${stats.bricks.count}
  Attack: ${stats.bricks.attack}
  Defense: ${stats.bricks.defense}

Items: ${stats.items.count}
  Attack: ${stats.items.attack}
  Defense: ${stats.items.defense}
  
Explorers:
Range: # - Bricks - Avg Def - Total
3.0: ${(stats.ranges['3.0'].count)} - ${(stats.ranges['3.0'].count * 3).toFixed(1)} - ${stats.ranges['3.0'].count ? (stats.ranges['3.0'].total / stats.ranges['3.0'].count).toFixed(1) : 0} - ${stats.ranges['3.0'].total}
2.0: ${(stats.ranges['2.0'].count)} - ${(stats.ranges['2.0'].count * 2).toFixed(1)} - ${stats.ranges['2.0'].count ? (stats.ranges['2.0'].total / stats.ranges['2.0'].count).toFixed(1) : 0} - ${stats.ranges['2.0'].total}
1.5: ${(stats.ranges['1.5'].count)} - ${(stats.ranges['1.5'].count * 1.5).toFixed(1)} - ${stats.ranges['1.5'].count ? (stats.ranges['1.5'].total / stats.ranges['1.5'].count).toFixed(1) : 0} - ${stats.ranges['1.5'].total}
1.0: ${(stats.ranges['1.0'].count)} - ${(stats.ranges['1.0'].count * 1).toFixed(1)} - ${stats.ranges['1.0'].count ? (stats.ranges['1.0'].total / stats.ranges['1.0'].count).toFixed(1) : 0} - ${stats.ranges['1.0'].total}
0.7: ${(stats.ranges['0.7'].count)} - ${(stats.ranges['0.7'].count * 0.7).toFixed(1)} - ${stats.ranges['0.7'].count ? (stats.ranges['0.7'].total / stats.ranges['0.7'].count).toFixed(1) : 0} - ${stats.ranges['0.7'].total}
0.5: ${(stats.ranges['0.5'].count)} - ${(stats.ranges['0.5'].count * 0.5).toFixed(1)} - ${stats.ranges['0.5'].count ? (stats.ranges['0.5'].total / stats.ranges['0.5'].count).toFixed(1) : 0} - ${stats.ranges['0.5'].total}
0.4: ${(stats.ranges['0.4'].count)} - ${(stats.ranges['0.4'].count * 0.4).toFixed(1)} - ${stats.ranges['0.4'].count ? (stats.ranges['0.4'].total / stats.ranges['0.4'].count).toFixed(1) : 0} - ${stats.ranges['0.4'].total}
0.3: ${(stats.ranges['0.3'].count)} - ${(stats.ranges['0.3'].count * 0.3).toFixed(1)} - ${stats.ranges['0.3'].count ? (stats.ranges['0.3'].total / stats.ranges['0.3'].count).toFixed(1) : 0} - ${stats.ranges['0.3'].total}
0.2: ${(stats.ranges['0.2'].count)} - ${(stats.ranges['0.2'].count * 0.2).toFixed(1)} - ${stats.ranges['0.2'].count ? (stats.ranges['0.2'].total / stats.ranges['0.2'].count).toFixed(1) : 0} - ${stats.ranges['0.2'].total}
0.1: ${(stats.ranges['0.1'].count)} - ${(stats.ranges['0.1'].count * 0.1).toFixed(1)} - ${stats.ranges['0.1'].count ? (stats.ranges['0.1'].total / stats.ranges['0.1'].count).toFixed(1) : 0} - ${stats.ranges['0.1'].total}
Total: ${total.toFixed(1)}`;
        let info = document.getElementById('build_info');
        info.innerHTML = '<pre>'+results+'</pre>';
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