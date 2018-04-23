javascript:
    /*
     * Author: Titu
     *
     * Script Name: Mass Flag Script
     * Function: Mass Assign/Remove flags from Research Overview
     *
     * Params:
     *	assignFlag - boolean - true => assign flags, false => remove flags, Defaults to false.
     */

var assignFlag = true;

    if (typeof(assignFlag) == "undefined") {
        var assignFlag = true;
    }

var flagTypeInput = prompt("Enter flag type:");

var flagTypes = [
    "Resource production",
    "Recruitment speed",
    "Attack strength",
    "Defense strength",
    "Luck",
    "Population capacity",
    "Lower coin costs",
    "Haul capacity",
    "All"
];

var flagDisplayNames = [
    "Grondstoffen",
    "rekruteringssnelheid",
    "aanval",
    "verdediging",
    "geluk",
    "bevolking",
    "muntkosten",
    "Haul",
    "All"
];

var flagDisplayNamesOriginal = [
    "Resources",
    "Recruit speed",
    "Attack",
    "Defense",
    "Luck",
    "Population",
    "Coin costs",
    "Haul",
    "All"
];

flagTypeInput = flagTypeInput.toLowerCase();
var flagTypeIndex = -1;
for (var i = 0; i < flagTypes.length; i++) {
    if (flagTypes[i].toLowerCase().search(flagTypeInput) > -1) {
        flagTypeIndex = i;
        flagTypeInput = flagTypes[i];
    }
}

// Handle sitter
var sitter = "";
if (document.URL.match(/t=\d+/)) {
    sitter = "&" + document.URL.match(/t=\d+/);
}

// Set up for slow process
var currentRowNumber = -1;
var totalRows = 0;
var flagLevel;
var intervalEvent;
var flagCounts = new Array();

function GetNextVillageIdToProcess(rowNum){
    var id = $("#techs_table tr")[rowNum].id.substr(8);
    var flagDiv = $("#flag_info_" + id + " div")[0];
    if (flagDiv.style.cssText == "") {
        return assignFlag ? -1 : id;
    } else {
        return assignFlag ? id : -1;
    }
}

function IsSameFlagType(villageId){
    var flagDiv = $("#flag_info_" + villageId + " div")[0];

    if (flagDiv.style.cssText == "") {

        if(flagDisplayNames[flagTypeIndex] == "All") {
            return true;
        }

        console.log(flagDiv.textContent);

        if (flagDiv.textContent.match(flagDisplayNames[flagTypeIndex]) != null){
            return true;
        }
    }
    return false;
}

function ProcessVillages(){
    if (assignFlag) {
        // Populate the array with flag counts
        function PopulateArray(table) {
            if (table == null) {
                return;
            }

            var flagRowCells = table.rows[flagTypeIndex + 1].cells;
            for (var i = 1; i < flagRowCells.length; i++) {
                var value = flagRowCells[i].textContent.trim();
                var count = value == "" ? 0 : parseInt(value, 10);
                flagCounts.push(count);
            }
            flagCounts.reverse();
        }

        var flagsInfo = new XMLHttpRequest();
        var location = "https://" + window.location.hostname + "/game.php?village=null&ajax=select_flag&screen=flags" + sitter;
        flagsInfo.open("GET", location, true);
        flagsInfo.onreadystatechange = function () {
            if (flagsInfo.status == 200 && flagsInfo.readyState == 4) {
                var response = flagsInfo.responseText;
                var dummyDocument = document.createElement('html');
                dummyDocument.innerHTML = response.substr(1, response.length - 2).replace(/\\\//g, "/").replace(/\\\"/g, "\"").replace(/\\n/g, "\n").replace(/\\t/g,"\t");
                var flagsTable = dummyDocument.getElementsByTagName('table')[0];
                PopulateArray(flagsTable);
                currentRowNumber = 0;
                flagLevel = 9;
                intervalEvent = setInterval(function() { ProcessSingleVillage(); }, 201);
            }
        }
        flagsInfo.send(null);
    } else {
        currentRowNumber = 0;
        intervalEvent = setInterval(function() { ProcessSingleVillage(); }, 201);
    }
}

function ProcessSingleVillage() {
    if (assignFlag) {
        while (currentRowNumber < totalRows){
            if (flagCounts[0] == 0) {
                flagCounts.splice(0,1);
                flagLevel--;
                continue;
            } else if (isNaN(flagCounts[0])) {
                alert("You've ran out of flags of this type");
                currentRowNumber = totalRows;
                break;
            }
            currentRowNumber++;

            var villageId = GetNextVillageIdToProcess(currentRowNumber);
            if (villageId == -1) {
                continue;
            }
            FlagsOverview.assignFlag(flagTypeIndex + 1, flagLevel, villageId);
            flagCounts[0]--;
            break;
        }
    } else {
        while (currentRowNumber < totalRows) {
            currentRowNumber++;

            console.log(currentRowNumber);
            console.log(totalRows);


            var villageId = GetNextVillageIdToProcess(currentRowNumber);
            if (villageId == -1) {
                continue;
            }
            if (IsSameFlagType(villageId)){
                FlagsOverview.unassignFlag(villageId);
                break;
            }
        }
    }
    if (currentRowNumber >= totalRows) {
        clearInterval(intervalEvent);
        alert("Finishing processing.");
    }
}

var table = $("#techs_table")[0];
if (table == null) {
    alert("This script needs to be run on Research overview.");
} else {
    totalRows = $("#techs_table")[0].rows.length - 1;
    if (flagTypeIndex == -1) {
        alert("Unable to determine flag type");
    } else {
        var task = assignFlag ? "ASSIGN" : "REMOVE";
        if (confirm("You are about to " + task + " *" + flagTypeInput + "* flags")){
            ProcessVillages();
        }
    }
}
