import React from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import Icon from "react-native-vector-icons/Feather";

const ORANGE = "#FF7A1A";

const CrimeReportingHomeScreen = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backRow}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-left" size={20} color="#111" />
          <Text style={styles.title}>
            <Text style={styles.titleHighlight}> Crime</Text>
            <Text style={styles.titleNormal}> Reporting.</Text>
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.body}>
        <Text style={styles.subtitle}>Choose crime category</Text>

        <View style={styles.grid}>
          <Card
            icon="shield"
            title="Domestic Violence"
            desc="Report abuse or violence"
            onPress={() =>
              navigation.navigate("CrimeReport", {
                category: "Domestic Violence",
              })
            }
          />

          <Card
            icon="slash"
            title="Harassment"
            desc="Report threats or harassment"
            onPress={() =>
              navigation.navigate("CrimeReport", {
                category: "Harassment",
              })
            }
          />

          <Card
            icon="lock"
            title="Theft"
            desc="Report stolen items"
            onPress={() =>
              navigation.navigate("CrimeReport", {
                category: "Theft",
              })
            }
          />

          <Card
            icon="monitor"
            title="Cyber Crime"
            desc="Report online abuse or scams"
            onPress={() =>
              navigation.navigate("CrimeReport", {
                category: "Cyber Crime",
              })
            }
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

const Card = ({ icon, title, desc, onPress }) => (
  <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.9}>
    <View style={styles.iconWrap}>
      <Icon name={icon} size={20} color={ORANGE} />
    </View>

    <Text style={styles.cardTitle}>{title}</Text>
    <Text style={styles.cardDesc}>{desc}</Text>

    <View style={styles.cardArrow}>
      <Icon name="arrow-right" size={16} color={ORANGE} />
    </View>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F7F7",
  },

  header: {
    backgroundColor: "#fff",
    padding: 20,
  },

  backRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  title: {
    fontSize: 20,
    fontWeight: "700",
    marginLeft: 8,
  },

  titleHighlight: { color: ORANGE },
  titleNormal: { color: "#111" },

  body: {
    padding: 16,
  },

  subtitle: {
    textAlign: "center",
    fontWeight: "700",
    marginBottom: 20,
    fontSize: 16,
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  card: {
    width: "48%",
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    elevation: 3,
    position: "relative",
  },

  iconWrap: {
    backgroundColor: "#FFF3E8",
    padding: 8,
    borderRadius: 20,
    alignSelf: "flex-start",
    marginBottom: 10,
  },

  cardTitle: {
    fontWeight: "700",
    fontSize: 14,
  },

  cardDesc: {
    fontSize: 12,
    color: "#777",
    marginTop: 4,
    paddingRight: 14,
  },

  cardArrow: {
    position: "absolute",
    right: 12,
    bottom: 12,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#FFF3E8",
    alignItems: "center",
    justifyContent: "center",
  },
});

export default CrimeReportingHomeScreen;