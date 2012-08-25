(function () {
    "use strict";
    function createDB() {
        var dbRequest = window.indexedDB.open("ArticleDB", 1);
        dbRequest.onsuccess = function (evt) { dbSuccess(evt); };
        dbRequest.onupgradeneeded = function (evt) { dbVersionUpgrade(evt); };
    }
    function dbSuccess(evt) {
        Data.db = evt.target.result;
        if (Data.db.objectStoreNames.length === 0) {
            Data.db.close();
            Data.db = null;
            window.indexedDB.deleteDatabase("ArticleDB", 1);

            createDB();
        }
        else {
            loadArray(Data.currentRegion);
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

        loadData(evt);
    }

    //declare WinJS.Binding.List(for search)
    var list = new WinJS.Binding.List();

    //declare bindinglist(for home.html with region filter)
    var articlelist = new WinJS.Binding.List();
    var subjectArray = new Array();//groups in list
    var articleArray = new Array();//groupitems in list

    function loadData(evt) {
        Data.db = evt.target.result;

        //load db: resource
        var foldername = "data";
        var filename = "resource.xml";
        Windows.ApplicationModel.Package.current.installedLocation.getFolderAsync(foldername).done(function (folder) {
            folder.getFileAsync(filename).done(function (file) {
                var loadSettings = new Windows.Data.Xml.Dom.XmlLoadSettings;
                loadSettings.prohibitDtd = false;
                loadSettings.resolveExternals = false;

                Windows.Data.Xml.Dom.XmlDocument.loadFromFileAsync(file, loadSettings).done(function (xmlDoc) {
                    var nodes = xmlDoc.getElementsByTagName(Data.language);

                    for (var i = 0; i < nodes.length; i++) {
                        objarticle = new Object();
                        objAddProperty("id", i + 1);
                        objAddProperty("language", Data.language);

                        var txn = Data.db.transaction(["resource"], "readwrite");
                        var resourceStore = txn.objectStore("resource");

                        for (var j = 0; j < nodes[i].childNodes.length; j++) {
                            if (nodes[i].childNodes[j].nodeType == 1) {
                                if (nodes[i].childNodes[j].nodeName == "subjectid") {
                                    var group = parseInt(nodes[i].childNodes[j].innerText) - 1;
                                    objAddProperty("group", subjectArray[group]);
                                }
                                //save content without html tag
                                if (nodes[i].childNodes[j].nodeName == "content") {
                                    var content = nodes[i].childNodes[j].innerText.replace(/<\s*\w.*?>/g, "").replace(/<\s*\/\s*\w\s*.*?>|<\s*br\s*>/g, "");
                                    objAddProperty("contentnotag", content);
                                }
                                objAddProperty(nodes[i].childNodes[j].nodeName, nodes[i].childNodes[j].innerText);
                            }
                        }

                        resourceStore.add(objarticle);

                        var isdone = false;
                        txn.oncomplete = function () {
                            //update language in UI
                            if (!isdone) {
                                //updateUI();
                                updateUI();

                                //load db: article, subject
                                filename = Data.language + ".xml";

                                subjectArray = new Array();
                                Windows.ApplicationModel.Package.current.installedLocation.getFolderAsync(foldername).done(function (folder) {
                                    folder.getFileAsync(filename).done(function (file) {
                                        var loadSettings = new Windows.Data.Xml.Dom.XmlLoadSettings;
                                        loadSettings.prohibitDtd = false;
                                        loadSettings.resolveExternals = false;

                                        Windows.Data.Xml.Dom.XmlDocument.loadFromFileAsync(file, loadSettings).done(function (xmlDoc) {
                                            //load subject nodes
                                            var nodes = xmlDoc.getElementsByTagName('subject');
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
                                            }

                                            //load region nodes
                                            var nodes = xmlDoc.getElementsByTagName('a_region');
                                            for (var i = 0; i < nodes.length; i++) {
                                                objarticle = new Object();
                                                objAddProperty("id", i + 1);
                                                objAddProperty(nodes[i].nodeName, nodes[i].innerText);

                                                var txn = Data.db.transaction(["regions"], "readwrite");
                                                var regionStore = txn.objectStore("regions");
                                                regionStore.add(objarticle);
                                            }

                                            //load article nodes
                                            nodes = xmlDoc.getElementsByTagName('article');
                                            for (var i = 0; i < nodes.length; i++) {
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
                                                        objAddProperty(nodes[i].childNodes[j].nodeName, nodes[i].childNodes[j].innerText);
                                                    }
                                                }
                                                var txn = Data.db.transaction(["articles"], "readwrite");
                                                var articlesStore = txn.objectStore("articles");
                                                articlesStore.add(objarticle);

                                                var isdone = false;
                                                txn.oncomplete = function () {
                                                    //update data in page
                                                    if (!isdone) {
                                                        loadArray(Data.currentRegion);

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
                                        });
                                    });
                                });
                            }
                            isdone = true;
                        };
                    }
                });
            });
        });
    }

    function loadArray(region) {
        articleArray = new Array();

        var length = list.length;
        for (var i = 0; i < length; i++) {
            list.pop();
        }

        if (region == 'f') {
            favlistLoad();
        }

        var txn = Data.db.transaction(["articles"], "readonly");
        var store = txn.objectStore("articles");
        var request = store.openCursor();
        request.onsuccess = function (e) {
            var article = e.target.result;
            if (article) {
                if (article.value["region"] == region)
                    articleArray.push(article.value);
                list.push(article.value);
                article.continue();
            }
            else
                listAdd();

            updateView();
        };
    }

    function listAdd() {
        //remove old data
        var length = articlelist.length;
        for (var i = 0; i < length; i++) {
            articlelist.pop();
        }

        //add new ones
        articleArray.forEach(function (item) {
            articlelist.push(item);
        });
    }

    //data for listview(home.html)
    var myGroupedList = articlelist.createGrouped(getGroupKey, getGroupData, compareGroups);
    var favlist = new WinJS.Binding.List();

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
                        else if (element == "id")
                            $("#articleId").html(article[element]);
                        else
                            articles += "<p id='article" + element.toString() + "'>" + element.toString() + ": " + article[element] + "</p>";
                    }
                    $("#article").html(articles);
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
            //no language config, check user's setting
            if (applicationLanguages[0])
                Data.language = applicationLanguages[0].indexOf("zh") == 0 ? "zh-Hant-TW" : applicationLanguages[0];
                //can't support user's setting, set default language
            else
                Data.language = "en-US";
        }

    }
    var resourceArray = new Array();
    function updateUI() {
        resourceArray = new Array();
        var dbRequest = window.indexedDB.open("ArticleDB", 1);
        dbRequest.onsuccess = function (evt) {
            Data.db = evt.target.result;
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

                var changeContentArray = ["homeTitle", "homeFavlist", "addFav", "delFav", "favTitle","navHome","navFav"];
                var item = 2;
                for (var i in changeContentArray) {
                    var element = changeContentArray[i];
                    if (document.getElementById(element)) {
                        if (element == "addFav" || element == "delFav")
                            document.getElementById(element).winControl._labelSpan.innerText = resourceArray[item];
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

            var txn = Data.db.transaction(["articles"], "readwrite");
            var store = txn.objectStore("articles");
            store.clear();

            txn = Data.db.transaction(["subjects"], "readwrite");
            store = txn.objectStore("subjects");
            store.clear();

            txn = Data.db.transaction(["resource"], "readwrite");
            store = txn.objectStore("resource");
            store.clear();

            txn = Data.db.transaction(["regions"], "readwrite");
            store = txn.objectStore("regions");
            store.clear();

            loadData(evt);
        };
    }
    function changeRegionLan() {
        var dbRequest = window.indexedDB.open("ArticleDB", 1);
        dbRequest.onsuccess = function (evt) {
            Data.db = evt.target.result;
            var txn = Data.db.transaction(["regions"], "readwrite");
            var regionStore = txn.objectStore("regions");
            var request = regionStore.get(parseInt(Data.currentRegion));
            request.onsuccess = function (e) {
                var region = e.target.result;
                if (region)
                $("#regionTitle").html(region.a_region);
            };
        };
    }


    var groupedItems = list.createGrouped(
                    function groupKeySelector(item) { return item.group.key; },
                    function groupDataSelector(item) { return item.group; }
                );


    function favlistLoad() {
        var length = Data.favlist.length;
        for (var i = 0; i < length; i++) {
            Data.favlist.pop();
        }

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
                        Data.favlist.push(article);
                        articleArray.push(article);
                    } else {
                        listAdd();
                    }
                }
                like.continue();

                updateView();
            }
        };
    }

    var db, articleid, favAddMsg, language = null;

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
        favAddMsg: favAddMsg,
        currentRegion: "6",
        language: language,

        myGroupedList: myGroupedList,

        favlistLoad: favlistLoad,
        favlist: favlist
    });

})();