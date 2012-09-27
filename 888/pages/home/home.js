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

            // 地區控制
            $(".region").unbind("click");
            $(".region-option").unbind("click");
            $(".region").bind("click", function () {
                $("#favinfo").hide();
                regionChange(this.id);
            });
            $(".region-option").bind("click", function () {
                regionChange(this.id, true);
                updateView();
            });

            // FAV LINK
            $("#navtoFav").bind("click", function () { navigatetoFav(); });
            $('.go-full').click(function () { Windows.UI.ViewManagement.ApplicationView.tryUnsnap(); });

            $('.region-option').click(function () {
                $('.region-selected').removeClass('region-selected');
                $(this).children('div').addClass('region-selected');
            });

            window.addEventListener("resize", onResize);

            
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
        document.getElementById('homeNavBar').winControl.hide();
        regionChange('regionf');
        checkFav();
    }

    function checkFav() {
        var txn = Data.db.transaction(["likes"], "readwrite");
        var statusStore = txn.objectStore("likes");
        var request = statusStore.openCursor();
        request.onsuccess = function (e) {
            var like = e.target.result;
            if (like)
                $("#favinfo").hide();
            else
                $("#favinfo").show();
        };
    }

    function regionChange(id, snap) {
        var region = id.slice(6, id.length);

        $('#taiwanMap').attr('src', "../../images/map-" + region + ".png");
        Data.currentRegion = region;
        Data.changeRegionLan();
        if (!snap) {
            Data.regionChange(region);
        }
    }

    WinJS.Namespace.define("Home",{
        regionChange: regionChange
    });

})();


function regroupList(group) {

    if (Data.snapGroups == undefined) {
        Data.snapGroups = [];
    }
    
    // 判斷 group 是否建立
    if (Data.snapGroups[group.key] == undefined) {
        // 若無建立，則於local建立static group
        Data.snapGroups[group.key] = group;
    }
    
    if (Data.snapGroups[group.key]['container'] == undefined) {
        var groupBox = $('#snapGroupTemplate').clone().attr('id', 'groupTemplate_' + Data.snapGroups[group.key]);
        groupBox.children('.groupTitle').html(group.name);
        groupBox.hide();
        Data.snapGroups[group.key]['container'] = groupBox;
    }

    $('#listViewSnap').prepend(Data.snapGroups[group.key]['container']);
}

function snapRegionList() {
    
    for (var groupKey in Data.snapGroups) {

        if (Data.snapGroups[groupKey]['container'] != undefined && Data.snapGroups[groupKey]['container'].children('.itemsContainer').children().length > 0) {
            Data.snapGroups[groupKey]['container'].children('.itemsContainer').children().remove();
        }
    }

    var txn = Data.db.transaction(["articles"], "readonly");
    var store = txn.objectStore("articles");
    var request = store.openCursor();
    request.onsuccess = function (e) {
        
        if (e.target.result) {
            var article = e.target.result.value;

            if (article.region == Data.currentRegion || (Data.currentRegion == "b" && article.selected)) {
                var itemBox = $('#snapItemTemplate').clone();
                itemContent = itemBox.children('.articleArea');
                itemContent.children('h4').children('.itemTitle').html(article.title);
                itemBox.data('article-id', article.id);
                itemBox.click(function () {

                    Data.articleid = $(this).data('article-id');
                    WinJS.Navigation.navigate("/pages/article/article.html");

                    Windows.UI.ViewManagement.ApplicationView.tryUnsnap();
                });

                regroupList(article.group);

                Data.snapGroups[article.group.key]['container'].children('.itemsContainer').prepend(itemBox);
                Data.snapGroups[article.group.key]['container'].show();
            }

            e.target.result.continue();
        }

    };

   
    // 地區篩選完畢，重新掃瞄有item的group

    for (var groupKey in Data.snapGroups) {

        if (Data.snapGroups[groupKey]['container'] != undefined || Data.snapGroups[groupKey]['container'].children('.itemsContainer').children().length <= 0) {
            continue;
        }
        $('#listViewSnap').prepend(Data.snapGroups[groupKey]['container']);
    }
}

function snapFavList() {

    for (var groupKey in Data.snapGroups) {
        if (Data.snapGroups[groupKey]['container'] != undefined) {
            Data.snapGroups[groupKey]['container'].children('.itemsContainer').children().remove();
        }
    }

    $('#snapped-favinfo').hide();

    var txn = Data.db.transaction(["likes"], "readonly");
    var likeStore = txn.objectStore("likes");

    var counter = 0;

    // 檢查是否為空
    likeStore.count().onsuccess = function (e) {
        if (e.target.result == 0) {
            $('#snapped-favinfo').show();
        }
        counter = e.target.result;
    }

    var request = likeStore.openCursor();
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

                regroupList(article.group);

                Data.snapGroups[article.group.key]['container'].children('.itemsContainer').prepend(itemBox);
                Data.snapGroups[article.group.key]['container'].show();
            }

            like.continue();
        }
    };
}

function updateView() {
    var myViewState = Windows.UI.ViewManagement.ApplicationView.value;
    var viewStates = Windows.UI.ViewManagement.ApplicationViewState;
    $('#listViewSnap').children().remove();

    
    switch (myViewState) {
        case viewStates.snapped:            

            if (WinJS.Navigation.location == '/pages/article/article.html' || WinJS.Navigation.location == '/pages/search/searchResults.html') {
                WinJS.Navigation.back().done(function (e) {
                    var offset = { top: "12px", left: "0px", rtlflip: true };
                    // WinJS.UI.Animation.enterPage(document.getElementsByTagName('body'), offset);
                });
                return;
            }

            // 個別處理的標籤
            $('.snap-list-title').hide();
            $('#snapped-favinfo').hide();
            switch (Data.currentRegion) {
                case "b":
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

            if (this.lastState != undefined && this.lastState == viewStates.snapped) {
                this.lastState = myViewState;
                setTimeout(function () {
                    if (WinJS.Navigation.location == '/pages/home/home.html') {
                        WinJS.Navigation.navigate('/pages/home/home.html');
                    }
                }, 300);
            }

            if (Data.db != undefined) {
                Data.regionChange();
            }

            break;
    }

    this.lastState = myViewState;
}
