import axios from "axios";
import { initializeApp } from "firebase/app";
import { getDatabase, serverTimestamp, ref, onValue, off } from "firebase/database";
import { getAuth, signInAnonymously } from "firebase/auth";

const baseURL = process.env.REACT_APP_API_URL;
const staticURL = process.env.REACT_APP_STATIC_URL;

// Firebase config
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.REACT_APP_FIREBASE_DATABASE_URL,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID
};

// Khởi tạo Firebase
const firebaseApp = initializeApp(firebaseConfig);
const firebase = getDatabase(firebaseApp);
const auth = getAuth(firebaseApp);

// Axios instance
const api = axios.create({
  baseURL: baseURL,
  timeout: 10000, // 10 giây
  headers: {
    'Content-Type': 'application/json'
  }
});

// Initialize Firebase auth
const initializeFirebaseAuth = async () => {
  try {
    // Kiểm tra xem đã xác thực chưa
    if (!auth.currentUser) {
      await signInAnonymously(auth);
    }
  } catch (error) {
    console.error("Firebase authentication failed:", error);
    throw error;
  }
};

// Request interceptor
api.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const originalRequest = error.config;

    const isLoginRequest =
      originalRequest.headers &&
      originalRequest.headers["X-Login-Request"] === "true";

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !isLoginRequest
    ) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem("refreshToken");
        if (!refreshToken) {
          throw new Error("No refresh token");
        }

        const refreshResponse = await axios.post(
          `${baseURL}/token/refresh`,
          { refresh_token: refreshToken },
          { headers: { "Content-Type": "application/json" } }
        );

        const { access_token } = refreshResponse.data;

        if (!access_token) {
          throw new Error("No access token received");
        }

        localStorage.setItem("accessToken", access_token);
        originalRequest.headers.Authorization = `Bearer ${access_token}`;

        return api(originalRequest);
      } catch (err) {
        localStorage.clear();
        if (!isLoginRequest && window.location.pathname !== "/") {
          window.location.href = "/";
        }
        return Promise.reject(err);
      }
    }
    return Promise.reject(error);
  }
);

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const publicRoutes = ["/pendingUser/verify", "/pendingUser/complete"];
    const isPublicRoute = publicRoutes.some((route) =>
      config.url.includes(route)
    );

    if (!isPublicRoute) {
      const token = localStorage.getItem("accessToken");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Firebase helper functions
const getFirebaseRef = (path) => {
  return ref(firebase, path);
};

const listenToFirebaseRef = (path, callback) => {
  const reference = ref(firebase, path);
  onValue(reference, (snapshot) => {
    callback(snapshot.val());
  });
  return reference;
};

const removeFirebaseListener = (reference) => {
  off(reference);
};

export { 
  api, 
  baseURL, 
  staticURL,
  firebase,
  auth,
  serverTimestamp,
  getFirebaseRef,
  listenToFirebaseRef,
  removeFirebaseListener,
  initializeFirebaseAuth
};
