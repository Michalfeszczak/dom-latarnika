const GRAPH_VERSION = "v21.0";
const CACHE_SECONDS = 1800;

export async function handleFacebookPosts(request, env) {
  const pageId = env.FB_PAGE_ID;
  const token = env.FB_PAGE_TOKEN;
  const edge = env.FB_EDGE || "posts";
  const rawLimit = Number(env.FB_LIMIT || 6);
  const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(rawLimit, 1), 12) : 6;

  if (!pageId || !token) {
    return json({ configured: false, posts: [] }, 200, 60);
  }

  const cache = typeof caches !== "undefined" ? caches.default : null;
  const cacheKey = new Request(new URL("/api/fb-posts", request.url).toString(), request);
  const cached = cache ? await cache.match(cacheKey) : null;
  if (cached) return cached;

  const fields = "message,story,created_time,full_picture,permalink_url";
  const api = `https://graph.facebook.com/${GRAPH_VERSION}/${encodeURIComponent(pageId)}/${edge}` +
    `?fields=${fields}&limit=${limit}&access_token=${encodeURIComponent(token)}`;

  try {
    const res = await fetch(api, { headers: { "Accept": "application/json" } });
    const data = await res.json();

    if (!res.ok || data.error) {
      const message = data.error ? data.error.message : `HTTP ${res.status}`;
      return json({ configured: true, posts: [], error: message }, 200, 60);
    }

    const posts = (data.data || [])
      .map((post) => ({
        id: post.id,
        text: post.message || post.story || "",
        date: post.created_time || "",
        image: post.full_picture || "",
        url: post.permalink_url || `https://www.facebook.com/${pageId}`
      }))
      .filter((post) => post.image || post.text)
      .slice(0, limit);

    const response = json({ configured: true, posts }, 200, CACHE_SECONDS);
    if (cache) await cache.put(cacheKey, response.clone());
    return response;
  } catch (error) {
    return json({ configured: true, posts: [], error: String(error) }, 200, 60);
  }
}

export function json(body, status = 200, maxAge = 60, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": `public, max-age=${maxAge}, s-maxage=${maxAge}`,
      "Access-Control-Allow-Origin": "*",
      ...extraHeaders
    }
  });
}
