// HomeScreen.jsx
import React from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ScrollView,
} from "react-native";
import Icon from "react-native-vector-icons/Feather"; // make sure this package is installed

const PRIMARY = "#ff7a00"; // main orange
const BG = "#f5f5f7";
const CARD = "#ffffff";
const TEXT_DARK = "#222";

const HomeScreen = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={BG} />

      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.logoRow}>
          <Icon
            name="heart"
            size={24}
            color={PRIMARY}
            style={styles.logoIcon}
          />
          <Text style={styles.logoMain}>Angel</Text>
          <Text style={styles.logoAccent}>Touch.</Text>
        </View>

        <View style={styles.subtitleRow}>
          <Icon name="smile" size={14} color="#999" style={{ marginRight: 4 }} />
          <Text style={styles.subTitle}>You are not alone.</Text>
        </View>

        <View style={styles.headerChipsRow}>
          <View style={styles.chip}>
            <Icon name="shield" size={14} color={PRIMARY} />
            <Text style={styles.chipText}>Safe Space</Text>
          </View>
          <View style={styles.chip}>
            <Icon name="clock" size={14} color={PRIMARY} />
            <Text style={styles.chipText}>24/7 Support</Text>
          </View>
        </View>
      </View>

      {/* MAIN CONTENT */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Section title with icon */}
        <View style={styles.sectionHeaderRow}>
          <Icon
            name="zap"
            size={18}
            color={PRIMARY}
            style={styles.sectionTitleIcon}
          />
          <Text style={styles.sectionTitle}>Quick Actions</Text>
        </View>

        {/* Grid actions */}
        <View style={styles.gridRow}>
          <FeatureCard
            icon="clipboard"
            label="Reporting"
            description="File a report quickly & safely."
            onPress={() => navigation && navigation.navigate("Reporting")}
          />
          <FeatureCard
            icon="headphones"
            label="Counseling & Therapy"
            description="Talk to a professional."
            onPress={() => navigation && navigation.navigate("Counseling")}
          />
        </View>

        <View style={styles.gridRow}>
          <FeatureCard
            icon="navigation-2"
            label="Traffic"
            description="Safe route & traffic alerts."
            onPress={() => navigation && navigation.navigate("Traffic")}
          />
          <FeatureCard
            icon="life-buoy"
            label="Support"
            description="Get help & resources."
            onPress={() => navigation && navigation.navigate("Support")}
          />
        </View>

        {/* SOS AREA */}
        <View style={styles.sosWrapper}>
          <View style={styles.sosShadow} />

          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.sosButton}
            onPress={() => {
              // handle SOS press here
            }}
          >
            <View style={styles.sosInnerGlow} />

            <View style={styles.sosIconCircle}>
              <Icon name="alert-triangle" size={34} color="#ffffff" />
            </View>

            <Text style={styles.sosText}>SOS</Text>

            <View style={styles.sosHintRow}>
              <Icon
                name="info"
                size={13}
                color="#ffe8d0"
                style={{ marginRight: 4 }}
              />
              <Text style={styles.sosHint}>Tap & hold for 3 seconds</Text>
            </View>
          </TouchableOpacity>

          {/* Side tab / quick slide button */}
          <View style={styles.sideTab}>
            <Icon name="phone-call" size={20} color="#fff" />
          </View>
        </View>
      </ScrollView>

      {/* BOTTOM NAV */}
      <View style={styles.bottomBar}>
        <NavItem
          icon="settings"
          label="Settings"
          active={false}
          onPress={() => navigation && navigation.navigate("Settings")}
        />
        <NavItem icon="home" label="Home" active onPress={() => {}} />
        <NavItem
          icon="user"
          label="Profile"
          active={false}
          onPress={() => navigation && navigation.navigate("Profile")}
        />
      </View>
    </SafeAreaView>
  );
};

const FeatureCard = ({ icon, label, description, onPress }) => (
  <TouchableOpacity activeOpacity={0.9} style={styles.card} onPress={onPress}>
    <View style={styles.cardIconWrap}>
      <Icon name={icon} size={26} color={PRIMARY} />
    </View>
    <Text style={styles.cardText}>{label}</Text>
    <Text style={styles.cardDesc}>{description}</Text>
  </TouchableOpacity>
);

