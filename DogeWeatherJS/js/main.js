﻿//getWeather("./weather.php");
WinJS.Namespace.define("DogeWeather", {
    secondFunction: function () { getLocation(); }
});

function b() { getLocation(); }

var dogePlugin = $($.doge);

	   function getWeather(link) {
	       jQuery.support.cors = true;

	       WinJS.xhr({ url: link }).then(function (data) {

			var obj = jQuery.parseJSON(data.responseText);

			//set weather id & icon 
			var id = obj.weather[0].id;
			var icon = obj.weather[0].icon;

			$('#weather-id').text(id);
			$('#weather-icon').text(icon);

			//TESTING 
			//icon = "01n";
			//change such doge and sky based on much icon
			var doge_img = "url(./img/doge/" + icon + ".png)";
			$('.doge-image').css('background-image', doge_img);

			var sky_img = "url(./img/sky-img/" + icon + ".png)";
			$('.bg').css('background-image', sky_img);

			//console.log(icon);

			//get weather description
			var tempCelcius = obj.main.temp - 273.15;
			var tempFahrenheit = tempCelcius * 9 / 5 + 32;
			var description = obj.weather[0].description

			$('#weather-desc').text("wow " + description);
			$('#location').text(obj.name);

			$('#degreesCelsius .number').text(Math.round(tempCelcius));
			$('#degreesCelsius .cel').text("°C ");
			$('#degreesFahrenheit').text(Math.round(tempFahrenheit) + "°F");

			//$(".suchlikes").show();
			$(".ourinfo").show();

	        //initialise such doge
            $($.doge);
               
		});
	   }

	   $("#browser_geo").on('click', function () {
	       var text = $("#browser_geo").text();
	       //if (text != "wow, located!") {
	        getLocation();
	        //}
	   });

	   setInterval(function () {
           //Click browser_geo to clear the interval running in .doge
	       $("#browser_geo").click();
	       console.log('update');
           //Update location
	       getLocation();
	   },
       60000);

	   	function getLocation()
			  {
			  if (navigator.geolocation)
			    {
			    navigator.geolocation.getCurrentPosition(showPosition);
			    }
			  else
			  	$("#browser_geo").text("Geolocation is not supported by this pc.");
			  }
			function showPosition(position)
			  {
			  //$("#browser_geo").text("Latitude: " + position.coords.latitude + 
			    //"Longitude: " + position.coords.longitude);

                //Test Data
			    //var number = 1 + Math.floor(Math.random() * 10);
			    //var xTest = -21.1493069 + number;
			    //var yTest = 149.1875982 - number;

			  	var url = 'http://api.openweathermap.org/data/2.5/weather';
			  	url += '?lat=' + position.coords.latitude + '&lon=' + position.coords.longitude + '?format=json';

			    //test url
			  	//url += '?lat=' + xTest.toString() + '&lon=' + yTest.toString() + '?format=json';

                getWeather(url);
                $("#browser_geo").text("wow, located!").css("cursor", "auto").css("color", "#B66DFF"); 
			  }
			





