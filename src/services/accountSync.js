/**
 * Cloud & Cross-Device Account Sync Service for Roblox Outfindly.
 * Allows instant cross-device sync (PC, iPad, Mobile) via randomized account codes
 * and security questions stored in Firebase Firestore.
 */

import {
  db,
  doc,
  setDoc,
  getDocFromServer,
  collection,
  serverTimestamp,
} from './firebase.js';
import {
  getAllFromIndexedDB,
  saveToIndexedDB,
  saveMetadataToLocalStorage,
} from './avatarStorage.js';
import { getSavedCharacters, saveCharacter } from './catalog.js';

export const CURRENT_ACCOUNT_KEY = 'rbx_active_code_account';
export const EXPANDED_BIOS_KEY = 'expanded_roblox_bios';
export const RECENT_SEARCHES_KEY = 'rbx_recent_searches';

export const SECURITY_QUESTIONS = [
  'What was the first Roblox game you ever played?',
  'What is your favorite Roblox hat or accessory?',
  'What is the name of your first pet?',
  'Who is your favorite Roblox YouTuber or creator?',
  'What year did you start playing Roblox?',
  'What was your first favorite Roblox place or hangout?',
  'What is your secret favorite Roblox game genre?',
];

/**
 * Generates a clean, readable randomized account code.
 * Example: "RBX-7K9P-4M2Q"
 */
