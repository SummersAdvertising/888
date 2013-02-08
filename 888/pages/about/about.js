(function () {
    "use strict";
    WinJS.UI.Pages.define("/pages/about/about.html", {
        ready: function (element, options) {
            // TODO: 在此初始化頁面。
            WinJS.Binding.processAll(element, this._data);

            switch (Data.language) {
                case "zh-Hant-TW":
                    $("#aboutPageTitle").html("關於  青春台灣食玩誌");
                    $("#aboutPageContent").html("<p>旅行是青春的軌跡，美食是青春的樂趣。『青春台灣食玩誌』是台灣第一支網友集體創作APP，透過台灣微軟主辦的「青春888公里」徵文活動，我們募集了網友心中超值、浪漫、懷舊等六個主題的台灣，由微軟提供之資金、人力、程式與技術，將網友所提供之文章翻譯成英/日文，製作在全球發行Windows 8 APP，與世界分享我們共同熱愛的這座青春島嶼。</p>");
                    break;
                case "en-US":
                    $("#aboutPageTitle").html("About the Food and Fun Diary of Taiwan Youth");
                    $("#aboutPageContent").html("<p>Travelling is how the youth write down their life stories, while food is how the youth enjoy the best of their time. The Food and Fun Diary of Taiwan Youth is the first app collectively created by Internet users in Taiwan. Through the “Youth 888 km” Essay Contest hosted by Microsoft Taiwan, we have collected from Taiwan Internet users some sites and restaurants in Taiwan with the best value, and provided full sponsorship of capital, labor, and computer programming techniques to translate these articles into English and Japanese, make a global Windows app, and spread the charm of this island that we love so passionately to the whole world.</p>");
                    break;
                case "ja":
                    $("#aboutPageTitle").html("青春台湾食遊記について");
                    $("#aboutPageContent").html("<p>旅行は青春の軌跡、美食は青春の喜び！『青春台湾食遊記』は台湾初のネットユーザーが創り上げるアプリです。台湾マイクロソフトの主催する「青春888キロメートル」エッセイ募集活動を通じて、ネットユーザーの皆さんが台湾で感じた最も価値あるもの、最もロマンチックなこと、最も懐かしいもの......についてつづった文章を集めます。資金、人材、プログラム技術の全賛助の下、世界中の人々にこの愛すべき青春の小島について知ってもらうため、すべての文章は英語と日本語に訳されてWindowsアプリとして全世界に発行されます。</p>");
                    break;
                default:
                    $("#aboutPageTitle").html("關於  青春台灣食玩誌");
                    $("#aboutPageContent").html("<p>旅行是青春的軌跡，美食是青春的樂趣。『青春台灣食玩誌』是台灣第一支網友集體創作APP，透過台灣微軟主辦的「青春888公里」徵文活動，我們募集了網友心中超值、浪漫、懷舊等六個主題的台灣，由微軟提供之資金、人力、程式與技術，將網友所提供之文章翻譯成英/日文，製作在全球發行Windows 8 APP，與世界分享我們共同熱愛的這座青春島嶼。</p>");
                    break;
            }
        }
    });

})();