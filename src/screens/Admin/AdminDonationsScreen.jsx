import React, { useCallback, useEffect, useMemo, useState } from "react";
import { SafeAreaView, View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Image, TextInput, RefreshControl } from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { adminGET, adminPATCH } from "../../utils/adminApi";
import { useTranslate } from "../../utils/localization";

const FILTERS = ["Pending", "Active", "Closed", "Rejected"];

function getLifecycleLabel(item) {
  if (item?.isClosed) return "Closed";
  if (item?.status === "rejected") return "Rejected";
  if (item?.isFunded) return "Funded";
  if (item?.status === "approved") return "Approved";
  return "Pending";
}

export default function AdminDonationsScreen() {
  const translate = useTranslate();
  const UI = useMemo(() => ({
    bg: "#F6F3EE",
    card: "#FFFFFF",
    card2: "#FFF7EF",
    text: "#111111",
    mut: "#6F6257",
    soft: "#9B8A7B",
    line: "#EADBCB",
    accent: "#FF7A1A",
    accent2: "#D97706",
    accentSoft: "#FFE0C2",
    good: "#16A34A",
    goodSoft: "#ECFDF3",
    danger: "#EF4444",
    warn: "#F59E0B"
  }), []);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submittingKey, setSubmittingKey] = useState("");
  const [donations, setDonations] = useState([]);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("Pending");
  const [notesById, setNotesById] = useState({});
  const [progressById, setProgressById] = useState({});

  const load = useCallback(async (spinner = true) => {
    try {
      if (spinner) setLoading(true);
      const data = await adminGET("/api/donations/manage");
      const list = Array.isArray(data?.donations) ? data.donations : [];
      setDonations(list);
      setNotesById(prev => {
        const next = {
          ...prev
        };
        list.forEach(item => {
          if (next[item._id] === undefined) {
            next[item._id] = item.adminNotes || "";
          }
        });
        return next;
      });
      setProgressById(prev => {
        const next = {
          ...prev
        };
        list.forEach(item => {
          if (!next[item._id]) {
            next[item._id] = {
              amountReceived: "",
              donorIncrement: "1"
            };
          }
        });
        return next;
      });
    } catch (error) {
      Alert.alert(translate("Donations error"), error?.message || "Failed to load donation requests");
      setDonations([]);
    } finally {
      setLoading(false);
    }
  }, [translate]);

  useEffect(() => {
    load(true);
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load(false);
    setRefreshing(false);
  };

  const updateDonationInState = useCallback(updatedDonation => {
    setDonations(prev => prev.map(item => item._id === updatedDonation._id ? {
      ...item,
      ...updatedDonation
    } : item));
  }, []);

  const updateDecision = async (id, action) => {
    try {
      setSubmittingKey(`${action}:${id}`);
      const data = await adminPATCH(`/api/donations/${id}/${action}`, {
        adminNotes: notesById[id] || ""
      });
      if (data?.donation?._id) {
        updateDonationInState(data.donation);
      }
      const actionLabel = action === "approve" ? translate("approved") : translate("Rejected");
      Alert.alert(translate("Updated"), `${translate("Donation request")} ${actionLabel}.`);
    } catch (error) {
      Alert.alert(translate("Update failed"), error?.message || `Could not ${action} donation request`);
    } finally {
      setSubmittingKey("");
    }
  };

  const recordProgress = async id => {
    const progress = progressById[id] || {};
    const amountText = String(progress.amountReceived || "").trim();
    if (!amountText) {
      Alert.alert(translate("Missing"), translate("Enter the amount received before saving progress."));
      return;
    }
    try {
      setSubmittingKey(`progress:${id}`);
      const data = await adminPATCH(`/api/donations/${id}/progress`, {
        amountReceived: amountText,
        donorIncrement: progress.donorIncrement || "1"
      });
      if (data?.donation?._id) {
        updateDonationInState(data.donation);
      }
      setProgressById(prev => ({
        ...prev,
        [id]: {
          amountReceived: "",
          donorIncrement: prev[id]?.donorIncrement || "1"
        }
      }));
      Alert.alert(translate("Updated"), translate("Donation progress saved."));
    } catch (error) {
      Alert.alert(translate("Update failed"), error?.message || "Could not update donation progress");
    } finally {
      setSubmittingKey("");
    }
  };

  const closeRequest = async id => {
    try {
      setSubmittingKey(`close:${id}`);
      const data = await adminPATCH(`/api/donations/${id}/close`, {});
      if (data?.donation?._id) {
        updateDonationInState(data.donation);
      }
      Alert.alert(translate("Updated"), translate("Donation request closed."));
    } catch (error) {
      Alert.alert(translate("Update failed"), error?.message || "Could not close donation request");
    } finally {
      setSubmittingKey("");
    }
  };

  const filtered = useMemo(() => {
    const search = q.trim().toLowerCase();
    return donations.filter(item => {
      const lifecycle = getLifecycleLabel(item);
      if (filter === "Pending" && item.status !== "pending") return false;
      if (filter === "Active" && (item.status !== "approved" || item.isClosed)) return false;
      if (filter === "Closed" && !item.isClosed) return false;
      if (filter === "Rejected" && item.status !== "rejected") return false;
      if (!search) return true;
      const haystack = [item?.fullName, item?.contact, item?.location, item?.helpType, item?.description, item?.createdBy?.email, lifecycle].filter(Boolean).join(" ").toLowerCase();
      return haystack.includes(search);
    });
  }, [donations, filter, q]);

  const counts = useMemo(() => ({
    pending: donations.filter(item => item.status === "pending").length,
    active: donations.filter(item => item.status === "approved" && !item.isClosed).length,
    closed: donations.filter(item => item.isClosed).length,
    rejected: donations.filter(item => item.status === "rejected").length
  }), [donations]);

  const lifecycleTone = item => {
    const label = getLifecycleLabel(item);
    if (label === "Closed") return UI.soft;
    if (label === "Rejected") return UI.danger;
    if (label === "Funded") return UI.good;
    if (label === "Approved") return UI.accent2;
    return UI.warn;
  };

  return <SafeAreaView style={[styles.safe, {
    backgroundColor: UI.bg
  }]}>
      <ScrollView contentContainerStyle={styles.page} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />} showsVerticalScrollIndicator={false}>
        <View style={[styles.hero, {
        backgroundColor: UI.card,
        borderColor: UI.line
      }]}>
          <View style={[styles.heroGlow, {
          backgroundColor: UI.accentSoft
        }]} />
          <Text style={[styles.eyebrow, {
          color: UI.accent
        }]}>{translate("Admin Donations")}</Text>
          <Text style={[styles.title, {
          color: UI.text
        }]}>{translate("Support people with clear, careful follow-up.")}</Text>
          <Text style={[styles.sub, {
          color: UI.mut
        }]}>{translate("Review requests, keep support updates organized, and close requests when help is complete.")}</Text>
        </View>

        <View style={styles.statsRow}>
          <MetricCard label={translate("Pending")} value={counts.pending} color={UI.warn} UI={UI} />
          <MetricCard label={translate("Active")} value={counts.active} color={UI.accent2} UI={UI} />
          <MetricCard label={translate("Closed")} value={counts.closed} color={UI.soft} UI={UI} />
          <MetricCard label={translate("Rejected")} value={counts.rejected} color={UI.danger} UI={UI} />
        </View>

        <View style={[styles.search, {
        backgroundColor: UI.card,
        borderColor: UI.line
      }]}>
          <Ionicons name="search-outline" size={18} color={UI.mut} />
          <TextInput value={q} onChangeText={setQ} placeholder={translate("Search by requester, location, help type...")} placeholderTextColor={UI.soft} style={[styles.input, {
          color: UI.text
        }]} />
          {!!q && <TouchableOpacity onPress={() => setQ("")}>
              <Ionicons name="close-circle" size={20} color={UI.mut} />
            </TouchableOpacity>}
        </View>

        <View style={styles.filters}>
          {FILTERS.map(item => {
          const active = filter === item;
          return <TouchableOpacity key={item} activeOpacity={0.9} onPress={() => setFilter(item)} style={[styles.filterChip, {
            borderColor: UI.line,
            backgroundColor: active ? UI.accentSoft : UI.card
          }]}>
                <Text style={[styles.filterChipText, {
              color: active ? UI.accent2 : UI.mut
            }]}>{translate(item)}</Text>
              </TouchableOpacity>;
        })}
        </View>

        <View style={[styles.panel, {
        backgroundColor: UI.card,
        borderColor: UI.line
      }]}>
          {loading ? <View style={styles.centerBox}>
              <ActivityIndicator color={UI.accent} />
              <Text style={[styles.centerText, {
            color: UI.mut
          }]}>{translate("Loading help requests...")}</Text>
            </View> : filtered.length === 0 ? <View style={styles.centerBox}>
              <Ionicons name="checkmark-done-outline" size={22} color={UI.good} />
              <Text style={[styles.centerText, {
            color: UI.mut
          }]}>{translate("No donation requests match this view.")}</Text>
            </View> : filtered.map(item => {
          const lifecycle = getLifecycleLabel(item);
          const tone = lifecycleTone(item);
          const progressWidth = `${Math.min(Number(item.progressPercent || 0), 100)}%`;
          const busyAction = submittingKey.split(":");
          const isBusy = busyAction[1] === item._id;
          const progressState = progressById[item._id] || {
            amountReceived: "",
            donorIncrement: "1"
          };
          return <View key={item._id} style={[styles.card, {
            backgroundColor: UI.card2,
            borderColor: UI.line
          }]}>
                  <View style={styles.cardTop}>
                    <View style={styles.cardTopCopy}>
                      <Text style={[styles.cardTitle, {
                  color: UI.text
                }]}>{item.helpType || "Donation Request"}</Text>
                      <Text style={[styles.cardMeta, {
                  color: UI.mut
                }]}>{item.fullName} | {item.location}</Text>
                    </View>
                    <View style={[styles.badge, {
                borderColor: tone
              }]}>
                      <View style={[styles.dot, {
                  backgroundColor: tone
                }]} />
                      <Text style={[styles.badgeText, {
                  color: tone
                }]}>{translate(lifecycle)}</Text>
                    </View>
                  </View>

                  <Text style={[styles.amount, {
              color: UI.text
            }]}>{translate("Need Rs.")}{item.amountNeeded} | {translate("Raised Rs.")}{item.raisedAmount} | {translate("Remaining Rs.")}{item.remainingAmount}</Text>
                  <View style={[styles.progressTrack, {
              backgroundColor: UI.line
            }]}>
                    <View style={[styles.progressFill, {
                backgroundColor: lifecycle === "Funded" ? UI.good : UI.accent,
                width: progressWidth
              }]} />
                  </View>
                  <Text style={[styles.progressText, {
              color: UI.mut
            }]}>{item.progressPercent}% | {translate("Donors")}: {item.donorCount}</Text>

                  <Text style={[styles.desc, {
              color: UI.mut
            }]}>{item.description}</Text>
                  <Text style={[styles.detail, {
              color: UI.mut
            }]}>{translate("Contact:")} {item.contact}</Text>
                  {item?.createdBy?.email ? <Text style={[styles.detail, {
              color: UI.mut
            }]}>{translate("Submitted by:")} {item.createdBy.email}</Text> : null}
                  {!!item.adminNotes && <Text style={[styles.detail, {
              color: UI.text
            }]}>{translate("Review note:")} {item.adminNotes}</Text>}

                  <View style={styles.previewRow}>
                    {item?.qrImage ? <Image source={{
                uri: item.qrImage
              }} style={styles.preview} resizeMode="cover" /> : null}
                    {item?.proofImage ? <Image source={{
                uri: item.proofImage
              }} style={styles.preview} resizeMode="cover" /> : null}
                    {item?.proofVideo ? <View style={[styles.videoFlag, {
                borderColor: UI.line,
                backgroundColor: UI.card
              }]}>
                        <Ionicons name="videocam-outline" size={16} color={UI.accent2} />
                        <Text style={[styles.videoFlagText, {
                  color: UI.text
                }]}>{translate("Proof video uploaded")}</Text>
                      </View> : null}
                  </View>

                  {item.status === "pending" ? <>
                      <Text style={[styles.fieldLabel, {
                color: UI.mut
              }]}>{translate("Admin Notes")}</Text>
                      <TextInput value={notesById[item._id] || ""} onChangeText={value => setNotesById(prev => ({
                ...prev,
                [item._id]: value
              }))} placeholder={translate("Add review notes")} placeholderTextColor={UI.soft} multiline style={[styles.notesInput, {
                color: UI.text,
                borderColor: UI.line,
                backgroundColor: UI.card
              }]} />
                      <View style={styles.actions}>
                        <TouchableOpacity activeOpacity={0.9} onPress={() => updateDecision(item._id, "approve")} disabled={isBusy} style={[styles.btn, {
                  backgroundColor: UI.good,
                  opacity: isBusy ? 0.7 : 1
                }]}>
                          <Text style={styles.btnTxt}>{isBusy && submittingKey.startsWith("approve:") ? translate("Working...") : translate("Approve")}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity activeOpacity={0.9} onPress={() => updateDecision(item._id, "reject")} disabled={isBusy} style={[styles.btn, {
                  backgroundColor: UI.danger,
                  opacity: isBusy ? 0.7 : 1
                }]}>
                          <Text style={styles.btnTxt}>{isBusy && submittingKey.startsWith("reject:") ? translate("Working...") : translate("Reject")}</Text>
                        </TouchableOpacity>
                      </View>
                    </> : null}

                  {item.status === "approved" && !item.isClosed ? <>
                      <Text style={[styles.fieldLabel, {
                color: UI.mut
              }]}>{translate("Update received support")}</Text>
                      <View style={styles.progressInputs}>
                        <TextInput value={progressState.amountReceived} onChangeText={value => setProgressById(prev => ({
                ...prev,
                [item._id]: {
                  ...prev[item._id],
                  amountReceived: value
                }
              }))} placeholder={translate("Amount")} placeholderTextColor={UI.soft} keyboardType="numeric" style={[styles.smallInput, {
                color: UI.text,
                borderColor: UI.line,
                backgroundColor: UI.card
              }]} />
                        <TextInput value={progressState.donorIncrement} onChangeText={value => setProgressById(prev => ({
                ...prev,
                [item._id]: {
                  ...prev[item._id],
                  donorIncrement: value
                }
              }))} placeholder={translate("Donors")} placeholderTextColor={UI.soft} keyboardType="numeric" style={[styles.smallInput, {
                color: UI.text,
                borderColor: UI.line,
                backgroundColor: UI.card
              }]} />
                      </View>

                      <View style={styles.actions}>
                        <TouchableOpacity activeOpacity={0.9} onPress={() => recordProgress(item._id)} disabled={isBusy} style={[styles.btn, {
                  backgroundColor: UI.accent,
                  opacity: isBusy ? 0.7 : 1
                }]}>
                          <Text style={styles.btnTxt}>{isBusy && submittingKey.startsWith("progress:") ? translate("Working...") : translate("Save Progress")}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity activeOpacity={0.9} onPress={() => closeRequest(item._id)} disabled={isBusy} style={[styles.btn, {
                  backgroundColor: UI.soft,
                  opacity: isBusy ? 0.7 : 1
                }]}>
                          <Text style={styles.btnTxt}>{isBusy && submittingKey.startsWith("close:") ? translate("Working...") : translate("Close Request")}</Text>
                        </TouchableOpacity>
                      </View>
                    </> : null}
                </View>;
        })}
        </View>
      </ScrollView>
    </SafeAreaView>;
}

