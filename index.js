// Import stylesheets
import "./style.css";
// Firebase App (the core Firebase SDK) is always required and must be listed first
import * as firebase from "firebase/app";

// Add the Firebase products that you want to use
import "firebase/auth";
import "firebase/firestore";

import * as firebaseui from "firebaseui";

// Document elements
const startRsvpButton = document.getElementById("startRsvp");
const guestbookContainer = document.getElementById("guestbook-container");

const form = document.getElementById("leave-message");
const input = document.getElementById("message");
const guestbook = document.getElementById("guestbook");
const numberAttending = document.getElementById("number-attending");
const rsvpYes = document.getElementById("rsvp-yes");
const rsvpNo = document.getElementById("rsvp-no");

var rsvpListener = null;
var guestbookListener = null;

async function main() {
  // Add Firebase project configuration object here
  var firebaseConfig = {
    apiKey: "AIzaSyDIXBDSJNfCMy6INRbjg_FVsatB2HUM05A",
    authDomain: "fir-web-codelab-7dfb4.firebaseapp.com",
    databaseURL: "https://fir-web-codelab-7dfb4.firebaseio.com",
    projectId: "fir-web-codelab-7dfb4",
    storageBucket: "fir-web-codelab-7dfb4.appspot.com",
    messagingSenderId: "990250795654",
    appId: "1:990250795654:web:92199772bcfa19aeb50707",
    measurementId: "G-0LGHL793P5"
  };
  // Initialize Firebase
  firebase.initializeApp(firebaseConfig);
  // firebase.analytics();

  // firebase.initializeApp(firebaseConfig);

  // FirebaseUI config
  const uiConfig = {
    credentialHelper: firebaseui.auth.CredentialHelper.NONE,
    signInOptions: [
      // Email / Password Provider.
      firebase.auth.EmailAuthProvider.PROVIDER_ID
    ],
    callbacks: {
      signInSuccessWithAuthResult: function (authResult, redirectUrl) {
        // Handle sign-in.
        // Return false to avoid redirect.
        return false;
      }
    }
  };

  // initialize the FireBaseUI widget using FireBase
  const ui = new firebaseui.auth.AuthUI(firebase.auth());

  // Listen to RSVP button clicks
  startRsvpButton.addEventListener("click", () => {
    if (firebase.auth().currentUser) {
      // if a user has signed in, clicking this button will allow the user to sign out
      firebase.auth().signOut();
    } else {
      ui.start("#firebaseui-auth-container", uiConfig);
    }
  });

  firebase.auth().onAuthStateChanged(user => {
    if (user) {
      startRsvpButton.textContent = "Log Out";
      guestbookContainer.style.display = "block"; // seen only by the logged in users
      subscribeGuestBook();
    } else {
      startRsvpButton.textContent = "RSVP";
      guestbookContainer.style.display = "none";
      unsubscribeGuestBook();
    }
  });

  form.addEventListener("submit", e => {
    e.preventDefault();
    firebase
      .firestore()
      .collection("guestbook")
      .add({
        text: input.value,
        timestamp: Date.now(),
        name: firebase.auth().currentUser.displayName,
        userId: firebase.auth().currentUser.uid
      });

    input.value = "";

    return false;
  });

  // Listen to questbook updates
  function subscribeGuestBook() {
    firebase
      .firestore()
      .collection("guestbook")
      .orderBy("timestamp", "desc")
      .onSnapshot(snaps => {
        guestbook.innerHTML = "";
        snaps.forEach(doc => {
          const entry = document.createElement("p");
          entry.textContent = doc.data().name + ": " + doc.data().text;
          guestbook.appendChild(entry);
        });
      });
  }

  // unsubscribe from guestbook updates
  function unsubscribeGuestBook() {
    if (guestbookListener != null) {
      guestbookListener();
      guestbookListener = null;
    }
  }

  // Listen to RSVP responses
rsvpYes.onclick = () => {
 // Get a reference to the user's document in the attendees collection
 const userDoc = firebase.firestore().collection('attendees').doc(firebase.auth().currentUser.uid);

 // If they RSVP'd yes, save a document with attending: true
 userDoc.set({
   attending: true
 }).catch(console.error)
}

rsvpNo.onclick = () => {
 // Get a reference to the user's document in the attendees collection
 const userDoc = firebase.firestore().collection('attendees').doc(firebase.auth().currentUser.uid);

 // If they RSVP'd no, save a document with attending: false
 userDoc.set({
   attending: false
 }).catch(console.error)
}

// Listen for attendee list
firebase.firestore()
.collection('attendees')
.where("attending", "==", true)
.onSnapshot(snap => {
 const newAttendeeCount = snap.docs.length;

 numberAttending.innerHTML = newAttendeeCount+' people going'; 
})

// Listen for attendee list
function subscribeCurrentRSVP(user){
 rsvpListener = firebase.firestore()
 .collection('attendees')
 .doc(user.uid)
 .onSnapshot((doc) => {
   if (doc && doc.data()){
     const attendingResponse = doc.data().attending;

     // Update css classes for buttons
     if (attendingResponse){
       rsvpYes.className="clicked";
       rsvpNo.className="";
     }
     else{
       rsvpYes.className="";
       rsvpNo.className="clicked";
     }
   }
 });
}

function unsubscribeCurrentRSVP(){
 if (rsvpListener != null)
 {
   rsvpListener();
   rsvpListener = null;
 }
 rsvpYes.className="";
 rsvpNo.className="";
}

// Listen to the current Auth state
firebase.auth().onAuthStateChanged((user) => {
if (user){
  startRsvpButton.textContent = "LOGOUT";
  // Show guestbook to logged-in users
  guestbookContainer.style.display = "block";

  // Subscribe to the guestbook collection
  subscribeGuestbook();
  // Subscribe to the guestbook collection
  subscribeCurrentRSVP(user);
}
else{
  startRsvpButton.textContent = "RSVP";
  // Hide guestbook for non-logged-in users
  guestbookContainer.style.display = "none";

  // Unsubscribe from the guestbook collection
  unsubscribeGuestbook();
  // Unsubscribe from the guestbook collection
  unsubscribeCurrentRSVP();

}
});


}

main();
