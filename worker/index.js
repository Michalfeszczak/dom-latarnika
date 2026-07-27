import { handleFacebookPosts, json } from "./fb-posts.js";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/fb-posts") {
      if (request.method === "OPTIONS") {
        return new Response(null, {
          status: 204,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type"
          }
        });
      }

      if (request.method !== "GET") {
        return json({ error: "Method not allowed" }, 405, 0, {
          "Allow": "GET, OPTIONS"
        });
      }

      return handleFacebookPosts(request, env);
    }

    return env.ASSETS.fetch(request);
  }
};
