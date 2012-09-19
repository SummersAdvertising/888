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

        loadData(evt);
    }
    //declare WinJS.Binding.List
    var list = new WinJS.Binding.List();
    var subject = new Array();//groups in list
    var article = new Array();//groupitems in list

    function loadData(evt) {
        var foldername = "data";
        var filename = Data.language + ".xml";

        Data.db = evt.target.result;

        Windows.ApplicationModel.Package.current.installedLocation.getFolderAsync(foldername).done(function (folder) {
            folder.getFileAsync(filename).done(function (file) {
                var loadSettings = new Windows.Data.Xml.Dom.XmlLoadSettings;
                loadSettings.prohibitDtd = false;
                loadSettings.resolveExternals = false;

                //load XML
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
                        subject.push(objarticle);

                        txn.oncomplete = function () {
                            if (counter >= nodes.length)
                                showData("subjects");
                            if (list._currentKey == 0)
                                listAdd();

                            counter++;
                        };
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
                                            objAddProperty("group", subject[0]);
                                            break;
                                        case "2":
                                            objAddProperty("group", subject[1]);
                                            break;
                                        case "3":
                                            objAddProperty("group", subject[2]);
                                            break;
                                        case "4":
                                            objAddProperty("group", subject[3]);
                                            break;
                                        case "5":
                                            objAddProperty("group", subject[4]);
                                            break;
                                        case "6":
                                            objAddProperty("group", subject[5]);
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
                        article.push(objarticle);

                        txn.oncomplete = function () {
                            counter++;
                            if (counter >= nodes.length) {
                                showData("articles");
                                if (Data.articleid)
                                    showData("article");
                                counter = 1;
                            }
                        };
                    }
                });
            });
        });
    }

    function listAdd() {
        article.forEach(function (item) {
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
            //list all the articles
            case "articles":
                var txn = Data.db.transaction(["articles"], "readonly");
                var cursorRequest = txn.objectStore("articles").openCursor();
                var articles = "";
                cursorRequest.onsuccess = function (e) {
                    var cursor = e.target.result;
                    if (cursor) {
                        var str = "";
                        for (var i in cursor.value) {
                            if (i != "content")
                                str += i.toString() + ": " + cursor.value[i] + " / ";
                        }
                        articles += "<p>" + str + "<a class='article' id='article" + cursor.value["id"] + "' href='/pages/article/article.html'>show</a></p>";

                        cursor.continue();
                    }
                    $("#output").html(articles);
                    $(".article").unbind();
                    $(".article").bind("click", function () { Home.showArticle(this); return false; });
                }
                break;

                //list a single article
            case "article":
                var txn = Data.db.transaction(["articles"], "readonly");
                var store = txn.objectStore("articles");
                var request = store.get(parseInt(Data.articleid));
                var articles = "";
                request.onsuccess = function (e) {
                    var article = e.target.result;
                    for (var element in article) {
                        if (element == "title")
                            $("#articleTitle").html(article[element]);
                        else
                            articles += "<p>" + element.toString() + ": " + article[element] + "</p>";
                    }
                    $("#article").html(articles);

                    if (article) {
                        $("#addFav").bind("click", function () {
                            Article.checkLike($("#articleTitle").html());
                        });
                    }
                    else {
                        $("#article").append("can't find this article.");
                    }
                }
                break;

                //list all the subjects
            case "subjects":
                var txn = Data.db.transaction(["subjects"], "readonly");
                var cursorRequest = txn.objectStore("subjects").openCursor();
                var subjects = "";
                var counter = 0;
                cursorRequest.onsuccess = function (e) {

                    var cursor = e.target.result;
                    if (cursor) {
                        subjects += "<li id='subject" + cursor.value.id + "' class='subject'>" + cursor.value.name + "</li>";
                        cursor.continue();
                    }
                    $("#subject").html("<li id='subject0' class='subject'>all</li>" + subjects);

                    $(".subject").unbind();
                    $(".subject").bind("click", function () {
                        var subjectid = this.id.slice(7, this.id.length);
                        Home.selectData(subjectid);
                    });
                }
                break;

            default:
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

        db: db,
        articleid: articleid,
        favAddMsg: favAddMsg,
        language: language,

        myGroupedList: myGroupedList
    });

})();