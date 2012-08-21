// 如需頁面控制項範本的簡介，請參閱下列文件:
// http://go.microsoft.com/fwlink/?LinkId=232511
(function () {
    "use strict";

    WinJS.UI.Pages.define("/pages/favorite/favorite.html", {
        // 每當使用者巡覽至此頁面時，就會呼叫這個函式。它
        // 會將應用程式的資料填入頁面項目。
        ready: function (element, options) {
            // TODO: 在此初始化頁面。
            Data.initLanguage();
            Data.updateUI();

            var listView = element.querySelector("#listView").winControl;
            listView.addEventListener("iteminvoked", itemInvokedHandler);

            checkFav();

            Data.favlistLoad();
        }
    });

    //navigate to article page
    function itemInvokedHandler(eventObject) {
        eventObject.detail.itemPromise.done(function (invokedItem) {
            Data.articleid = invokedItem.data.id;
            WinJS.Navigation.navigate("/pages/article/article.html");
        });
    }

    function checkFav() {
        var txn = Data.db.transaction(["likes"], "readwrite");
        var statusStore = txn.objectStore("likes");
        var request = statusStore.openCursor();
        request.onsuccess = function (e) {
            var like = e.target.result;
            if (like)
                $("#noEntries").remove();
        };
    }

})();
