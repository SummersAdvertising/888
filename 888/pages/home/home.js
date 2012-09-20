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

                Data.currentRegion = region;
                Data.regionChange(region);
            });

            $("#navtoFav").bind("click", function () { navigatetoFav(); });


            window.addEventListener("resize", onResize);
            updateView();
        }
    });

    //navigate to article page
    function itemInvokedHandler(eventObject) {

        eventObject.detail.itemPromise.done(function (invokedItem) {
            Data.articleid = invokedItem.data.id;
            WinJS.Navigation.navigate("/pages/article/article.html");
        });
    }


    function onResize() {
        updateView();
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

function updateView() {
    var myViewState = Windows.UI.ViewManagement.ApplicationView.value;
    var viewStates = Windows.UI.ViewManagement.ApplicationViewState;
    var statusText;
    $('#listViewSnap').children().remove();

    switch (myViewState) {
        case viewStates.snapped:

            var groups = Data.groups._groupItems;
            var items = Data.items._groupedItems;

            if (WinJS.Navigation.location == '/pages/article/article.html') {
                Data.regionChange(Data.currentRegion);
                WinJS.Navigation.back();
            }


            for (var groupKey in groups) {

                if (groups[groupKey]['container'] != undefined) {
                    groups[groupKey]['container'].children('.itemsContainer').children().remove();                    
                    groups[groupKey]['container'].remove();
                }

                var groupBox = $('#snapGroupTemplate').clone();
                groupBox.children('.groupTitle').html(groups[groupKey].data.name);
                $('#listViewSnap').prepend(groupBox);

                groups[groupKey]['container'] = groupBox;
            }

            for (var i in items) {
                var itemBox = $('#snapItemTemplate').clone();
                itemBox.children('.itemTitle').html(items[i].data.title);
                itemBox.data('article-id', items[i].data.id);
                itemBox.click(function () {

                    Data.articleid = $(this).data('article-id');
                    WinJS.Navigation.navigate("/pages/article/article.html");

                    Windows.UI.ViewManagement.ApplicationView.tryUnsnap();
                });

                groups[items[i].groupKey]['container'].children('.itemsContainer').prepend(itemBox);
            }

            break;
        case viewStates.filled:


            break;
        case viewStates.fullScreenLandscape:


            break;
        default:


            break;
    }
}