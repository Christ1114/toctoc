import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyD-vF53lGhjkfRUjnKwTlmic4iBll_LPR4",
  authDomain: "toctocmvp.firebaseapp.com",
  projectId: "toctocmvp",
  storageBucket: "toctocmvp.firebasestorage.app",
  messagingSenderId: "478036990165",
  appId: "1:478036990165:web:5fdbd2de3bfa53ebf56a5c",
  measurementId: "G-1PSRCG9PJ8"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);