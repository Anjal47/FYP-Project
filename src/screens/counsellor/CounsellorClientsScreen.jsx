import React, { useCallback, useEffect, useMemo, useState } from "react";
import { SafeAreaView, View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, ActivityIndicator, Alert } from "react-native";
import Feather from "react-native-vector-icons/Feather";
import Ionicons from "react-native-vector-icons/Ionicons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAppTheme } from "../../context/ThemeContext";
import { formatReviewSummary, submitCounselingReview } from "../../utils/counselingReviews";
import { useTranslate } from "../../utils/localization";
const BASE_URL = "http://10.0.2.2:5000";
export default function CounsellorClientsScreen({
  navigation
}) {
  const translate = useTranslate();
  const {
    theme,
    isDark
  } = useAppTheme();
  const styles = useMemo(() => StyleSheet.create(createStyles(theme, isDark)), [theme, isDark]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState([]);
  const [expandedReviewId, setExpandedReviewId] = useState("");
  const [reviewDrafts, setReviewDrafts] = useState({});
  const [submittingReviewId, setSubmittingReviewId] = useState("");
  const loadAppointments = useCallback(async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        navigation.reset({
          index: 0,
          routes: [{
            name: "Login"
          }]
        });
        return;
      }
      const res = await fetch(`${BASE_URL}/api/counseling/counsellor/appointments`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "Failed to load booked clients");
      setAppointments(Array.isArray(data?.appointments) ? data.appointments : []);
    } catch (error) {
      Alert.alert(translate("Booked Clients"), error?.message || "Could not load booked clients");
    } finally {
      setLoading(false);
    }
  }, [navigation]);
  useEffect(() => {
    const unsub = navigation.addListener("focus", loadAppointments);
    return unsub;
  }, [navigation, loadAppointments]);
  const bookedClients = useMemo(() => {
    const sorted = [...appointments].sort((a, b) => {
      const ta = new Date(a?.updatedAt || a?.createdAt || 0).getTime();
      const tb = new Date(b?.updatedAt || b?.createdAt || 0).getTime();
      return tb - ta;
    });
    const map = new Map();
    for (const appt of sorted) {
      const user = appt?.user;
      const userId = user?._id || user?.id || appt?.userId || appt?.user;
      if (!userId || map.has(userId)) continue;
      const apptId = appt?.id || appt?._id;
      map.set(userId, {
        id: String(userId),
        appointmentId: apptId ? String(apptId) : "",
        name: user?.fullName || "Client",
        email: user?.email || "",
        phone: user?.phone || "",
        latestStatus: String(appt?.status || "pending").toLowerCase(),
        latestWhen: `${appt?.month || ""} ${appt?.day || ""}`.trim(),
        latestSlot: appt?.slot || "",
        reviewSummary: user?.reviewSummary || {
          averageRating: 0,
          reviewCount: 0
        },
        myReview: appt?.myReview || null,
        problem: appt?.request?.problem || "",
        mode: appt?.request?.mode || "",
        language: appt?.request?.language || "",
        desc: appt?.request?.description || ""
      });
    }
    return Array.from(map.values());
  }, [appointments]);
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return bookedClients;
    return bookedClients.filter(client => [client.name, client.email, client.phone, client.problem, client.latestStatus].filter(Boolean).join(" ").toLowerCase().includes(q));
  }, [bookedClients, search]);
  const stats = useMemo(() => {
    const completed = bookedClients.filter(client => client.latestStatus === "completed").length;
    const chatReady = bookedClients.filter(client => canChat(client)).length;
    return {
      total: bookedClients.length,
      completed,
      chatReady
    };
  }, [bookedClients]);
  const updateReviewDraft = (appointmentId, patch) => {
    setReviewDrafts(prev => ({
      ...prev,
      [appointmentId]: {
        rating: prev[appointmentId]?.rating || 0,
        comment: prev[appointmentId]?.comment || "",
        ...patch
      }
    }));
  };
  const onSubmitReview = async appointmentId => {
    const draft = reviewDrafts[appointmentId] || {};
    const rating = Number(draft.rating || 0);
    const comment = String(draft.comment || "").trim();
    if (!rating) {
      Alert.alert(translate("Missing rating"), translate("Please select a star rating first."));
      return;
    }
    try {
      setSubmittingReviewId(appointmentId);
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        navigation.reset({
          index: 0,
          routes: [{
            name: "Login"
          }]
        });
        return;
      }
      const data = await submitCounselingReview(token, appointmentId, {
        rating,
        comment
      });
      const savedReview = data?.review || {
        rating,
        comment
      };
      setAppointments(prev => prev.map(item => String(item?.id || item?._id) === appointmentId ? {
        ...item,
        myReview: savedReview
      } : item));
      setExpandedReviewId("");
      Alert.alert(translate("Review saved"), translate("Your client review has been submitted."));
    } catch (error) {
      Alert.alert(translate("Review failed"), error?.message || "Could not submit your review");
    } finally {
      setSubmittingReviewId("");
    }
  };
  function canChat(client) {
    const okStatus = String(client.latestStatus || "").toLowerCase() === "confirmed";
    const okMode = String(client.mode || "").toLowerCase() === "online";
    return okStatus && okMode && !!client.appointmentId;
  }
  return <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <View style={styles.topBar}>
            <TouchableOpacity style={styles.backRow} onPress={() => navigation.goBack()} activeOpacity={0.85}>
              <View style={styles.backIconWrap}>
                <Feather name="arrow-left" size={18} color={theme.text} />
              </View>
              <Text style={styles.backText}>{translate("Back")}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.settingsButton} onPress={() => navigation.navigate("Settings")} activeOpacity={0.88}>
              <Feather name="settings" size={17} color={theme.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.heroGlow} />
          <Text style={styles.eyebrow}>{translate("Clients")}</Text>
          <Text style={styles.title}>{translate("One card per client, with the latest context up front.")}</Text>
          <Text style={styles.subtitle}>{translate("Repeated session rows were collapsed into a clearer client view so chat, status, and reviews appear once in the place they actually belong.")}</Text>

          <View style={styles.statsRow}>
            <MetricCard styles={styles} label={translate("Clients")} value={stats.total} />
            <MetricCard styles={styles} label={translate("Chat Ready")} value={stats.chatReady} />
            <MetricCard styles={styles} label={translate("Reviewable")} value={stats.completed} />
          </View>
        </View>

        <View style={styles.searchCard}>
          <View style={styles.searchRow}>
            <Feather name="search" size={16} color={theme.muted} />
            <TextInput value={search} onChangeText={setSearch} placeholder={translate("Search client, concern, or status")} placeholderTextColor={theme.muted} style={styles.searchInput} />
            {!!search && <TouchableOpacity onPress={() => setSearch("")} activeOpacity={0.85}>
                <Feather name="x-circle" size={18} color={theme.muted} />
              </TouchableOpacity>}
          </View>
        </View>

        {loading ? <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={theme.accentStrong} />
            <Text style={styles.loadingText}>{translate("Loading booked clients...")}</Text>
          </View> : filtered.length === 0 ? <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>{translate("No clients found")}</Text>
            <Text style={styles.emptyText}>{translate("If users have not booked sessions yet, this list stays empty.")}</Text>
          </View> : filtered.map(client => <View key={client.id} style={styles.card}>
              <View style={styles.cardTop}>
                <View style={styles.avatar}>
                  <Ionicons name="person-outline" size={20} color={theme.accentStrong} />
                </View>
                <View style={styles.cardCopy}>
                  <Text style={styles.clientName}>{client.name}</Text>
                  <Text style={styles.clientMeta}>{formatReviewSummary(client.reviewSummary)}</Text>
                </View>
                <StatusBadge styles={styles} status={client.latestStatus} />
              </View>

              <View style={styles.metaGrid}>
                {!!client.latestWhen && <MetaTile styles={styles} icon="calendar" label={translate("Latest Session")} value={`${client.latestWhen}${client.latestSlot ? ` • ${client.latestSlot}` : ""}`} theme={theme} />}
                {!!client.problem && <MetaTile styles={styles} icon="activity" label={translate("Concern")} value={client.problem} theme={theme} />}
                {!!(client.mode || client.language) && <MetaTile styles={styles} icon="video" label={translate("Format")} value={[client.mode, client.language].filter(Boolean).join(" • ")} theme={theme} />}
                {!!(client.email || client.phone) && <MetaTile styles={styles} icon="user" label={translate("Contact")} value={[client.email, client.phone].filter(Boolean).join(" • ")} theme={theme} />}
              </View>

              <View style={styles.notesCard}>
                <Text style={styles.notesLabel}>{translate("Latest Notes")}</Text>
                <Text style={styles.notesText}>
                  {client.desc ? client.desc : "No description provided by client."}
                </Text>
              </View>

              {String(client.latestStatus || "").toLowerCase() === "completed" ? <View style={styles.reviewCard}>
                  <Text style={styles.reviewTitle}>{translate("Review this user")}</Text>
                  {client.myReview ? <>
                      <Text style={styles.reviewStars}>
                        {"★".repeat(client.myReview.rating)}
                        {"☆".repeat(5 - client.myReview.rating)}
                      </Text>
                      <Text style={styles.reviewText}>
                        {client?.myReview?.comment || "You rated this user without a written comment."}
                      </Text>
                    </> : <>
                      <TouchableOpacity style={styles.reviewToggle} onPress={() => setExpandedReviewId(prev => prev === client.appointmentId ? "" : client.appointmentId)} activeOpacity={0.88}>
                        <Text style={styles.reviewToggleText}>
                          {expandedReviewId === client.appointmentId ? "Hide review form" : "Rate user"}
                        </Text>
                      </TouchableOpacity>

                      {expandedReviewId === client.appointmentId ? <View style={styles.reviewForm}>
                          <View style={styles.starsRow}>
                            {[1, 2, 3, 4, 5].map(star => {
                  const active = star <= Number(reviewDrafts[client.appointmentId]?.rating || 0);
                  return <TouchableOpacity key={`${client.appointmentId}-star-${star}`} onPress={() => updateReviewDraft(client.appointmentId, {
                    rating: star
                  })} activeOpacity={0.8}>
                                  <Text style={[styles.starButton, active && styles.starButtonActive]}>
                                    {active ? "★" : "☆"}
                                  </Text>
                                </TouchableOpacity>;
                })}
                          </View>

                          <TextInput value={reviewDrafts[client.appointmentId]?.comment || ""} onChangeText={text => updateReviewDraft(client.appointmentId, {
                comment: text
              })} placeholder={translate("Write a short review")} placeholderTextColor={theme.muted} multiline style={styles.reviewInput} />

                          <TouchableOpacity style={[styles.submitReviewButton, submittingReviewId === client.appointmentId && styles.submitReviewButtonBusy]} onPress={() => onSubmitReview(client.appointmentId)} disabled={submittingReviewId === client.appointmentId} activeOpacity={0.9}>
                            <Text style={styles.submitReviewButtonText}>
                              {submittingReviewId === client.appointmentId ? "Submitting..." : "Submit Review"}
                            </Text>
                          </TouchableOpacity>
                        </View> : null}
                    </>}
                </View> : null}

              <View style={styles.actionsRow}>
                {canChat(client) ? <TouchableOpacity style={styles.chatButton} onPress={() => navigation.navigate("CounsellorChat", {
            appointmentId: client.appointmentId,
            userName: client.name,
            userPhone: String(client.phone || "")
          })} activeOpacity={0.9}>
                    <Ionicons name="chatbubble-ellipses-outline" size={16} color="#FFFFFF" />
                    <Text style={styles.chatButtonText}>{translate("Open Chat")}</Text>
                  </TouchableOpacity> : <View style={styles.helperPill}>
                    <Text style={styles.helperPillText}>{translate("Chat unlocks for confirmed online sessions")}</Text>
                  </View>}
              </View>
            </View>)}
      </ScrollView>
    </SafeAreaView>;
}
function MetricCard({
  label,
  value,
  styles
}) {
  return <View style={styles.metricCard}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>;
}
function MetaTile({
  icon,
  label,
  value,
  styles,
  theme
}) {
  return <View style={styles.metaTile}>
      <Feather name={icon} size={14} color={theme.accentStrong} />
      <Text style={styles.metaTileLabel}>{label}</Text>
      <Text style={styles.metaTileValue}>{value}</Text>
    </View>;
}
function StatusBadge({
  status,
  styles
}) {
  const palette = {
    pending: {
      bg: "#FFF4E3",
      fg: "#B56A00"
    },
    confirmed: {
      bg: "#EAF7EE",
      fg: "#197A3A"
    },
    completed: {
      bg: "#EAF7EE",
      fg: "#197A3A"
    },
    cancelled: {
      bg: "#FDECEC",
      fg: "#B42318"
    }
  };
  const selected = palette[status] || {
    bg: "#F2F2F2",
    fg: "#666666"
  };
  return <View style={[styles.statusBadge, {
    backgroundColor: selected.bg
  }]}>
      <Text style={[styles.statusBadgeText, {
      color: selected.fg
    }]}>
        {status[0].toUpperCase() + status.slice(1)}
      </Text>
    </View>;
}
function createStyles(theme, isDark) {
  return {
    container: {
      flex: 1,
      backgroundColor: theme.background
    },
    content: {
      padding: 12,
      paddingBottom: 32
    },
    hero: {
      position: "relative",
      overflow: "hidden",
      backgroundColor: theme.surface,
      borderRadius: 32,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 22,
      marginBottom: 16,
      shadowColor: "#000",
      shadowOpacity: isDark ? 0.24 : 0.08,
      shadowRadius: 16,
      shadowOffset: {
        width: 0,
        height: 10
      },
      elevation: 4
    },
    heroGlow: {
      position: "absolute",
      top: -86,
      right: -60,
      width: 220,
      height: 220,
      borderRadius: 110,
      backgroundColor: theme.accentSoft
    },
    topBar: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 18,
      gap: 12
    },
    backRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10
    },
    backIconWrap: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.surfaceSoft,
      borderWidth: 1,
      borderColor: theme.border,
      alignItems: "center",
      justifyContent: "center"
    },
    backText: {
      color: theme.text,
      fontSize: 12,
      fontWeight: "700"
    },
    settingsButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.surfaceSoft,
      borderWidth: 1,
      borderColor: theme.border,
      alignItems: "center",
      justifyContent: "center"
    },
    eyebrow: {
      color: theme.accentStrong,
      fontSize: 11,
      fontWeight: "800",
      letterSpacing: 1,
      textTransform: "uppercase"
    },
    title: {
      marginTop: 8,
      color: theme.text,
      fontSize: 24,
      lineHeight: 30,
      fontWeight: "800",
      letterSpacing: -0.6,
      maxWidth: 560
    },
    subtitle: {
      marginTop: 10,
      color: theme.muted,
      fontSize: 12,
      lineHeight: 19,
      maxWidth: 540
    },
    statsRow: {
      flexDirection: "row",
      gap: 10,
      marginTop: 18,
      flexWrap: "wrap"
    },
    metricCard: {
      flex: 1,
      minWidth: 92,
      backgroundColor: theme.surfaceElevated,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 20,
      padding: 14
    },
    metricValue: {
      color: theme.text,
      fontSize: 17,
      fontWeight: "800"
    },
    metricLabel: {
      marginTop: 4,
      color: theme.muted,
      fontSize: 10,
      fontWeight: "700",
      textTransform: "uppercase",
      letterSpacing: 0.8
    },
    searchCard: {
      backgroundColor: theme.surface,
      borderRadius: 26,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 16,
      marginBottom: 16
    },
    searchRow: {
      minHeight: 48,
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.surfaceSoft,
      paddingHorizontal: 14
    },
    searchInput: {
      flex: 1,
      color: theme.text,
      fontSize: 13,
      paddingVertical: 12
    },
    loadingBox: {
      padding: 30,
      alignItems: "center"
    },
    loadingText: {
      marginTop: 10,
      color: theme.muted,
      fontSize: 12,
      fontWeight: "700"
    },
    emptyCard: {
      backgroundColor: theme.surface,
      borderRadius: 26,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 20
    },
    emptyTitle: {
      color: theme.text,
      fontSize: 15,
      fontWeight: "800"
    },
    emptyText: {
      marginTop: 6,
      color: theme.muted,
      fontSize: 12,
      lineHeight: 18
    },
    card: {
      backgroundColor: theme.surface,
      borderRadius: 28,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 18,
      marginBottom: 12
    },
    cardTop: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12
    },
    avatar: {
      width: 52,
      height: 52,
      borderRadius: 26,
      backgroundColor: theme.accentSoft,
      alignItems: "center",
      justifyContent: "center"
    },
    cardCopy: {
      flex: 1
    },
    clientName: {
      color: theme.text,
      fontSize: 15,
      fontWeight: "800"
    },
    clientMeta: {
      marginTop: 4,
      color: theme.accentStrong,
      fontSize: 11,
      fontWeight: "800"
    },
    statusBadge: {
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: 999
    },
    statusBadgeText: {
      fontSize: 11,
      fontWeight: "800"
    },
    metaGrid: {
      flexDirection: "row",
      gap: 10,
      flexWrap: "wrap",
      marginTop: 14
    },
    metaTile: {
      minWidth: "47%",
      flexGrow: 1,
      backgroundColor: theme.surfaceSoft,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 13
    },
    metaTileLabel: {
      marginTop: 8,
      color: theme.muted,
      fontSize: 10,
      fontWeight: "800",
      textTransform: "uppercase",
      letterSpacing: 0.8
    },
    metaTileValue: {
      marginTop: 6,
      color: theme.text,
      fontSize: 12,
      lineHeight: 18,
      fontWeight: "700"
    },
    notesCard: {
      marginTop: 14,
      backgroundColor: theme.surfaceSoft,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 14
    },
    notesLabel: {
      color: theme.muted,
      fontSize: 10,
      fontWeight: "800",
      textTransform: "uppercase",
      letterSpacing: 0.8
    },
    notesText: {
      marginTop: 8,
      color: theme.text,
      fontSize: 12,
      lineHeight: 18
    },
    reviewCard: {
      marginTop: 14,
      backgroundColor: theme.accentSoft,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 14
    },
    reviewTitle: {
      color: theme.text,
      fontSize: 13,
      fontWeight: "800"
    },
    reviewStars: {
      marginTop: 8,
      color: theme.accentStrong,
      fontSize: 18,
      fontWeight: "800"
    },
    reviewText: {
      marginTop: 8,
      color: theme.text,
      fontSize: 12,
      lineHeight: 18
    },
    reviewToggle: {
      marginTop: 10,
      alignSelf: "flex-start",
      backgroundColor: theme.surface,
      borderRadius: 999,
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderWidth: 1,
      borderColor: theme.border
    },
    reviewToggleText: {
      color: theme.accentStrong,
      fontSize: 12,
      fontWeight: "800"
    },
    reviewForm: {
      marginTop: 12
    },
    starsRow: {
      flexDirection: "row",
      gap: 10
    },
    starButton: {
      fontSize: 28,
      color: "#C9C9C9"
    },
    starButtonActive: {
      color: theme.accentStrong
    },
    reviewInput: {
      marginTop: 12,
      minHeight: 88,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.surface,
      paddingHorizontal: 12,
      paddingVertical: 10,
      color: theme.text,
      textAlignVertical: "top",
      fontSize: 12
    },
    submitReviewButton: {
      marginTop: 12,
      alignSelf: "flex-start",
      backgroundColor: theme.accentStrong,
      borderRadius: 999,
      paddingHorizontal: 16,
      paddingVertical: 10
    },
    submitReviewButtonBusy: {
      opacity: 0.75
    },
    submitReviewButtonText: {
      color: "#FFFFFF",
      fontSize: 12,
      fontWeight: "800"
    },
    actionsRow: {
      flexDirection: "row",
      gap: 10,
      marginTop: 16,
      flexWrap: "wrap",
      alignItems: "center"
    },
    chatButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      backgroundColor: theme.accentStrong,
      paddingHorizontal: 16,
      paddingVertical: 11,
      borderRadius: 999
    },
    chatButtonText: {
      color: "#FFFFFF",
      fontSize: 12,
      fontWeight: "800"
    },
    helperPill: {
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderRadius: 999,
      backgroundColor: theme.surfaceSoft,
      borderWidth: 1,
      borderColor: theme.border
    },
    helperPillText: {
      color: theme.muted,
      fontSize: 11,
      fontWeight: "700"
    }
  };
}