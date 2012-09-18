// 如需頁面控制項範本的簡介，請參閱下列文件:
// http://go.microsoft.com/fwlink/?LinkId=232511
(function () {
    "use strict";

    WinJS.UI.Pages.define("/pages/favorite/favorite.html", {
        // 每當使用者巡覽至此頁面時，就會呼叫這個函式。它
        // 會將應用程式的資料填入頁面項目。
        ready: function (element, options) {
            // TODO: 在此初始化頁面。
            Data.updateLanguage();
            showFav();
        },

        unload: function () {
            // TODO: 回應離開這個頁面的導覽。
        },

        updateLayout: function (element, viewState, lastViewState) {
            /// <param name="element" domElement="true" />

            // TODO: 回應 viewState 中的變更。
        }
    });

    function showFav() {
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
                        $(".article").bind("click", function () { showArticle(this); return false; });

                        $(".delete").unbind();
                        $(".delete").bind("click", function () { deleteArticle(this); return false; });

                        $("#noEntries").remove();
                    }
                }
                like.continue();
            }
        };

        function showArticle(article) {
            Data.articleid = article.id.slice(7, article.id.length);
            WinJS.Navigation.navigate(article.href);
        }

        function deleteArticle(article) {
            var record = article.id.slice(6, article.id.length);

            var txn = Data.db.transaction(["likes"], "readwrite");
            var statusStore = txn.objectStore("likes");
            statusStore.delete(parseInt(record));

            showFav();
        }
    }
})();
