import { client as api } from "./api"
import * as SecureStore from "expo-secure-store"

const TOKEN_KEY = "essay_ai_token"

export const saveToken = async (token: string) => {
  await SecureStore.setItemAsync(TOKEN_KEY, token)
}

export const getToken = async () => {
  return await SecureStore.getItemAsync(TOKEN_KEY)
}

export const removeToken = async () => {
  await SecureStore.deleteItemAsync(TOKEN_KEY)
}

export const authApi = {
  login: async (email: string, password: string) => {
    const res = await api.post("/auth/login", { email, password })
    return res.data.data
  },
  register: async (name: string, email: string, password: string) => {
    const res = await api.post("/auth/register", { name, email, password })
    return res.data.data
  },
  getProfile: async () => {
    const res = await api.get("/auth/me")
    return res.data.data
  }
}
