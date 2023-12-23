document.addEventListener('DOMContentLoaded', function () {
    let toggle = document.getElementById('toggle');
    toggle.addEventListener("click", function() {
        toggleUI();
    });
    let citiesSave = document.getElementById('citiesSave');
    citiesSave.addEventListener("click", function() {
        saveCities();
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

function saveCities(){
    let cities = document.getElementById('cities').value;
    cities = cities.split(',');
    chrome.runtime.sendMessage({action: "saveCities", cities: cities}, function(response) {
        console.log("saveCities complete");
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