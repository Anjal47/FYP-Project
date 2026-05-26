import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import Svg, { Circle, Defs, LinearGradient, Path, Rect, Stop } from "react-native-svg";
import { useAppTheme } from "../context/ThemeContext";

const DEFAULT_WORDMARK = "AngelTouch";

export default function AppLogo({
  size = 64,
  label,
  showWordmark = true,
  wordmark = DEFAULT_WORDMARK,
}) {
  const { theme, isDark } = useAppTheme();
  const styles = useMemo(
    () => StyleSheet.create(createStyles(theme, isDark, size)),
    [theme, isDark, size]
  );

  return (
    <View style={styles.container}>
      <View style={styles.markWrap}>
        <View style={styles.markGlow} />
        <Svg width={size} height={size} viewBox="0 0 72 72">
          <Defs>
            <LinearGradient id="logoGradient" x1="8" y1="6" x2="64" y2="68">
              <Stop offset="0" stopColor={theme.accentStrong} />
              <Stop offset="1" stopColor={theme.accent} />
            </LinearGradient>
          </Defs>

          <Rect x="4" y="4" width="64" height="64" rx="22" fill="url(#logoGradient)" />
          <Circle cx="54" cy="18" r="10" fill="rgba(255,255,255,0.18)" />
          <Path
            d="M36 16c-8.2 0-15 4.8-15 12.5v5.8c0 10.3 6.8 19.2 15 23.5 8.2-4.3 15-13.2 15-23.5v-5.8C51 20.8 44.2 16 36 16Z"
            stroke="#FFFFFF"
            strokeWidth="3"
            strokeLinejoin="round"
            fill="none"
          />
          <Path
            d="M27 36h6l3.2-6.6L40 43l3.2-6h5.8"
            stroke="#FFFFFF"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          <Circle cx="36" cy="29" r="2.5" fill="#FFFFFF" opacity="0.92" />
        </Svg>
      </View>

      {showWordmark ? (
        <View style={styles.copy}>
          <Text style={styles.wordmark}>{wordmark}</Text>
          {label ? <Text style={styles.label}>{label}</Text> : null}
        </View>
      ) : null}
    </View>
  );
}

function createStyles(theme, isDark, size) {
  const shellSize = size + 12;

  return {
    container: {
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
    },
    markWrap: {
      width: shellSize,
      height: shellSize,
      borderRadius: Math.round(shellSize * 0.34),
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.surfaceElevated || theme.surfaceSoft,
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
      shadowColor: "#000",
      shadowOpacity: isDark ? 0.16 : 0.08,
      shadowRadius: 14,
      shadowOffset: {
        width: 0,
        height: 8,
      },
      elevation: 3,
    },
    markGlow: {
      position: "absolute",
      width: Math.round(shellSize * 0.68),
      height: Math.round(shellSize * 0.68),
      borderRadius: 999,
      backgroundColor: theme.accentSoft,
      top: -8,
      right: -6,
    },
    copy: {
      flexShrink: 1,
    },
    wordmark: {
      color: theme.text,
      fontSize: Math.max(24, Math.round(size * 0.42)),
      fontWeight: "800",
      letterSpacing: -0.9,
    },
    label: {
      marginTop: 4,
      color: theme.accentStrong,
      fontSize: Math.max(11, Math.round(size * 0.16)),
      lineHeight: Math.max(14, Math.round(size * 0.2)),
      fontWeight: "800",
    },
  };
}
