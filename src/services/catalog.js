/**
 * Roblox Marketplace Catalog items & Saved Character Manager.
 */

import { fetchRobloxJson } from './roblox.js';

export const CURATED_CATALOG = [
  // --- HATS & CAPS ---
  {
    id: 1080951,
    name: "Builders Club Hard Hat",
    category: "hats",
    price: 0,
    creator: "Roblox",
    imageUrl: "https://tr.rbxcdn.com/180DAY-2b16c733ccb551b1e5b300a86e6d0a27/420/420/Hat/Png/noFilter",
    description: "Classic construction hard hat.",
  },
  {
    id: 96103379,
    name: "Dominus Infernus",
    category: "hats",
    price: 50000,
    creator: "Roblox",
    imageUrl: "https://tr.rbxcdn.com/180DAY-9ac47de86749aa563b05e43522ed2731/420/420/Hat/Png/noFilter",
    description: "One of the most legendary hats in Roblox history.",
  },
  {
    id: 1365767,
    name: "Valkyrie Helm",
    category: "hats",
    price: 50000,
    creator: "Roblox",
    imageUrl: "https://tr.rbxcdn.com/180DAY-33ebc9fedab2e19a669b6686ad7a656b/420/420/Hat/Png/noFilter",
    description: "Forged in the halls of Valhalla.",
  },
  {
    id: 1285307,
    name: "Sparkle Time Fedora",
    category: "hats",
    price: 25000,
    creator: "Roblox",
    imageUrl: "https://tr.rbxcdn.com/180DAY-021f90eeacf6ea627994dd5ce8365460/420/420/Hat/Png/noFilter",
    description: "Pure sparkle, pure swagger.",
  },

  // --- HAIR ---
  {
    id: 20418474,
    name: "Shaggy Hair",
    category: "hair",
    price: 50,
    creator: "Roblox",
    imageUrl: "https://tr.rbxcdn.com/180DAY-81679df8836fc317789fa7179db4696c/420/420/Image/Png/noFilter",
    description: "The timeless shaggy hairstyle.",
  },
  {
    id: 16630147,
    name: "Beautiful Hair for Beautiful People",
    category: "hair",
    price: 95,
    creator: "Roblox",
    imageUrl: "https://tr.rbxcdn.com/180DAY-e6b3bea674f4ea1073debd8ad220c8c9/420/420/HairAccessory/Png/noFilter",
    description: "A staple brown swoopy hair style.",
  },
  {
    id: 376527350,
    name: "Pal Hair (Bacon)",
    category: "hair",
    price: 0,
    creator: "Roblox",
    imageUrl: "https://tr.rbxcdn.com/180DAY-84eb030419a5487092f0c1d32a4993dc/420/420/HairAccessory/Png/noFilter",
    description: "The world-famous classic Bacon Hair.",
  },
  {
    id: 62234425,
    name: "Brown Charmer Hair",
    category: "hair",
    price: 80,
    creator: "Roblox",
    imageUrl: "https://tr.rbxcdn.com/180DAY-2579acf81b849c7c583c0e733dc2db94/420/420/HairAccessory/Png/noFilter",
    description: "Smooth and stylish.",
  },

  // --- FACES ---
  {
    id: 494291269,
    name: "Super Super Happy Face",
    category: "faces",
    price: 75000,
    creator: "Roblox",
    imageUrl: "https://tr.rbxcdn.com/180DAY-c23824ccd04260f4261de2d2d2aa43a9/420/420/Face/Png/noFilter",
    description: "The cheerful iconic face.",
  },
  {
    id: 24036163,
    name: "Playful Vampire",
    category: "faces",
    price: 45000,
    creator: "Roblox",
    imageUrl: "https://tr.rbxcdn.com/180DAY-88edbd4c22e4a1b7ef17bb94d78ebde1/420/420/GameIcon8/Png/noFilter",
    description: "Cute fangs and mischievous eyes.",
  },
  {
    id: 86487700,
    name: "Man Face",
    category: "faces",
    price: 0,
    creator: "Roblox",
    imageUrl: "https://tr.rbxcdn.com/180DAY-49cff792661b25772112b96239494045/420/420/Face/Png/noFilter",
    description: "Pure confidence.",
  },
  {
    id: 86487762,
    name: "Woman Face",
    category: "faces",
    price: 0,
    creator: "Roblox",
    imageUrl: "https://tr.rbxcdn.com/180DAY-3195259bc26f137a7226b7e9eb693d27/420/420/Image/Png/noFilter",
    description: "Classic feminine smile.",
  },

  // --- SHIRTS & TOPS ---
  {
    id: 1142116,
    name: "Builders Club Jacket",
    category: "shirts",
    price: 0,
    creator: "Roblox",
    imageUrl: "https://t7.rbxcdn.com/180DAY-cafac58759b75480b708304fa0e3b599",
    description: "Official classic retro builders shirt.",
  },
  {
    id: 607785314,
    name: "Classic Denim Jacket",
    category: "shirts",
    price: 0,
    creator: "Roblox",
    imageUrl: "https://tr.rbxcdn.com/180DAY-89c5ecf4531e4fbf962025e8a688f594/420/420/Shirt/Png/noFilter",
    description: "Denim jacket with white hoodie underneath.",
  },
  {
    id: 144076358,
    name: "Streetwear Hoodie",
    category: "shirts",
    price: 5,
    creator: "Kestrel",
    imageUrl: "https://tr.rbxcdn.com/180DAY-a363b433a6b1ca1717f38c2c83e92738/420/420/Shirt/Png/noFilter",
    description: "Oversized black skater hoodie.",
  },

  // --- PANTS & BOTTOMS ---
  {
    id: 144076760,
    name: "Ripped Cargo Skater Pants",
    category: "pants",
    price: 5,
    creator: "Kestrel",
    imageUrl: "https://tr.rbxcdn.com/180DAY-271360eb1523e4c8cb9ae56fadd7a354/420/420/Pants/Png/noFilter",
    description: "Detailed distressed denim with sneaker laces.",
  },

  // --- ACCESSORIES ---
  {
    id: 20011917,
    name: "8-Bit Sword Pack",
    category: "accessories",
    price: 500,
    creator: "Roblox",
    imageUrl: "https://tr.rbxcdn.com/180DAY-88edbd4c22e4a1b7ef17bb94d78ebde1/420/420/GameIcon10/Png/noFilter",
    description: "Retro pixelated crossed swords.",
  },
];

