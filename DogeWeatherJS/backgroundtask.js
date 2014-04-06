//Background task
//Checks for new events and notifies user.
//Updates tiles

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

                // A JavaScript background task must call close when it is done 
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
                              //var formatter = new Windows.Globalization.DateTimeFormatting.DateTimeFormatter("longtime");
                              //var timestamp = formatter.format(new Date());
                              var data = sampleFile;
                              var memoryStream = new Windows.Storage.Streams.InMemoryRandomAccessStream();
                              var dataWriter = new Windows.Storage.Streams.DataWriter(memoryStream);
                              dataWriter.writeBuffer(ibuffer);
                              var buffer = dataWriter.detachBuffer();
                              dataWriter.close();
                              //return Windows.Storage.FileIO.writeTextAsync(sampleFile, timestamp);
                              var file = Windows.Storage.FileIO.writeBufferAsync(data, buffer).done(function () {
                                  //overint++;
                                  console.log('clear');
                                  console.log('Running Man')
                                  
                                  console.log(num);

                                  WinJS.Utilities.startLog({ type: "info", tags: "custom" });
                                  WinJS.log(num, "info", "custom");
                                  //if (num == "4") {
                                  //    backgroundTaskInstance.succeeded = true;
                                  //    displayTileNotification();
                                  //}
                              });


                              
                          })
    }

    function downloadFile(pos, num) {
        var json = "{\"lon\":" + (pos.coordinate.longitude).toString() + ",\"lan\":" + (pos.coordinate.latitude).toString() + ",\"version\":" + num + "}";
        return new WinJS.xhr({
            type: "POST",
            url: "http://silverflamenet.com/DogeService/dogeService.svc/REST/GetDoge64/json",
            headers: { "Content-type": "application/json; charset=utf-8" },
            data: json
        }).then(function complete(request) {
            var stList = JSON.parse(request.responseText);
            //var data = request.response;
            //var fileStream = new Windows.Storage.Streams.InMemoryRandomAccessStream();
            //var jpgencoderId = Windows.Graphics.Imaging.BitmapEncoder.jpegEncoderId;
            var iBuffer = Windows.Security.Cryptography.CryptographicBuffer.decodeFromBase64String(stList);
            saveFile(num, iBuffer)

            //var bitmapDecoder = Windows.Graphics.Imaging.BitmapDecoder;
            //fileStream.writeAsync(iBuffer)
            //var stuff = Windows.Graphics.Imaging.BitmapEncoder.createForTranscodingAsync(fileStream, bitmapDecoder.jpegDecoderId);

        }, function error(er) {
            var err = er.responseText;

            backgroundTaskInstance.succeeded = false;

            // A JavaScript background task must call close when it is done 
            close();
        });
    }

    function displayTileNotification() {
        var path = "ms-appdata:///local/";
        // get a filled in version of the template by using getTemplateContent
        var tileXml = notifications.TileUpdateManager.getTemplateContent(notifications.TileTemplateType.tileSquare150x150Image);

        // get the text attributes for this template and fill them in
        var tileAttributes = tileXml.selectSingleNode('//image[@id="1"]');
        tileAttributes.setAttribute('src', path + "4title.jpg");
        var bindingElement = tileXml.selectSingleNode('//binding');
        bindingElement.setAttribute('branding', 'none');

        var tileXml2 = notifications.TileUpdateManager.getTemplateContent(notifications.TileTemplateType.tileWide310x150Image);

        // get the text attributes for this template and fill them in
        var tileAttributes2 = tileXml2.selectSingleNode('//image[@id="1"]');
        tileAttributes2.setAttribute('src', path + "3title.jpg");
        var bindingElement2 = tileXml2.selectSingleNode('//binding');
        bindingElement2.setAttribute('branding', 'none');

        var tileXml3 = notifications.TileUpdateManager.getTemplateContent(notifications.TileTemplateType.tileSquare310x310Image);

        // get the text attributes for this template and fill them in
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
        //notifications.TileUpdateManager.createTileUpdaterForSecondaryTile("id").update(tileNotification);
        notifications.TileUpdateManager.createTileUpdaterForApplication().clear();
        notifications.TileUpdateManager.createTileUpdaterForApplication().update(tileNotification);
        close();
    }

})();