const NavItem = ({ icon, label, active, onPress }) => (
  <TouchableOpacity style={styles.navItem} activeOpacity={0.8} onPress={onPress}>
    <View style={[styles.navIconBubble, active && styles.navIconBubbleActive]}>
      <Icon name={icon} size={20} color={active ? "#fff" : "#888"} />
    </View>
    <Text style={[styles.navLabel, active && styles.navLabelActive]}>
      {label}
    </Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: BG,
  },

  /* HEADER */
  header: {
    paddingHorizontal: 22,
    paddingTop: 10,
    paddingBottom: 18,
    backgroundColor: CARD,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 8,
  },
  statusPill: {
    alignSelf: "flex-start",
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: BG,
    marginBottom: 8,
  },
  statusText: {
    fontSize: 12,
    color: "#444",
    fontWeight: "500",
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "flex-end",
  },
  logoMain: {
    fontSize: 26,
    fontWeight: "700",
    color: TEXT_DARK,
  },
  logoAccent: {
    fontSize: 26,
    fontWeight: "700",
    color: PRIMARY,
    marginLeft: 2,
  },
  subTitle: {
    marginTop: 4,
    fontSize: 13,
    color: "#777",
  },
  headerChipsRow: {
    flexDirection: "row",
    marginTop: 10,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "#fff5ec",
    marginRight: 8,
  },
  chipText: {
    fontSize: 11,
    color: PRIMARY,
    marginLeft: 4,
    fontWeight: "500",
  },

  /* CONTENT */
  content: {
    flex: 1,
    paddingHorizontal: 22,
    paddingTop: 18,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: TEXT_DARK,
    marginBottom: 8,
  },
  gridRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  card: {
    flex: 1,
    backgroundColor: CARD,
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 12,
    marginHorizontal: 6,
    alignItems: "flex-start",
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 5,
  },
  cardIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff4e6",
    marginBottom: 10,
  },
  cardText: {
    fontSize: 13,
    color: TEXT_DARK,
    fontWeight: "600",
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 11,
    color: "#777",
  },

  /* SOS */
  sosWrapper: {
    marginTop: 25,
    alignItems: "center",
    justifyContent: "center",
  },
  sosShadow: {
    position: "absolute",
    width: 250,
    height: 250,
    borderRadius: 110,
    backgroundColor: PRIMARY,
    opacity: 0.08,
  },
  sosButton: {
    width: 200,
    height: 200,
    borderRadius: 90,
    backgroundColor: PRIMARY,
    justifyContent: "center",
    alignItems: "center",
    elevation: 10,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 16,
  },
  sosInnerGlow: {
    position: "absolute",
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: "#ffffff22",
  },
  sosIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 2,
    borderColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  sosText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
    letterSpacing: 1.4,
  },
  sosHint: {
    fontSize: 11,
    marginTop: 4,
    color: "#ffe8d0",
  },
  sideTab: {
    position: "absolute",
    right: -26,
    width: 56,
    height: 80,
    borderTopLeftRadius: 28,
    borderBottomLeftRadius: 28,
    backgroundColor: PRIMARY,
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: -2, height: 4 },
    shadowRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },

  /* BOTTOM NAV */
  bottomBar: {
    marginHorizontal: 36,
    marginBottom: 18,
    height: 62,
    borderRadius: 32,
    backgroundColor: CARD,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-evenly",
    elevation: 8,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
  },
  navItem: {
    alignItems: "center",
    justifyContent: "center",
  },
  navIconBubble: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: "center",
    alignItems: "center",
  },
  navIconBubbleActive: {
    backgroundColor: PRIMARY,
  },
  navLabel: {
    fontSize: 10,
    color: "#888",
    marginTop: 2,
  },
  navLabelActive: {
    color: PRIMARY,
    fontWeight: "600",
  },
});

export default HomeScreen;
