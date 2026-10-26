/**
 * Roblox API client in pure JavaScript with multi-proxy fallback,
 * full pagination for outfits, asset price/year caching, and cross-player ownership checks.
 */

const PUBLIC_PROXIES = [
  (url) => `/api/roblox-proxy?url=${encodeURIComponent(url)}`,
  (url) => `https://corsproxy.io/?url=${encodeURIComponent(url)}`,
  (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  (url) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
];

export async function fetchRobloxJson(targetUrl, options = {}) {
  let lastError = null;

  for (const getProxyUrl of PUBLIC_PROXIES) {
    try {
      const proxyUrl = getProxyUrl(targetUrl);
      const isPost = options.method === 'POST';
      const headers = {
        Accept: 'application/json, text/plain, */*',
        ...(isPost ? { 'Content-Type': 'application/json' } : {}),
        ...options.headers,
      };

      const res = await fetch(proxyUrl, {
        method: options.method || 'GET',
        headers,
        ...(options.body ? { body: options.body } : {}),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const text = await res.text();
      try {
        return JSON.parse(text);
      } catch {
        throw new Error('Response was not valid JSON');
      }
    } catch (err) {
      lastError = err;
    }
  }

  throw new Error(`Failed to contact Roblox API: ${lastError?.message || 'Network error'}`);
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

/**
 * Resolves user query (User ID or Username) to a Roblox user object.
 */
export async function searchRobloxUser(query) {
  const trimmed = query.trim();
  if (!trimmed) {
    throw new Error('Please enter a username or user ID.');
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

/**
 * Checks if a specific player Wears or Owns a given asset or avatar outfit.
 * Returns: { status: 'wears' | 'owns' | 'none', outfitName?: string, user: Object }
 */
export async function checkPlayerOwnership(userQuery, targetAssetId, targetOutfitId = null) {
  try {
    const user = await searchRobloxUser(userQuery);
    if (!user) return null;

    // 1. Check if they are CURRENTLY WEARING IT
    const active = await fetchCurrentWearingAvatar(user.id);
    const isWearing = (active.assets || []).some(
      (a) => String(a.id) === String(targetAssetId)
    );

    if (isWearing) {
      return {
        status: 'wears',
        label: 'Currently Wearing',
        user,
        avatarUrl: active.imageUrl || user.avatarFullUrl,
        itemsCount: active.assets.length,
      };
    }

    // 2. Check if they OWN IT in any of their saved outfits
    const userOutfits = await fetchUserOutfits(user.id);
    if (targetOutfitId && userOutfits.some((o) => String(o.id) === String(targetOutfitId))) {
      const matchOutfit = userOutfits.find((o) => String(o.id) === String(targetOutfitId));
      return {
        status: 'owns',
        label: `Saved Outfit: ${matchOutfit.name}`,
        user,
        avatarUrl: matchOutfit.imageUrl || user.avatarFullUrl,
        outfitName: matchOutfit.name,
      };
    }

    // Check inventory for the item directly
    try {
      const invUrl = `https://inventory.roblox.com/v1/users/${user.id}/items/Asset/${targetAssetId}`;
      const invRes = await fetchRobloxJson(invUrl);
      if (invRes?.data && invRes.data.length > 0) {
        return {
          status: 'owns',
          label: 'In Player Inventory',
          user,
          avatarUrl: user.avatarFullUrl,
        };
      }
    } catch {
      // Inventory might be private
    }

    return {
      status: 'none',
      label: 'Does not have this item',
      user,
      avatarUrl: user.avatarFullUrl,
    };
  } catch (err) {
    console.warn(`Error checking player ownership for ${userQuery}:`, err);
    return null;
  }
}
