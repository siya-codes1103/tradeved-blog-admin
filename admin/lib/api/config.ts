/**
 * API mode: when BLOG_API_URL is set, the admin reads and writes through the office backend
 * (login required, SUPER_ADMIN only). When it is empty, the admin works on local files as before.
 */
export const API_URL = (process.env.BLOG_API_URL ?? "").replace(/\/$/, "");
export const API_MODE = API_URL !== "";

export const COOKIE_ACCESS = "tv_at";
export const COOKIE_REFRESH = "tv_rt";
export const REQUIRED_ROLE = "SUPER_ADMIN";