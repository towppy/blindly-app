/**
 * Secure JWT storage using expo-secure-store.
 * Use these helpers everywhere instead of AsyncStorage for the
 * user's auth token so it is stored in the device's secure enclave.
 */
import * as SecureStore from "expo-secure-store";

const JWT_KEY = "jwt";

export const setJwt = (token) => SecureStore.setItemAsync(JWT_KEY, String(token));
export const getJwt = () => SecureStore.getItemAsync(JWT_KEY);
export const deleteJwt = () => SecureStore.deleteItemAsync(JWT_KEY);
