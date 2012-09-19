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
            //clear objectstores of article and subject, load data
            var txn = Data.db.transaction(["articles"], "readwrite");
            var store = txn.objectStore("articles");
            store.clear();

            txn = Data.db.transaction(["subjects"], "readwrite");
            store = txn.objectStore("subjects");
            store.clear();

            loadData(evt);
        }
    }
    function dbVersionUpgrade(evt) {
        if (Data.db)
            Data.db.close();

        Data.db = evt.target.result;

        var articleStore = Data.db.createObjectStore("articles", { keyPath: "id", autoIncrement: false });
        var subjectStore = Data.db.createObjectStore("subjects", { keyPath: "id", autoIncrement: false });
        var statusStore = Data.db.createObjectStore("likes", { keyPath: "id", autoIncrement: true });
    }

    //declare WinJS.Binding.List(for search)
    var list = new WinJS.Binding.List();
    var subjectArray = new Array();//groups in list
    var articleArray = new Array();//groupitems in list

    function loadData(evt) {
        var foldername = "data";
        var filename = Data.language + ".xml";
        subjectArray = new Array();
        //article = new Array();

        Data.db = evt.target.result;

        Windows.ApplicationModel.Package.current.installedLocation.getFolderAsync(foldername).done(function (folder) {
            folder.getFileAsync(filename).done(function (file) {
                var loadSettings = new Windows.Data.Xml.Dom.XmlLoadSettings;
                loadSettings.prohibitDtd = false;
                loadSettings.resolveExternals = false;

                Windows.Data.Xml.Dom.XmlDocument.loadFromFileAsync(file, loadSettings).done(function (xmlDoc) {
                    //load subject nodes
                    var nodes = xmlDoc.getElementsByTagName('subject');
                    var counter = 1;
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

                    //load article nodes
                    nodes = xmlDoc.getElementsByTagName('article');
                    for (var i = 0; i < nodes.length; i++) {
                        objarticle = new Object();
                        objAddProperty("id", i + 1);
                        for (var j = 0; j < nodes[i].childNodes.length; j++) {
                            if (nodes[i].childNodes[j].nodeType == 1) {
                                if (nodes[i].childNodes[j].nodeName == "subjectid") {
                                    switch (nodes[i].childNodes[j].innerText) {
                                        case "1":
                                            objAddProperty("group", subjectArray[0]);
                                            break;
                                        case "2":
                                            objAddProperty("group", subjectArray[1]);
                                            break;
                                        case "3":
                                            objAddProperty("group", subjectArray[2]);
                                            break;
                                        case "4":
                                            objAddProperty("group", subjectArray[3]);
                                            break;
                                        case "5":
                                            objAddProperty("group", subjectArray[4]);
                                            break;
                                        case "6":
                                            objAddProperty("group", subjectArray[5]);
                                            break;
                                    }
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
                        //article.push(objarticle);

                        var isdone = false;
                        txn.oncomplete = function () {
                            //update data in page
                            if (!isdone) {
                                loadArray("0");

                                switch (WinJS.Navigation.location) {
                                    case "/pages/article/article.html":
                                        showData("article");
                                        break;
                                    case "/pages/favorite/favorite.html":
                                        showData("favorite");
                                        break;
                                    case "/pages/search/search.html":
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
    function loadArray(region) {
        articleArray = new Array();

        var txn = Data.db.transaction(["articles"], "readonly");
        var store = txn.objectStore("articles");
        var request = store.openCursor();
        request.onsuccess = function (e) {
            var article = e.target.result;
            if (article) {
                if (article.value["region"] == region)
                    articleArray.push(article.value);
                article.continue();
            }
            else
                listAdd();
        };
    }

    function listAdd() {
        //remove old data
        var length = list.length;
        for (var i = 0; i < length; i++) {
            list.pop();
        }

        //add new ones
        articleArray.forEach(function (item) {
            list.push(item);
        });
        groupedItems = list.createGrouped(
                    function groupKeySelector(item) { return item.group.key; },
                    function groupDataSelector(item) { return item.group; }
                );
    }

    //data for listview
    var myGroupedList = list.createGrouped(getGroupKey, getGroupData, compareGroups);

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
                        else
                            articles += "<p>" + element.toString() + ": " + article[element] + "</p>";
                    }
                    $("#article").html(articles);
                    if (!article) {
                        $("#article").append("can't find this article.");
                    }
                }

                break;
            case "favorite":
                $("#favList").html("<p id='noEntries'>no entries in the list</p>");

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
                        request.onsuccess = function (e) {
                            var article = e.target.result;
                            if (article) {
                                $("#favList").append("<p>" + article["title"] + " | <a class='article' id='article" + article["id"] + "' href='/pages/article/article.html'>show</a> | <a class='delete' id='delete" + likeid + "' href='#'>delete</a></p>");
                                $(".article").unbind();
                                $(".article").bind("click", function () {
                                    Data.articleid = parseInt(this.id.slice(7, this.id.length));
                                    WinJS.Navigation.navigate("/pages/article/article.html");
                                });

                                $(".delete").unbind();
                                $(".delete").bind("click", function () {
                                    var record = this.id.slice(6, this.id.length);

                                    var txn = Data.db.transaction(["likes"], "readwrite");
                                    var statusStore = txn.objectStore("likes");
                                    statusStore.delete(parseInt(record));

                                    showData("favorite");
                                });

                                $("#noEntries").remove();
                            }
                        }
                        like.continue();
                    }
                };
                break;
        }
    }

    function updateLanguage() {
        //get current language
        var applicationLanguages = Windows.Globalization.ApplicationLanguages.languages;
        if (!Data.language) {
            if (applicationLanguages[0])
                Data.language = applicationLanguages[0].indexOf("zh") == 0 ? "zh-Hant-TW" : applicationLanguages[0];
            else
                Data.language = "en-US";
        }

        //language source
        var resourceNS = Windows.ApplicationModel.Resources.Core;
        var resourceMap = resourceNS.ResourceManager.current.mainResourceMap.getSubtree('Resources');

        var context = new resourceNS.ResourceContext();
        var languagesVector = new Array(Data.language);
        context.languages = languagesVector;

        //chang UI language
        var changeContentArray = ["homeTitle", "homeFavlist", "articleFavlist", "favTitle"];
        for (var i in changeContentArray) {
            var element = changeContentArray[i];
            if (document.getElementById(element)) {
                document.getElementById(element).textContent = resourceMap.getValue(element, context).valueAsString;
            }
        }

    }

    var groupedItems = list.createGrouped(
                    function groupKeySelector(item) { return item.group.key; },
                    function groupDataSelector(item) { return item.group; }
                );

    var db, articleid, favAddMsg, language = null;

    WinJS.Namespace.define("Data", {
        items: groupedItems,
        groups: groupedItems.groups,
        createDB: createDB,
        showData: showData,
        updateLanguage: updateLanguage,

        regionChange: loadArray,

        db: db,
        articleid: articleid,
        favAddMsg: favAddMsg,
        language: language,

        myGroupedList: myGroupedList
    });

})();