function MetricCard({
  label,
  value,
  color,
  UI
}) {
  return <View style={[styles.metricCard, {
    borderColor: UI.line,
    backgroundColor: UI.card
  }]}>
      <View style={styles.metricTop}>
        <View style={[styles.dot, {
        backgroundColor: color
      }]} />
        <Text style={[styles.metricLabel, {
        color: UI.mut
      }]}>{label}</Text>
      </View>
      <Text style={[styles.metricValue, {
      color: UI.text
    }]}>{value}</Text>
    </View>;
}

const styles = StyleSheet.create({
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
    lineHeight: 19
  },
  statsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 12,
    flexWrap: "wrap"
  },
  metricCard: {
    flex: 1,
    minWidth: 76,
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
    minHeight: 74
  },
  metricTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: "800"
  },
  metricValue: {
    marginTop: 10,
    fontSize: 18,
    fontWeight: "900"
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
  filters: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 12
  },
  filterChip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: "800"
  },
  panel: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 12
  },
  centerBox: {
    padding: 18,
    alignItems: "center"
  },
  centerText: {
    marginTop: 10,
    fontSize: 12,
    fontWeight: "800"
  },
  card: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    marginBottom: 12
  },
  cardTop: {
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-start"
  },
  cardTopCopy: {
    flex: 1
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "900"
  },
  cardMeta: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: "700"
  },
  badge: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 6
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "900"
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 99
  },
  amount: {
    marginTop: 12,
    fontSize: 12,
    fontWeight: "900",
    lineHeight: 18
  },
  progressTrack: {
    width: "100%",
    height: 8,
    borderRadius: 999,
    overflow: "hidden",
    marginTop: 10
  },
  progressFill: {
    height: "100%",
    borderRadius: 999
  },
  progressText: {
    marginTop: 6,
    fontSize: 11,
    fontWeight: "800"
  },
  desc: {
    marginTop: 10,
    fontSize: 13,
    lineHeight: 19
  },
  detail: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 18
  },
  previewRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
    flexWrap: "wrap",
    alignItems: "center"
  },
  preview: {
    width: 88,
    height: 88,
    borderRadius: 12,
    backgroundColor: "#1F2937"
  },
  videoFlag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10
  },
  videoFlagText: {
    fontSize: 12,
    fontWeight: "800"
  },
  fieldLabel: {
    marginTop: 14,
    marginBottom: 8,
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.7
  },
  notesInput: {
    minHeight: 90,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    textAlignVertical: "top"
  },
  progressInputs: {
    flexDirection: "row",
    gap: 10
  },
  smallInput: {
    flex: 1,
    minHeight: 46,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13
  },
  actions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14
  },
  btn: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center"
  },
  btnTxt: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "900"
  }
});
