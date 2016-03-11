//--- MODEL ---
//This is the locations array,
//it has an array of objects.
var locations = [
  {
  place: 'Victorville, CA',
  lat: '34.5362184',
  lng: '-117.2927641'
  },
  {
  place: 'San Diego, CA',
  lat: '32.715738',
  lng: '-117.16108380000003'
  },
  {
  place: 'Honolulu, HI',
  lat: '21.3069444',
  lng: '-157.85833330000003'
  },
  {
  place: 'Hilo, HI',
  lat: '19.7297222',
  lng: '-155.09000000000003'
  },
  {
  place: 'San Francisco, CA',
  lat: '37.7749295',
  lng: '-122.41941550000001'
}];

//Makes a new Location using locationData as a parameter,
//locationData is an object from the locations array.
function Location(locationData) {
  var self = this;
  self.place = ko.observable(locationData.place);
  self.lat = ko.observable(locationData.lat);
  self.lng = ko.observable(locationData.lng);
}

//-- VIEW MODEL ---
//This function is the VIEW MODEL.
function ViewModel() {
  var self = this;

  //user input received from the input panel, "locationInput", is
  //made into an observable object, userInput
  self.userInput = ko.observable("");

  //creates an empty observable array which will be populated with
  //objects from the locations array
  self.locationsArray = ko.observableArray([]);

  //This is the FILTER, it is used to populate locationsArray() dynamically
  //based on the value of userInput.
  //If userInput has a value, the value of userInput is lowercased and
  //searched in the place property, which is also lowercased,
  // of each object of the locations array.
  //If there is a match between userInput and an object's place property, that
  //object is made into a Location which is then pushed into the locationsArray().
  //If there is no value for userInput, all objects in the locations array
  //is pushed into locationsArray().
  self.locationsUpdate = ko.computed(function() {
    self.locationsArray([]);
    if (self.userInput()) {
      for (var i = 0; i < locations.length; i++) {
        if (locations[i].place.toLowerCase().search(self.userInput().toLowerCase()) != -1) {
          self.locationsArray.push(new Location(locations[i]));
        }
      }
    } else {
      locations.forEach(function(locationItem) {
        self.locationsArray.push(new Location(locationItem));
      });
    }
  });
}

//This creates the MAP with the map markers.
function initMap() {
  var mapDiv = document.getElementById('map');

  var myLatLng = {
    lat: 30,
    lng: -135
  };
  var map = new google.maps.Map(mapDiv, {
    center: myLatLng,
    zoom: 3
  });

  //Calls makeMarker to make map markers.
  makeMarker(map);
}

//This makes the makes the markers for the map.
function makeMarker(map) {

  var self = this;
  var marker, i;
  var infowindow = new google.maps.InfoWindow({
    content: 'Loading...'
  });

  //This for loop creates the markers on the map.
  //The position and title properties is base on
  //the coordinates and place properties
  //of an object in locationsArray().
  for (i = 0; i < locationsArray().length; i++) {

    marker = new google.maps.Marker({
      position: new google.maps.LatLng(locationsArray()[i].lat(), locationsArray()[i].lng()),
      map: map,
      title: locationsArray()[i].place()

    });

    //The marker click function in the for loop
    //makes the clicked marker bounce and opens an InfoWindow
    //which displaces the marker's title and relevant Wikipedia
    //links.
    marker.addListener('click', function() {
      var self = this;

      //This makes the clicked marker bounce for 1400ms
      toggleBounce(this);
      setTimeout(function() {
        self.setAnimation(null);
      }, 1400);

      //This is the string that will be used by the ajax.
      //Note that the marker's title, which is the place property of an object in
      //the locationArray(), is added in the string.
      var wikiUrl = 'https://en.wikipedia.org/w/api.php?action=opensearch&search=' + this.title + '&format=json';

      //This timeout function is for the ajax request.
      //If it takes more than 4000ms, the InfoWindow content
      //of the marker will state a fail to load error.
      var wikiRequestTimeout = setTimeout(function() {
        infowindow.setContent("ERROR!!!  Failed to load.");
      }, 4000);

      //Ajax is used to get Wikipedia data.
      $.ajax({
        url: wikiUrl,
        dataType: 'jsonp',

        //The success function will receive response data.
        //The data from response[1], which is an array, will be put into the
        //articleList variable, making it also an array.
        //Each element of articleList is made into a link which will appear
        //in an InfoWindow using infowindow.setContent().
        success: function(response) {

          var articleList = response[1];
          var str = "";
          for (var j = 0; j < articleList.length; j++) {

            var articleStr = articleList[j];

            var url = 'http://en.wikipedia.org/wiki/' + articleStr;

            str = str + '<li><a href="' + url + '">' + articleStr + '</a></li>';

          }

          //Clears timeout when ajax request is a success.
          clearTimeout(wikiRequestTimeout);

          infowindow.setContent("<p>" + self.title + "</p><ul>" + str + "</ul>");

        }

      });

      //Opens the InfoWindow.
      infowindow.open(map, this);

      //Default InfoWindow content until ajax is complete.
      //When ajax is complete, success function runs and changes
      //content within the InfoWindow.
      infowindow.setContent("Loading...");

    });

  }
}

//This makes the markers bounce.
//If it is not bouncing, it will bounce.
//If it is bouncing, it will not bounce.
function toggleBounce(marker) {

  if (marker.getAnimation() != null) {
    marker.setAnimation(null);
  } else {
    marker.setAnimation(google.maps.Animation.BOUNCE);
  }
}

//Binds all knockout objects in ViewModel.
ko.applyBindings(ViewModel);