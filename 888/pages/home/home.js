(function () {
    "use strict";

    WinJS.UI.Pages.define("/pages/home/home.html", {
        ready: function (element, options) {
            // TODO: 在此初始化頁面。
            WinJS.Binding.processAll(element, this._data);

            Data.updateLanguage();
            Data.createDB();

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


    Data.favlist = new WinJS.Binding.List();

    function navigatetoFav() {
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
                        Data.favlist.push(article);
                    }
                }
                like.continue();
            }
            else {
                WinJS.Navigation.navigate('/pages/favorite/favorite.html');
                document.getElementById('customLayoutAppBar').winControl.hide();
            }
        };


    }


})();
