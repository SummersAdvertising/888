// 如需導覽範本的簡介，請參閱下列文件:
// http://go.microsoft.com/fwlink/?LinkId=232506
(function () {
    "use strict";

    WinJS.Binding.optimizeBindingReferences = true;

    var app = WinJS.Application;
    var activation = Windows.ApplicationModel.Activation;
    var nav = WinJS.Navigation;

    app.addEventListener("activated", function (args) {
        if (args.detail.kind === activation.ActivationKind.launch) {
            if (args.detail.previousExecutionState !== activation.ApplicationExecutionState.terminated) {
                // TODO: 這個應用程式剛啟動。請在這裡初始化
                // 您的應用程式。

                //Data.initLanguage();
                Data.createDB();

                //bind navtoFav
                $("#navtoFav").bind("click", function () { navigatetoFav(); });

                WinJS.Application.onsettings = function (e) {
                    var titleLan, titleAbout, titleAuthor;
                    switch (Data.language) {
                        case "zh-Hant-TW":
                            titleLan = "語言";
                            titleAbout = "關於 青春台灣食玩誌";
                            titleAuthor = "隱私權聲明";
                            break;
                        case "en-US":
                            titleLan = "Language";
                            titleAbout = "About the Food and Fun Diary of Taiwan Youth";
                            titleAuthor = "Privacy Statement";
                            break;
                        case "ja":
                            titleLan = "言語";
                            titleAbout = "青春台湾食遊記について";
                            titleAuthor = "プライバシーに関する声明";
                            break;
                        default:
                            titleLan = "語言";
                            titleAbout = "關於 青春台灣食玩誌";
                            titleAuthor = "隱私權聲明";
                            break;
                    }
                    e.detail.applicationcommands = {
                        "language": { title: titleLan, href: "/pages/language/language.html" },
                        "about": { title: titleAbout, href: "/pages/about/about.html" },
                        "authorization": { title: titleAuthor, href: "/pages/authorization/authorization.html" }
                    };
                    WinJS.UI.SettingsFlyout.populateSettings(e);

                };
            } else {
                // TODO: 這個應用程式已經從擱置重新啟用。
                // 請在這裡還原應用程式狀態。
            }

            if (app.sessionState.history) {
                nav.history = app.sessionState.history;
            }
            args.setPromise(WinJS.UI.processAll().then(function () {
                if (nav.location) {
                    nav.history.current.initialPlaceholder = true;
                    return nav.navigate(nav.location, nav.state);
                } else {
                    return nav.navigate(Application.navigator.home);
                }
            }));
        }

    });

    app.oncheckpoint = function (args) {
        // TODO: 這個應用程式即將暫停。請在這裡儲存任何
        // 需要在擱置間保存的狀態。如果必須 
        // 在應用程式擱置前完成非同步作業， 
        // 請呼叫 args.setPromise()。
        app.sessionState.history = nav.history;
    };

    app.start();


})();

var animated = false;
function toFullscreen() {
    Data.currentRegion = 'b';
    Windows.UI.ViewManagement.ApplicationView.tryUnsnap();
}

function navigatetoFav() {
    Data.currentRegion = 'f';
    WinJS.Navigation.back(WinJS.Navigation.history.backStack.length);
}