(function () {
    "use strict";

    var listView;
    //var data_load_flag = false;

    WinJS.UI.Pages.define("/pages/home/home.html", {
        ready: function (element, options) {
            // TODO: 在此初始化頁面。
            WinJS.Binding.processAll(element, this._data);

            Data.initLanguage();
            Data.createDB();

            Data.changeRegionLan();
            Data.updateUI(Data.regionChange);

             var listView = element.querySelector("#listView").winControl;
            listView.addEventListener("iteminvoked", itemInvokedHandler);

            $(".region").unbind("click");
            $(".region").bind("click", function () {
                regionChange(this.id);
                updateView();
            });

            $("#navtoFav").bind("click", function () { navigatetoFav(); });
            $('.go-full').click(function () { Windows.UI.ViewManagement.ApplicationView.tryUnsnap(); });

            $('.region-option').click(function () {
                $('.region-selected').removeClass('region-selected');
                $(this).children('div').addClass('region-selected');
            });

            window.addEventListener("resize", onResize);
            updateView();

            
            if (!animated) {
                // 頁首動畫
                $('#mainImg').css('height', $(window).height());
                setTimeout(function () {
                    animated = true;
                    $('.main-all').animate({ left: 0 }, 2000);
                }, 1000);
            } else {
                $('#mainImg').hide();
                $('.main-all').css('left', 0 );
            }
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

    function navigatetoFav() {
        document.getElementById('customLayoutAppBar').winControl.hide();
        WinJS.Navigation.navigate('/pages/favorite/favorite.html');
    }

    function regionChange(id) {
        var region = id.slice(6, id.length);

        Data.currentRegion = region;
        Data.regionChange(region);
        Data.changeRegionLan();
    }

    WinJS.Namespace.define("Home",{
        regionChange: regionChange
    });

})();


function buildUpGroupContainer(groupKey) {
    var groups = Data.groups._groupItems;

    var groupBox = $('#snapGroupTemplate').clone();
    groupBox.children('.groupTitle').html(groups[groupKey].data.name);
    groupBox.hide();
    $('#listViewSnap').prepend(groupBox);
    groups[groupKey]['container'] = groupBox;
}

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

                if (groups[article.group.key]['container'] == undefined) {
                    buildUpGroupContainer(article.group.key);
                }

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

    // 檢查是否為空
    $('#snapped-favinfo').hide();
    statusStore.count().onsuccess = function (e) {
        if (e.target.result == 0) {
            $('#snapped-favinfo').show();
        }
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

            if (WinJS.Navigation.location == '/pages/article/article.html' || WinJS.Navigation.location == '/pages/search/searchResults.html') {
                WinJS.Navigation.back();
                return;
            }

            // 個別處理的標籤
            $('.snap-list-title').hide();
            $('#snapped-favinfo').hide();
            switch (Data.currentRegion) {
                case "6":
                    $('#snap-best-title').show();
                    break;
                case "f":
                    $('#snap-fav-title').show();
                    break;
                default:
                    break;
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
