var MyJSItemTemplate = WinJS.Utilities.markSupportedForProcessing(function MyJSItemTemplate(itemPromise) {
    return itemPromise.then(function (currentItem) {

        // Build ListView Item Container div
        var result = document.createElement("div");
        result.className = "regularListIconTextItem";
        result.style.overflow = "hidden";

        // Build content body
        var body = document.createElement("div");
        body.className = "regularListIconTextItem-Detail";
        //body.style.overflow = "hidden";

        // Display title
        var title = document.createElement("h4");
        title.innerText = currentItem.data.title;
        body.appendChild(title);

        // Display text
        var fulltext = document.createElement("h6");
        fulltext.innerText = currentItem.data.date;
        body.appendChild(fulltext);

        //put the body into the ListView Item
        result.appendChild(body);
        return result;
    });
});
var headerTemplate = WinJS.Utilities.markSupportedForProcessing(function MyJSItemTemplate(itemPromise) {
    return itemPromise.then(function (currentItem) {

        // Build ListView Item Container div
        var result = document.createElement("div");
        result.className = "regularListIconTextItem";
        result.style.overflow = "hidden";

        // Build content body
        var body = document.createElement("div");
        body.className = "regularListIconTextItem-Detail";
        body.style.overflow = "hidden";

        // Display title
        var title = document.createElement("h4");
        title.innerText = currentItem.data.title;
        body.appendChild(title);

        //put the body into the ListView Item
        result.appendChild(body);

        return result;
    });
});

(function () {
    "use strict";

    WinJS.UI.Pages.define("/pages/home/home.html", {
        ready: function (element, options) {
            // TODO: 在此初始化頁面。
            WinJS.Binding.processAll(element, this._data);

            Data.updateLanguage();
            Data.createDB();

            isAddMsg();
            $("#fav").click(function () {
                WinJS.Navigation.navigate("/pages/favorite/favorite.html");
            });

            var listView = element.querySelector("#listView").winControl;
            listView.addEventListener("iteminvoked", itemInvokedHandler);


        }
    });

    function selectData(subject) {
        $("#output").html("subject: " + subject);
        $("#output").append("<p id='noEntry'>no articles in subject " + subject + "</p>");

        if (subject == 0)
            Data.showData("articles");
        else {
            var txn = Data.db.transaction(["articles"], "readonly");
            var cursorRequest = txn.objectStore("articles").openCursor();
            cursorRequest.onsuccess = function (e) {
                var cursor = e.target.result;
                if (cursor) {
                    if (cursor.value["subjectid"] == subject) {
                        var str = "";
                        for (var i in cursor.value) {
                            if (i != "content")
                                str += i.toString() + ": " + cursor.value[i] + " / ";
                        }
                        $("#noEntry").remove();
                        $("#output").append("<p>" + str + "<a class='article' id='article" + cursor.value["id"] + "' href='/pages/article/article.html'>show</a></p>");

                        $(".article").unbind();
                        $(".article").bind("click", function () { showArticle(this); return false; });
                    }
                    cursor.continue();
                }
            }
        }
    }

    //navigate to article page
    function showArticle(article) {
        Data.articleid = article.id.slice(7, article.id.length);
        WinJS.Navigation.navigate(article.href);
    }

    function itemInvokedHandler(eventObject) {
        eventObject.detail.itemPromise.done(function (invokedItem) {
            var itemData = invokedItem.data;
        });
    }

    function isAddMsg() {
        if (Data.favAddMsg) {
            $("#favAddMsg").html(Data.favAddMsg);
            Data.favAddMsg = null;
        }
    }

    WinJS.Namespace.define("Home", {
        selectData: selectData,
        showArticle: showArticle
    });
})();
