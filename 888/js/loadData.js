function createDB() {
    var dbRequest = window.indexedDB.open("ArticleDB", 1);
    dbRequest.onsuccess = function (evt) { dbSuccess(evt); };
    dbRequest.onupgradeneeded = function (evt) { dbVersionUpgrade(evt); };
}

function dbSuccess(evt) {
    Data.db = evt.target.result;
    loadData(evt);

    if (Data.db.objectStoreNames.length === 0) {
        Data.db.close();
        Data.db = null;
        window.indexedDB.deleteDatabase("ArticleDB", 1);

        createDB();
    }
}
function dbVersionUpgrade(evt) {
    if (Data.db)
        Data.db.close();

    Data.db = evt.target.result;

    var articleStore = Data.db.createObjectStore("articles", { keyPath: "id", autoIncrement: false });
    var subjectStore = Data.db.createObjectStore("subjects", { keyPath: "id", autoIncrement: false });
    var subjectStore = Data.db.createObjectStore("regions", { keyPath: "id", autoIncrement: false });
    var statusStore = Data.db.createObjectStore("likes", { keyPath: "id", autoIncrement: true });

    var resourceStore = Data.db.createObjectStore("resource", { keyPath: "id", autoIncrement: false });

    
}

//declare WinJS.Binding.List(for search)
var list = new WinJS.Binding.List();

//declare bindinglist(for home.html with region filter)
var articlelist = new WinJS.Binding.List();
var subjectArray = new Array();//groups in list
var articleArray = new Array();//groupitems in list

//get nodedata from XML
function getNodeData(XMLfileName, nodeName, storeName) {
    var foldername = "data";

    Windows.ApplicationModel.Package.current.installedLocation.getFolderAsync(foldername).done(function (folder) {
        folder.getFileAsync(XMLfileName).done(function (file) {
            var loadSettings = new Windows.Data.Xml.Dom.XmlLoadSettings;
            loadSettings.prohibitDtd = false;
            loadSettings.resolveExternals = false;

            Windows.Data.Xml.Dom.XmlDocument.loadFromFileAsync(file, loadSettings).done(function (xmlDoc) {
                var nodes = xmlDoc.getElementsByTagName(nodeName);

                //save node data to indexedDB
                addObjectStore(storeName, nodes);
            });
        });
    });
}

function addObjectStore(storeName, nodes) {
    switch (storeName) {
        case "resource":
            for (var i = 0; i < nodes.length; i++) {
                objarticle = new Object();
                objAddProperty("id", i + 1);
                objAddProperty("language", Data.language);

                for (var j = 0; j < nodes[i].childNodes.length; j++) {
                    if (nodes[i].childNodes[j].nodeType == 1) {
                        objAddProperty(nodes[i].childNodes[j].nodeName, nodes[i].childNodes[j].innerText);
                    }
                }

                var txn = Data.db.transaction(["resource"], "readwrite");
                var resourceStore = txn.objectStore("resource");
                resourceStore.add(objarticle);
            }
            break;

        case "subjects":
            subjectArray = new Array();
            for (var i = 0; i < nodes.length; i++) {
                objarticle = new Object();
                objAddProperty("id", i + 1);
                for (var j = 0; j < nodes[i].attributes.length; j++) {
                    objAddProperty(nodes[i].attributes[j].nodeName, nodes[i].attributes[j].nodeValue);
                }
                var txn = Data.db.transaction(["subjects"], "readwrite");
                var subjectsStore = txn.objectStore("subjects");

                subjectsStore.put(objarticle);
                subjectArray.push(objarticle);

                var isdone = false;

                txn.oncomplete = function () {
                    if (!isdone) {
                        //when subject stored, call function to store article data
                        var articleNodes = getNodeData(Data.language + ".xml", "article", "articles");
                    }
                    isdone = true;
                };
            }
            break;

        case "regions":
            for (var i = 0; i < nodes.length; i++) {
                objarticle = new Object();
                objAddProperty("id", i + 1);
                objAddProperty(nodes[i].nodeName, nodes[i].innerText);

                var txn = Data.db.transaction(["regions"], "readwrite");
                var regionStore = txn.objectStore("regions");
                regionStore.add(objarticle);
            }
            break;

        case "articles":

            for (var i = 0; i < nodes.length; i++) {
                var addToList = false;
                objarticle = new Object();
                objAddProperty("id", i + 1);
                for (var j = 0; j < nodes[i].childNodes.length; j++) {
                    if (nodes[i].childNodes[j].nodeType == 1) {
                        if (nodes[i].childNodes[j].nodeName == "subjectid") {
                            var group = parseInt(nodes[i].childNodes[j].innerText) - 1;
                            objAddProperty("group", subjectArray[group]);
                        }
                        //save content without html tag
                        if (nodes[i].childNodes[j].nodeName == "content") {
                            //regex:html tag /<\s*(\S+)(\s[^>]*)?>[\s\S]*<\s*\/\1\s*>/ 
                            //htmltag open /<\s*\w.*?>/g
                            //htmltag close /<\s*\/\s*\w\s*.*?>|<\s*br\s*>/g
                            var content = nodes[i].childNodes[j].innerText.replace(/<\s*\w.*?>/g, "").replace(/<\s*\/\s*\w\s*.*?>|<\s*br\s*>/g, "");
                            objAddProperty("contentnotag", content);
                        }
                        if (nodes[i].childNodes[j].nodeName == "selected" && Data.currentRegion!="f") {
                            addToList = true;
                        }
                        objAddProperty(nodes[i].childNodes[j].nodeName, nodes[i].childNodes[j].innerText);
                    }
                }
                var txn = Data.db.transaction(["articles"], "readwrite");
                var articlesStore = txn.objectStore("articles");
                articlesStore.add(objarticle);
                if (addToList)
                    articlelist.push(objarticle);

                var isdone = false;

                txn.oncomplete = function () {
                    if (!isdone) {
                        
                            updateView();
                        
                        updateUI();

                        loadListforSearch();
                        switch (WinJS.Navigation.location) {
                            case "/pages/article/article.html":
                                showData("article");
                                break;
                            case "/pages/favorite/favorite.html":
                                //showData("favorite");
                                break;
                            case "/pages/home/home.html":
                                Data.changeRegionLan();
                                break;
                        }
                    }
                    isdone = true;
                };
            }
            break;
    }
}

