import React, { useEffect, useMemo, useState } from "react";
import { SafeAreaView, View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, RefreshControl, ActivityIndicator } from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { adminGET, adminPATCH } from "../../utils/adminApi";
import { useTranslate } from "../../utils/localization";
export default function AdminUsersScreen() {
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
    danger: "#EF4444"
  }), []);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [users, setUsers] = useState([]);
  const load = async () => {
    try {
      const data = await adminGET("/api/admin/users");
      setUsers(data?.users || []);
    } catch (e) {
      Alert.alert(translate("Users error"), e?.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
  }, []);
  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };
  const filtered = users.filter(u => {
    const s = q.trim().toLowerCase();
    if (!s) return true;
    return String(u?._id || "").toLowerCase().includes(s) || String(u?.fullName || "").toLowerCase().includes(s) || String(u?.email || "").toLowerCase().includes(s);
  });
  const toggleActive = async id => {
    try {
      const data = await adminPATCH(`/api/admin/users/${id}/toggle`, {});
      setUsers(prev => prev.map(u => u._id === id ? {
        ...u,
        isActive: data.isActive
      } : u));
    } catch (e) {
      Alert.alert(translate("Update failed"), e?.message || "Could not update user");
    }
  };
  return <SafeAreaView style={[s.safe, {
    backgroundColor: UI.bg
  }]}>
      <ScrollView contentContainerStyle={s.page} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />} showsVerticalScrollIndicator={false}>
        <View style={[s.hero, {
        backgroundColor: UI.card,
        borderColor: UI.line
      }]}>
          <View style={[s.heroGlow, {
          backgroundColor: UI.accentSoft
        }]} />
          <Text style={[s.eyebrow, {
          color: UI.accent2
        }]}>{translate("Admin Users")}</Text>
          <Text style={[s.title, {
          color: UI.text
        }]}>{translate("Search and manage user accounts.")}</Text>
          <Text style={[s.sub, {
          color: UI.mut
        }]}>{translate("Review account activity and quickly enable or disable access.")}</Text>
        </View>

        <View style={[s.search, {
        backgroundColor: UI.card,
        borderColor: UI.line
      }]}>
          <Ionicons name="search-outline" size={18} color={UI.mut} />
          <TextInput value={q} onChangeText={setQ} placeholder={translate("Search by name, email, ID...")} placeholderTextColor={UI.soft} style={[s.input, {
          color: UI.text
        }]} />
          {!!q && <TouchableOpacity onPress={() => setQ("")}>
              <Ionicons name="close-circle" size={20} color={UI.mut} />
            </TouchableOpacity>}
        </View>

        <View style={[s.box, {
        backgroundColor: UI.card,
        borderColor: UI.line
      }]}>
          {loading ? <View style={{
          padding: 14,
          alignItems: "center"
        }}>
              <ActivityIndicator color={UI.accent} />
              <Text style={{
            marginTop: 10,
            color: UI.mut,
            fontWeight: "800"
          }}>{translate("Loading users...")}</Text>
            </View> : filtered.length === 0 ? <Text style={{
          color: UI.mut,
          fontWeight: "700"
        }}>{translate("No users found.")}</Text> : filtered.map(u => <View key={u._id} style={[s.row, {
          backgroundColor: UI.card2,
          borderColor: UI.line
        }]}>
                <View style={{
            flex: 1
          }}>
                  <Text style={[s.name, {
              color: UI.text
            }]}>{u.fullName}</Text>
                  <Text style={[s.email, {
              color: UI.mut
            }]}>{u.email}</Text>
                  <Text style={[s.id, {
              color: UI.mut
            }]}>{translate("ID:")}{String(u._id).slice(-8)}</Text>
                </View>

                <TouchableOpacity activeOpacity={0.9} onPress={() => toggleActive(u._id)} style={[s.btn, {
            borderColor: UI.line,
            backgroundColor: UI.card
          }]}>
                  <Ionicons name={u.isActive ? "lock-open-outline" : "lock-closed-outline"} size={16} color={u.isActive ? UI.good : UI.danger} />
                  <Text style={[s.btnTxt, {
              color: UI.text
            }]}>{u.isActive ? "Active" : "Disabled"}</Text>
                </TouchableOpacity>
              </View>)}
        </View>
      </ScrollView>
    </SafeAreaView>;
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
    marginBottom: 12
  },
  heroGlow: {
    position: "absolute",
    width: 170,
    height: 170,
    borderRadius: 999,
    top: -70,
    right: -30,
    opacity: 0.85
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
    textTransform: "uppercase"
  },
  title: {
    fontSize: 20,
    fontWeight: "900"
  },
  sub: {
    marginTop: 4,
    fontSize: 13,
    marginBottom: 12
  },
  search: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12
  },
  input: {
    flex: 1,
    fontSize: 13
  },
  box: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 12
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
  name: {
    fontSize: 14,
    fontWeight: "900"
  },
  email: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: "700"
  },
  id: {
    marginTop: 2,
    fontSize: 11,
    fontWeight: "800"
  },
  btn: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  btnTxt: {
    fontSize: 11,
    fontWeight: "900"
  }
});