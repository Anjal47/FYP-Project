import React, { useEffect, useMemo, useState } from "react";
import { SafeAreaView, View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { adminGET } from "../../utils/adminApi";
import { useTranslate } from "../../utils/localization";
export default function AdminDashboardScreen({
  navigation
}) {
  const translate = useTranslate();
  const UI = useMemo(() => ({
    bg: "#F6F3EE",
    card: "#FFFFFF",
    card2: "#FFF7EF",
    text: translate("#111111"),
    mut: "#6F6257",
    soft: "#9B8A7B",
    line: "#EADBCB",
    accent: "#FF7A1A",
    accent2: "#D97706",
    accentSoft: "#FFE0C2",
    good: "#22C55E",
    warn: "#F59E0B",
    danger: "#EF4444"
  }), []);
  const [loading, setLoading] = useState(true);

  // ✅ added municipality
  const [stats, setStats] = useState({
    users: 0,
    staff: 0,
    counsellors: 0,
    therapists: 0,
    police: 0,
    municipality: 0,
    // ✅ NEW
    openReports: 0
  });
  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        setLoading(true);
        const data = await adminGET("/api/admin/stats");
        if (mounted && data?.stats) {
          setStats(p => ({
            ...p,
            ...data.stats,
            municipality: Number(data?.stats?.municipality || 0) // ✅ safe fallback
          }));
        }
      } catch (e) {
        Alert.alert(translate("Dashboard error"), e?.message || "Failed to load stats");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => mounted = false;
  }, []);
  return <SafeAreaView style={[s.safe, {
    backgroundColor: UI.bg
  }]}>
      <ScrollView contentContainerStyle={s.page} showsVerticalScrollIndicator={false}>
        <View style={[s.hero, {
        backgroundColor: UI.card,
        borderColor: UI.line
      }]}>
          <View style={[s.heroGlow, {
          backgroundColor: UI.accentSoft
        }]} />
          <View style={s.header}>
            <View style={s.headerCopy}>
              <Text style={[s.eyebrow, {
              color: UI.accent2
            }]}>{translate("Admin Control")}</Text>
              <Text style={[s.title, {
              color: UI.text
            }]}>{translate("Angel")}<Text style={{
                color: UI.accent,
                fontWeight: "900"
              }}>{translate("Touch")}</Text>{translate("Admin")}</Text>
              <Text style={[s.sub, {
              color: UI.mut
            }]}>{translate("Control center for users, staff, and reports.")}</Text>
            </View>

            <TouchableOpacity activeOpacity={0.9} style={[s.iconBtn, {
            borderColor: UI.line,
            backgroundColor: UI.card2
          }]} onPress={() => navigation.navigate("Settings")}>
              <Ionicons name="settings-outline" size={22} color={UI.text} />
            </TouchableOpacity>
          </View>

          <View style={s.heroBand}>
            <HeroChip UI={UI} icon="people-outline" text={translate("User oversight")} />
            <HeroChip UI={UI} icon="briefcase-outline" text={translate("Staff access")} />
            <HeroChip UI={UI} icon="document-text-outline" text={translate("Report review")} />
            <HeroChip UI={UI} icon="heart-outline" text={translate("Donation approvals")} />
          </View>
        </View>

        {loading ? <View style={[s.loadingBox, {
        backgroundColor: UI.card,
        borderColor: UI.line
      }]}>
            <ActivityIndicator color={UI.accent} />
            <Text style={{
          marginTop: 10,
          color: UI.mut,
          fontWeight: "800"
        }}>{translate("Loading stats...")}</Text>
          </View> : <>
            <View style={s.grid}>
              <StatCard title={translate("Users")} value={stats.users} icon="people-outline" tone={UI.accent} UI={UI} />
              <StatCard title={translate("Total Staff")} value={stats.staff} icon="briefcase-outline" tone={UI.good} UI={UI} />
              <StatCard title={translate("Open Reports")} value={stats.openReports} icon="warning-outline" tone={UI.danger} UI={UI} />
              <StatCard title={translate("Counsellors")} value={stats.counsellors} icon="chatbubble-ellipses-outline" tone={UI.accent2} UI={UI} />
              <StatCard title={translate("Therapists")} value={stats.therapists} icon="heart-outline" tone={UI.warn} UI={UI} />
              <StatCard title={translate("Police")} value={stats.police} icon="shield-outline" tone={UI.good} UI={UI} />
              <StatCard title={translate("Municipality")} value={stats.municipality} icon="business-outline" tone={UI.warn} UI={UI} />
            </View>

            <View style={[s.section, {
          backgroundColor: UI.card,
          borderColor: UI.line
        }]}>
              <Text style={[s.sectionTitle, {
            color: UI.text
          }]}>{translate("Quick Actions")}</Text>

              <ActionRow UI={UI} icon="person-add-outline" title={translate("Create Staff")} subtitle={translate("Add counsellor / therapist / police / municipality")} onPress={() => navigation.navigate("Staff")} />

              <ActionRow UI={UI} icon="people-outline" title={translate("Manage Users")} subtitle={translate("View, disable, and monitor accounts")} onPress={() => navigation.navigate("Users")} />

              <ActionRow UI={UI} icon="document-text-outline" title={translate("Manage Reports")} subtitle={translate("All reports (assign, status, priority)")} onPress={() => navigation.navigate("Reports")} />

              <ActionRow UI={UI} icon="heart-outline" title={translate("Review Donations")} subtitle={translate("Approve or reject charity requests")} onPress={() => navigation.navigate("Donations")} />

              <ActionRow UI={UI} icon="trash-outline" title={translate("Waste Reports")} subtitle={translate("Only waste management cases (assign municipality)")} onPress={() => navigation.navigate("MunicipalityWasteDashboard")} />
            </View>
          </>}
      </ScrollView>
    </SafeAreaView>;
}
function HeroChip({
  UI,
  icon,
  text
}) {
  return <View style={[s.heroChip, {
    borderColor: UI.line,
    backgroundColor: UI.card2
  }]}>
      <Ionicons name={icon} size={14} color={UI.accent} />
      <Text style={[s.heroChipTxt, {
      color: UI.text
    }]}>{text}</Text>
    </View>;
}
function StatCard({
  title,
  value,
  icon,
  tone,
  UI
}) {
  return <View style={[s.card, {
    backgroundColor: UI.card,
    borderColor: UI.line
  }]}>
      <View style={s.cardTop}>
        <Ionicons name={icon} size={20} color={tone} />
        <View style={[s.dot, {
        backgroundColor: tone
      }]} />
      </View>
      <Text style={[s.cardVal, {
      color: UI.text
    }]}>{value}</Text>
      <Text style={[s.cardTitle, {
      color: UI.mut
    }]}>{title}</Text>
    </View>;
}
function ActionRow({
  UI,
  icon,
  title,
  subtitle,
  onPress
}) {
  return <TouchableOpacity activeOpacity={0.9} onPress={onPress} style={[s.row, {
    borderColor: UI.line,
    backgroundColor: UI.card2
  }]}>
      <View style={[s.rowIcon, {
      borderColor: UI.line,
      backgroundColor: UI.card
    }]}>
        <Ionicons name={icon} size={18} color={UI.accent} />
      </View>
      <View style={{
      flex: 1
    }}>
        <Text style={[s.rowTitle, {
        color: UI.text
      }]}>{title}</Text>
        <Text style={[s.rowSub, {
        color: UI.mut
      }]}>{subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={UI.mut} />
    </TouchableOpacity>;
}
const s = StyleSheet.create({
  safe: {
    flex: 1
  },
  page: {
    padding: 16,
    paddingBottom: 26
  },
  hero: {
    position: "relative",
    overflow: "hidden",
    borderWidth: 1,
    borderRadius: 22,
    padding: 16,
    marginBottom: 14,
    shadowColor: "#B45309",
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: {
      width: 0,
      height: 8
    },
    elevation: 3
  },
  heroGlow: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 999,
    top: -70,
    right: -40,
    opacity: 0.85
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start"
  },
  headerCopy: {
    flex: 1,
    paddingRight: 12
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
    textTransform: "uppercase"
  },
  title: {
    fontSize: 22,
    fontWeight: "900"
  },
  sub: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 18
  },
  heroBand: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 14
  },
  heroChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  heroChipTxt: {
    fontSize: 12,
    fontWeight: "800"
  },
  iconBtn: {
    width: 42,
    height: 42,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center"
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 14
  },
  card: {
    width: "48%",
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    minHeight: 104,
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 3
    },
    elevation: 2
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  dot: {
    width: 9,
    height: 9,
    borderRadius: 99,
    opacity: 0.9
  },
  cardVal: {
    fontSize: 22,
    fontWeight: "900"
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: "800"
  },
  section: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 14
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "900",
    marginBottom: 10
  },
  loadingBox: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    alignItems: "center",
    marginBottom: 14
  },
  row: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 10
  },
  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center"
  },
  rowTitle: {
    fontSize: 14,
    fontWeight: "900"
  },
  rowSub: {
    fontSize: 12,
    marginTop: 3,
    fontWeight: "700"
  }
});