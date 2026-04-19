import { View, Text, ImageBackground, StyleSheet } from "react-native";
import { Colors } from "../../constants/Colors";
import type { TileState } from "@mathdle/core";

interface TokenTileProps {
  display: string;
  state: TileState;
  size: number;
}

const TILE_SPRITE: Partial<Record<TileState, ReturnType<typeof require>>> = {
  present: require('../../assets/sprites/tile-present.png'),
  absent:  require('../../assets/sprites/tile-absent.png'),
};

const STATE_COLORS: Record<TileState, { bg: string; border: string; text: string }> = {
  empty:     { bg: '#0a1122',          border: '#1e2d4a',        text: Colors.gameText },
  active:    { bg: '#0f1c35',          border: '#6366f1',        text: Colors.gameText },
  correct:   { bg: Colors.tileCorrect, border: Colors.tileCorrect, text: '#fff' },
  present:   { bg: Colors.tilePresent, border: Colors.tilePresent, text: '#fff' },
  absent:    { bg: Colors.tileAbsent,  border: Colors.tileAbsent,  text: Colors.gameMuted },
  invalid:   { bg: '#0a1122',          border: Colors.error,     text: Colors.error },
  revealing: { bg: '#0f1c35',          border: '#1e2d4a',        text: Colors.gameText },
  pending:   { bg: '#0a1122',          border: '#1e2d4a',        text: Colors.gameText },
};

export function TokenTile({ display, state, size }: TokenTileProps) {
  const c = STATE_COLORS[state] ?? STATE_COLORS.empty;
  const fontSize = size > 40 ? 17 : size > 30 ? 14 : 11;
  const sprite = TILE_SPRITE[state];

  if (sprite) {
    return (
      <ImageBackground
        source={sprite}
        resizeMode="stretch"
        style={[styles.tile, { width: size, height: size }]}
      >
        <Text style={[styles.text, { fontSize, color: '#fff' }]}>{display}</Text>
      </ImageBackground>
    );
  }

  return (
    <View
      style={[
        styles.tile,
        {
          width: size,
          height: size,
          backgroundColor: c.bg,
          borderColor: c.border,
          borderWidth: state === 'active' ? 2 : 2,
        },
      ]}
    >
      <Text
        style={[
          styles.text,
          { fontSize, color: c.text },
          state === 'correct' && styles.submittedText,
        ]}
      >
        {display}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    borderRadius: 4,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 2,
    overflow: 'hidden',
  },
  text: {
    fontWeight: '700',
    fontFamily: 'DungGeunMo',
  },
  submittedText: {
    color: '#fff',
  },
});
