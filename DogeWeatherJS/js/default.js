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
    var uriToLaunch = "ms-windows-store:REVIEW?PFN=" + familyName;

    var applicationData = Windows.Storage.ApplicationData.current;
    var localSettings = applicationData.localSettings;
    var localFolder = applicationData.localFolder;

    var entryPoint = "backgroundtask.js";
    var taskName = "UpdateTile";

    var conditionType = Windows.ApplicationModel.Background.SystemConditionType.internetAvailable;
    var taskCondition = new Windows.ApplicationModel.Background.SystemCondition(conditionType);

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

    function a() { b(); }
    app.onloaded = function () {
        a();
    }

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

    //
    // Register a background task with the specified taskEntryPoint, name, trigger,
    // and condition (optional).
    //
    // taskEntryPoint: Task entry point for the background task.
    // taskName: A name for the background task.
    // trigger: The trigger for the background task.
    // condition: Optional parameter. A conditional event that must be true for the task to fire.
    //
    function RegisterBackgroundTask(taskEntryPoint,
                                    taskName,
                                    trigger,
                                    condition) {
        //
        // Check for existing registrations of this background task.
        //

        var taskRegistered = false;

        var background = Windows.ApplicationModel.Background;


            var iter = background.BackgroundTaskRegistration.allTasks.first();
            var hascur = iter.hasCurrent;

            while (hascur) {
                var cur = iter.current.value;

                if (cur.name === taskName) {
                    taskRegistered = true;
                    break;
                }

                hascur = iter.moveNext();
            }

            if (taskRegistered == true) {

                return iter.current;
            }

            var builder = new Windows.ApplicationModel.Background.BackgroundTaskBuilder();

            builder.name = taskName;
            builder.taskEntryPoint = taskEntryPoint;
            builder.setTrigger(trigger);

            if (condition !== null) {
                builder.addCondition(condition);

                //
                // If the condition changes while the background task is executing then it will
                // be canceled.
                //
                builder.cancelOnConditionLoss = true;
            }

            var task = builder.register();
       
    }

    function requestLockScreenAccess() {
        var Background = Windows.ApplicationModel.Background;

        //
        // An app can call the add or query API as many times as it wants; however, it will only present the dialog box to the user one time.
        //
        Background.BackgroundExecutionManager.requestAccessAsync().then(function (result) {
            switch (result) {
                case Background.BackgroundAccessStatus.denied:
                    displayStatus("This app is not on the lock screen.");
                    break;

                case Background.BackgroundAccessStatus.allowedWithRealTimeConnectivity:
                    displayStatus("This app is on the lock screen and has access to Real Time Connectivity.");
                    break;

                case Background.BackgroundAccessStatus.allowedWithoutRealTimeConnectivity:
                    displayStatus("This app is on the lock screen, but does not have access to Real Time Connectivity.");
                    break;

                case Background.BackgroundAccessStatus.unspecified:
                    displayStatus("The user has not yet taken any action. This is the default setting and the app is not on the lock screen.");
                    break;
            }
        }, function (e) {
            displayStatus(e);
            console.log(e);
        });
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

            //BECAUSE FUCK YOU, Thats why, it breaks on the first time opening the app! :C
            requestLockScreenAccess();
            RegisterBackgroundTask(entryPoint,
                                                        taskName,
                                                        new Windows.ApplicationModel.Background.TimeTrigger(30, false),
                                                        taskCondition);
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

    WinJS.Namespace.define("DogeWeather", {
        firstFunction: function () { MyNamespace.secondFunction(); }
    });

    app.start();
})();
