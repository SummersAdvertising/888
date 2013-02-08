function createDB() {
    var dbRequest = window.indexedDB.open("ArticleDB", 1);
    dbRequest.onsuccess = function (evt) { dbSuccess(evt); };
    dbRequest.onupgradeneeded = function (evt) { dbVersionUpgrade(evt); };
}
function dbSuccess(evt) {
    Data.db = evt.target.result;

    var clearDB = ["articles", "subjects", "regions"];
    for (var item in clearDB) {
        var txn = Data.db.transaction([clearDB[item]], "readwrite");
        var store = txn.objectStore(clearDB[item]);
        store.clear();
    }

    initLanguage(evt);

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
                        if (nodes[i].childNodes[j].nodeName == "selected" && Data.currentRegion != "f") {
                            addToList = true;
                        }
                        objAddProperty(nodes[i].childNodes[j].nodeName, nodes[i].childNodes[j].innerText);
                    }
                }
                var txn = Data.db.transaction(["articles"], "readwrite");
                var articlesStore = txn.objectStore("articles");
                articlesStore.add(objarticle);
                if (addToList) {
                    objarticle.cover = objarticle.folder + "cover.png";
                    articlelist.push(objarticle);
                }
                var isdone = false;

                txn.oncomplete = function () {
                    if (!isdone) {

                        //updateView();

                        updateUI();

                        loadListforSearch();
                        switch (WinJS.Navigation.location) {
                            case "/pages/article/article.html":
                                showData("article");
                                break;
                            case "/pages/home/home.html":
                                Data.changeRegionLan();
                                if (Data.currentRegion == "f") { favlistLoad(); }
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
    //clear list
    var length = source.length;
    for (var i = 0; i < length; i++) {
        source.pop();
    }
}

function loadData(evt) {
    Data.db = evt.target.result;

    cleanList(articlelist);
    cleanList(list);

    var regionNodes = getNodeData(Data.language + ".xml", "a_region", "regions");
    var resourceNodes = getNodeData("resource.xml", Data.language, "resource");

    //when subject stored, call function to store article data
    var subjectNodes = getNodeData(Data.language + ".xml", "subject", "subjects");
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
                        var descript = article[element].descript;
                        //var descript = article[element].descript.replace(/br/gi, "<br />");
                        $("#articleSubjectDescrip").html(descript);
                    }
                    else if (element == "link")
                        $("#articleLink").html(article[element]);
                    else
                        articles += "<p id='article" + element.toString() + "'>" + element.toString() + ": " + article[element] + "</p>";
                }
                $("#article").html(articles);
                //adjust div height
                $('[class^="content-photo"]').css('height', $(window).height());

                //disable all the links
                $("a").bind("click", function () {
                    return false;
                });

                //remove imgs' alt and title attributes
                $("img").removeAttr("title").removeAttr("alt");

                if (!article) {
                    $("#article").append("can't find this article.");
                }
            }

            break;
    }
}

function initLanguage(evt) {

    var dbRequest = window.indexedDB.open("ArticleDB", 1);
    dbRequest.onsuccess = function (evt) {
        var txn = Data.db.transaction(["resource"], "readonly");
        var store = txn.objectStore("resource");
        var request = store.openCursor();
        request.onsuccess = function (e) {
            var resource = e.target.result;
            if (resource) {
                Data.language = Data.language == undefined ? resource.value.language : Data.language;
            }
            else {
                var applicationLanguages = Windows.System.UserProfile.GlobalizationPreferences.languages;
                if (!Data.language) {
                    //no language config, check user's setting
                    if (applicationLanguages[0]) {
                        for (var item in applicationLanguages) {

                            switch (applicationLanguages[item].indexOf("zh")) {
                                case 0:
                                    Data.language = "zh-Hant-TW";
                                    break;
                                default:
                                    switch (applicationLanguages[item].indexOf("en")) {
                                        case 0:
                                            Data.language = "en-US";
                                            break;
                                        default:
                                            switch (applicationLanguages[item].indexOf("ja")) {
                                                case 0:
                                                    Data.language = "ja";
                                                    break;
                                            }
                                            break;
                                    }
                                    break;
                            }
                            if (Data.language) {
                                break;
                            }

                        }
                    }
                }
                    //can't support user's setting, set default language
                else {
                    Data.language = "en-US";
                }
            }

            Data.language;
            loadData(evt);

            // 預選台灣地圖
            switch (Data.language) {
                case "zh-Hant-TW":
                    $('#taiwanMap').attr('src', "/images/map/map-" + Data.currentRegion + ".png");
                    break;
                case "en-US":
                    $('#taiwanMap').attr('src', "/images/map/map-" + Data.currentRegion + "-en.png");
                    break;
                case "ja":
                    $('#taiwanMap').attr('src', "/images/map/map-" + Data.currentRegion + "-jp.png");
                    break;
                default:
                    $('#taiwanMap').attr('src', "/images/map/map-" + Data.currentRegion + ".png");
                    break;
            }
        };
    }
}

