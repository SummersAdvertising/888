(function () {
    "use strict";

    var listView;

    WinJS.UI.Pages.define("/pages/home/home.html", {
        ready: function (element, options) {
            // TODO: 在此初始化頁面。
            WinJS.Binding.processAll(element, this._data);

            Data.initLanguage();
            Data.createDB();
            Data.updateUI();

            isAddMsg();
            listView = element.querySelector("#listView").winControl;
            listView.addEventListener("iteminvoked", itemInvokedHandler);

            listView.forceLayout();
            $(".region").bind("click", function () {
                var region = this.id.slice(6, this.id.length);

                $(this).siblings().removeClass("region_c");
                $(this).addClass("region_c");
                Data.currentRegion = region;
                Data.regionChange(region);
            });

            $("#navtoFav").bind("click", function () { navigatetoFav(); });

            $('.region-option').click(function () {
                $('.region-selected').removeClass('region-selected');
                $(this).children('div').addClass('region-selected');
            });

            window.addEventListener("resize", onResize);
            updateView();
        }
    });


    function onResize() {
        updateView();
    }


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


function updateView() {
    var myViewState = Windows.UI.ViewManagement.ApplicationView.value;
    var viewStates = Windows.UI.ViewManagement.ApplicationViewState;
    var statusText;
    $('#listViewSnap').children().remove();

    switch (myViewState) {
        case viewStates.snapped:

            if (Data.myGroupedList._groupsProjection == undefined) {
                return;
            }

            var groups = Data.myGroupedList._groupsProjection._groupItems;
            var items = Data.myGroupedList._groupedItems;

            if (WinJS.Navigation.location == '/pages/article/article.html') {
                Data.regionChange(Data.currentRegion);
                WinJS.Navigation.back();
                return;
            }


            for (var groupKey in groups) {

                if (groups[groupKey]['container'] != undefined) {
                    groups[groupKey]['container'].children('.itemsContainer').children().remove();
                    groups[groupKey]['container'].remove();
                }

                var groupBox = $('#snapGroupTemplate').clone();
                groupBox.children('.groupTitle').html(groups[groupKey].data.title);
                $('#listViewSnap').prepend(groupBox);

                groups[groupKey]['container'] = groupBox;
            }

            for (var i in items) {

                if (this.last_id == items[i].data.id)
                    continue;

                this.last_id = items[i].data.id;

                var itemBox = $('#snapItemTemplate').clone();
                itemContent = itemBox.children('.articleArea');
                itemContent.children('h4').children('.itemTitle').html(items[i].data.title);
                itemBox.data('article-id', items[i].data.id);
                itemBox.click(function () {

                    Data.articleid = $(this).data('article-id');
                    WinJS.Navigation.navigate("/pages/article/article.html");

                    Windows.UI.ViewManagement.ApplicationView.tryUnsnap();
                });


                groups[items[i].groupKey]['container'].children('.itemsContainer').prepend(itemBox);
            }

            // 標籤
            $('.region-selected').removeClass('region-selected');
            $('#region' + Data.currentRegion).children().addClass('region-selected');

            break;
        default:


            break;
    }
}
