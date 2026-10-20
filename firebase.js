
/* =========================================
   BESNOS JOBS - FIREBASE CONFIGURATION
========================================= */

const firebaseConfig = {
    apiKey: "AIzaSyCJYVzDPbymADYc5CBVITL7cbo-e1EKK9c",
    authDomain: "besnos-jobs.firebaseapp.com",
    databaseURL: "https://besnos-jobs-default-rtdb.firebaseio.com",
    projectId: "besnos-jobs",
    storageBucket: "besnos-jobs.firebasestorage.app",
    messagingSenderId: "210625114941",
    appId: "1:210625114941:web:9ed4605d178658ad558b54",
    measurementId: "G-1QWVS83ZK5"
};

// Initialize Firebase only once
if (typeof firebase !== "undefined") {
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }

    // Connect to Firestore
    const db = firebase.firestore();
} else {
    console.error(
        "Firebase failed to load. Check the Firebase script links in your HTML files."
    );
}
