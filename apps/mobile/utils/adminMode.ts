import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "mathdle:admin_mode";

export async function getAdminMode(): Promise<boolean> {
  const v = await AsyncStorage.getItem(KEY);
  return v === "1";
}

export async function setAdminMode(on: boolean): Promise<void> {
  await AsyncStorage.setItem(KEY, on ? "1" : "0");
}
