// Greylight accounts on the website: Google sign-in, the sign-up profile
// and download records, on Firebase (Auth + Firestore).
import { firebaseConfig, ADMIN_EMAIL, REPO, FILES } from './firebase-config.js';

const SDK = 'https://www.gstatic.com/firebasejs/10.12.2/';

export const configured = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);
export { ADMIN_EMAIL, REPO, FILES };

let ready;
/** Loads Firebase once; resolves to { auth, db, fs, au } (SDK modules). */
export function firebase() {
  if (!configured) return Promise.reject(new Error('not-configured'));
  ready ??= (async () => {
    const [{ initializeApp }, au, fs] = await Promise.all([
      import(SDK + 'firebase-app.js'),
      import(SDK + 'firebase-auth.js'),
      import(SDK + 'firebase-firestore.js'),
    ]);
    const app = initializeApp(firebaseConfig);
    const auth = au.getAuth(app);
    await au.setPersistence(auth, au.browserLocalPersistence);
    return { auth, db: fs.getFirestore(app), fs, au };
  })();
  return ready;
}

/** The signed-in user once Firebase knows (null: signed out). */
export async function currentUser() {
  const { auth, au } = await firebase();
  await auth.authStateReady();
  return auth.currentUser;
}

export async function onUser(callback) {
  const { auth, au } = await firebase();
  return au.onAuthStateChanged(auth, callback);
}

export async function signInWithGoogle() {
  const { auth, au } = await firebase();
  const provider = new au.GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  const result = await au.signInWithPopup(auth, provider);
  return result.user;
}

export async function signOut() {
  const { auth, au } = await firebase();
  await au.signOut(auth);
}

/** The sign-up profile (users/<uid>), or null when not signed up yet. */
export async function getProfile(uid) {
  const { db, fs } = await firebase();
  const snap = await fs.getDoc(fs.doc(db, 'users', uid));
  return snap.exists() ? snap.data() : null;
}

export function profileComplete(p) {
  return Boolean(p && p.firstName && p.country && Number(p.age) >= 13);
}

/** Everything the admin dashboard shows (admin account only). */
export async function adminData() {
  const { db, fs } = await firebase();
  const [users, downloads] = await Promise.all([
    fs.getDocs(fs.collection(db, 'users')),
    fs.getDocs(fs.collection(db, 'downloads')),
  ]);
  const t = v => (v && typeof v.toDate === 'function' ? v.toDate() : null);
  return {
    users: users.docs.map(d => ({ id: d.id, ...d.data(), createdAt: t(d.get('createdAt')), lastOpenedAt: t(d.get('lastOpenedAt')), lastDownloadAt: t(d.get('lastDownloadAt')) })),
    downloads: downloads.docs.map(d => ({ ...d.data(), at: t(d.get('at')) })),
  };
}

export async function readPublic(name) {
  const { db, fs } = await firebase();
  const snap = await fs.getDoc(fs.doc(db, 'public', name));
  return snap.exists() ? snap.data() : null;
}

export async function writePublic(name, data) {
  const { db, fs } = await firebase();
  await fs.setDoc(fs.doc(db, 'public', name), { ...data, updatedAt: fs.serverTimestamp() });
}

/** Saves the sign-up form. New profiles get createdAt. */
export async function saveProfile(user, form) {
  const { db, fs } = await firebase();
  const ref = fs.doc(db, 'users', user.uid);
  const existing = await fs.getDoc(ref);
  const data = {
    firstName: form.firstName.trim(),
    lastName: form.lastName.trim(),
    age: Math.round(Number(form.age)),
    country: form.country.trim(),
    state: form.state.trim(),
    city: form.city.trim(),
    email: user.email,
    updatedAt: fs.serverTimestamp(),
  };
  if (!existing.exists()) {
    data.createdAt = fs.serverTimestamp();
    data.downloads = 0;
    await fs.setDoc(ref, data);
  } else {
    await fs.updateDoc(ref, data);
  }
}

/** Records a download (for the dashboard) and returns the file's address. */
export async function recordDownload(user, profile, os, version) {
  const { db, fs } = await firebase();
  const at = fs.serverTimestamp();
  await Promise.all([
    // Download records are anonymous: the person's own count is on their profile.
    fs.addDoc(fs.collection(db, 'downloads'), { os, version: version || '', country: profile.country || '', at }),
    fs.updateDoc(fs.doc(db, 'users', user.uid), { downloads: fs.increment(1), lastDownloadAt: at, lastDownloadOs: os }),
  ]);
}

/** A download's address: the newest version, or the release tagged [tag]. */
export function fileUrl(os, tag) {
  const file = os === 'windows' ? FILES.windows : FILES.mac;
  return tag
    ? `https://github.com/${REPO}/releases/download/${encodeURIComponent(tag)}/${file}`
    : `https://github.com/${REPO}/releases/latest/download/${file}`;
}

