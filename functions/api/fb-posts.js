/**
 * Cloudflare Pages Function — /api/fb-posts
 * ------------------------------------------------------------------
 * Zwraca najnowsze posty ze Strony Facebooka jako JSON, żeby strona
 * mogła je pokazać jako własne kafelki (bez wtyczki FB i bez ciasteczek
 * third-party u gościa).
 *
 * Token jest SEKRETEM — trzymamy go w zmiennych środowiskowych
 * Cloudflare Pages, NIGDY w kodzie strony. Ustaw w panelu Cloudflare:
 *   Settings → Environment variables (Production i Preview):
 *     FB_PAGE_ID     – numeryczne ID Strony (np. 1181172...), albo vanity „DomLatarnika”
 *     FB_PAGE_TOKEN  – długoterminowy token Strony (Page Access Token)
 *   Opcjonalnie:
 *     FB_EDGE        – "posts" (domyślnie) lub "feed" / "published_posts"
 *     FB_LIMIT       – ile postów (domyślnie 6)
 *
 * Jak zdobyć ID i token — patrz FACEBOOK-SETUP.md.
 */

const GRAPH_VERSION = "v21.0";
const CACHE_SECONDS = 1800; // 30 min — odświeża się rzadko, nie męczymy API

export async function onRequestGet({ request, env }) {
  const pageId = env.FB_PAGE_ID;
  const token = env.FB_PAGE_TOKEN;
  const edge = env.FB_EDGE || "posts";
  const limit = Number(env.FB_LIMIT || 6);

  // Brak konfiguracji → 200 z pustą listą, żeby strona spokojnie pokazała fallback.
  if (!pageId || !token) {
    return json({ configured: false, posts: [] }, 200, 60);
  }

  // Cache na krawędzi Cloudflare — szybko i bez nadużywania Graph API.
  const cache = caches.default;
  const cacheKey = new Request(new URL("/api/fb-posts", request.url).toString(), request);
  const cached = await cache.match(cacheKey);
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
      .map((p) => ({
        id: p.id,
        text: p.message || p.story || "",
        date: p.created_time || "",
        image: p.full_picture || "",
        url: p.permalink_url || `https://www.facebook.com/${pageId}`
      }))
      // pokaż tylko wpisy, które mają zdjęcie lub tekst
      .filter((p) => p.image || p.text)
      .slice(0, limit);

    const response = json({ configured: true, posts }, 200, CACHE_SECONDS);
    // zapisz w cache krawędziowym
    const toCache = response.clone();
    await cache.put(cacheKey, toCache);
    return response;
  } catch (err) {
    return json({ configured: true, posts: [], error: String(err) }, 200, 60);
  }
}

function json(obj, status = 200, maxAge = 60) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": `public, max-age=${maxAge}, s-maxage=${maxAge}`,
      "Access-Control-Allow-Origin": "*"
    }
  });
}
