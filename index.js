var mongo = require("mongodb");
var MongoClient = require('mongodb').MongoClient;

var testUser = {
  name: "Test User",
  coordinates: [ 76.9480533, 10.9987576 ]
};
var target = {
  name: "Target User",
  coordinates: [76.87591642746301, 10.825842664395019]
};
var northUser = {
  name: "North user",
  coordinates: [76.8991642746301, 10.995842664395019]
};
var eastUser = {
  name: "East User",
  coordinates: [77.0551642746301, 10.825842664395019]
};
// {
//   name: "Search from West",
//   coordinates: [76.8991642746301, 10.995842664395019]
// },
// {
//   name: "Search from South",
//   coordinates: [76.8991642746301, 10.995842664395019]
// }

var insertNoise = true;
var testData = [target, northUser, eastUser ];

var url = 'mongodb://localhost:27017/geoTest';
MongoClient.connect(url, function(err, db) {
  if (err) {
    console.log("Error connecting to database.");
  } else {
    console.log("Connected correctly to server.");
  }

  // Clear previous data
  var users = db.collection('users');
  users.drop(function (err, results) {
    console.log("Cleared DB: %s", results);

    users.insert(testData, function (err, result) {
      console.log("Inserted all");
      users.createIndex({coordinates: "2dsphere"});

      // Insert data
      if (insertNoise) {
        for (var i=0; i<100; i++) {
          users.insert({name: "TestUser" + i, coordinates: testUser.coordinates});
        }
      }

      // Scenario 1:
      // Search for the Target from the east of the target
      //          North
      //West      Target     SearchFromHere
      //          South
      aggregationSearch(users, 20, eastUser);

      // Scenario 2:
      // Search for the Target from the north of the target
      //      SearchFromHere
      //West      Target     East
      //          South
      aggregationSearch(users, 20, northUser);
    });
  });
});

function aggregationSearch (collection, radius, searchBy, callback) {
  collection.aggregate([
    {
      $geoNear: {
        near: {
          type: "Point",
          coordinates: searchBy.coordinates
        },
        distanceField: 'dist',
        maxDistance: radius * 1000,
        distanceMultiplier: 1/1000,
        spherical: true
      }
    }
  ], function (err, docs) {
    printResult(searchBy.name, docs);
  });
}

function printResult(direction, docs) {
  console.log("*******");
  console.log("Search from " + direction + " Found " + docs.length + " users");
  docs.forEach(function (doc) {
    if (doc.name.indexOf("Target User") === 0) {
      console.log("Target User found");
    }
    // console.log(doc.name + " at [" + doc.coordinates + "] at distance" + doc.dist);
  });
  console.log("*******");
}
