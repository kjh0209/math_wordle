import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { Colors } from "../../constants/Colors";

interface LoadingStateProps {
  message?: string;
}

export function LoadingState({ message = "불러오는 중..." }: LoadingStateProps) {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={Colors.brand} />
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    backgroundColor: Colors.gameBg,
  },
  message: {
    fontSize: 14,
    color: Colors.gameTextMuted,
  },
});
