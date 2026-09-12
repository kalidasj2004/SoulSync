import React from "react";
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, Platform } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import { THEME } from "../utils/theme";

export default function Header({
  title,
  showBackButton = false,
  leftComponent,
  rightComponent,
  style,
  titleStyle,
}) {
  const navigation = useNavigation();
  const isBrand = title === "SoulSync AI" || title === "SoulSync";

  return (
    <SafeAreaView style={[styles.safeArea, style]}>
      <View style={styles.container}>

        {/* ── Left ── */}
        {showBackButton ? (
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
        ) : leftComponent ? (
          <View style={styles.leftAction}>{leftComponent}</View>
        ) : (
          <View style={styles.placeholder} />
        )}

        {/* ── Centre ── */}
        {isBrand ? (
          <View style={styles.brandContainer}>
            <View style={styles.brandRow}>

              {/* Gradient icon tile */}
              <LinearGradient
                colors={["#FF8A3D", "#FFD54A"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.iconTile}
              >
                <Text style={styles.iconEmoji}>🧠</Text>
              </LinearGradient>

              {/* Wordmark + tagline */}
              <View style={styles.wordmarkCol}>
                <View style={styles.wordmarkRow}>
                  <Text style={styles.wordSoul}>Soul</Text>
                  <Text style={styles.wordSync}>Sync</Text>
                  <View style={styles.aiBadge}>
                    <Text style={styles.aiBadgeText}>AI</Text>
                  </View>
                </View>
                <View style={styles.taglineRow}>
                  <View style={styles.liveDot} />
                  <Text style={styles.taglineText}>Wellness Companion</Text>
                </View>
              </View>

            </View>
          </View>
        ) : (
          <Text style={[styles.title, titleStyle]} numberOfLines={1}>
            {title}
          </Text>
        )}

        {/* ── Right ── */}
        {rightComponent ? (
          <View style={styles.rightAction}>{rightComponent}</View>
        ) : (
          <View style={styles.placeholder} />
        )}

      </View>
    </SafeAreaView>
  );
}

const WEB_FONT = Platform.OS === "web"
  ? "'Inter', 'SF Pro Display', system-ui, sans-serif"
  : "System";

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: THEME.colors.background,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,138,61,0.10)",
    shadowColor: "#FF8A3D",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
    paddingTop: Platform.OS === "android" ? 30 : 0,
  },
  container: {
    height: 64,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: THEME.sizes.md,
  },

  // Back button
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.80)",
    borderWidth: 1,
    borderColor: "rgba(255,138,61,0.18)",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#FF8A3D",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.10,
    shadowRadius: 4,
    elevation: 2,
  },
  backText: {
    color: "#FF8A3D",
    fontSize: 19,
    fontWeight: "700",
    lineHeight: 20,
  },

  // Plain screen title
  title: {
    fontSize: 17,
    fontWeight: "700",
    color: THEME.colors.textPrimary,
    textAlign: "center",
    flex: 1,
    marginHorizontal: THEME.sizes.sm,
  },

  // Brand section
  brandContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  // Icon tile
  iconTile: {
    width: 36,
    height: 36,
    borderRadius: 11,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#FF8A3D",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 5,
  },
  iconEmoji: {
    fontSize: 18,
    lineHeight: 22,
  },

  // Wordmark
  wordmarkCol: {
    alignItems: "flex-start",
  },
  wordmarkRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  wordSoul: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1E293B",
    letterSpacing: -0.4,
    fontFamily: WEB_FONT,
  },
  wordSync: {
    fontSize: 20,
    fontWeight: "800",
    color: "#FF8A3D",
    letterSpacing: -0.4,
    fontFamily: WEB_FONT,
  },

  // AI badge
  aiBadge: {
    marginLeft: 5,
    backgroundColor: "rgba(255,138,61,0.11)",
    borderWidth: 1,
    borderColor: "rgba(255,138,61,0.28)",
    borderRadius: 5,
    paddingHorizontal: 5,
    paddingVertical: 2,
    alignSelf: "center",
    marginBottom: 1,
  },
  aiBadgeText: {
    fontSize: 9,
    fontWeight: "800",
    color: "#FF8A3D",
    letterSpacing: 0.8,
  },

  // Tagline
  taglineRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
    gap: 4,
  },
  liveDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#10B981",
  },
  taglineText: {
    fontSize: 9,
    fontWeight: "600",
    color: "#94A3B8",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },

  // Slots
  leftAction: {
    minWidth: 40,
    alignItems: "flex-start",
    justifyContent: "center",
  },
  rightAction: {
    minWidth: 40,
    alignItems: "flex-end",
    justifyContent: "center",
  },
  placeholder: {
    width: 40,
  },
});
