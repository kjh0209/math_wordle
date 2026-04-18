import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter, usePathname } from "expo-router";
import { Colors } from "../../constants/Colors";

interface AppHeaderProps {
  title?: string;
  showBack?: boolean;
}

export function AppHeader({ title = "Mathdle", showBack }: AppHeaderProps) {
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
      <Text style={styles.title}>{title}</Text>
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
    paddingVertical: 12,
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
  title: {
    fontSize: 20,
    fontWeight: "800",
    color: Colors.gameText,
    letterSpacing: 2,
  },
});
