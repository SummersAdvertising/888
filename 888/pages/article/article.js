// 如需頁面控制項範本的簡介，請參閱下列文件:
// http://go.microsoft.com/fwlink/?LinkId=232511
(function () {
    "use strict";

    WinJS.UI.Pages.define("/pages/article/article.html", {
        // 每當使用者巡覽至此頁面時，就會呼叫這個函式。它
        // 會將應用程式的資料填入頁面項目。
        ready: function (element, options) {
            // TODO: 在此初始化頁面。
            Data.updateLanguage();
            Data.showData("article");

            $("#addFav").bind("click", function () { checkLike(); });
        }
    });

    var check;
    function checkLike() {
        check = false;
        var txn = Data.db.transaction(["likes"], "readonly");
        var statusStore = txn.objectStore("likes");
        var request = statusStore.openCursor();
        request.onsuccess = function (e) {
            var like = e.target.result;
            if (like) {
                if (like.value.articleid == Data.articleid) {
                    check = true;
                }
                like.continue();
            }
            else {
                if (check) {
                    $("#article").prepend("article is already in the list");
                    $("#addFav").unbind();
                    document.getElementById('createAppBar').winControl.hide();
                }
                else {
                    var txn = Data.db.transaction(["likes"], "readwrite");
                    var statusStore = txn.objectStore("likes");
                    var like = { articleid: Data.articleid };
                    statusStore.add(like);
                    txn.oncomplete = function () {
                        Data.favAddMsg = $("#articleTitle").html() + " added";
                        WinJS.Navigation.back(0);
                    };
                }
            }
        }
    }

    WinJS.Namespace.define("Article", {
        checkLike: checkLike
    });
})();
