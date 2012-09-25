(function () {
    "use strict";

    var listView;

    WinJS.UI.Pages.define("/pages/home/home.html", {
        ready: function (element, options) {
            // TODO: 在此初始化頁面。
            WinJS.Binding.processAll(element, this._data);

            Data.initLanguage();
            Data.createDB();
            Data.updateUI(Data.regionChange);

            isAddMsg();
            listView = element.querySelector("#listView").winControl;
            listView.addEventListener("iteminvoked", itemInvokedHandler);

            listView.forceLayout();
            $(".region").bind("click", function () {
                var region = this.id.slice(6, this.id.length);

                $(this).siblings().removeClass("region_c");
                $(this).addClass("region_c");

                Data.currentRegion = region;
                updateView();
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

function snapRegionList() {
    var groups = Data.groups._groupItems;
    
    for (var groupKey in groups) {

        if (groups[groupKey]['container'] != undefined) {
            groups[groupKey]['container'].children('.itemsContainer').children().remove();
            groups[groupKey]['container'].remove();
        }

        var groupBox = $('#snapGroupTemplate').clone();
        groupBox.children('.groupTitle').html(groups[groupKey].data.name);
        
        groupBox.hide();
        groups[groupKey]['container'] = groupBox;
        $('#listViewSnap').prepend(groups[groupKey]['container']);
    }

    var txn = Data.db.transaction(["articles"], "readonly");
    var store = txn.objectStore("articles");
    var request = store.openCursor();
    request.onsuccess = function (e) {
        
        if (e.target.result) {
            var article = e.target.result.value;

            if (Data.currentRegion == article.region) {
                var itemBox = $('#snapItemTemplate').clone();
                itemContent = itemBox.children('.articleArea');
                itemContent.children('h4').children('.itemTitle').html(article.title);
                itemBox.data('article-id', article.id);
                itemBox.click(function () {

                    Data.articleid = $(this).data('article-id');
                    WinJS.Navigation.navigate("/pages/article/article.html");

                    Windows.UI.ViewManagement.ApplicationView.tryUnsnap();
                });

                groups[article.group.key]['container'].children('.itemsContainer').prepend(itemBox);
                groups[article.group.key]['container'].show();
            }

            e.target.result.continue();
        }

    };

   
    // 地區篩選完畢，重新掃瞄有item的group

    for (var groupKey in groups) {

        if (groups[groupKey]['container'].children('.itemsContainer').children().length <= 0) {
            continue;
        }
        $('#listViewSnap').prepend(groups[groupKey]['container']);
    }
}

function snapFavList() {

    function buildUpGroupContainer(groupKey) {

        var groupBox = $('#snapGroupTemplate').clone();
        groupBox.children('.groupTitle').html(groups[groupKey].data.name);
        groupBox.hide();
        $('#listViewSnap').prepend(groupBox);
        groups[groupKey]['container'] = groupBox;
    }

    var txn = Data.db.transaction(["likes"], "readonly");
    var statusStore = txn.objectStore("likes");
    var request = statusStore.openCursor();

    var groups = Data.groups._groupItems;

    for (var groupKey in groups) {

        if (groups[groupKey]['container'] != undefined) {
            groups[groupKey]['container'].children('.itemsContainer').children().remove();
            groups[groupKey]['container'].remove();
        }

        buildUpGroupContainer(groupKey);

    }

    request.onsuccess = function (e) {
        var like = e.target.result;
        if (like) {
            var txn = Data.db.transaction(["articles"], "readonly");
            var store = txn.objectStore("articles");
            var request = store.get(parseInt(like.value["articleid"]));
            var likeid = like.value.id;


            request.onsuccess = function (e) {
                var article = e.target.result;

                var itemBox = $('#snapItemTemplate').clone();
                itemContent = itemBox.children('.articleArea');
                itemContent.children('h4').children('.itemTitle').html(article.title);
                itemBox.data('article-id', article.id);
                itemBox.click(function () {

                    Data.articleid = $(this).data('article-id');
                    WinJS.Navigation.navigate("/pages/article/article.html");

                    Windows.UI.ViewManagement.ApplicationView.tryUnsnap();
                });

                if (groups[article.group.key]['container'] == undefined) {
                    buildUpGroupContainer(article.group.key);
                }

                groups[article.group.key]['container'].children('.itemsContainer').prepend(itemBox);
                groups[article.group.key]['container'].show();
            }

            like.continue();
        }
    };
}

function updateView() {
    var myViewState = Windows.UI.ViewManagement.ApplicationView.value;
    var viewStates = Windows.UI.ViewManagement.ApplicationViewState;
    var statusText;
    $('#listViewSnap').children().remove();
    
    switch (myViewState) {
        case viewStates.snapped:            

            if (WinJS.Navigation.location == '/pages/article/article.html') {
                WinJS.Navigation.back();
                return;
            }

            if (Data.currentRegion != 'f') {
                snapRegionList();
            } else {
                snapFavList();
            }

            // 標籤
            $('.region-selected').removeClass('region-selected');
            $('#region' + Data.currentRegion).children().addClass('region-selected');

            break;
        default:

            if (Data.db != undefined) {
                Data.regionChange();
            }

            break;
    }
}
