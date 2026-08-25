import axios from "axios";

export const goApi = axios.create({
  baseURL: process.env.BASE_URL,
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
  expiresAt = now + 14 * 60 * 1000; // slightly under 15m
  return token;
}

goApi.interceptors.request.use(async (config) => {
  config.headers.Authorization = `Bearer ${await getGoToken()}`;
  return config;
});