export function generateRandomAccountCode() {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'; // exclude ambiguous 0, 1, I, O
  let part1 = '';
  let part2 = '';
  for (let i = 0; i < 4; i++) {
    part1 += chars.charAt(Math.floor(Math.random() * chars.length));
    part2 += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `RBX-${part1}-${part2}`;
}

/**
 * Normalizes code string (e.g. handles lowercase or spaces).
 */
export function normalizeAccountCode(code = '') {
  return String(code).trim().toUpperCase();
}

/**
 * Normalizes answer for comparison (lowercase, trimmed).
 */
export function normalizeAnswer(answer = '') {
  return String(answer).trim().toLowerCase();
}

/**
 * Retrieves the currently logged-in code account from localStorage.
 */
export function getActiveCodeAccount() {
  try {
    const raw = localStorage.getItem(CURRENT_ACCOUNT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Persists active code account to localStorage.
 */
export function setActiveCodeAccount(account) {
  try {
    if (account) {
      localStorage.setItem(CURRENT_ACCOUNT_KEY, JSON.stringify(account));
    } else {
      localStorage.removeItem(CURRENT_ACCOUNT_KEY);
    }
  } catch (err) {
    console.warn('Could not store active code account:', err);
  }
}

/**
 * Creates a brand new account in Firestore with a randomized code & security question.
 */
export async function createCodeAccount(code, securityQuestion, securityAnswer) {
  const cleanCode = normalizeAccountCode(code);
  const cleanAnswer = normalizeAnswer(securityAnswer);

  if (!cleanCode || cleanCode.length < 5) {
    throw new Error('Invalid account code.');
  }
  if (!securityQuestion) {
    throw new Error('Please select a security question.');
  }
  if (!cleanAnswer) {
    throw new Error('Please enter an answer for your security question.');
  }

  // Check if account already exists
  const accountRef = doc(db, 'accounts', cleanCode);
  try {
    const existing = await getDocFromServer(accountRef);
    if (existing.exists()) {
      throw new Error('This account code is already taken. Please generate a new code.');
    }
  } catch (err) {
    // If not exists or test passes, continue
    if (err.message?.includes('already taken')) throw err;
  }

  // Gather current local assets, searches, and maker creations to seed the cloud account
  const localAssets = await getAllFromIndexedDB().catch(() => []);
  const localCharacters = getSavedCharacters();
  let localSearches = [];
  try {
    const s = localStorage.getItem(RECENT_SEARCHES_KEY);
    if (s) localSearches = JSON.parse(s);
  } catch {}
  let localBios = [];
  try {
    const b = localStorage.getItem(EXPANDED_BIOS_KEY);
    if (b) localBios = JSON.parse(b);
  } catch {}

  const accountDoc = {
    code: cleanCode,
    securityQuestion,
    securityAnswer: cleanAnswer,
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
    searchHistory: localSearches.slice(0, 15),
    expandedBios: localBios,
    avatarMakerCreations: localCharacters.slice(0, 30),
    // Assets metadata (small dataUrl can be stored)
    assetsSummary: localAssets.map((a) => ({
      id: a.id,
      name: a.name,
      fileName: a.fileName,
      fileType: a.fileType,
      fileSize: a.fileSize,
      category: a.category,
      tags: a.tags || [],
      createdAt: a.createdAt,
      // Store small thumbnail preview in main document if < 40KB
      thumbnailUrl: a.dataUrl && a.dataUrl.length < 50000 ? a.dataUrl : null,
    })),
  };

  await setDoc(accountRef, accountDoc);

  // If there are full assets, also store them in the subcollection `accounts/{code}/assets/{id}`
  for (const asset of localAssets.slice(0, 15)) {
    try {
      if (asset.dataUrl && asset.dataUrl.length < 800000) {
        const assetRef = doc(db, 'accounts', cleanCode, 'assets', asset.id);
        await setDoc(assetRef, {
          ...asset,
          code: cleanCode,
          updatedAt: new Date().toISOString(),
        });
      }
    } catch (e) {
      console.warn('Could not sync initial asset subdoc:', e);
    }
  }

  const sessionObj = {
    code: cleanCode,
    securityQuestion,
    displayName: `Robloxian ${cleanCode}`,
  };

  setActiveCodeAccount(sessionObj);
  return sessionObj;
}

/**
 * Signs into an existing account with code + security question answer.
 * Downloads all data (assets, searches, avatar maker creations, bios) to this device.
 */
export async function loginWithCode(code, securityAnswer) {
  const cleanCode = normalizeAccountCode(code);
  const cleanAnswer = normalizeAnswer(securityAnswer);

  if (!cleanCode) throw new Error('Please enter your account code.');
  if (!cleanAnswer) throw new Error('Please enter your security question answer.');

  const accountRef = doc(db, 'accounts', cleanCode);
  const snap = await getDocFromServer(accountRef);

  if (!snap.exists()) {
    throw new Error(`Account code "${cleanCode}" was not found. Please verify your code.`);
  }

  const data = snap.data();
  if (normalizeAnswer(data.securityAnswer) !== cleanAnswer) {
    throw new Error('Incorrect answer to security question. Please check capitalization or spelling.');
  }

  // Update last login
  try {
    await setDoc(accountRef, { lastLoginAt: new Date().toISOString() }, { merge: true });
  } catch {}

  // 1. Sync Search History
  if (Array.isArray(data.searchHistory) && data.searchHistory.length > 0) {
    try {
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(data.searchHistory));
    } catch {}
  }

  // 2. Sync Expanded Bios
  if (Array.isArray(data.expandedBios)) {
    try {
      localStorage.setItem(EXPANDED_BIOS_KEY, JSON.stringify(data.expandedBios));
    } catch {}
  }

  // 3. Sync Avatar Maker Creations
  if (Array.isArray(data.avatarMakerCreations)) {
    for (const char of data.avatarMakerCreations) {
      saveCharacter(char);
    }
  }

  // 4. Sync Uploaded Assets into IndexedDB
  if (Array.isArray(data.assetsSummary)) {
    for (const a of data.assetsSummary) {
      await saveToIndexedDB({
        id: a.id,
        name: a.name,
        description: a.description || '',
        fileName: a.fileName,
        fileType: a.fileType,
        fileSize: a.fileSize,
        category: a.category,
        tags: a.tags || [],
        dataUrl: a.thumbnailUrl || null,
        createdAt: a.createdAt,
        updatedAt: a.createdAt,
        syncedToCloud: true,
      });
    }
    const all = await getAllFromIndexedDB();
    saveMetadataToLocalStorage(all);
  }

  const sessionObj = {
    code: cleanCode,
    securityQuestion: data.securityQuestion,
    displayName: `Robloxian ${cleanCode}`,
  };

  setActiveCodeAccount(sessionObj);
  return sessionObj;
}

/**
 * Pushes updated search history to cloud if account is active.
 */
export async function pushSearchHistoryToCloud(searches) {
  const current = getActiveCodeAccount();
  if (!current?.code) return;

  try {
    const accountRef = doc(db, 'accounts', current.code);
    await setDoc(
      accountRef,
      {
        searchHistory: searches.slice(0, 15),
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (err) {
    console.warn('Could not sync search history to cloud:', err);
  }
}

/**
 * Pushes updated expanded bios to cloud if account is active.
 */
export async function pushExpandedBiosToCloud(bios) {
  const current = getActiveCodeAccount();
  if (!current?.code) return;

  try {
    const accountRef = doc(db, 'accounts', current.code);
    await setDoc(
      accountRef,
      {
        expandedBios: bios,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (err) {
    console.warn('Could not sync expanded bios to cloud:', err);
  }
}

/**
 * Pushes updated avatar maker creations to cloud.
 */
export async function pushAvatarMakerToCloud(creations) {
  const current = getActiveCodeAccount();
  if (!current?.code) return;

  try {
    const accountRef = doc(db, 'accounts', current.code);
    await setDoc(
      accountRef,
      {
        avatarMakerCreations: creations.slice(0, 30),
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (err) {
    console.warn('Could not sync avatar maker to cloud:', err);
  }
}

/**
 * Pushes newly saved avatar file to cloud under this code account.
 */
export async function pushSavedAssetToCloud(asset) {
  const current = getActiveCodeAccount();
  if (!current?.code) return;

  try {
    // 1. Update subcollection document if < 800KB
    if (asset.dataUrl && asset.dataUrl.length < 800000) {
      const assetRef = doc(db, 'accounts', current.code, 'assets', asset.id);
      await setDoc(assetRef, {
        ...asset,
        code: current.code,
        updatedAt: new Date().toISOString(),
      });
    }

    // 2. Also update assetsSummary in main account doc
    const all = await getAllFromIndexedDB();
    const accountRef = doc(db, 'accounts', current.code);
    await setDoc(
      accountRef,
      {
        assetsSummary: all.slice(0, 50).map((a) => ({
          id: a.id,
          name: a.name,
          fileName: a.fileName,
          fileType: a.fileType,
          fileSize: a.fileSize,
          category: a.category,
          tags: a.tags || [],
          createdAt: a.createdAt,
          thumbnailUrl: a.dataUrl && a.dataUrl.length < 50000 ? a.dataUrl : null,
        })),
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (err) {
    console.warn('Could not sync asset to code account:', err);
  }
}