function cleanList(source) {
    //clear articlelist
    var length = source.length;
    for (var i = 0; i < length; i++) {
        source.pop();
    }
}

function loadData(evt) {
    Data.db = evt.target.result;

    cleanList(articlelist);
    cleanList(list);

    var resourceNodes = getNodeData("resource.xml", Data.language, "resource");

    //when subject stored, call function to store article data
    var subjectNodes = getNodeData(Data.language + ".xml", "subject", "subjects");

    var regionNodes = getNodeData(Data.language + ".xml", "a_region", "regions");

}

//data for listview
var myGroupedList = articlelist.createGrouped(getGroupKey, getGroupData, compareGroups);

var favlist = new WinJS.Binding.List();
var groupedFavList = favlist.createGrouped(getGroupKey, getGroupData, compareGroups);


// Function used to sort the groups by first letter
function compareGroups(left, right) {
    return left.charCodeAt(0) - right.charCodeAt(0);
}
// Function which returns the group key that an item belongs to
function getGroupKey(dataItem) {
    return dataItem.subjectid;
}
// Function which returns the data for a group
function getGroupData(dataItem) {
    return {
        title: dataItem.group.name
    };
}

var objarticle = new Object();
function objAddProperty(propertyname, propertyvalue) {
    Object.defineProperty(objarticle, propertyname, {
        value: propertyvalue,
        writable: true,
        enumerable: true,
        configurable: true
    });
}

function showData(show) {
    switch (show) {
        case "article":
            var txn = Data.db.transaction(["articles"], "readwrite");
            var store = txn.objectStore("articles");
            var request = store.get(parseInt(Data.articleid));
            var articles = "";

            request.onsuccess = function (e) {
                var article = e.target.result;
                Data.currnetArticle = article;
                for (var element in article) {
                    if (element == "title")
                        $("#articleTitle").html(article[element]);
                    else if (element == "subtitle")
                        $("#articleSubTitle").html(article[element]);
                    else if (element == "author")
                        $("#articleAuthor").html(article[element]);
                    else if (element == "content")
                        $(".articleArea").html($(".articleArea").html() + article[element]);
                    else if (element == "id")
                        $("#articleId").html(article[element]);
                    else if (element == "group") {
                        $("#contentPhoto").addClass("content-photo-" + article[element].key);
                        $("#articleSubjectName").html(article[element].name);
                    }
                    else
                        articles += "<p id='article" + element.toString() + "'>" + element.toString() + ": " + article[element] + "</p>";
                }
                $("#article").html(articles);
                //adjust div height
                $('[class^="content-photo"]').css('height', $(window).height());

                if (!article) {
                    $("#article").append("can't find this article.");
                }
            }

            break;
    }
}

