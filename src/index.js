import { fromEvent, merge, of} from 'rxjs';
import { scan, map as rxMap, mergeMap } from 'rxjs/operators';
import { partial, defaults, forEach, map, random, findIndex, range} from 'lodash-es';
import { collectionData } from 'rxfire/firestore';

function norm2(x,y) {
  return x*x + y*y;
}
function dist2(x1,y1,x2,y2) {
  return norm2(x1-x2, y1-y2);
}
function minus(p1, p2) {
  return [p1[0] - p2[0], p1[1] - p2[1]]
}
function plus(p1, p2) {
  return [p1[0] + p2[0], p1[1] + p2[1]]
}

function process_mouse(state, evt) {
  switch (event.type) {
    case 'mousedown':
      var dists = map(state.circles, c =>
      dist2(evt.offsetX, evt.offsetY, c[0][0], c[0][1]) - c[1]*c[1])
      var chosen_circle = findIndex(dists, d => d < 0);

    if (chosen_circle > -1) {
      state.chosen_circle = chosen_circle;
      state.chosen_at = [evt.offsetX, evt.offsetY];
    }
    return state;
    case 'mousemove':
    if (state.chosen_circle > -1) {
      var circ = state.circles[state.chosen_circle][0]
      var offset = minus([evt.offsetX, evt.offsetY], state.chosen_at)
      state.circles[state.chosen_circle][0] = plus(state.chosen_at, offset);
    }
    return state;
    case 'mouseup':
    state.chosen_circle = -1;
    state.chosen_at = [];
    default:
    return state;
  }
}
function render(ctx, state) {
  ctx.clearRect(0,0,600,600);
  forEach(state.circles, function(c) {
    ctx.beginPath();
    ctx.arc(c[0][0], c[0][1], c[1], 0, 2 * Math.PI);
    ctx.fillStyle= 'blue'
    ctx.fill();
  });
  forEach(state.edges, function(e) {
    var f = state.circles[e[0]][0];
    var t = state.circles[e[1]][0];
    ctx.lineWidth = 1;
    ctx.strokeStyle= 'black';
    ctx.beginPath();
    ctx.moveTo(f[0], f[1]);
    ctx.lineTo(t[0], t[1]);
    ctx.stroke();
  });
}

function init() {
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    const mouse = of('mousedown', 'mousemove', 'mouseup').pipe(
      mergeMap(partial(fromEvent,document)));
    const graphData = app.firestore().collection('graphs');
    graphData.where('name', '==', 'initial');
    graphChanges$ = collectionData(graphData, 'id')
    graphChanges$.tap(console.log)
    const initial_state = {
      'chosen_circle': -1,
      'circles': map(range(0,41), x=>[
        [random(10,590),random(10,590)],
        10]),
      'edges': map(range(0,50), x=>
        [random(0,40), random(0,40)])
    }
    const mouse_observer = mouse.pipe(scan(process_mouse, initial_state))
    render(ctx, initial_state);
    mouse_observer.subscribe(partial(render, ctx));

}
// Loads chat messages history and listens for upcoming ones.
function loadMessages() {
  // Create the query to load the last 12 messages and listen for new ones.
  var query = firebase.firestore()
                  .collection('messages')
                  .orderBy('timestamp', 'desc')
                  .limit(12);

  // Start listening to the query.
  query.onSnapshot(function(snapshot) {
    snapshot.docChanges().forEach(function(change) {
      if (change.type === 'removed') {
        deleteMessage(change.doc.id);
      } else {
        var message = change.doc.data();
        displayMessage(change.doc.id, message.timestamp, message.name,
                       message.text, message.profilePicUrl, message.imageUrl);
      }
    });
  });
}
// Signs-in Graph.
function signIn() {
  // Sign into Firebase using popup auth & Google as the identity provider.
  var provider = new firebase.auth.GoogleAuthProvider();
  firebase.auth().signInWithPopup(provider);
}
// Signs-out of Graph.
function signOut() {
  // Sign out of Firebase.
  firebase.auth().signOut();
}
// Initiate Firebase Auth.
function initFirebaseAuth() {
  // Listen to auth state changes.
  firebase.auth().onAuthStateChanged(authStateObserver);
}
// Returns the signed-in user's display name.
function getUserName() {
  return firebase.auth().currentUser.displayName;
}
// Returns true if a user is signed-in.
function isUserSignedIn() {
  return !!firebase.auth().currentUser;
}
// Triggers when the auth state change for instance when the user signs-in or signs-out.
function authStateObserver(user) {
  if (user) { // User is signed in!
    // Get the signed-in user's profile pic and name.
    var profilePicUrl = getProfilePicUrl();
    var userName = getUserName();

    // Set the user's profile pic and name.
    userPicElement.style.backgroundImage = 'url(' + addSizeToGoogleProfilePic(profilePicUrl) + ')';
    userNameElement.textContent = userName;

    // Show user's profile and sign-out button.
    userNameElement.removeAttribute('hidden');
    userPicElement.removeAttribute('hidden');
    signOutButtonElement.removeAttribute('hidden');

    // Hide sign-in button.
    signInButtonElement.setAttribute('hidden', 'true');

    // We save the Firebase Messaging Device token and enable notifications.
    saveMessagingDeviceToken();
  } else { // User is signed out!
    // Hide user's profile and sign-out button.
    userNameElement.setAttribute('hidden', 'true');
    userPicElement.setAttribute('hidden', 'true');
    signOutButtonElement.setAttribute('hidden', 'true');

    // Show sign-in button.
    signInButtonElement.removeAttribute('hidden');
  }
}

// Returns true if user is signed-in. Otherwise false and displays a messages.
function checkSignedInWithMessage() {
  // Return true if the user is signed in Firebase
  if (isUserSignedIn()) {
    return true;
  }

  // Display a message to the user using a Toast.
  var data = {
    message: 'You must sign-in first',
    timeout: 2000
  };
  signInSnackbarElement.MaterialSnackbar.showSnackbar(data);
  return false;
}

// Resets the given MaterialTextField.
function resetMaterialTextfield(element) {
  element.value = '';
  element.parentNode.MaterialTextfield.boundUpdateClassesHandler();
}

// Template for messages.
var MESSAGE_TEMPLATE =
    '<div class="message-container">' +
      '<div class="spacing"><div class="pic"></div></div>' +
      '<div class="message"></div>' +
      '<div class="name"></div>' +
    '</div>';

// Adds a size to Google Profile pics URLs.
function addSizeToGoogleProfilePic(url) {
  if (url.indexOf('googleusercontent.com') !== -1 && url.indexOf('?') === -1) {
    return url + '?sz=150';
  }
  return url;
}



// Checks that the Firebase SDK has been correctly setup and configured.
function checkSetup() {
  if (!window.firebase || !(firebase.app instanceof Function) || !firebase.app().options) {
    window.alert('You have not configured and imported the Firebase SDK. ' +
        'Make sure you go through the codelab setup instructions and make ' +
        'sure you are running the codelab using `firebase serve`');
  }
}

// Checks that Firebase has been imported.
checkSetup();

// Shortcuts to DOM Elements.
var signInButtonElement = document.getElementById('sign-in');
var signOutButtonElement = document.getElementById('sign-out');
var signInSnackbarElement = document.getElementById('must-signin-snackbar');

// Saves message on form submit.
signOutButtonElement.addEventListener('click', signOut);
signInButtonElement.addEventListener('click', signIn);

initFirebaseAuth();


init();
