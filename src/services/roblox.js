/**
 * Roblox API client in pure JavaScript with multi-proxy fallback.
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
 * Fetches all saved outfits for a user with renders.
 */
export async function fetchUserOutfits(userId) {
  const outfitsUrl = `https://avatar.roblox.com/v1/users/${userId}/outfits?page=1&itemsPerPage=100`;
  const res = await fetchRobloxJson(outfitsUrl);

  const rawOutfits = res?.data || [];
  if (rawOutfits.length === 0) {
    return [];
  }

  const outfitIds = rawOutfits.map((o) => o.id);

  // Batch fetch thumbnails (up to 100 in one batch)
  const thumbMap = {};
  try {
    const thumbsUrl = `https://thumbnails.roblox.com/v1/users/outfits?userOutfitIds=${outfitIds.join(
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
    console.warn('Could not batch fetch outfit thumbnails:', err);
  }

  return rawOutfits.map((outfit) => ({
    ...outfit,
    imageUrl: thumbMap[outfit.id] || '',
  }));
}

/**
 * Fetches full details for a single outfit.
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
