// For an introduction to the Blank template, see the following documentation:
// http://go.microsoft.com/fwlink/?LinkId=232509

//                  Port By:

// Developer:       Christian Kristensen
// Company:         SilverFlame Apps
// Data:            February 2014
// github:          

//                  Much Happy, Many Thanks! :)
// Orignial:        http://www.dogeweather.com
// github:          https://github.com/katiaeirin/dogeweather  


(function () {
    "use strict";
    var page = WinJS.UI.Pages.define("/default.html", {
        ready: function (element, options) {
        }
    });

    WinJS.Application.checkpoint = function (e) {
        WinJS.Application.stop();
    }
    WinJS.Application.onsettings = function (e) {
        e.detail.applicationcommands = {
            "about": {
                title: "About",
                href: "/settings_about.html"
            },
            "privacy": {
                title: "Privacy",
                href: "/settings_privacy.html"
            },
            //"settings": {
            //    title: "Settings",
            //    href: "/settings_settings.html"
            //}
        };
        WinJS.UI.SettingsFlyout.populateSettings(e);
    };

    var app = WinJS.Application;
    var activation = Windows.ApplicationModel.Activation;

    var familyName = Windows.ApplicationModel.Package.current.id.familyName;
    var uriToLaunch = "ms-windows-store:REVIEW?PFN=" + familyName; //Edit for your Application!

    var applicationData = Windows.Storage.ApplicationData.current;
    var localSettings = applicationData.localSettings;
    var localFolder = applicationData.localFolder;

    app.oncheckpoint = function (args) {
        // TODO: This application is about to be suspended. Save any state
        // that needs to persist across suspensions here. You might use the
        // WinJS.Application.sessionState object, which is automatically
        // saved and restored across suspension. If you need to complete an
        // asynchronous operation before your application is suspended, call
        // args.setPromise().
        WinJS.Application.stop();
        window.close();
    };

    app.onready = function () {
        readRateMeData();

        //Test Rating
        //ShowMessage();

        //Testing Live Tile Support
        //liveTileSetup();
    }

    app.onactivated = function (args) {
        if (args.detail.kind === activation.ActivationKind.launch) {
            if (args.detail.previousExecutionState !== activation.ApplicationExecutionState.terminated) {
                // TODO: This application has been newly launched. Initialize
                // your application here.
               
            } else {
                // TODO: This application has been reactivated from suspension.
                // Restore application state here.
            }
            args.setPromise(WinJS.UI.processAll());
        }
    };

    function ShowMessage() {
        var msgpopup = new Windows.UI.Popups.MessageDialog("much happy, little rate?", "wow application?");
        msgpopup.commands.append(new Windows.UI.Popups.UICommand("so wow", function () { launchUri(uriToLaunch); }));
        msgpopup.commands.append(new Windows.UI.Popups.UICommand("much sad", function () { }));
        msgpopup.showAsync();
    }

    function writeRateMeData(text) {
        localSettings.values["RateMe"] = text;
    }

    function readRateMeData() {
        var value = localSettings.values["RateMe"];

        if (!value) {
            console.log("Nothing Found");
            // Rate Me Data not found
            writeRateMeData("0"); //First time, well write a zero.
        }
        else {
            console.log(value);
            // Rate Me is contained in data
            if (value == "0") { //Second Time (Let's ask for review)
                writeRateMeData("1");
                ShowMessage();
            }
            else if (value == "1") { //Third Time (Already asked, don't ask again :C)
            }
        }
    }

    function launchUri(link) {
        // Create the URI to launch from a string.
        var uri = new Windows.Foundation.Uri(link);

        // Set the show warning option.
        //var options = new Windows.System.LauncherOptions();
        //options.treatAsUntrusted = true;

        // Launch the URI.
        Windows.System.Launcher.launchUriAsync(uri).done(
            function (success) {
                if (success) {
                    WinJS.log && WinJS.log("URI " + uri.absoluteUri + " launched.", "sample", "status");
                } else {
                    WinJS.log && WinJS.log("URI launch failed.", "sample", "error");
                }
            });
    }

    function liveTileSetup() {
        var notifications = Windows.UI.Notifications;

        var template = notifications.TileTemplateType.tileWide310x150Image;
        //var template = "livetilesettings.xml";

        var tileXml = notifications.TileUpdateManager.getTemplateContent(template);
        var imageFile = "13n.png";

        var image = tileXml.selectSingleNode('//image[@id="1"]');
        image.setAttribute('src', 'ms-appx:///img/doge/' + imageFile);
        image.setAttribute('alt', 'Live Tile');

        var bindingElement = tileXml.selectSingleNode('//binding');
        bindingElement.setAttribute('branding', 'name');

        var squareTemplate = notifications.TileTemplateType.tileSquare150x150Image;
        var squareTileXml = notifications.TileUpdateManager.getTemplateContent(squareTemplate);
        var squareImage = squareTileXml.selectSingleNode('//image[@id="1"]');
        squareImage.setAttribute('src', 'ms-appx:///img/doge/' + imageFile);
        squareImage.setAttribute('alt', 'Live Tile');
        bindingElement = squareTileXml.selectSingleNode('//binding');
        bindingElement.setAttribute('branding', 'name');

        var bigTemplate = notifications.TileTemplateType.tileSquare310x310BlockAndText02;
        var bigTileXml = notifications.TileUpdateManager.getTemplateContent(bigTemplate);
        var bigTileTextAttributes = bigTileXml.selectSingleNode("//text[@id='1']");
        bigTileTextAttributes.appendChild(bigTileXml.createTextNode("wow"));
        bigTileTextAttributes = bigTileXml.selectSingleNode("//text[@id='2']");
        bigTileTextAttributes.appendChild(bigTileXml.createTextNode("Copenhagen"));
        bigTileTextAttributes = bigTileXml.selectSingleNode("//text[@id='3']");
        bigTileTextAttributes.appendChild(bigTileXml.createTextNode("4C / 43F"));
        var bigImage = bigTileXml.selectSingleNode('//image[@id="1"]');
        bigImage.setAttribute('src', 'ms-appx:///img/doge/' + imageFile);
        bindingElement = bigTileXml.selectSingleNode('//binding');
        bindingElement.setAttribute('branding', 'name');

        var node = tileXml.importNode(squareTileXml.selectSingleNode('//binding'), true);
        tileXml.selectSingleNode('//visual').appendChild(node);
        node = tileXml.importNode(bigTileXml.selectSingleNode('//binding'), true);
        tileXml.selectSingleNode('//visual').appendChild(node);

        var tileNotification = new notifications.TileNotification(tileXml);
        notifications.TileUpdateManager.createTileUpdaterForApplication().update(tileNotification);
    }

    app.start();
})();
