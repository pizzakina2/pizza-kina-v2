import { defaultPublicSettings } from "./settings.js";
import { collection, db, doc, getDoc, getDocs, orderBy, query } from "./firestore.js";

export async function loadPublicSettings() {
  const ref = doc(db, "publicSettings", "current");
  const snap = await getDoc(ref);
  return snap.exists() ? { ...defaultPublicSettings, ...snap.data() } : defaultPublicSettings;
}

export async function loadMenuItems() {
  const q = query(collection(db, "menuItems"), orderBy("sortOrder", "asc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}