var resourceArray = new Array();
function updateUI(callBack) {
    var UIhash = new Object();

    var dbRequest = window.indexedDB.open("ArticleDB", 1);
    dbRequest.onsuccess = function (evt) {
        var txn = Data.db.transaction(["resource"], "readonly");
        var store = txn.objectStore("resource");
        var request = store.openCursor();
        request.onsuccess = function (e) {
            var resource = e.target.result;
            if (resource) {
                for (var item in resource.value) {

                    UIhash[item] = resource.value[item];

                }
            }

            var changeContentArray = ["homeTitle", "homeIndex", "addFav", "delFav", "favTitle", "navHome", "navFav", "snappedTitle"];
            for (var i in changeContentArray) {
                var element = changeContentArray[i];
                if (document.getElementById(element)) {
                    if (element == "addFav" || element == "delFav") {
                        document.getElementById(element).winControl.label = UIhash[element];
                        Article.checkLike("del");
                    }
                    else {
                        if (element == "snappedTitle") { document.getElementById(element).textContent = UIhash["homeTitle"]; }
                        else { document.getElementById(element).textContent = UIhash[element]; }
                    }
                }
            }

            switch (Data.language) {
                case "zh-Hant-TW":
                    $("#snapRegion1").html("北台灣");
                    $("#snapRegion2").html("東台灣");
                    $("#snapRegion3").html("中台灣");
                    $("#snapRegion4").html("南台灣");
                    $("#snapRegion5").html("離島");
                    $("#snapRegionf").html("我的最愛");
                    $("#favTitle").html("您尚未建立我的最愛，請參考圖示步驟");
                    $("#favStep1").html("1. 在文章頁以觸控由下往上滑出應用程式列或<br />滑鼠按右鍵叫出應用程式列");
                    $("#favStep2").html("2. 點選『加入我的最愛』");
                    break;
                case "en-US":
                    $("#snapRegion1").html("Northern Taiwan");
                    $("#snapRegion2").html("Eastern Taiwan");
                    $("#snapRegion3").html("Central Taiwan");
                    $("#snapRegion4").html("Southern Taiwan");
                    $("#snapRegion5").html("Outlying Islands");
                    $("#snapRegionf").html("Favorites");
                    $("#favTitle").html("Your favorite list is empty. <br />Please follow the guide to add articles as favorites.");
                    $("#favStep1").html("1. Touch screen from bottom to top in the <br />article page, or click on the right button <br />of mouse to show up the AppBar.");
                    $("#favStep2").html('2. Click "Add to Favorites".<br /><br /><br />');
                    break;
                case "ja":
                    $("#snapRegion1").html("台湾北部");
                    $("#snapRegion2").html("台湾東部");
                    $("#snapRegion3").html("台湾中部");
                    $("#snapRegion4").html("台湾南部");
                    $("#snapRegion5").html("離島");
                    $("#snapRegionf").html("お気に入り");
                    $("#favTitle").html("お気に入りの文章はまだありません。次の説明を参考してください。");
                    $("#favStep1").html("1. 文章画面の下端から上端へスワイプすると、<br />アプリバーが表示されます。パソコンを使って<br />いる場合は、右クリックしてください。");
                    $("#favStep2").html("2. 「お気に入りに追加」をクリックして<br />お気に入りが利用できます。<br /><br />");
                    break;
                default:
                    $("#snapRegion1").html("北台灣");
                    $("#snapRegion2").html("東台灣");
                    $("#snapRegion3").html("中台灣");
                    $("#snapRegion4").html("南台灣");
                    $("#snapRegion5").html("離島");
                    $("#snapRegionf").html("我的最愛");
                    $("#favTitle").html("您尚未建立我的最愛，請參考圖示步驟");
                    $("#favStep1").html("1. 在文章頁以觸控由下往上滑出應用程式列或<br />滑鼠按右鍵叫出應用程式列");
                    $("#favStep2").html("2. 點選『加入我的最愛』");
                    break;
            }

            //change snapped view region name
            if (Windows.UI.ViewManagement.ApplicationView.value == Windows.UI.ViewManagement.ApplicationViewState.snapped) {
                var dbRequest = window.indexedDB.open("ArticleDB", 1);
                dbRequest.onsuccess = function (evt) {
                    Data.db = evt.target.result;
                    var txn = Data.db.transaction(["regions"], "readwrite");
                    var regionStore = txn.objectStore("regions");

                    for (var regionNum = 1; regionNum <= 7; regionNum++) {
                        var request = regionStore.get(regionNum);

                        request.onsuccess = function (e) {
                            var region = e.target.result;
                            if (region) {
                                var targetID;
                                if (region.id == 6) { targetID = "#snapRegionb" }
                                else if (region.id == 7) { targetID = "#snapRegionf"; }
                                else { targetID = "#snapRegion" + region.id }
                                $(targetID).html(region.a_region);
                            }
                        };
                    }
                };

                switch (Data.language) {
                    case "zh-Hant-TW":
                        $("#snap-fav-title").html("我的最愛");
                        $("#snap-best-title").html("精選文章");
                        $("#snap-favnotbuild").html("您尚未建立我的最愛");
                        $("#snap-buildfav").html("建立我的最愛");
                        break;
                    case "en-US":
                        $("#snap-fav-title").html("Favorites");
                        $("#snap-best-title").html("Featured Articles");
                        $("#snap-favnotbuild").html("Your favorite list is empty.");
                        $("#snap-buildfav").html("Add articles as favorites.");
                        break;
                    case "ja":
                        $("#snap-fav-title").html("お気に入り");
                        $("#snap-best-title").html("注目の文章");
                        $("#snap-favnotbuild").html("お気に入りの文章はまだありません。");
                        $("#snap-buildfav").html("お気に入りに追加");
                        break;
                    default:
                        $("#snap-fav-title").html("我的最愛");
                        $("#snap-best-title").html("精選文章");
                        $("#snap-favnotbuild").html("您尚未建立我的最愛");
                        $("#snap-buildfav").html("建立我的最愛");
                        break;
                }

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
                    if (addtolist) {
                        article.cover = article.folder + "cover.png";
                        articlelist.push(article);
                    }
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
        var regionID;
        switch (Data.currentRegion) {
            case "1":
                regionID = 1;
                break;
            case "2":
                regionID = 2;
                break;
            case "3":
                regionID = 3;
                break;
            case "4":
                regionID = 4;
                break;
            case "5":
                regionID = 5;
                break;
            case "b":
                regionID = 6;
                break;
            case "f":
                regionID = 7;
                break;
        }

        var request = regionStore.get(regionID);
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

    /* 用來偵錯
        if (this.counter != undefined) {
            console.log(++this.counter);
        } else {
            this.counter = 0;
        }
    */

    var db, articleid, favAddMsg, language = null;

    if (region == 'f') {
        favlistLoad();
        return;
    } else {
        $("#favinfo").hide();
    }

    var txn = Data.db.transaction(["articles"], "readonly");
    var store = txn.objectStore("articles");
    var request = store.openCursor();
    request.onsuccess = function (e) {
        var article = e.target.result;
        if (article) {
            if (article.value["region"] == region || (region == "b" && article.value["selected"])) {
                articleArray.push(article.value.id);
                article.value['cover'] = article.value.folder + "cover.png";

                articlelist.push(article.value);
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
            article.value.search = article.value.folder + 'search.png';
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