/** Deletes the profile, then the Google sign-in for Greylight. */
export async function deleteAccount(user) {
  const { db, fs, au } = await firebase();
  await fs.deleteDoc(fs.doc(db, 'users', user.uid));
  try {
    await au.deleteUser(user);
  } catch (e) {
    if (e.code !== 'auth/requires-recent-login') throw e;
    await au.reauthenticateWithPopup(user, new au.GoogleAuthProvider());
    await au.deleteUser(user);
  }
}

/** The newest published version (public/release), or null. */
export async function latestRelease() {
  const { db, fs } = await firebase();
  const snap = await fs.getDoc(fs.doc(db, 'public', 'release'));
  return snap.exists() ? snap.data() : null;
}

export const COUNTRIES = ['Afghanistan', 'Albania', 'Algeria', 'Andorra', 'Angola', 'Antigua and Barbuda', 'Argentina', 'Armenia', 'Australia', 'Austria', 'Azerbaijan', 'Bahamas', 'Bahrain', 'Bangladesh', 'Barbados', 'Belarus', 'Belgium', 'Belize', 'Benin', 'Bhutan', 'Bolivia', 'Bosnia and Herzegovina', 'Botswana', 'Brazil', 'Brunei', 'Bulgaria', 'Burkina Faso', 'Burundi', 'Cabo Verde', 'Cambodia', 'Cameroon', 'Canada', 'Central African Republic', 'Chad', 'Chile', 'China', 'Colombia', 'Comoros', 'Congo', 'Costa Rica', 'Côte d’Ivoire', 'Croatia', 'Cuba', 'Cyprus', 'Czechia', 'Democratic Republic of the Congo', 'Denmark', 'Djibouti', 'Dominica', 'Dominican Republic', 'Ecuador', 'Egypt', 'El Salvador', 'Equatorial Guinea', 'Eritrea', 'Estonia', 'Eswatini', 'Ethiopia', 'Fiji', 'Finland', 'France', 'Gabon', 'Gambia', 'Georgia', 'Germany', 'Ghana', 'Greece', 'Grenada', 'Guatemala', 'Guinea', 'Guinea-Bissau', 'Guyana', 'Haiti', 'Honduras', 'Hong Kong', 'Hungary', 'Iceland', 'India', 'Indonesia', 'Iran', 'Iraq', 'Ireland', 'Israel', 'Italy', 'Jamaica', 'Japan', 'Jordan', 'Kazakhstan', 'Kenya', 'Kiribati', 'Kosovo', 'Kuwait', 'Kyrgyzstan', 'Laos', 'Latvia', 'Lebanon', 'Lesotho', 'Liberia', 'Libya', 'Liechtenstein', 'Lithuania', 'Luxembourg', 'Macao', 'Madagascar', 'Malawi', 'Malaysia', 'Maldives', 'Mali', 'Malta', 'Marshall Islands', 'Mauritania', 'Mauritius', 'Mexico', 'Micronesia', 'Moldova', 'Monaco', 'Mongolia', 'Montenegro', 'Morocco', 'Mozambique', 'Myanmar', 'Namibia', 'Nauru', 'Nepal', 'Netherlands', 'New Zealand', 'Nicaragua', 'Niger', 'Nigeria', 'North Korea', 'North Macedonia', 'Norway', 'Oman', 'Pakistan', 'Palau', 'Palestine', 'Panama', 'Papua New Guinea', 'Paraguay', 'Peru', 'Philippines', 'Poland', 'Portugal', 'Puerto Rico', 'Qatar', 'Romania', 'Russia', 'Rwanda', 'Saint Kitts and Nevis', 'Saint Lucia', 'Saint Vincent and the Grenadines', 'Samoa', 'San Marino', 'São Tomé and Príncipe', 'Saudi Arabia', 'Senegal', 'Serbia', 'Seychelles', 'Sierra Leone', 'Singapore', 'Slovakia', 'Slovenia', 'Solomon Islands', 'Somalia', 'South Africa', 'South Korea', 'South Sudan', 'Spain', 'Sri Lanka', 'Sudan', 'Suriname', 'Sweden', 'Switzerland', 'Syria', 'Taiwan', 'Tajikistan', 'Tanzania', 'Thailand', 'Timor-Leste', 'Togo', 'Tonga', 'Trinidad and Tobago', 'Tunisia', 'Türkiye', 'Turkmenistan', 'Tuvalu', 'Uganda', 'Ukraine', 'United Arab Emirates', 'United Kingdom', 'United States', 'Uruguay', 'Uzbekistan', 'Vanuatu', 'Vatican City', 'Venezuela', 'Vietnam', 'Yemen', 'Zambia', 'Zimbabwe'];
