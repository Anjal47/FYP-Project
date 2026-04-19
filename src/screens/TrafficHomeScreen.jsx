import React, { useMemo } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import Icon from "react-native-vector-icons/Feather";
import FloatingHelpChat from "../components/FloatingHelpChat";
import { useAppTheme } from "../context/ThemeContext";
import { createThemedStyles } from "../utils/themeStyles";

const ORANGE = "#FF7A1A";

const TrafficHomeScreen = ({ navigation }) => {
  const { theme, isDark } = useAppTheme();
  const styles = useMemo(
    () => StyleSheet.create(createThemedStyles(baseStyles, theme, isDark)),
    [theme, isDark]
  );
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backRow}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-left" size={20} color={theme.text} />
          <Text style={styles.title}>
            <Text style={styles.titleHighlight}> Traffic</Text>
            <Text style={styles.titleNormal}>.</Text>
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.body}>
        <Text style={styles.subtitle}>Stay safe on the road.</Text>

        <View style={styles.cardsGrid}>
          <TrafficCard
            styles={styles}
            iconColor={theme.text}
            icon="alert-octagon"
            title="Report a Violation"
            subtitle="Report unsafe driving or incidents."
            onPress={() => navigation.navigate("TrafficReport")}
          />

          <TrafficCard
            styles={styles}
            iconColor={theme.text}
            icon="book-open"
            title="View Traffic Rules"
            subtitle="Know your rights and duties."
            onPress={() => navigation.navigate("TrafficRules")}
          />

          <TrafficCard
            styles={styles}
            iconColor={theme.text}
            icon="credit-card"
            title="Pay Fine"
            subtitle="Manage and clear penalties."
            onPress={() => {
              navigation.navigate("FinePayment");
            }}
          />

          <TrafficCard
            styles={styles}
            iconColor={theme.text}
            icon="file-text"
            title="Reporting"
            subtitle="See your previous submissions."
            onPress={() => navigation.navigate("TrafficReportStatus")}
          />
        </View>
      </View>

      <FloatingHelpChat bottom={110} fabBottom={145} />
    </SafeAreaView>
  );
};

const TrafficCard = ({ icon, title, subtitle, onPress, styles, iconColor }) => (
  <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.9}>
    <View style={styles.cardIconWrap}>
      <Icon name={icon} size={20} color={iconColor} />
    </View>

    <Text style={styles.cardTitle}>{title}</Text>
    <Text style={styles.cardSubtitle}>{subtitle}</Text>

    <View style={styles.cardArrow}>
      <Icon name="arrow-right" size={16} color={ORANGE} />
    </View>
  </TouchableOpacity>
);

const baseStyles = {
  container: { flex: 1, backgroundColor: "#F4F4F4" },

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

  titleHighlight: { color: ORANGE },
  titleNormal: { color: "#111" },

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
    marginBottom: 28,
  },

  cardsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  card: {
    width: "47%",
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    paddingHorizontal: 14,
    paddingVertical: 16,
    marginBottom: 26,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },

  cardIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#FFF4E8",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },

  cardTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#111",
    marginBottom: 4,
  },

  cardSubtitle: {
    fontSize: 12,
    color: "#777",
    lineHeight: 16,
    paddingRight: 10,
  },

  cardArrow: {
    position: "absolute",
    right: 12,
    bottom: 12,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#FFF4E8",
    alignItems: "center",
    justifyContent: "center",
  },

};

export default TrafficHomeScreen;
