//--- MODEL ---
//This is the locations array,
//it has an array of objects.
var locations = [{
    place: 'Victorville, CA',
    lat: '34.5362184',
    lng: '-117.2927641',
    marker: 'Loading...'
  },
  {
    place: 'San Diego, CA',
    lat: '32.715738',
    lng: '-117.16108380000003',
    marker: 'Loading...'
  },
  {
    place: 'Honolulu, HI',
    lat: '21.3069444',
    lng: '-157.85833330000003',
    marker: 'Loading...'
  },
  {
    place: 'Hilo, HI',
    lat: '19.7297222',
    lng: '-155.09000000000003',
    marker: 'Loading...'
  },
  {
    place: 'San Francisco, CA',
    lat: '37.7749295',
    lng: '-122.41941550000001',
    marker: 'Loading...'
}];

//Set this as global as the ViewModel() and makeMarker()
//modifies the infowindow.
var infowindow;

//Makes a new Location using locationData as a parameter,
//locationData is an object from the locations array.
function Location(locationData) {
    var self = this;
    self.place = ko.observable(locationData.place);
    self.lat = ko.observable(locationData.lat);
    self.lng = ko.observable(locationData.lng);
    self.marker = ko.observable(locationData.marker);
}

//-- VIEW MODEL ---
//This function is the VIEW MODEL.
function ViewModel() {
    var self = this;

    //User input received from the input panel, "locationInput", is
    //made into an observable object, userInput.
    self.userInput = ko.observable('');

    //creates an empty observable array which will be populated with
    //objects from the locations array
    self.locationsArray = ko.observableArray([]);

    //This is the FILTER and it occurs when the user types an input.
    //It is used to populate locationsArray() and modify
    //marker visibility dynamically based on the value of userInput().
    //It first sets visibility on all markers in locationsArray() as false.
    //It then clears the locationsArray().
    //It repopulates objects into locationsArray() with only the objects from the
    //locations array that match the value of userInput().
    //It then sets the visibility of each object's marker in the locationsArray() as true.
    //This process repeats when userInput() changes.
    self.locationsUpdate = ko.computed(function() {

        //This occurs before locationsArray() is filtered.
        //If locationsArray() is populated, it checks if its
        //marker() property has been updated with google maps
        //marker data.  If it is, then marker() visibility is
        //set to false.
        if (locationsArray().length > 0) {
            for (var i = 0; i < locationsArray().length; i++) {
                if (locationsArray()[i].marker() != 'Loading...')
                    locationsArray()[i].marker().setVisible(false);
            }
            infowindow.close();
        }

        //Clears locationsArray().
        self.locationsArray([]);

        //This filters locationsArray().
        //If userInput has a value, the value of userInput() is lowercased and
        //searched in the place property, which is also lowercased,
        //of each object in the locations array.
        //If there is a match between the value userInput() and an object's place property,
        //that object is made into a Location() which is then pushed into the locationsArray().
        //If there is no value for userInput(), all objects in the locations array
        //are pushed into locationsArray().
        if (self.userInput()) {
            for (i = 0; i < locations.length; i++) {
                if (locations[i].place.toLowerCase().search(self.userInput().toLowerCase()) != -1) {
                    self.locationsArray.push(new Location(locations[i]));
                }
            }
        } else {
            locations.forEach(function(locationItem) {
                self.locationsArray.push(new Location(locationItem));
            });
        }

        //This occurs after locationsArray() is filtered.
        //If locationsArray() is populated, it checks if its
        //marker() property has been updated with google maps
        //marker data.  If it is, then marker() visibility is
        //set to true.
        if (locationsArray().length > 0) {
            for (i = 0; i < locationsArray().length; i++) {
                if (locationsArray()[i].marker() != 'Loading...')
                    locationsArray()[i].marker().setVisible(true);
            }
        }
    });

    //This function is binded to each place in the list.
    //Upon clicking the place, it activates the respective marker's
    //click event, which is animating the marker and opening
    //an infowindow.
    self.markerAnimate = function(location) {
        google.maps.event.trigger(location.marker(), 'click');
    };
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

//This makes the markers for the map.
function makeMarker(map) {
    var self = this;

    //Creates an InfoWindow.
    infowindow = new google.maps.InfoWindow({
        content: 'Loading...'
    });

    //This for loop creates the markers on the map.
    //The position and title properties is based on
    //the coordinates and place properties
    //of an object in the locations array.
    for (var i = 0; i < locations.length; i++) {
        locations[i].marker = new google.maps.Marker({
            position: new google.maps.LatLng(locations[i].lat, locations[i].lng),
            map: map,
            title: locations[i].place,
            visible: false
        });

        //The marker click function in the for loop
        //makes the clicked marker bounce and opens an InfoWindow
        //which displaces the marker's title and relevant Wikipedia
        //links.
        locations[i].marker.addListener('click', function() {
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
                infowindow.setContent('ERROR!!!  Failed to load.');
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

                    infowindow.setContent('<p>' + self.title + '</p><ul>' + str + '</ul>');
                }
            });

            //Opens the InfoWindow.
            infowindow.open(map, this);

            //Default InfoWindow content until ajax is complete.
            //When ajax is complete, success function runs and changes
            //content within the InfoWindow.
            infowindow.setContent('Loading...');
        });

        //Makes locationsArray() marker data equal to
        //marker data in the locations array.
        locationsArray()[i].marker(locations[i].marker);
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

//This creates an error alert if Google Maps API fails.
function googleError() {
    alert('ERROR!!!  Map Failed To Load!!!  Quit Application!!!');
}
//Binds all knockout objects in ViewModel.
ko.applyBindings(ViewModel);