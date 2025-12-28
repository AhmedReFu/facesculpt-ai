import { IPA_BASE } from "@env";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

const apiClient = axios.create({
  baseURL: IPA_BASE,
  timeout: 10000,
});

// 🔐 Attach token automatically
apiClient.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem("token");

  if (token) {
    config.headers = {
      ...config.headers as any,
      Authorization: `Bearer ${token}`,
    };
  }

  return config;
});

export default apiClient;
