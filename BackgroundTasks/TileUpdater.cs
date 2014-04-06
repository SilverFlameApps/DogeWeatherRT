using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using Windows.ApplicationModel.Background;
using Windows.Data.Xml.Dom;
using Windows.Devices.Geolocation;
using Windows.Graphics.Imaging;
using Windows.Storage;
using Windows.Storage.Streams;
using Windows.UI.Notifications;
using Windows.UI.Xaml.Media.Imaging;
using System.Runtime.InteropServices.WindowsRuntime;
using System.IO;


namespace BackgroundTasks
{
    public sealed class TileUpdater : IBackgroundTask
    {
        //JSON Template Versions: 0 & 1 = (WP) 2 = Big, 3 = Wide, 4 = Square (RT)
        //Formats: {0} = lon, {1} = lan, {2} = version
        private CancellationTokenSource CancellationTokenSource { get; set; }
        public async void Run(IBackgroundTaskInstance taskInstance)
        {
            dogeService.IdogeServiceClient dogeClient = new dogeService.IdogeServiceClient();
            string lon = "";
            string lan = "";

            var defferal = taskInstance.GetDeferral();

            try
            {
                if (this.CancellationTokenSource == null)
                    this.CancellationTokenSource = new CancellationTokenSource();
                {
                    Geolocator locator = new Geolocator();
                    Geoposition position = await locator.GetGeopositionAsync()
                        .AsTask(this.CancellationTokenSource.Token);

                    lon = position.Coordinate.Point.Position.Longitude.ToString();
                    lan = position.Coordinate.Point.Position.Latitude.ToString();
                }
            }
            catch (Exception ex)
            {
                throw ex;
            }


            var updater = TileUpdateManager.CreateTileUpdaterForApplication();
            //updater.EnableNotificationQueue(true);

            updater.Clear();

            for (int i = 2; i < 5; i++)
            {
                String json = "{\"lon\":" + lon + ",\"lan\":" + lan + ",\"version\":" + i.ToString() + "}";

                var clientStream = await dogeClient.GetDataAsync(json);
                var stream = new InMemoryRandomAccessStream();
                await stream.WriteAsync(clientStream.AsBuffer());
                stream.Seek(0);
                //bitmapImage.SetSource(stream);

                BitmapDecoder decoder = await BitmapDecoder.CreateAsync(stream);
                //var pixels = await decoder.GetPixelDataAsync();
                //pixels.DetachPixelData();

                var outputFile = await ApplicationData.Current.LocalFolder.CreateFileAsync("tile" + i.ToString() + ".png", CreationCollisionOption.ReplaceExisting);
                using (var writeStream = await outputFile.OpenAsync(FileAccessMode.ReadWrite))
                {
                    await EncodeWriteableBitmap(decoder, writeStream, BitmapEncoder.JpegEncoderId);
                }
            }

            //StorageFolder storageFolder = ApplicationData.Current.LocalFolder;
            //StorageFile sampleFile = await storageFolder.GetFileAsync("tileBig.png");

            var tile = await SendLiveTileUpdate();
            updater.Update(tile);

            defferal.Complete();
        }

        private static async Task EncodeWriteableBitmap(BitmapDecoder bit, IRandomAccessStream writeStream, Guid encoderId)
        {
            // Copy buffer to pixels
            byte[] pixels;
            var bmd = await bit.GetPixelDataAsync();
            pixels = bmd.DetachPixelData();

            // Encode pixels into stream
            try
            {
                var encoder = await BitmapEncoder.CreateAsync(encoderId, writeStream);
                encoder.SetPixelData(BitmapPixelFormat.Bgra8, BitmapAlphaMode.Premultiplied,
                   bit.PixelWidth, bit.PixelHeight,
                   96, 96, pixels);
                await encoder.FlushAsync();
            }
            catch (Exception e)
            {
                Debug.WriteLine(e.InnerException);
            }
        }

        private async Task<TileNotification> SendLiveTileUpdate()
        {
            string path = string.Format("ms-appdata:///local/{0}", "tile");
            XmlDocument tileXml = TileUpdateManager.GetTemplateContent(TileTemplateType.TileSquare150x150Image);

            XmlNodeList tileImageAttributes = tileXml.GetElementsByTagName("image");
            ((XmlElement)tileImageAttributes[0]).SetAttribute("src", path + "4.png");

            var TileBinding = (XmlElement)tileXml.GetElementsByTagName("binding").Item(0);
            TileBinding.SetAttribute("branding", "none"); // removes logo from lower left-hand corner of tile

            // Create a live update for a wide tile
            XmlDocument wideTileXml = TileUpdateManager.GetTemplateContent(TileTemplateType.TileWide310x150Image);

            XmlNodeList wideTileImageAttributes = wideTileXml.GetElementsByTagName("image");
            ((XmlElement)wideTileImageAttributes[0]).SetAttribute("src", path + "3.png");

            TileBinding = (XmlElement)wideTileXml.GetElementsByTagName("binding").Item(0);
            TileBinding.SetAttribute("branding", "none"); // removes logo from lower left-hand corner of tile

            // Create a live update for a Big tile
            XmlDocument bigTileXml = TileUpdateManager.GetTemplateContent(TileTemplateType.TileSquare310x310Image);

            XmlNodeList bigTileImageAttributes = bigTileXml.GetElementsByTagName("image");
            ((XmlElement)bigTileImageAttributes[0]).SetAttribute("src", path + "2.png");

            TileBinding = (XmlElement)bigTileXml.GetElementsByTagName("binding").Item(0);
            TileBinding.SetAttribute("branding", "none"); // removes logo from lower left-hand corner of tile

            // Add the big and wide tile to the square tile's payload, so they are sibling elements under visual
            IXmlNode node = tileXml.ImportNode(wideTileXml.GetElementsByTagName("binding").Item(0), true);
            tileXml.GetElementsByTagName("visual").Item(0).AppendChild(node);
            node = tileXml.ImportNode(bigTileXml.GetElementsByTagName("binding").Item(0), true);
            tileXml.GetElementsByTagName("visual").Item(0).AppendChild(node);

            // Create a tile notification that will expire in 1 day and send the live tile update.  
            TileNotification tileNotification = new TileNotification(tileXml);
            return tileNotification;
            //tileNotification.ExpirationTime = DateTimeOffset.UtcNow.AddDays(1);
            //TileUpdateManager.CreateTileUpdaterForApplication().Update(tileNotification);            
        }
    }
}
