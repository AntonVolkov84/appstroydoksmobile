import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_URL = "https://api.stroydoks.ru/mobile";

const api = axios.create({
  baseURL: API_URL,
});

const refreshAccessToken = async (): Promise<string | null> => {
  const refreshToken = await AsyncStorage.getItem("refreshToken");
  if (!refreshToken) return null;

  try {
    const res = await axios.post(`${API_URL}/refresh-token`, { token: refreshToken });
    const newAccessToken = res.data.accessToken;
    await AsyncStorage.setItem("accessToken", newAccessToken);
    return newAccessToken;
  } catch (err) {
    console.error("Failed to refresh token:", err);
    return null;
  }
};

export const authRequest = async (makeRequest: (token: string) => Promise<any>) => {
  let accessToken = await AsyncStorage.getItem("accessToken");
  if (!accessToken) throw new Error("No access token");

  try {
    return await makeRequest(accessToken);
  } catch (err: any) {
    if (err.response?.status === 403) {
      const newAccessToken = await refreshAccessToken();
      if (!newAccessToken) throw new Error("Unable to refresh token");
      return await makeRequest(newAccessToken);
    }
    if (err.response?.data) {
      console.log(err.response);
      throw err.response.data;
    }
    throw err;
  }
};

export default api;
