﻿// 如需頁面控制項範本的簡介，請參閱下列文件:
// http://go.microsoft.com/fwlink/?LinkId=232511
(function () {
    "use strict";

    WinJS.UI.Pages.define("/pages/authorization/authorization.html", {
        // 每當使用者巡覽至此頁面時，就會呼叫這個函式。它
        // 會將應用程式的資料填入頁面項目。
        ready: function (element, options) {
            // TODO: 在此初始化頁面。

            var uri = new Windows.Foundation.Uri("http://www.microsoft.com/privacystatement/zh-tw/core/default.aspx");
            Windows.System.Launcher.launchUriAsync(uri);
        },

        unload: function () {
            // TODO: 回應離開這個頁面的導覽。
        },

        updateLayout: function (element, viewState, lastViewState) {
            /// <param name="element" domElement="true" />

            // TODO: 回應 viewState 中的變更。
        }
    });
})();
