// Firebase configuration

const firebaseConfig = {
    apiKey: "AIzaSyCJYVzDPbymADYc5CBVITL7cbo-e1eEK9c",
    authDomain: "besnos-jobs.firebaseapp.com",
    databaseURL: "https://besnos-jobs-default-rtdb.firebaseio.com",
    projectId: "besnos-jobs",
    storageBucket: "besnos-jobs.firebasestorage.app",
    messagingSenderId: "210625114941",
    appId: "1:210625114941:web:9ed4605d178658ad558b54",
    measurementId: "G-1QWVS83ZK5"
};


// Initialize Firebase

firebase.initializeApp(firebaseConfig);


// Connect to Firestore

const db = firebase.firestore();