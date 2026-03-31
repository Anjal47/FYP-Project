import AsyncStorage from "@react-native-async-storage/async-storage";

const API = "http://10.0.2.2:5000/api";

const api = async (url, method = "GET", body = null) => {
  const token = await AsyncStorage.getItem("token");

  const res = await fetch(`${API}${url}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: token ? `Bearer ${token}` : "",
    },
    body: body ? JSON.stringify(body) : null,
  });

  return await res.json();
};

export default api;