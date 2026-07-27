import { handleFacebookPosts } from "../../worker/fb-posts.js";

/**
 * Cloudflare Pages Function compatibility wrapper for /api/fb-posts.
 * The active Workers deploy uses worker/index.js, but keeping this file
 * allows the same endpoint to work if the project is switched back to Pages.
 */
export async function onRequestGet({ request, env }) {
  return handleFacebookPosts(request, env);
}
