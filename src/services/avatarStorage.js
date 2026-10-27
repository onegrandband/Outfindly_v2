import {
  db,
  auth,
  doc,
  setDoc,
  getDocs,
  deleteDoc,
  collection,
  serverTimestamp,
  handleFirestoreError,
  OperationType,
} from './firebase.js';
import { pushSavedAssetToCloud } from './accountSync.js';

const DB_NAME = 'RobloxAvatarSaverDB';
const DB_VERSION = 1;
const STORE_NAME = 'avatars';
const LOCAL_STORAGE_KEY = 'roblox_saved_avatars_meta';

// Helper to open IndexedDB
function openDB() {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      reject(new Error('IndexedDB is not supported by your browser'));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('createdAt', 'createdAt', { unique: false });
        store.createIndex('category', 'category', { unique: false });
        store.createIndex('userId', 'userId', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Save metadata array to LocalStorage for instant synchronous access
export function saveMetadataToLocalStorage(items) {
  try {
    const metaList = items.map((item) => ({
      id: item.id,
      name: item.name,
      description: item.description || '',
      fileName: item.fileName,
      fileType: item.fileType,
      fileSize: item.fileSize,
      category: item.category,
      tags: item.tags || [],
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      syncedToCloud: Boolean(item.syncedToCloud),
      userId: item.userId || null,
      // If it's a small image thumbnail (< 30KB), save small preview in localStorage for instant rendering
      thumbnailUrl: item.category === 'image' && item.dataUrl && item.dataUrl.length < 35000 ? item.dataUrl : null,
    }));
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(metaList));
  } catch (err) {
    console.warn('LocalStorage quota or write warning:', err);
  }
}

// Read metadata from LocalStorage
export function getMetadataFromLocalStorage() {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

// Save single avatar to IndexedDB
export async function saveToIndexedDB(item) {
  const dbInstance = await openDB();
  return new Promise((resolve, reject) => {
    const tx = dbInstance.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.put(item);

    request.onsuccess = () => resolve(item);
    request.onerror = () => reject(request.error);
  });
}

// Get all avatars from IndexedDB
export async function getAllFromIndexedDB() {
  const dbInstance = await openDB();
  return new Promise((resolve, reject) => {
    const tx = dbInstance.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

// Get single avatar by ID from IndexedDB
export async function getFromIndexedDB(id) {
  const dbInstance = await openDB();
  return new Promise((resolve, reject) => {
    const tx = dbInstance.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(id);

    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

// Delete avatar from IndexedDB
export async function deleteFromIndexedDB(id) {
  const dbInstance = await openDB();
  return new Promise((resolve, reject) => {
    const tx = dbInstance.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onsuccess = () => resolve(true);
    request.onerror = () => reject(request.error);
  });
}

// Determine general category from filename and mime type
export function categorizeFile(fileName = '', mimeType = '') {
  const lower = fileName.toLowerCase();
  const lowerMime = mimeType.toLowerCase();

  if (
    lowerMime.startsWith('image/') ||
    lower.endsWith('.png') ||
    lower.endsWith('.jpg') ||
    lower.endsWith('.jpeg') ||
    lower.endsWith('.webp') ||
    lower.endsWith('.gif') ||
    lower.endsWith('.svg')
  ) {
    return 'image';
  }

  if (
    lower.endsWith('.obj') ||
    lower.endsWith('.gltf') ||
    lower.endsWith('.glb') ||
    lower.endsWith('.fbx') ||
    lower.endsWith('.rbxm') ||
    lower.endsWith('.rbxmx')
  ) {
    return '3d';
  }

  if (
    lowerMime.includes('json') ||
    lower.endsWith('.json') ||
    lower.endsWith('.txt') ||
    lower.endsWith('.yaml') ||
    lower.endsWith('.xml')
  ) {
    return 'config';
  }

  return 'other';
}

// Convert a File to base64 Data URL
export function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

// Format byte size to readable string
export function formatBytes(bytes, decimals = 1) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// Save avatar into local storages (IndexedDB + LocalStorage) and optionally Firestore
export async function saveAvatarFile({
  file,
  name,
  description = '',
  tags = [],
  category = null,
  userId = null,
}) {
  const fileDataUrl = await readFileAsDataURL(file);
  const now = new Date().toISOString();
  const cleanId = `avatar_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  const finalCategory = category || categorizeFile(file.name, file.type);

  const item = {
    id: cleanId,
    userId: userId || auth.currentUser?.uid || 'guest',
    name: name?.trim() || file.name.replace(/\.[^/.]+$/, ''),
    description: description.trim(),
    fileName: file.name,
    fileType: file.type || 'application/octet-stream',
    fileSize: file.size,
    category: finalCategory,
    dataUrl: fileDataUrl,
    tags: tags.length ? tags : [finalCategory.toUpperCase()],
    createdAt: now,
    updatedAt: now,
    syncedToCloud: false,
  };

  // 1. Store in IndexedDB
  await saveToIndexedDB(item);

  // 2. Update LocalStorage metadata list
  const existingAll = await getAllFromIndexedDB();
  saveMetadataToLocalStorage(existingAll);

  // 3. If authenticated with Firebase or Code Account, sync to cloud
  if (auth.currentUser && userId) {
    try {
      await syncItemToFirestore(item, auth.currentUser.uid);
      item.syncedToCloud = true;
      await saveToIndexedDB(item);
      const refreshedAll = await getAllFromIndexedDB();
      saveMetadataToLocalStorage(refreshedAll);
    } catch (err) {
      console.warn('Could not sync newly saved avatar to Firestore immediately:', err);
    }
  }

  // 4. Sync to code account if logged in
  try {
    await pushSavedAssetToCloud(item);
  } catch (err) {
    console.warn('Could not push saved asset to code account:', err);
  }

  return item;
}

// Sync an individual avatar document to Firestore
export async function syncItemToFirestore(item, uid) {
  if (!uid) return;
  const targetPath = `users/${uid}/saved_avatars/${item.id}`;

  try {
    const docRef = doc(db, 'users', uid, 'saved_avatars', item.id);

    // Firestore has ~1MB document limit.
    // Check if dataUrl is small enough to include in document:
    const includeDataUrl = item.dataUrl && item.dataUrl.length < 800000;

    const payload = {
      id: item.id,
      userId: uid,
      name: item.name.slice(0, 100),
      description: (item.description || '').slice(0, 500),
      fileName: item.fileName.slice(0, 200),
      fileType: item.fileType.slice(0, 100),
      fileSize: item.fileSize,
      category: item.category.slice(0, 50),
      tags: (item.tags || []).slice(0, 20),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    if (includeDataUrl) {
      payload.dataUrl = item.dataUrl;
    }

    await setDoc(docRef, payload, { merge: true });
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, targetPath);
  }
}

// Fetch all saved avatars from Firestore and sync down to local IndexedDB
export async function syncFromFirestore(uid) {
  if (!uid) return [];
  const targetPath = `users/${uid}/saved_avatars`;

  try {
    const colRef = collection(db, 'users', uid, 'saved_avatars');
    const snapshot = await getDocs(colRef);
    const cloudItems = [];

    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();
      const localItem = await getFromIndexedDB(docSnap.id);

      const merged = {
        id: docSnap.id,
        userId: uid,
        name: data.name || 'Unnamed Avatar',
        description: data.description || '',
        fileName: data.fileName || `${docSnap.id}.bin`,
        fileType: data.fileType || 'application/octet-stream',
        fileSize: data.fileSize || 0,
        category: data.category || 'other',
        // Preserve local full dataUrl if available, or use cloud dataUrl if provided
        dataUrl: localItem?.dataUrl || data.dataUrl || null,
        tags: data.tags || [],
        createdAt: data.createdAt?.toDate?.()?.toISOString() || localItem?.createdAt || new Date().toISOString(),
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || localItem?.updatedAt || new Date().toISOString(),
        syncedToCloud: true,
      };

      await saveToIndexedDB(merged);
      cloudItems.push(merged);
    }

    // Refresh local storage metadata
    const allLocal = await getAllFromIndexedDB();
    saveMetadataToLocalStorage(allLocal);
    return allLocal;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, targetPath);
    return [];
  }
}

// Delete an avatar completely
export async function deleteAvatar(id, userId = null) {
  // 1. Delete from IndexedDB
  await deleteFromIndexedDB(id);

  // 2. Delete from Firestore if authenticated
  if (auth.currentUser && userId) {
    const targetPath = `users/${userId}/saved_avatars/${id}`;
    try {
      const docRef = doc(db, 'users', userId, 'saved_avatars', id);
      await deleteDoc(docRef);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, targetPath);
    }
  }

  // 3. Refresh LocalStorage
  const allLocal = await getAllFromIndexedDB();
  saveMetadataToLocalStorage(allLocal);
  return allLocal;
}

// Download file directly
export function triggerFileDownload(item) {
  if (!item.dataUrl) {
    alert('No file content available to download.');
    return;
  }
  const link = document.createElement('a');
  link.href = item.dataUrl;
  link.download = item.fileName || `${item.name}.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
