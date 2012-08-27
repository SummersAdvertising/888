// 如需頁面控制項範本的簡介，請參閱下列文件:
// http://go.microsoft.com/fwlink/?LinkId=232511
(function () {
    "use strict";

    WinJS.UI.Pages.define("/pages/article/article.html", {
        // 每當使用者巡覽至此頁面時，就會呼叫這個函式。它
        // 會將應用程式的資料填入頁面項目。
        ready: function (element, options) {
            // TODO: 在此初始化頁面。
            Data.initLanguage();
            Data.showData("article");
            Data.updateUI();

            checkLike("del");

            $("#addFav").bind("click", function () { checkLike("add"); });
            $("#delFav").bind("click", function () { delFav(); });

            $("#navtoFav").bind("click", function () { navigatetoFav(); });

            //share
            var dataTransferManager = Windows.ApplicationModel.DataTransfer.DataTransferManager.getForCurrentView();
            dataTransferManager.addEventListener("datarequested", dataRequested);

            //DIV content photo: change class
            //$("#contentPhoto").addClass("content-photo-" + $("#articleSubjectKey").html());

            // 重設長度
            //$('[class^="content-photo"]').css('height', $(window).height());
            $('.content-body').css('height', $(window).height());

        }
    });

    function navigatetoFav() {
        Home.isFav = true;
        WinJS.Navigation.back(WinJS.Navigation.history.backStack.length);
    }

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
                            $("#delFav").show();
                            $("#addFav").hide();
                        }
                        else {
                            $("#delFav").hide();
                            $("#addFav").show();
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

    //data requested for link sharing
    function dataRequested(e) {
        var request = e.request;

        // Title is required
        var dataPackageTitle = $("#articletitle").html();
        if ((typeof dataPackageTitle === "string") && (dataPackageTitle !== "")) {
            var dataPackageLink = $("#articlecontentnotag").html();
            if ((typeof dataPackageLink === "string") && (dataPackageLink !== "")) {
                request.data.properties.title = dataPackageTitle;

                try {
                    request.data.setUri(new Windows.Foundation.Uri("http://msdn.microsoft.com/en-us/library/windows/apps/br211837.aspx"));
                } catch (ex) {
                    //show error message
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
