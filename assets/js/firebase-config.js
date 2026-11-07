// Paste the web app config from Firebase console → Project settings → Your apps.
// While apiKey/projectId are empty the site runs in demo mode (form logs to console, prices stay static).
export const firebaseConfig = {
  apiKey: "AIzaSyC2BuRwlONcFG5eK8_lTfe2z9xhqmuYfqs",
  authDomain: "auto-remar.firebaseapp.com",
  projectId: "auto-remar",
  storageBucket: "auto-remar.firebasestorage.app",
  messagingSenderId: "979803767665",
  appId: "1:979803767665:web:1c2fca79a97509d6176cd0",
};

// Optional: reCAPTCHA v3 site key for Firebase App Check. Empty = App Check off.
export const appCheckSiteKey = "";

// Optional: e-mail about every new booking via EmailJS. Empty = no e-mail.
export const emailjs = { serviceId: "", templateId: "", publicKey: "" };

// ---- no need to edit below ----
const SDK = "https://www.gstatic.com/firebasejs/10.12.2/";
export const configured = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);

let appPromise;
export function getApp() {
  return (appPromise ??= (async () => {
    const { initializeApp } = await import(SDK + "firebase-app.js");
    const app = initializeApp(firebaseConfig);
    if (appCheckSiteKey) {
      const { initializeAppCheck, ReCaptchaV3Provider } = await import(SDK + "firebase-app-check.js");
      initializeAppCheck(app, { provider: new ReCaptchaV3Provider(appCheckSiteKey), isTokenAutoRefreshEnabled: true });
    }
    return app;
  })());
}
export const firestore = () => import(SDK + "firebase-firestore.js");
export const auth = () => import(SDK + "firebase-auth.js");
