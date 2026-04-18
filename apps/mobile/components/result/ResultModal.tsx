import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from "react-native";
import { ShareCard } from "./ShareCard";
import { Colors } from "../../constants/Colors";
import type { PuzzleViewModel, FeedbackColor, GameMode } from "@mathdle/core";

interface ResultModalProps {
  visible: boolean;
  onClose: () => void;
  puzzle: PuzzleViewModel;
  mode: GameMode;
  solved: boolean;
  attemptCount: number;
  clearTimeMs: number | null;
  rows: FeedbackColor[][];
  onShare: () => void;
  onCopyText: () => void;
  onPlayAgain: () => void;
  copied?: boolean;
}

export function ResultModal({
  visible,
  onClose,
  puzzle,
  mode,
  solved,
  attemptCount,
  clearTimeMs,
  rows,
  onShare,
  onCopyText,
  onPlayAgain,
  copied = false,
}: ResultModalProps) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <ScrollView contentContainerStyle={styles.content}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.emoji}>{solved ? "🎉" : "😔"}</Text>
              <Text style={styles.heading}>
                {solved ? "정답입니다!" : "아쉽네요..."}
              </Text>
              <Text style={styles.sub}>
                {solved
                  ? `${attemptCount}번 만에 맞혔습니다!`
                  : "다음에 다시 도전해보세요."}
              </Text>
            </View>

            {/* Share card */}
            <ShareCard
              puzzleTitle={puzzle.title}
              solved={solved}
              attemptsUsed={attemptCount}
              maxAttempts={puzzle.maxAttempts}
              clearTimeMs={clearTimeMs}
              rows={rows}
            />

            {/* Explanation */}
            {puzzle.explanation && (
              <View style={styles.explanationBox}>
                <Text style={styles.explanationLabel}>풀이</Text>
                <Text style={styles.explanationText}>{puzzle.explanation}</Text>
              </View>
            )}

            {/* Action buttons */}
            <View style={styles.actions}>
              <TouchableOpacity style={styles.shareBtn} onPress={onShare}>
                <Text style={styles.shareBtnText}>📤 공유하기</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.copyBtn} onPress={onCopyText}>
                <Text style={styles.copyBtnText}>
                  {copied ? "✓ 복사됨!" : "📋 결과 복사"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.playAgainBtn} onPress={onPlayAgain}>
                <Text style={styles.playAgainText}>🔄 다시 플레이</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>

          {/* Close */}
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: Colors.gameCard,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "85%",
    borderWidth: 1,
    borderColor: Colors.gameBorder,
  },
  content: {
    padding: 24,
    gap: 20,
    paddingBottom: 40,
  },
  closeBtn: {
    position: "absolute",
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.gameSurface,
    alignItems: "center",
    justifyContent: "center",
  },
  closeText: {
    color: Colors.gameTextMuted,
    fontSize: 16,
  },
  header: {
    alignItems: "center",
    gap: 4,
  },
  emoji: {
    fontSize: 48,
  },
  heading: {
    fontSize: 22,
    fontWeight: "800",
    color: Colors.gameText,
  },
  sub: {
    fontSize: 14,
    color: Colors.gameTextMuted,
  },
  explanationBox: {
    backgroundColor: Colors.gameSurface,
    borderRadius: 12,
    padding: 14,
    gap: 4,
  },
  explanationLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.gameMuted,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  explanationText: {
    fontSize: 14,
    color: Colors.gameText,
    lineHeight: 20,
  },
  actions: {
    gap: 10,
  },
  shareBtn: {
    backgroundColor: Colors.brand,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  shareBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  copyBtn: {
    backgroundColor: Colors.gameSurface,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.gameBorder,
  },
  copyBtnText: {
    color: Colors.gameText,
    fontSize: 15,
    fontWeight: "600",
  },
  playAgainBtn: {
    paddingVertical: 12,
    alignItems: "center",
  },
  playAgainText: {
    color: Colors.gameTextMuted,
    fontSize: 14,
    fontWeight: "500",
  },
});
