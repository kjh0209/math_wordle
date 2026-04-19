import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter, usePathname } from "expo-router";
import { Colors } from "../../constants/Colors";

interface AppHeaderProps {
  showBack?: boolean;
}

export function AppHeader({ showBack }: AppHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const shouldShowBack = showBack ?? pathname !== "/";

  return (
    <View style={styles.container}>
      {shouldShowBack ? (
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.backBtn} />
      )}
      <Image
        source={require("../../assets/sprites/mathle_logo.png")}
        style={styles.logo}
        resizeMode="contain"
      />
      <View style={styles.backBtn} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: Colors.gameSurface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gameBorder,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  backText: {
    fontSize: 22,
    color: Colors.gameText,
  },
  logo: {
    width: 120,
    height: 36,
  },
});
