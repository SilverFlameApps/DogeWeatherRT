//Background task
//Checks for new events and notifies user.
//Updates tiles

//Do note that I have ZERO experience with jQuery, so this code is proberly 100% stupid.

(function () {
    "use strict";

    importScripts("//Microsoft.WinJS.2.0/js/base.js");

    //Begin task
    var backgroundTaskInstance = Windows.UI.WebUI.WebUIBackgroundTaskInstance.current;
    var notifications = Windows.UI.Notifications;
    var date = new Date();
    var promise;
    var promise2;

    var geolocator = new Windows.Devices.Geolocation.Geolocator();
    var geofenceBackgroundEvents = new Array();
    var maxEventDescriptors = 42;   // Value determined by how many max length event descriptors (91 chars)  
    // stored as a JSON string can fit in 8K (max allowed for local settings) 

    var applicationData = Windows.Storage.ApplicationData.current;
    var localFolder = applicationData.localFolder;

    //So in C# .NET 4.5 we have the option to await the service call.
    //I didn't find any such option here, so i just wait a simi approtiate time interval before updating the tiles.
    //Worst case senario, they get updated the next time it runs!
    var promise3 = new WinJS.Promise(function (complete) {
        promise = geolocator.getGeopositionAsync();
        promise.then(
            function (pos) {
                for (var i = 2; i < 5; i++) {

                    downloadFile(pos, i.toString()).done(function (result) {
                        var lol = result;
                    });
                }

            },
            function (err) {
                var settings = Windows.Storage.ApplicationData.current.localSettings;
                settings.values["Status"] = err.message;

                backgroundTaskInstance.succeeded = false;
                close();
            }
        );
        complete();
    }).then(function () {
        return WinJS.Promise.timeout(1000);
    }).then(function () {
        return WinJS.Promise.timeout(2500);
    }).then(function () {
        backgroundTaskInstance.succeeded = true;
            displayTileNotification();
    });



    function saveFile(num, ibuffer) {
        localFolder.createFileAsync(num + "title.jpg", Windows.Storage.CreationCollisionOption.replaceExisting)
                          .then(function (sampleFile) {
                              var data = sampleFile;
                              var memoryStream = new Windows.Storage.Streams.InMemoryRandomAccessStream();
                              var dataWriter = new Windows.Storage.Streams.DataWriter(memoryStream);
                              dataWriter.writeBuffer(ibuffer);
                              var buffer = dataWriter.detachBuffer();
                              dataWriter.close();
                              var file = Windows.Storage.FileIO.writeBufferAsync(data, buffer).done(function () {

                                  console.log('running doge')
                                  console.log(num);
                              });


                              
                          })
    }

    //Calling my service here, code is not included in project... might be later though, its kinda awesome and kinda beyond fucking retarded!
    //We call a RESTful WCF Service, it returns a Base64 incoded image, we do this 3 times for all 3 sizes... perhaps upgrade it to an array of base64's?
    function downloadFile(pos, num) {
        var json = "{\"lon\":" + (pos.coordinate.longitude).toString() + ",\"lan\":" + (pos.coordinate.latitude).toString() + ",\"version\":" + num + "}";
        return new WinJS.xhr({
            type: "POST",
            url: "http://silverflamenet.com/DogeService/dogeService.svc/REST/GetDoge64/json",
            headers: { "Content-type": "application/json; charset=utf-8" },
            data: json
        }).then(function complete(request) {
            var stList = JSON.parse(request.responseText);
           
            var iBuffer = Windows.Security.Cryptography.CryptographicBuffer.decodeFromBase64String(stList);
            saveFile(num, iBuffer)

        }, function error(er) {
            var err = er.responseText;
            backgroundTaskInstance.succeeded = false;
            close();
        });
    }

    function displayTileNotification() {
        var path = "ms-appdata:///local/";
        var tileXml = notifications.TileUpdateManager.getTemplateContent(notifications.TileTemplateType.tileSquare150x150Image);

        // get the text attributes for this template and fill them in
        var tileAttributes = tileXml.selectSingleNode('//image[@id="1"]');
        tileAttributes.setAttribute('src', path + "4title.jpg");
        var bindingElement = tileXml.selectSingleNode('//binding');
        bindingElement.setAttribute('branding', 'none');

        var tileXml2 = notifications.TileUpdateManager.getTemplateContent(notifications.TileTemplateType.tileWide310x150Image);

        var tileAttributes2 = tileXml2.selectSingleNode('//image[@id="1"]');
        tileAttributes2.setAttribute('src', path + "3title.jpg");
        var bindingElement2 = tileXml2.selectSingleNode('//binding');
        bindingElement2.setAttribute('branding', 'none');

        var tileXml3 = notifications.TileUpdateManager.getTemplateContent(notifications.TileTemplateType.tileSquare310x310Image);

        var tileAttributes3 = tileXml3.selectSingleNode('//image[@id="1"]');
        tileAttributes3.setAttribute('src', path + "2title.jpg");
        var bindingElement3 = tileXml3.selectSingleNode('//binding');
        bindingElement3.setAttribute('branding', 'none');

        var node = tileXml.importNode(tileXml2.selectSingleNode('//binding'), true);
        tileXml.selectSingleNode('//visual').appendChild(node);
        node = tileXml.importNode(tileXml3.selectSingleNode('//binding'), true);
        tileXml.selectSingleNode('//visual').appendChild(node);

        // create the notification from the XML
        var tileNotification = new notifications.TileNotification(tileXml);

        // send the notification to the app's default tile
        notifications.TileUpdateManager.createTileUpdaterForApplication().clear();
        notifications.TileUpdateManager.createTileUpdaterForApplication().update(tileNotification);
        close();
    }

})();