export const ROBLOX_PALETTE = [
  { name: "Yellow", hex: "#F5CD30", id: 226 },
  { name: "Blue", hex: "#0055BF", id: 26 },
  { name: "Red", hex: "#DA291C", id: 21 },
  { name: "Green", hex: "#28A745", id: 37 },
  { name: "Grey", hex: "#A3A2A5", id: 194 },
  { name: "Black", hex: "#1B2A35", id: 1017 },
  { name: "White", hex: "#F2F3F3", id: 1 },
  { name: "Tan", hex: "#C7AC78", id: 125 },
  { name: "Brown", hex: "#A05F35", id: 106 },
  { name: "Peach", hex: "#EAB892", id: 1001 },
  { name: "Purple", hex: "#6B327C", id: 107 },
  { name: "Cyan", hex: "#00A2FF", id: 1018 },
];

const SAVED_CHARACTERS_KEY = 'rbx_saved_custom_characters';
const ACTIVE_AVATAR_KEY = 'rbx_active_custom_avatar';

export function getSavedCharacters() {
  try {
    const raw = localStorage.getItem(SAVED_CHARACTERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveCharacter(character) {
  const characters = getSavedCharacters();
  const index = characters.findIndex((c) => c.id === character.id);
  if (index >= 0) {
    characters[index] = { ...character, updatedAt: Date.now() };
  } else {
    characters.unshift({
      ...character,
      id: character.id || `char_${Date.now()}`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  }
  localStorage.setItem(SAVED_CHARACTERS_KEY, JSON.stringify(characters));
  return characters;
}

export function deleteCharacter(charId) {
  const characters = getSavedCharacters().filter((c) => c.id !== charId);
  localStorage.setItem(SAVED_CHARACTERS_KEY, JSON.stringify(characters));
  return characters;
}

/**
 * Returns active avatar. Does NOT automatically force builderman.
 * Starts with a clean custom Roblox character template unless user saved one.
 */
export function getActiveAvatar() {
  try {
    const raw = localStorage.getItem(ACTIVE_AVATAR_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // fallback
  }

  return {
    name: "My Custom Robloxian",
    baseUser: null, // Clean default base
    playerAvatarType: "R15",
    poseType: "action", // 'action' (with pose) or 'straight' (no pose)
    bodyColors: {
      head: "#F5CD30",
      torso: "#0055BF",
      leftArm: "#F5CD30",
      rightArm: "#F5CD30",
      leftLeg: "#28A745",
      rightLeg: "#28A745",
    },
    scales: {
      height: 1.0,
      width: 1.0,
      head: 1.0,
      proportion: 0.0,
    },
    equippedItems: [
      {
        id: 1080951,
        name: "Builders Club Hard Hat",
        category: "hats",
        price: 0,
        imageUrl: "https://tr.rbxcdn.com/180DAY-2b16c733ccb551b1e5b300a86e6d0a27/420/420/Hat/Png/noFilter",
      },
    ],
  };
}

export function setActiveAvatar(avatar) {
  try {
    localStorage.setItem(ACTIVE_AVATAR_KEY, JSON.stringify(avatar));
  } catch {
    // ignore
  }
}

/**
 * Dynamically looks up any Roblox Catalog item by its ID and fetches a real valid thumbnail.
 */
export async function lookupCatalogItem(assetId) {
  const id = Number(assetId);
  if (!id || isNaN(id)) {
    throw new Error('Please enter a valid numeric Item ID.');
  }

  // 1. Check curated catalog
  const found = CURATED_CATALOG.find((item) => item.id === id);
  if (found && found.imageUrl) return found;

  // 2. Fetch thumbnail from Roblox thumbnails API
  let imageUrl = '';
  try {
    const thumbs = await fetchRobloxJson(
      `https://thumbnails.roblox.com/v1/assets?assetIds=${id}&size=420x420&format=Png`
    );
    if (thumbs?.data?.[0]?.imageUrl) {
      imageUrl = thumbs.data[0].imageUrl;
    }
  } catch {
    // continue
  }

  // 3. Fetch item metadata
  let name = `Roblox Item #${id}`;
  let creator = 'Roblox';
  let price = 0;
  let category = 'accessories';

  try {
    const details = await fetchRobloxJson(
      `https://economy.roblox.com/v2/assets/${id}/details`
    );
    if (details) {
      if (details.Name) name = details.Name;
      if (details.Creator?.Name) creator = details.Creator.Name;
      if (details.PriceInRobux) price = details.PriceInRobux;

      const typeId = details.AssetTypeId;
      if (typeId === 8 || typeId === 41 || typeId === 42) category = 'hats';
      else if (typeId === 20 || typeId === 48) category = 'hair';
      else if (typeId === 18) category = 'faces';
      else if (typeId === 11 || typeId === 2) category = 'shirts';
      else if (typeId === 12) category = 'pants';
      else if (typeId === 45 || typeId === 46 || typeId === 47) category = 'accessories';
    }
  } catch {
    // Fallback item info
  }

  return {
    id,
    name,
    category,
    price,
    creator,
    imageUrl: imageUrl || `https://tr.rbxcdn.com/180DAY-2b16c733ccb551b1e5b300a86e6d0a27/420/420/Hat/Png/noFilter`,
  };
}
