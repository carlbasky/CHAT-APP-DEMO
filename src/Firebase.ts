import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyAIoOHsbfyTHuGYmGlLIb5iv_pcCANVITk",
    authDomain: "chat-43351.firebaseapp.com",
    projectId: "chat-43351",
    storageBucket: "chat-43351.appspot.com",
    messagingSenderId: "308500378543",
    appId: "1:308500378543:web:e954debe9b485c8dbdf55a"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const auth = getAuth();
export const storage = getStorage();
export const db = getFirestore();