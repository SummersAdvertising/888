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

            var listView = element.querySelector("#listView").winControl;
            listView.addEventListener("iteminvoked", itemInvokedHandler);
        }
    });

    //navigate to article page
    function itemInvokedHandler(eventObject) {
        eventObject.detail.itemPromise.done(function (invokedItem) {
            Data.articleid = invokedItem.data.id;
            WinJS.Navigation.navigate("/pages/article/article.html");
        });
    }

    function isAddMsg() {
        if (Data.favAddMsg) {
            $("#favAddMsg").html(Data.favAddMsg);
            Data.favAddMsg = null;
        }
    }
})();
