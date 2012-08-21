(function () {
    "use strict";

    WinJS.UI.Pages.define("/pages/home/home.html", {
        ready: function (element, options) {
            // TODO: 在此初始化頁面。
            WinJS.Binding.processAll(element, this._data);

            Data.initLanguage();
            Data.createDB();
            Data.updateUI();

            isAddMsg();

            var listView = element.querySelector("#listView").winControl;
            listView.addEventListener("iteminvoked", itemInvokedHandler);

            $(".region").bind("click", function () {
                var region = this.id.slice(6, this.id.length);

                $(this).siblings().removeClass("region_c");
                $(this).addClass("region_c");

                Data.regionChange(region);
            });

            $("#navtoFav").bind("click", function () { navigatetoFav(); });
        }
    });

    //navigate to article page
    function itemInvokedHandler(eventObject) {
        eventObject.detail.itemPromise.done(function (invokedItem) {
            Data.articleid = invokedItem.data.id;
            WinJS.Navigation.navigate("/pages/article/article.html");
        });
    }

    function isAddMsg() {
        if (Data.favAddMsg) {
            $("#favAddMsg").html(Data.favAddMsg);
            Data.favAddMsg = null;
        }
    }

    function navigatetoFav() {
        document.getElementById('customLayoutAppBar').winControl.hide();
        WinJS.Navigation.navigate('/pages/favorite/favorite.html');
    }


})();
