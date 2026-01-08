"use client";

import { firebaseConfig } from "@/firebase/config";
import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";
import { getStorage, FirebaseStorage } from "firebase/storage";
import { getPerformance, performance } from "firebase/performance";

interface FirebaseServices {
  firebaseApp: FirebaseApp;
  auth: Auth;
  firestore: Firestore;
  storage: FirebaseStorage;
  performance?: performance;
}

export function initializeFirebase(): FirebaseServices {
  if (!getApps().length) {
    const app = initializeApp(firebaseConfig);

    if (typeof window !== "undefined") {
      performance = getPerformance(app);
    }

    return getSdks(app);
  } else {
    return getSdks(getApp());
  }
}

export function getSdks(firebaseApp: FirebaseApp): FirebaseServices {
  return {
    firebaseApp,
    auth: getAuth(firebaseApp),
    firestore: getFirestore(firebaseApp),
    storage: getStorage(firebaseApp),
    performance,
  };
}
