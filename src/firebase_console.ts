import firebase from "firebase/app";
import "firebase/auth";
import "firebase/firestore";
const firebaseConfig = {
  apiKey: "AIzaSyCBUZBYv1S8zQ_mnyJ6sqv5kA2FGCV6FZ0",
  authDomain: "okku-295708.firebaseapp.com",
  databaseURL: "https://okku-295708.firebaseio.com",
  projectId: "okku-295708",
  storageBucket: "okku-295708.appspot.com",
  messagingSenderId: "811021926948",
  appId: "1:811021926948:web:9891f2ba52b50d432a8eb1",
  measurementId: "G-YDVPJ431XV"
}
firebase.initializeApp(firebaseConfig);
var db = firebase.firestore();

if (location.hostname === "localhost") {
  db.useEmulator("localhost", 8080);
}

function deleteDB() {
    var query = firebase.firestore()
                      .collection('cities')
    query.onSnapshot(function(snapshot) {
        snapshot.forEach(function(doc) {
            doc.ref.delete();
        });
    })
}
deleteDB();
var query = firebase.firestore()
                  .collection('cities')
query.onSnapshot(function(snapshot) {
    snapshot.docChanges().forEach(function(change) {
        var message = change.doc.data();
        console.log('M', message)
    });
});
  
// // // Start listening to the query.
for (var i = 0; i < 3; ++i) {
    db.collection("cities").doc("LA" + i ).set({
    name: "Los Angeles",
    state: "CA",
    country: "USA"
})