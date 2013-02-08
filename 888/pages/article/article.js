// 如需頁面控制項範本的簡介，請參閱下列文件:
// http://go.microsoft.com/fwlink/?LinkId=232511
(function () {
    "use strict";

    WinJS.UI.Pages.define("/pages/article/article.html", {
        // 每當使用者巡覽至此頁面時，就會呼叫這個函式。它
        // 會將應用程式的資料填入頁面項目。
        ready: function (element, options) {
            // TODO: 在此初始化頁面。
            //Data.initLanguage();
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

            //copy content
            document.getElementById("sampleText").addEventListener("contextmenu", textHandler, false);
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
                        }
                        else {
                            var txn = Data.db.transaction(["likes"], "readwrite");
                            var statusStore = txn.objectStore("likes");
                            var like = { articleid: Data.articleid };
                            statusStore.add(like);
                            txn.oncomplete = function () {
                                var stringAddAlready;
                                var stringConfirm;

                                switch (Data.language) {
                                    case "zh-Hant-TW":
                                        stringAddAlready = "已經加到我的最愛";
                                        stringConfirm = "確定";
                                        break;
                                    case "en-US":
                                        stringAddAlready = "has been added to your favorite list.";
                                        stringConfirm = "Confirm";
                                        break;
                                    case "ja":
                                        stringAddAlready = "お気に入りに追加しました。";
                                        stringConfirm = "確認";
                                        break;
                                    default:
                                        stringAddAlready = "已經加到我的最愛";
                                        stringConfirm = "確定";
                                        break;
                                }


                                var msg = new Windows.UI.Popups.MessageDialog($("#articleTitle").html() + stringAddAlready);

                                // Add commands and set their command handlers
                                msg.commands.append(new Windows.UI.Popups.UICommand(stringConfirm, function (command) { }));

                                // Set the command that will be invoked by default
                                msg.defaultCommandIndex = 1;

                                // Show the message dialog
                                msg.showAsync().done(function () { });

                                checkLike("del");
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
        };
        document.getElementById('homeNavBar').winControl.hide();
        document.getElementById('createAppBar').winControl.hide();
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
                    var deleteRequest = statusStore.delete(parseInt(like.value.id));

                    var stringDelAlready;
                    var stringConfirm;

                    switch (Data.language) {
                        case "zh-Hant-TW":
                            stringDelAlready = "已經從我的最愛中移除";
                            stringConfirm = "確定";
                            break;
                        case "en-US":
                            stringDelAlready = "has been deleted from your favorite list.";
                            stringConfirm = "Confirm";
                            break;
                        case "ja":
                            stringDelAlready = "お気に入りに削除しました。";
                            stringConfirm = "確認";
                            break;
                        default:
                            stringDelAlready = "已經從我的最愛中移除";
                            stringConfirm = "確定";
                            break;
                    }


                    var msg = new Windows.UI.Popups.MessageDialog($("#articleTitle").html() + stringDelAlready);
                    msg.commands.append(new Windows.UI.Popups.UICommand(stringConfirm, function (command) { }));
                    deleteRequest.onsuccess = function (e) {
                        // Show the message dialog
                        msg.showAsync().done(function () { });
                    }
                    checkLike("del");
                }
                like.continue();
            }
        };

        // $("#articlemsg").html("article is deleted from the list");
        checkLike("del");
    }

    //data requested for link sharing
    function dataRequested(e) {
        var request = e.request;

        // Title is required
        var dataPackageTitle = $("#articleTitle").html();
        if ((typeof dataPackageTitle === "string") && (dataPackageTitle !== "")) {
            request.data.properties.title = dataPackageTitle;

            try {
                request.data.setUri(new Windows.Foundation.Uri($("#articleLink").html()));
            } catch (ex) {
                //show error message
            }
        } else {
            request.failWithDisplayText("Enter the text you would like to share and try again.");
        }
    }


    //copy content
    // Converts from client to WinRT coordinates, which take scale factor into consideration.
    function clientToWinRTRect(e) {
        var zoomFactor = document.documentElement.msContentZoomFactor;
        return {
            x: e.pageX,
            y: e.pageY,
            width: 80,
            height: 80
        };
    }

    function textHandler(e) {
        e.preventDefault(); // Prevent the default context menu.

        // Only show a context menu if text is selected
        if (isTextSelected()) {
            // Creating a menu with each command specifying a unique command callaback.
            // Seach the command callbacks are unique, there is no need to specify command IDs.
            var menu = new Windows.UI.Popups.PopupMenu();
            switch (Data.language) {
                case "zh-Hant-TW":
                    menu.commands.append(new Windows.UI.Popups.UICommand("複製", null, 1));
                    break;
                case "ja":
                    menu.commands.append(new Windows.UI.Popups.UICommand("コピー", null, 1));
                    break;
                case "en-US":
                    menu.commands.append(new Windows.UI.Popups.UICommand("Copy", null, 1));
                    break;
                default:
                    menu.commands.append(new Windows.UI.Popups.UICommand("複製", null, 1));
                    break;
            }


            // We don't want to obscure content, so pass in the position representing the selection area.
            //rectangle : document.selection.createRange().getBoundingClientRect()
            menu.showForSelectionAsync(clientToWinRTRect(e)).then(function (invokedCommand) {
                if (invokedCommand !== null) {
                    switch (invokedCommand.id) {
                        case 1: // Copy
                            var selectedText = window.getSelection();
                            copyTextToClipboard(selectedText);
                            break;

                        default:
                            break;
                    }
                }
            });
        }
            //no text selected, show nav bar
        else {
            document.getElementById('homeNavBar').winControl.show();
            document.getElementById('createAppBar').winControl.show();
        }
    };

    function isTextSelected() {
        return (document.getSelection().toString().length > 0);
    };

    function copyTextToClipboard(textToCopy) {
        var dataPackage = new Windows.ApplicationModel.DataTransfer.DataPackage();
        dataPackage.setText(textToCopy);
        Windows.ApplicationModel.DataTransfer.Clipboard.setContent(dataPackage);
    };


    WinJS.Namespace.define("Article", {
        checkLike: checkLike
    });
})();
