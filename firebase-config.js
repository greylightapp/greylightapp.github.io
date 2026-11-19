// Greylight's Firebase project (free Spark plan). These values identify the
// project; they are not secrets. Who may read or change what is decided by
// the security rules in firestore.rules.
export const firebaseConfig = {
  apiKey: 'AIzaSyCy8p6h8S9Xw87aBzbBvfGY80jwL2ucAzk',
  authDomain: 'greylight-app-6032f.firebaseapp.com',
  projectId: 'greylight-app',
  appId: '1:647348742470:web:ee658cbfed4dd6233f9d47',
};

// Google sign-in button (Google Cloud › Google Auth Platform › Clients ›
// "Web client"). Its authorised JavaScript origins must list the website.
export const GOOGLE_CLIENT_ID = '647348742470-9jfslcihboastb6hi0i7025188beq1pr.apps.googleusercontent.com';

// The one Google account that can open admin.html.
export const ADMIN_EMAIL = 'greylightcompany53@gmail.com';

// Where the downloads live (GitHub Releases of the public repository).
export const REPO = 'greylightapp/greylightapp.github.io';
export const FILES = { mac: 'Greylight-Mac.dmg', windows: 'Greylight-Windows.zip' };
