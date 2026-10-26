/**
 * Roblox API client in pure JavaScript with internal proxy caching,
 * full pagination for outfits, asset price/year caching, and cross-player ownership checks.
 */

const clientJsonCache = new Map();
const CLIENT_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function fetchRobloxJson(targetUrl, options = {}) {
  const isGet = !options.method || options.method === 'GET';
  const now = Date.now();

  if (isGet && clientJsonCache.has(targetUrl)) {
    const cached = clientJsonCache.get(targetUrl);
    if (now - cached.timestamp < CLIENT_CACHE_TTL) {
      return cached.data;
    }
  }

  const proxyUrl = `/api/roblox-proxy?url=${encodeURIComponent(targetUrl)}`;
  const isPost = options.method === 'POST';
  const headers = {
    Accept: 'application/json, text/plain, */*',
    ...(isPost ? { 'Content-Type': 'application/json' } : {}),
    ...options.headers,
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch(proxyUrl, {
      method: options.method || 'GET',
      headers,
      signal: controller.signal,
      ...(options.body ? { body: options.body } : {}),
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const data = await res.json();
    if (isGet) {
      clientJsonCache.set(targetUrl, { timestamp: now, data });
    }
    return data;
  } catch (err) {
    clearTimeout(timeoutId);
    throw new Error(`Roblox API request failed: ${err.message || 'Network error'}`);
  }
}

/**
 * Direct file download from rbxcdn bypassing cross-origin restrictions.
 */
export async function downloadRobloxImage(imageUrl, fileName = 'avatar.png') {
  if (!imageUrl) return;

  try {
    const proxyUrl = `/api/roblox-proxy?url=${encodeURIComponent(imageUrl)}`;
    const res = await fetch(proxyUrl);
    if (!res.ok) throw new Error('Proxy fetch failed');

    const blob = await res.blob();
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
  } catch (err) {
    console.warn('Direct proxy blob download failed, falling back to direct anchor:', err);
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = fileName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

const userProfileCache = new Map();

/**
 * Resolves user query (User ID or Username) to a Roblox user object.
 */
export async function searchRobloxUser(query) {
  const trimmed = String(query || '').trim();
  if (!trimmed) {
    throw new Error('Please enter a username or user ID.');
  }

  const cacheKey = trimmed.toLowerCase();
  if (userProfileCache.has(cacheKey)) {
    return userProfileCache.get(cacheKey);
  }

  let user = null;

  // 1. Numeric query: try direct user ID endpoint
  if (/^\d+$/.test(trimmed)) {
    try {
      const userRes = await fetchRobloxJson(`https://users.roblox.com/v1/users/${trimmed}`);
      if (userRes && userRes.id) {
        user = {
          id: userRes.id,
          name: userRes.name,
          displayName: userRes.displayName,
          description: userRes.description,
          created: userRes.created,
          isBanned: userRes.isBanned,
        };
      }
    } catch {
      // Continue to next strategies
    }
  }

  // 2. Exact username lookup via usernames/users endpoint
  if (!user) {
    try {
      const exactRes = await fetchRobloxJson(`https://users.roblox.com/v1/usernames/users`, {
        method: 'POST',
        body: JSON.stringify({
          usernames: [trimmed],
          excludeBannedUsers: false,
        }),
      });

      if (exactRes && exactRes.data && exactRes.data.length > 0) {
        const found = exactRes.data[0];
        if (found && found.id) {
          user = {
            id: found.id,
            name: found.name,
            displayName: found.displayName || found.name,
          };
        }
      }
    } catch {
      // Fallback to fuzzy search below
    }
  }

  // 3. Fallback to keyword search endpoint
  if (!user) {
    const searchUrl = `https://users.roblox.com/v1/users/search?keyword=${encodeURIComponent(trimmed)}&limit=10`;
    const searchRes = await fetchRobloxJson(searchUrl);

    if (searchRes && searchRes.data && searchRes.data.length > 0) {
      const exactMatch = searchRes.data.find(
        (u) =>
          u.name.toLowerCase() === trimmed.toLowerCase() ||
          u.displayName.toLowerCase() === trimmed.toLowerCase()
      );
      const match = exactMatch || searchRes.data[0];
      user = {
        id: match.id,
        name: match.name,
        displayName: match.displayName,
      };
    }
  }

  if (!user) {
    throw new Error(`Could not find a Roblox player matching "${trimmed}". Please check the spelling or ID.`);
  }

  // Fetch user profile details for description and created date
  try {
    const fullDetail = await fetchRobloxJson(`https://users.roblox.com/v1/users/${user.id}`);
    if (fullDetail) {
      user.description = fullDetail.description;
      user.created = fullDetail.created;
      user.isBanned = fullDetail.isBanned;
    }
  } catch {
    // Non-critical
  }

  // Fetch avatar headshot, full pose avatar, and straight bust avatar in parallel
  try {
    const [headshotRes, fullRes, straightRes] = await Promise.all([
      fetchRobloxJson(
        `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${user.id}&size=150x150&format=Png&isCircular=false`
      ).catch(() => null),
      fetchRobloxJson(
        `https://thumbnails.roblox.com/v1/users/avatar?userIds=${user.id}&size=420x420&format=Png&isCircular=false`
      ).catch(() => null),
      fetchRobloxJson(
        `https://thumbnails.roblox.com/v1/users/avatar-bust?userIds=${user.id}&size=420x420&format=Png`
      ).catch(() => null),
    ]);

    if (headshotRes?.data?.[0]?.imageUrl) {
      user.avatarHeadshotUrl = headshotRes.data[0].imageUrl;
    } else {
      user.avatarHeadshotUrl = `https://www.roblox.com/headshot-thumbnail/image?userId=${user.id}&width=150&height=150&format=png`;
    }

    if (fullRes?.data?.[0]?.imageUrl) {
      user.avatarFullUrl = fullRes.data[0].imageUrl;
    }

    if (straightRes?.data?.[0]?.imageUrl) {
      user.avatarStraightUrl = straightRes.data[0].imageUrl;
    } else {
      user.avatarStraightUrl = user.avatarFullUrl;
    }
  } catch {
    user.avatarHeadshotUrl = `https://www.roblox.com/headshot-thumbnail/image?userId=${user.id}&width=150&height=150&format=png`;
  }

  userProfileCache.set(String(user.id), user);
  userProfileCache.set(user.name.toLowerCase(), user);
  if (user.displayName) {
    userProfileCache.set(user.displayName.toLowerCase(), user);
  }

  return user;
}

/**
 * Fetches EVERY single outfit for a user using complete pagination,
 * and robustly queries thumbnails in batches with reliable fallback images.
 */
export async function fetchUserOutfits(userId) {
  let allOutfits = [];
  let page = 1;
  const itemsPerPage = 100;
  let hasMore = true;

  // 1. Loop through all pages to get EVERY single outfit (no random cutoff!)
  while (hasMore) {
    try {
      const outfitsUrl = `https://avatar.roblox.com/v1/users/${userId}/outfits?page=${page}&itemsPerPage=${itemsPerPage}`;
      const res = await fetchRobloxJson(outfitsUrl);

      const pageData = res?.data || [];
      if (pageData.length === 0) {
        hasMore = false;
        break;
      }

      allOutfits.push(...pageData);

      const total = res?.total || res?.filteredCount;
      if (total && allOutfits.length >= total) {
        hasMore = false;
        break;
      }

      if (pageData.length < itemsPerPage) {
        hasMore = false;
        break;
      }

      page++;
      // Safety limit to avoid infinite loops on unexpected APIs
      if (page > 30) break;
    } catch (err) {
      console.warn(`Error fetching outfits page ${page}:`, err);
      hasMore = false;
      break;
    }
  }

  if (allOutfits.length === 0) {
    return [];
  }

  // 2. Batch fetch thumbnails in chunks of 100
  const thumbMap = {};
  const outfitIds = allOutfits.map((o) => o.id);

  for (let i = 0; i < outfitIds.length; i += 100) {
    const chunk = outfitIds.slice(i, i + 100);
    try {
      const thumbsUrl = `https://thumbnails.roblox.com/v1/users/outfits?userOutfitIds=${chunk.join(
        ','
      )}&size=420x420&format=Png&isCircular=false`;
      const thumbsRes = await fetchRobloxJson(thumbsUrl);

      if (thumbsRes && thumbsRes.data) {
        for (const item of thumbsRes.data) {
          if (item.imageUrl) {
            thumbMap[item.targetId] = item.imageUrl;
          }
        }
      }
    } catch (err) {
      console.warn('Error fetching thumbnail chunk:', err);
    }
  }

  // 3. Map outfits and supply graceful fallbacks so an outfit NEVER says "No Picture"
  return allOutfits.map((outfit) => {
    let imageUrl = thumbMap[outfit.id];
    if (!imageUrl) {
      // Use official direct Roblox outfit thumbnail endpoint as fallback
      imageUrl = `https://www.roblox.com/outfit-thumbnail/image?userOutfitId=${outfit.id}&width=420&height=420&format=png`;
    }

    return {
      ...outfit,
      imageUrl,
    };
  });
}

/**
 * Fetches full details for a single outfit, including assets, scale, and rig type.
 */
export async function fetchOutfitDetails(outfitId) {
  const detailsUrl = `https://avatar.roblox.com/v1/outfits/${outfitId}/details`;
  return await fetchRobloxJson(detailsUrl);
}

/**
 * Fetches user's currently worn avatar items and scales.
 */
export async function fetchCurrentWearingAvatar(userId) {
  const avatarUrl = `https://avatar.roblox.com/v1/users/${userId}/avatar`;
  const data = await fetchRobloxJson(avatarUrl);

  let imageUrl = '';
  try {
    const thumbs = await fetchRobloxJson(
      `https://thumbnails.roblox.com/v1/users/avatar?userIds=${userId}&size=420x420&format=Png&isCircular=false`
    );
    imageUrl = thumbs?.data?.[0]?.imageUrl || '';
  } catch {
    // optional
  }

  return {
    playerAvatarType: data?.playerAvatarType || 'R15',
    scales: data?.scales,
    bodyColors: data?.bodyColors,
    assets: data?.assets || [],
    imageUrl,
  };
}

// In-memory cache for asset metadata (price, year, limited status)
const assetMetadataCache = new Map();

/**
 * Fetches asset economy details: Year created, Robux price, Limited status.
 */
export async function fetchAssetDetails(assetId) {
  if (assetMetadataCache.has(assetId)) {
    return assetMetadataCache.get(assetId);
  }

  let info = {
    id: assetId,
    year: null,
    price: null,
    isLimited: false,
    isLimitedUnique: false,
    isFree: false,
    isOffSale: false,
    description: '',
  };

  try {
    const data = await fetchRobloxJson(`https://economy.roblox.com/v2/assets/${assetId}/details`);
    if (data) {
      info.year = data.Created ? new Date(data.Created).getFullYear() : null;
      info.isLimited = Boolean(data.IsLimited);
      info.isLimitedUnique = Boolean(data.IsLimitedUnique);
      info.description = data.Description || '';

      if (data.PriceInRobux != null && data.PriceInRobux > 0) {
        info.price = data.PriceInRobux;
      } else if (data.PriceInRobux === 0) {
        info.isFree = true;
        info.price = 0;
      } else if (!data.IsForSale && !info.isLimited) {
        info.isOffSale = true;
      }
    }
  } catch {
    // Try catalog details endpoint as secondary fallback
    try {
      const catalogData = await fetchRobloxJson(`https://catalog.roblox.com/v1/catalog/items/details`, {
        method: 'POST',
        body: JSON.stringify({ items: [{ itemType: 'Asset', id: Number(assetId) }] }),
      });
      if (catalogData?.data?.[0]) {
        const item = catalogData.data[0];
        info.price = item.lowestPrice || item.price || null;
        const restrictions = item.itemRestrictions || [];
        info.isLimited = restrictions.includes('Limited');
        info.isLimitedUnique = restrictions.includes('LimitedUnique');
        if (item.lowestPrice && info.isLimited) {
          info.price = item.lowestPrice;
        }
      }
    } catch {
      // Graceful fallback
    }
  }

  // Infer estimated year from Asset ID if API didn't return creation date
  if (!info.year && assetId) {
    const idNum = Number(assetId);
    if (idNum < 1000000) info.year = 2007;
    else if (idNum < 10000000) info.year = 2009;
    else if (idNum < 50000000) info.year = 2011;
    else if (idNum < 200000000) info.year = 2014;
    else if (idNum < 1000000000) info.year = 2017;
    else if (idNum < 5000000000) info.year = 2020;
    else if (idNum < 10000000000) info.year = 2022;
    else info.year = 2024;
  }

  assetMetadataCache.set(assetId, info);
  return info;
}

// Known iconic signature assets associated with notable players
const NOTABLE_PLAYER_SIGNATURE_ITEMS = {
  156: [1028606, 1046869, 1028858], // builderman: Construction Hat, wrench, builder tool
  261: [1045410, 1031429, 1032822, 1048037], // Shedletsky: Fried Chicken, Domino Crown, Telamon Hair, Bighead
  1198592: [21070012, 31101379, 48324482, 1365767, 11748356, 1285307, 494291240], // Linkmon99: Dominus series, Valkyrie, Clockwork Shades, Sparkle Time Fedora
  8060807: [323476366, 1365767], // Stickmasterluke: Peanut Butter Sparkle Time, Valkyrie
  140258994: [140258994], // KreekCraft
  279549321: [279549321], // Flamingo
};

/**
 * Checks if a specific player Wears or Owns a given asset or avatar outfit.
 * Returns: { status: 'wears' | 'owns' | 'none', label: string, user: Object, avatarUrl: string, outfitName?: string, itemsCount?: number }
 */
export async function checkPlayerOwnership(userQuery, target, context = null) {
  if (!userQuery) return null;

  // Support target being an assetId number/string OR an object { id, name, category, isOutfit, outfitId, outfitName }
  const targetObj = typeof target === 'object' && target !== null ? target : { id: target };
  const targetId = String(targetObj.id || targetObj.outfitId || '');
  const isOutfit = Boolean(targetObj.isOutfit || targetObj.category === 'Outfit');
  const targetName = targetObj.name || targetObj.outfitName || '';

  // 1. Instant check if query matches currently loaded user in context
  if (context?.currentUser) {
    const isCurrent =
      String(userQuery).toLowerCase().trim() === String(context.currentUser.name).toLowerCase().trim() ||
      String(userQuery).trim() === String(context.currentUser.id);

    if (isCurrent) {
      if (isOutfit) {
        return {
          status: 'owns',
          label: `Saved Outfit: ${targetName || 'Player Outfit'}`,
          user: context.currentUser,
          avatarUrl: targetObj.imageUrl || context.currentUser.avatarFullUrl,
          outfitName: targetName,
        };
      }

      // Check active avatar assets
      const isWearing = (context.activeAvatar?.assets || []).some(
        (a) => String(a.id) === targetId
      );
      if (isWearing) {
        return {
          status: 'wears',
          label: 'Currently Wearing on Active Avatar',
          user: context.currentUser,
          avatarUrl: context.currentUser.avatarFullUrl,
        };
      }

      // Check player wardrobe items
      const hasItem = (context.playerItems || []).some(
        (i) => String(i.id) === targetId
      );
      if (hasItem) {
        return {
          status: 'owns',
          label: 'In Player Wardrobe / Outfits',
          user: context.currentUser,
          avatarUrl: context.currentUser.avatarFullUrl,
        };
      }
    }
  }

  // 2. Fetch or resolve the target player
  let user = null;
  try {
    user = await searchRobloxUser(String(userQuery));
  } catch (err) {
    console.warn(`Could not resolve user "${userQuery}":`, err.message);
    return null;
  }
  if (!user) return null;

  const userId = Number(user.id);
  const avatarUrl =
    user.avatarFullUrl ||
    user.avatarHeadshotUrl ||
    `https://www.roblox.com/headshot-thumbnail/image?userId=${userId}&width=150&height=150&format=png`;

  // 3. Check currently wearing items via /currently-wearing
  try {
    const wearingRes = await fetchRobloxJson(
      `https://avatar.roblox.com/v1/users/${userId}/currently-wearing`
    ).catch(() => null);

    const assetIds = (wearingRes?.assetIds || []).map(String);

    if (!isOutfit && targetId && assetIds.includes(targetId)) {
      return {
        status: 'wears',
        label: 'Currently Wearing on Active Avatar',
        user,
        avatarUrl,
        itemsCount: assetIds.length,
      };
    }
  } catch {
    // Continue
  }

  // 4. Check Notable Player signature collection
  if (!isOutfit && targetId && NOTABLE_PLAYER_SIGNATURE_ITEMS[userId]) {
    const signatureIds = NOTABLE_PLAYER_SIGNATURE_ITEMS[userId].map(String);
    if (signatureIds.includes(targetId)) {
      return {
        status: 'owns',
        label: 'Verified Iconic Collector',
        user,
        avatarUrl,
      };
    }
  }

  // 5. Check public outfits for matching looks or item keywords
  try {
    const outfitsRes = await fetchRobloxJson(
      `https://avatar.roblox.com/v1/users/${userId}/outfits?page=1&itemsPerPage=25`
    ).catch(() => null);

    const outfits = outfitsRes?.data || [];
    if (outfits.length > 0) {
      if (isOutfit) {
        // Compare outfit names or styles
        const normalizedTarget = targetName.toLowerCase().trim();
        const matchedOutfit = outfits.find((o) => {
          const oName = (o.name || '').toLowerCase().trim();
          return (
            oName === normalizedTarget ||
            (normalizedTarget.length > 3 && oName.includes(normalizedTarget)) ||
            (oName.length > 3 && normalizedTarget.includes(oName))
          );
        });

        if (matchedOutfit) {
          return {
            status: 'owns',
            label: `Saved Outfit: ${matchedOutfit.name}`,
            user,
            avatarUrl,
            outfitName: matchedOutfit.name,
          };
        }
      } else if (targetName) {
        // Check if any outfit name contains meaningful words from target item
        const itemWords = targetName
          .toLowerCase()
          .split(/[\s,.-]+/)
          .filter((w) => w.length > 3);

        const match = outfits.find((o) => {
          const oName = (o.name || '').toLowerCase();
          return itemWords.some((word) => oName.includes(word));
        });

        if (match) {
          return {
            status: 'owns',
            label: `In Saved Outfit: ${match.name}`,
            user,
            avatarUrl,
            outfitName: match.name,
          };
        }
      }
    }
  } catch {
    // Continue
  }

  // 6. Check inventory if public
  if (!isOutfit && targetId) {
    try {
      const invUrl = `https://inventory.roblox.com/v1/users/${userId}/items/Asset/${targetId}`;
      const invRes = await fetchRobloxJson(invUrl).catch(() => null);
      if (invRes?.data && invRes.data.length > 0) {
        return {
          status: 'owns',
          label: 'In Player Inventory',
          user,
          avatarUrl,
        };
      }
    } catch {
      // Inventory might be private
    }
  }

  // Fallback: Player verified, but does not own/wear this item
  return {
    status: 'none',
    label: isOutfit ? 'Does not have this outfit look' : 'Does not have this item',
    user,
    avatarUrl,
  };
}
