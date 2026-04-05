// src/screens/TrafficRulesScreen.jsx
import React, { useMemo } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import Icon from "react-native-vector-icons/Feather";
import FloatingHelpChat from "../components/FloatingHelpChat";
import { useAppTheme } from "../context/ThemeContext";
import { createThemedStyles } from "../utils/themeStyles";

const rules = [
  {
    id: 1,
    titleEn: "Always carry a valid driving licence.",
    bodyEn:
      "Drivers must carry a valid licence and registration documents whenever operating a vehicle on public roads.",
    titleNp: "सधैं मान्य सवारी चालक अनुमतिपत्र साथमा राख्नुहोस्।",
    bodyNp:
      "सार्वजनिक सडकमा सवारी चलाउँदा चालकले मान्य अनुमतिपत्र र गाडीका कागजातहरू साथमा राख्नुपर्छ।",
  },
  {
    id: 2,
    titleEn: "Wear seat belt and helmet.",
    bodyEn:
      "Car drivers and front passengers must wear seat belts. Two-wheeler riders and pillion riders must wear a certified helmet.",
    titleNp: "सिटबेल्ट र हेल्मेट अनिवार्य।",
    bodyNp:
      "सवारी चालक र अगाडिको यात्रीले सिटबेल्ट बाध्यतापूर्वक लगाउनुपर्छ। दुईपांग्रे सवारी चालक र पछाडिको यात्रुले प्रमाणित हेल्मेट लगाउनुपर्छ।",
  },
  {
    id: 3,
    titleEn: "Do not drive under the influence of alcohol or drugs.",
    bodyEn:
      "Driving after consuming alcohol, drugs or any substance that affects judgement is strictly prohibited.",
    titleNp: "मदिरा वा लागूऔषधको सेवनबाट प्रभावित भएर सवारी नचलाउनुहोस्।",
    bodyNp:
      "मदिरा, लागूऔषध वा निर्णय क्षमता घटाउने कुनै पदार्थ सेवन गरी सवारी सञ्चालन गर्नु कानूनी रूपमा प्रतिबन्धित छ।",
  },
  {
    id: 4,
    titleEn: "Follow lane discipline and speed limits.",
    bodyEn:
      "Always drive within the marked lane and obey the speed limits fixed by the traffic police and local authority.",
    titleNp: "लेन अनुशासन र गति सीमा पालना गर्नुहोस्।",
    bodyNp:
      "सडकमा तोकिएको लेनमै सवारी चलाउनुहोस् र ट्राफिक प्रहरी तथा स्थानीय निकायले तोकेको गति सीमा ननाघ्नुहोस्।",
  },
  {
    id: 5,
    titleEn: "Give first priority to pedestrians and zebra crossings.",
    bodyEn:
      "Slow down near schools, hospitals and crossings. Stop and allow pedestrians to cross at zebra crossings.",
    titleNp: "पैदल यात्री र जेब्रा क्रसिङलाई प्राथमिकता दिनुहोस्।",
    bodyNp:
      "स्कूल, अस्पताल र क्रसिङ नजिक गति घटाउनुहोस्। जेब्रा क्रसिङमा पैदल यात्रुलाई सुरक्षित रूपमा सडक कटाउन रोकिएर प्राथमिकता दिनुपर्छ।",
  },
  {
    id: 6,
    titleEn: "Do not use mobile phones while driving.",
    bodyEn:
      "Talking, texting or using social media while driving distracts the driver and is punishable.",
    titleNp: "सवारी चलाउँदा मोबाइल फोन प्रयोग नगर्नुहोस्।",
    bodyNp:
      "फोनमा कुरा गर्ने, म्यासेज गर्ने वा सामाजिक सञ्जाल प्रयोग गर्ने कार्यले चालकको ध्यान विचलित गराउँछ र कानूनी कारबाहीको भाग बन्न सक्छ।",
  },
  {
    id: 7,
    titleEn: "Respect traffic lights, police signals and road signs.",
    bodyEn:
      "Red light, stop boards, one-way, no-parking and school-zone signs must always be followed.",
    titleNp: "ट्राफिक बत्ती, प्रहरी संकेत र सडक चिन्हको आदर गर्नुहोस्।",
    bodyNp:
      "रातो बत्ती, रोक्ने संकेत, वन-वे, नो-पार्किङ, स्कूल-जोन जस्ता सबै संकेत तथा बोर्डहरूको पालन अनिवार्य छ।",
  },
  {
    id: 8,
    titleEn: "Do not overload passengers or goods vehicles.",
    bodyEn:
      "Vehicles must not carry more passengers or goods than their legal capacity because overloading increases accident risk.",
    titleNp: "Yatayat sadhan lai kshamata bhanda badi load nagarnuhos.",
    bodyNp:
      "Kanun le tokeyeko sima bhanda badi yatri wa samaan boknu hudaina, kinaki yasle durghatana ko jokhim badhauncha.",
  },
  {
    id: 9,
    titleEn: "Use indicators before turning, overtaking or changing lanes.",
    bodyEn:
      "Drivers should signal clearly before turning, overtaking, stopping or shifting lanes so other road users can react safely.",
    titleNp: "Modnu, overtake garnu wa lane phernu aghi indicator dinuhos.",
    bodyNp:
      "Baen daen modnu, roknu wa lane phernu bhanda aghi spasta sanket dinu parchha jasle anya sadak prayogakarta lai surakshit pratikriya dina madad garcha.",
  },
  {
    id: 10,
    titleEn: "Keep a safe distance from the vehicle ahead.",
    bodyEn:
      "Maintain enough braking distance, especially during rain, fog, night driving and heavy traffic, to avoid rear-end collisions.",
    titleNp: "Agadiko sadhansanga surakshit duri kayam rakhnu hos.",
    bodyNp:
      "Barsa, kuhiro, rati wa bhid bhayeko samayama agadiko sadhansanga paryapta duri rakhnu parchha taki pachhadi bata thokkinne durghatana nahos.",
  },
  {
    id: 11,
    titleEn: "Give way to emergency vehicles.",
    bodyEn:
      "Ambulances, fire engines and police vehicles using sirens or emergency lights must be given immediate right of way.",
    titleNp: "Aakasmik sewaka sawarilai rasta dinuhos.",
    bodyNp:
      "Siren wa emergency light balera aaune ambulance, fire brigade ra police sawari lai turuntai rasta chhodnu parchha.",
  },
  {
    id: 12,
    titleEn: "Park only in permitted areas.",
    bodyEn:
      "Avoid parking on footpaths, intersections, bridges, narrow roads or no-parking zones because it blocks traffic and creates hazards.",
    titleNp: "Anumati diyeko thauma matra parking garnuhos.",
    bodyNp:
      "Footpath, chowk, pul, sanghuro bato wa no-parking zone ma sawari rakhnu hudaina kinaki yasle yatayat awarodh ra jokhim srijana garcha.",
  },
];

