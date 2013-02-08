// 如需頁面控制項範本的簡介，請參閱下列文件:
// http://go.microsoft.com/fwlink/?LinkId=232511
(function () {
    "use strict";

    WinJS.UI.Pages.define("/pages/language/language.html", {
        // 每當使用者巡覽至此頁面時，就會呼叫這個函式。它
        // 會將應用程式的資料填入頁面項目。
        ready: function (element, options) {
            // TODO: 在此初始化頁面。
            languageSelect(Data.language);
            changePageTitle();
            document.getElementById("languageList").addEventListener("change", function () {
                languageSelect(this.value);

                //navigate to home when language changed
                WinJS.Navigation.back(WinJS.Navigation.history.backStack.length);
                document.getElementById('languageFlyout').winControl.hide();
            });
        }
    });
    function changePageTitle() {
        switch (Data.language) {
            case "zh-Hant-TW":
                $("#languagePageTitle").html("語言");
                break;
            case "en-US":
                $("#languagePageTitle").html("language");
                break;
            case "ja":
                $("#languagePageTitle").html("言語");
                break;
            default:
                $("#languagePageTitle").html("語言");
                break;
        }
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

                changePageTitle();

                //load new language data
                Data.updateLanguage();
            }
        }

        
    }
})();
