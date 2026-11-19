// Greylight's Firebase project (free Spark plan). These values identify the
// project; they are not secrets. Who may read or change what is decided by
// the security rules in firestore.rules.
export const firebaseConfig = {
  apiKey: '',
  authDomain: '',
  projectId: '',
  appId: '',
};

// The one Google account that can open admin.html.
export const ADMIN_EMAIL = 'greylightcompany53@gmail.com';

// Where the downloads live (GitHub Releases of the public repository).
export const REPO = 'greylightapp/greylightapp.github.io';
export const FILES = { mac: 'Greylight-Mac.dmg', windows: 'Greylight-Windows.zip' };