const TrafficRulesScreen = ({ navigation }) => {
  const { theme, isDark } = useAppTheme();
  const styles = useMemo(
    () => StyleSheet.create(createThemedStyles(baseStyles, theme, isDark)),
    [theme, isDark]
  );
  const handleHomePress = () => navigation.navigate("Home");

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backRow}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-left" size={20} color="#111" />
          <Text style={styles.headerTitle}>
            <Text style={styles.headerHighlight}> Traffic</Text> Rules
          </Text>
        </TouchableOpacity>
      </View>

      {/* BODY */}
      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.screenTitle}>Know your rights and duties.</Text>
        <Text style={styles.subtitle}>
          Important traffic rules and regulations of Nepal in English and
          Nepali.
        </Text>

        {rules.map((rule) => (
          <View key={rule.id} style={styles.ruleCard}>
            <Text style={styles.ruleBadge}>Rule {rule.id}</Text>

            <Text style={styles.ruleTitleEn}>{rule.titleEn}</Text>
            <Text style={styles.ruleTextEn}>{rule.bodyEn}</Text>

            <View style={styles.divider} />

            <Text style={styles.ruleTitleNp}>{rule.titleNp}</Text>
            <Text style={styles.ruleTextNp}>{rule.bodyNp}</Text>
          </View>
        ))}

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* ORANGE SIDE PILL */}
      <FloatingHelpChat bottom={110} fabBottom={145} />

      {/* BOTTOM BAR */}
     
    </SafeAreaView>
  );
};

export default TrafficRulesScreen;

const baseStyles = {
  container: { flex: 1, backgroundColor: "#F4F4F4" },

  header: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: "#E3E3E3",
  },
  backRow: { flexDirection: "row", alignItems: "center" },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginLeft: 8,
    color: "#111",
  },
  headerHighlight: { color: "#FF7A1A" },

  body: { flex: 1 },
  bodyContent: {
    paddingHorizontal: 24,
    paddingTop: 18,
    paddingBottom: 140,
  },

  screenTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    color: "#555",
    marginBottom: 16,
  },

  ruleCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingVertical: 16,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  ruleBadge: {
    alignSelf: "flex-start",
    fontSize: 11,
    fontWeight: "700",
    color: "#FF7A1A",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "#FFF1E4",
    marginBottom: 6,
  },
  ruleTitleEn: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111",
    marginBottom: 2,
  },
  ruleTextEn: {
    fontSize: 13,
    color: "#444",
    marginBottom: 8,
  },
  divider: {
    height: 1,
    backgroundColor: "#F0F0F0",
    marginVertical: 6,
  },
  ruleTitleNp: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FF7A1A",
    marginBottom: 2,
  },
  ruleTextNp: {
    fontSize: 13,
    color: "#333",
  },

  sidePill: {
    position: "absolute",
    right: 0,
    bottom: 110,
    width: 56,
    height: 110,
    backgroundColor: "#FF7A1A",
    borderTopLeftRadius: 40,
    borderBottomLeftRadius: 40,
    elevation: 5,
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: -2, height: 2 },
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
  tabItem: { paddingHorizontal: 12, paddingVertical: 4 },
};
