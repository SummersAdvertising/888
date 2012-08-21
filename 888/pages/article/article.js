﻿// 如需頁面控制項範本的簡介，請參閱下列文件:
// http://go.microsoft.com/fwlink/?LinkId=232511
(function () {
    "use strict";

    WinJS.UI.Pages.define("/pages/article/article.html", {
        // 每當使用者巡覽至此頁面時，就會呼叫這個函式。它
        // 會將應用程式的資料填入頁面項目。
        ready: function (element, options) {
            // TODO: 在此初始化頁面。
            Data.initLanguage();
            Data.updateUI();
            Data.showData("article");

            checkLike("del");

            $("#addFav").bind("click", function () { checkLike("add"); });
            $("#delFav").bind("click", function () { delFav(); });

            //share
            var dataTransferManager = Windows.ApplicationModel.DataTransfer.DataTransferManager.getForCurrentView();
            dataTransferManager.addEventListener("datarequested", dataRequested);
        }
    });

    var check;
    function checkLike(act) {
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
                switch (act) {
                    case "add":
                        if (check) {
                            $("#articlemsg").prepend("<p>article is already in the list</p>");
                            $("#addFav").unbind();
                            document.getElementById('createAppBar').winControl.hide();
                        }
                        else {
                            var txn = Data.db.transaction(["likes"], "readwrite");
                            var statusStore = txn.objectStore("likes");
                            var like = { articleid: Data.articleid };
                            statusStore.add(like);
                            txn.oncomplete = function () {
                                $("#articlemsg").html($("#articleTitle").html() + " added");
                                //WinJS.Navigation.back(0);
                            };
                        }
                        break;
                    case "del":
                        if (check) {
                            $("#addFav").remove();
                        }
                        else {
                            $("#delFav").remove();
                        }
                        break;
                }
            }
        }
    }

    function delFav() {
        var record = $("#articleId").html();

        var txn = Data.db.transaction(["likes"], "readwrite");
        var statusStore = txn.objectStore("likes");
        var request = statusStore.openCursor();
        request.onsuccess = function (e) {
            var like = e.target.result;
            if (like) {
                if (like.value.articleid == record) {
                    statusStore.delete(parseInt(like.value.id));
                    checkLike("del");
                }
                like.continue();
            }
        };

        $("#articlemsg").html("article is deleted from the list");
        checkLike("del");
    }

    function dataRequested(e) {
        var request = e.request;

        // Title is required
        var dataPackageTitle = $("#articleTitle").html();
        if ((typeof dataPackageTitle === "string") && (dataPackageTitle !== "")) {
            var dataPackageLink = "the sharelink uri input";
            if ((typeof dataPackageLink === "string") && (dataPackageLink !== "")) {
                request.data.properties.title = dataPackageTitle;

                try {
                    request.data.setText($("#articlecontentnotag").html());
                    request.data.setUri(new Windows.Foundation.Uri("http://blogs.msdn.com/b/b8/"));                    
                } catch (ex) {
                    //show error message
                    request.failWithDisplayText("Enter the text you would like to share and try again.");
                }
            } else {
                request.failWithDisplayText("Enter the text you would like to share and try again.");
            }
        }
    }

    WinJS.Namespace.define("Article", {
        checkLike: checkLike
    });
})();