function initLanguage() {
    //get current language
    var applicationLanguages = Windows.Globalization.ApplicationLanguages.languages;
    if (!Data.language) {
        Data.language = "zh-Hant-TW";
        ////no language config, check user's setting
        //if (applicationLanguages[0])
        //    Data.language = applicationLanguages[0].indexOf("zh") == 0 ? "zh-Hant-TW" : applicationLanguages[0];
        //    //can't support user's setting, set default language
        //else
        //    Data.language = "en-US";
    }

}
var resourceArray = new Array();
function updateUI(callBack) {
    resourceArray = new Array();
    var dbRequest = window.indexedDB.open("ArticleDB", 1);
    dbRequest.onsuccess = function (evt) {
        var txn = Data.db.transaction(["resource"], "readonly");
        var store = txn.objectStore("resource");
        var request = store.openCursor();
        request.onsuccess = function (e) {
            var resource = e.target.result;
            if (resource) {
                for (var item in resource.value) {
                    resourceArray.push(resource.value[item]);
                }
            }

            var changeContentArray = ["homeTitle", "homeIndex", "addFav", "delFav", "favTitle", "navHome", "navFav"];
            var item = 2;
            for (var i in changeContentArray) {
                var element = changeContentArray[i];
                if (document.getElementById(element)) {
                    if (element == "addFav" || element == "delFav") {
                        document.getElementById(element).winControl.label = resourceArray[item];
                        Article.checkLike("del");
                    }
                    else
                        document.getElementById(element).textContent = resourceArray[item];
                }
                item++;
            }
        };
    };
}
function updateLanguage() {
    initLanguage();

    //load new language data to db
    var dbRequest = window.indexedDB.open("ArticleDB", 1);
    dbRequest.onsuccess = function (evt) {
        //clear objectstores of article and subject
        Data.db = evt.target.result;

        var clearDB = ["articles", "subjects", "regions", "resource"];
        for (var item in clearDB) {
            var txn = Data.db.transaction([clearDB[item]], "readwrite");
            var store = txn.objectStore(clearDB[item]);
            store.clear();
        }

        //data for listview(home.html)
        var myGroupedList = articlelist.createGrouped(getGroupKey, getGroupData, compareGroups);
        var favlist = new WinJS.Binding.List();

        loadData(evt);
    };
}

var groupedItems = list.createGrouped(
                function groupKeySelector(item) { return item.group.key; },
                function groupDataSelector(item) { return item.group; }
            );


function favlistLoad() {
    var txn = Data.db.transaction(["likes"], "readonly");
    var statusStore = txn.objectStore("likes");
    var request = statusStore.openCursor();
    request.onsuccess = function (e) {
        var like = e.target.result;
        if (like) {
            var txn = Data.db.transaction(["articles"], "readonly");
            var store = txn.objectStore("articles");
            var request = store.get(parseInt(like.value["articleid"]));
            var likeid = like.value.id;
            articleArray = [];

            request.onsuccess = function (e) {
                var article = e.target.result;
                if (article) {
                    var addtolist = true;
                    for (var item in articleArray) {
                        if (articleArray[item] == article.id) {
                            addtolist = false;
                            break;
                        }
                    }
                    articleArray.push(article.id);
                    if (addtolist)
                        articlelist.push(article);
                }
            }
            like.continue();
        }
    };
}

var resourceArray = new Array();

function changeRegionLan() {
    var dbRequest = window.indexedDB.open("ArticleDB", 1);
    dbRequest.onsuccess = function (evt) {
        Data.db = evt.target.result;
        var txn = Data.db.transaction(["regions"], "readwrite");
        var regionStore = txn.objectStore("regions");

        if (!parseInt(Data.currentRegion)) {
            switch (Data.currentRegion) {
                case 'f':
                    region = 7;
                    break;
                case 'b':
                    region = 6;
                    break;
            }
        }
        else {
            var region = parseInt(Data.currentRegion);
        }
        var request = regionStore.get(region);
        request.onsuccess = function (e) {
            var region = e.target.result;
            if (region)
                $("#regionTitle").html(region.a_region);
        };
    };
}


function loadArray(region) {
    articleArray = new Array();
    cleanList(articlelist);

    if (region == undefined || region.length <= 0) {
        region = Data.currentRegion;
    }

    var db, articleid, favAddMsg, language = null;


    if (region == 'f') {
        favlistLoad();
        return;
    }

    var txn = Data.db.transaction(["articles"], "readonly");
    var store = txn.objectStore("articles");
    var request = store.openCursor();
    request.onsuccess = function (e) {
        var article = e.target.result;
        if (article) {
            if (article.value["region"] == region || (region == "b" && article.value["selected"])) {
                var addtolist = true;
                for (var item in articleArray) {
                    if (article.value.id == articleArray[item]) {
                        addtolist = false;
                        break;
                    }
                }
                articleArray.push(article.value.id);
                if (addtolist) {
                    articlelist.push(article.value);
                }
            }
            article.continue();
        }
    };
}

function loadListforSearch() {
    cleanList(list);
    var txn = Data.db.transaction(["articles"], "readonly");
    var store = txn.objectStore("articles");
    var request = store.openCursor();
    request.onsuccess = function (e) {
        var article = e.target.result;
        if (article) {
            list.push(article.value);
            article.continue();
        }
    };
}

var db, articleid, favAddMsg, language, subjectKey = null;

WinJS.Namespace.define("Data", {
    items: groupedItems,
    groups: groupedItems.groups,
    createDB: createDB,
    showData: showData,

    initLanguage: initLanguage,
    updateLanguage: updateLanguage,
    updateUI: updateUI,
    changeRegionLan: changeRegionLan,

    regionChange: loadArray,

    db: db,
    articleid: articleid,
    isFav: null,

    favAddMsg: favAddMsg,
    currentRegion: "b",
    language: language,

    myGroupedList: myGroupedList,

    favlistLoad: favlistLoad,
    groupedFavList: groupedFavList,
    favlist: favlist,

    subjectKey: subjectKey
});