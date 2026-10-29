import axios from "axios";

// NEXT_PUBLIC_* values are inlined by Next.js at build/start time, so changing
// this requires restarting `next dev` (or rebuilding on Vercel).
const baseURL =
  process.env.NEXT_PUBLIC_API_URL ||
  (process.env.NODE_ENV === "development" ? "http://localhost:8000" : undefined);

export const goApi = axios.create({
  baseURL,
});

let token: string | null = null;
let expiresAt = 0;

async function getGoToken() {
  const now = Date.now();

  if (token && now < expiresAt) {
    return token;
  }

  const { data } = await axios.get("/api/auth/go-token");

  token = data.token;
  expiresAt = now + 14 * 60 * 1000;

  return token;
}

goApi.interceptors.request.use(async (config) => {
  config.headers.Authorization = `Bearer ${await getGoToken()}`;
  return config;
});