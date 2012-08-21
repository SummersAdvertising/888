// 如需頁面控制項範本的簡介，請參閱下列文件:
// http://go.microsoft.com/fwlink/?LinkId=232511
(function () {
    "use strict";

    WinJS.UI.Pages.define("/pages/language/language.html", {
        // 每當使用者巡覽至此頁面時，就會呼叫這個函式。它
        // 會將應用程式的資料填入頁面項目。
        ready: function (element, options) {
            // TODO: 在此初始化頁面。
            //Data.initLanguage();
            getInitLan();

            document.getElementById("languageList").addEventListener("change", function () {
                languageSelect(this.value);
                Data.createDB();
            });
        },

        unload: function () {
            // TODO: 回應離開這個頁面的導覽。
        },

        updateLayout: function (element, viewState, lastViewState) {
            /// <param name="element" domElement="true" />

            // TODO: 回應 viewState 中的變更。
        }
    });
    function getInitLan() {
        var dbRequest = window.indexedDB.open("ArticleDB", 1);
        dbRequest.onsuccess = function (evt) {
            Data.db = evt.target.result;
            var txn = Data.db.transaction(["resource"], "readonly");
            var store = txn.objectStore("resource");
            var request = store.openCursor();
            request.onsuccess = function (e) {
                var resource = e.target.result;
                if (resource) {
                    if (resource.value.language) {
                        languageSelect(resource.value.language);
                    }
                    else
                        languageSelect(Data.language);
                }
                else
                    languageSelect(Data.language);
            }
        };
    }

    function languageSelect(language) {
        if (language) {
            var languageChild;
            switch (language) {
                case "zh-Hant-TW":
                    languageChild = 0;
                    break;
                case "en-US":
                    languageChild = 1;
                    break;
                case "ja":
                    languageChild = 2;
                    break;
                default:
                    Data.initLanguage();
                    languageSelect(Data.language);
                    break;

            }
            var select = document.getElementById("languageList")[languageChild].selected = true;

            if (Data.language != language) {
                Data.language = language;

                //load new language data
                Data.updateLanguage();
            }
        }
    }
})();
