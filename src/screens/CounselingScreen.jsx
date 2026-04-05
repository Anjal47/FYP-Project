import React, { useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from "react-native";
import Icon from "react-native-vector-icons/Feather"; // make sure react-native-vector-icons is installed
import FloatingHelpChat from "../components/FloatingHelpChat";
import { useAppTheme } from "../context/ThemeContext";
import { createThemedStyles } from "../utils/themeStyles";

const CounselingScreen = ({ navigation }) => {
  const { theme, isDark } = useAppTheme();
  const styles = useMemo(
    () => StyleSheet.create(createThemedStyles(baseStyles, theme, isDark)),
    [theme, isDark]
  );
  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backRow}
          onPress={() => navigation?.goBack?.()}
        >
          <Icon name="arrow-left" size={20} color={theme.text} />
          <Text style={styles.title}>
            <Text style={styles.titleHighlight}> Counseling</Text>
            <Text style={styles.titleNormal}>Therapy.</Text>
          </Text>
        </TouchableOpacity>
      </View>

      {/* BODY */}
      <View style={styles.body}>
        <Text style={styles.subtitle}>This is your safe space.</Text>

        <View style={styles.buttonsWrapper}>
          <MenuButton
            styles={styles}
            label="Visit Counselors"
            onPress={() => navigation.navigate("CounselingForm")}
            arrowColor={theme.accent}
          />

          <MenuButton
            styles={styles}
            label="Urgent Therapy"
            onPress={() => navigation.navigate("TherapyScreen")}
            arrowColor={theme.text}
          />
          <MenuButton
            styles={styles}
            label="Connect to NGOs"
            onPress={() => navigation?.navigate?.("ConnectToNGOs")}
            arrowColor={theme.text}
          />
        </View>
      </View>

      {/* ORANGE SIDE PILL */}
      <FloatingHelpChat bottom={110} fabBottom={145} />

      {/* BOTTOM TABS */}
      
    </SafeAreaView>
  );
};

const MenuButton = ({ label, onPress, arrowColor, styles }) => (
  <TouchableOpacity style={styles.menuButton} onPress={onPress}>
    <Text style={styles.menuLabel}>{label}</Text>
    <Icon name="arrow-right" size={18} color={arrowColor} />
  </TouchableOpacity>
);

const baseStyles = {
  container: {
    flex: 1,
    backgroundColor: "#F4F4F4",
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 0.5,
    borderBottomColor: "#E3E3E3",
  },
  backRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
  },
  titleHighlight: {
    color: "#FF7A1A",
  },
  titleNormal: {
    color: "#111",
  },
  body: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111",
    textAlign: "center",
    marginBottom: 32,
  },
  buttonsWrapper: {
    gap: 20,
  },
  menuButton: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  menuLabel: {
    fontSize: 16,
    color: "#222",
  },
  bottomBar: {
    position: "absolute",
    bottom: 24,
    alignSelf: "center",
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    paddingHorizontal: 32,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "space-between",
    width: 220,
    elevation: 6,
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  tabItem: {
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
};

export default CounselingScreen;
