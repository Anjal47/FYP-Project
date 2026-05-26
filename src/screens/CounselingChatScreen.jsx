import React, { useEffect, useMemo, useRef, useState } from "react";
import { SafeAreaView, View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList, KeyboardAvoidingView, Platform, ActivityIndicator, Alert, AppState } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Icon from "react-native-vector-icons/Feather";
import call from "react-native-phone-call";
import { io } from "socket.io-client";
import { useAppTheme } from "../context/ThemeContext";
import { openVideoCall } from "../utils/videoCall";
import { useTranslate } from "../utils/localization";
const BASE_URL = "http://10.0.2.2:5000";
async function apiGetMessages(token, appointmentId) {
  const res = await fetch(`${BASE_URL}/api/chat/conversations/${appointmentId}/messages`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.message || "Failed to load messages");
  return json;
}
async function apiSendMessage(token, appointmentId, text) {
  const res = await fetch(`${BASE_URL}/api/chat/conversations/${appointmentId}/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      text
    })
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.message || "Failed to send message");
  return json;
}
const safeTime = iso => {
  try {
    if (!iso) return "";
    return new Date(iso).toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit"
    });
  } catch {
    return "";
  }
};
export default function CounselingChatScreen({
  navigation,
  route
}) {
  const translate = useTranslate();
  const {
    appointmentId,
    counsellorName,
    counsellorPhone
  } = route.params || {};
  const {
    theme,
    isDark
  } = useAppTheme();
  const styles = useMemo(() => StyleSheet.create(createStyles(theme, isDark)), [theme, isDark]);
  const listRef = useRef(null);
  const socketRef = useRef(null);
  const tokenRef = useRef(null);
  const appStateRef = useRef(AppState.currentState);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [socketReady, setSocketReady] = useState(false);
  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      if (listRef.current && messages.length > 0) {
        try {
          listRef.current.scrollToEnd({
            animated: true
          });
        } catch {}
      }
    });
  };
  const load = async () => {
    try {
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
      tokenRef.current = token;
      const json = await apiGetMessages(token, appointmentId);
      setMessages(Array.isArray(json?.messages) ? json.messages : []);
    } catch (error) {
      Alert.alert(translate("Error"), error?.message || "Could not load chat");
    } finally {
      setLoading(false);
    }
  };
  const addMessageIfNotExists = msg => {
    if (!msg) return;
    setMessages(prev => {
      const id = String(msg?._id || msg?.id || "");
      if (!id) return prev;
      const exists = prev.some(item => String(item?._id || item?.id || "") === id);
      return exists ? prev : [...prev, msg];
    });
  };
  const setupSocket = async () => {
    try {
      const token = tokenRef.current || (await AsyncStorage.getItem("token"));
      if (!token || socketRef.current) return;
      const socket = io(BASE_URL, {
        transports: ["websocket"],
        auth: {
          token
        },
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 600
      });
      socketRef.current = socket;
      socket.on("connect", () => {
        setSocketReady(true);
        socket.emit("chat:join", {
          appointmentId
        });
      });
      socket.on("disconnect", () => {
        setSocketReady(false);
      });
      socket.on("chat:newMessage", ({
        appointmentId: apptId,
        message
      }) => {
        if (String(apptId) === String(appointmentId)) addMessageIfNotExists(message);
      });
    } catch {}
  };
  const teardownSocket = () => {
    try {
      if (socketRef.current) {
        socketRef.current.removeAllListeners();
        socketRef.current.disconnect();
      }
    } catch {}
    socketRef.current = null;
    setSocketReady(false);
  };
  useEffect(() => {
    load();
    setupSocket();
    return () => teardownSocket();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    const sub = AppState.addEventListener("change", nextState => {
      const prev = appStateRef.current;
      appStateRef.current = nextState;
      if (prev.match(/inactive|background/) && nextState === "active" && !socketRef.current) {
        setupSocket();
      }
    });
    return () => sub.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    scrollToBottom();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages.length]);
  const onSend = async () => {
    const trimmed = String(text || "").trim();
    if (!trimmed) return;
    try {
      setSending(true);
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
      const tempId = `temp-${Date.now()}`;
      const tempMsg = {
        _id: tempId,
        text: trimmed,
        senderRole: "user",
        createdAt: new Date().toISOString(),
        pending: true
      };
      setMessages(prev => [...prev, tempMsg]);
      setText("");
      const json = await apiSendMessage(token, appointmentId, trimmed);
      const saved = json?.message;
      if (saved) {
        setMessages(prev => prev.map(m => m._id === tempId ? saved : m));
      }
    } catch (error) {
      Alert.alert(translate("Send failed"), error?.message || "Message not sent");
    } finally {
      setSending(false);
    }
  };
  const onVideoCall = () => {
    openVideoCall({
      appointmentId,
      serviceType: "counseling",
      participantName: counsellorName || "Counsellor"
    });
  };
  const onCall = async () => {
    const phone = String(counsellorPhone || "").trim();
    if (!phone) {
      Alert.alert(translate("Phone unavailable"), translate("This counsellor has not added a phone number yet."));
      return;
    }
    try {
      await call({
        number: phone,
        prompt: true
      });
    } catch (error) {
      Alert.alert(translate("Call failed"), error?.message || "Could not open the phone dialer.");
    }
  };
  const renderItem = ({
    item
  }) => {
    const isMe = String(item?.senderRole || "").toLowerCase() === "user";
    return <View style={[styles.bubbleRow, isMe ? styles.bubbleRowMe : styles.bubbleRowOther]}>
        <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleOther, item?.pending && styles.pendingBubble]}>
          <Text style={[styles.bubbleText, isMe && styles.bubbleTextMe]}>{item?.text || ""}</Text>
          <View style={styles.metaRow}>
            <Text style={[styles.timeText, isMe && styles.timeTextMe]}>{safeTime(item?.createdAt)}</Text>
            {isMe ? <Icon name={item?.pending ? "clock" : "check"} size={11} color={isMe ? "rgba(255,255,255,0.8)" : theme.muted} /> : null}
          </View>
        </View>
      </View>;
  };
  return <SafeAreaView style={styles.container}>
      <View style={styles.hero}>
        <TouchableOpacity style={styles.backRow} onPress={() => navigation.goBack()} activeOpacity={0.85}>
          <View style={styles.backIconWrap}>
            <Icon name="arrow-left" size={18} color={theme.text} />
          </View>
          <View style={styles.headerCopy}>
            <Text style={styles.eyebrow}>{translate("Counseling Chat")}</Text>
            <Text style={styles.headerTitle} numberOfLines={1}>{counsellorName || "Counsellor"}</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.headerRight}>
          <View style={styles.statusPill}>
            <View style={[styles.statusDot, {
            backgroundColor: socketReady ? theme.success : theme.accentStrong
          }]} />
            <Text style={styles.statusText}>{socketReady ? "Live" : "Connecting"}</Text>
          </View>
          <TouchableOpacity style={styles.callBtn} onPress={onCall} activeOpacity={0.88}>
            <Icon name="phone-call" size={16} color={theme.text} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.videoBtn} onPress={onVideoCall} activeOpacity={0.88}>
            <Icon name="video" size={16} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      {loading ? <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={theme.accentStrong} />
          <Text style={styles.loadingText}>{translate("Opening chat...")}</Text>
        </View> : <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <FlatList ref={listRef} data={messages} keyExtractor={item => String(item?._id || item?.id || Math.random())} renderItem={renderItem} contentContainerStyle={styles.chatBody} showsVerticalScrollIndicator={false} onContentSizeChange={scrollToBottom} ListEmptyComponent={<View style={styles.emptyState}>
                <Icon name="message-square" size={18} color={theme.accentStrong} />
                <Text style={styles.emptyText}>{translate("Start the conversation when you're ready.")}</Text>
              </View>} />

          <View style={styles.composerShell}>
            <View style={styles.inputWrap}>
              <TextInput value={text} onChangeText={setText} placeholder={translate("Type a message...")} placeholderTextColor={theme.muted} style={styles.input} multiline />
            </View>

            <TouchableOpacity activeOpacity={0.88} style={[styles.sendBtn, sending && styles.sendBtnDisabled]} onPress={onSend} disabled={sending}>
              {sending ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Icon name="send" size={17} color="#FFFFFF" />}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>}
    </SafeAreaView>;
}
function createStyles(theme, isDark) {
  return {
    container: {
      flex: 1,
      backgroundColor: theme.background
    },
    flex: {
      flex: 1
    },
    hero: {
      backgroundColor: theme.surface,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
      paddingHorizontal: 14,
      paddingTop: 10,
      paddingBottom: 14,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12
    },
    backRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      flex: 1
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
    headerCopy: {
      flex: 1
    },
    eyebrow: {
      color: theme.accentStrong,
      fontSize: 10,
      fontWeight: "800",
      letterSpacing: 1,
      textTransform: "uppercase"
    },
    headerTitle: {
      marginTop: 4,
      fontSize: 15,
      fontWeight: "800",
      color: theme.text
    },
    headerRight: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8
    },
    statusPill: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      backgroundColor: theme.surfaceSoft,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 999,
      paddingHorizontal: 10,
      paddingVertical: 7
    },
    statusDot: {
      width: 8,
      height: 8,
      borderRadius: 4
    },
    statusText: {
      color: theme.text,
      fontSize: 11,
      fontWeight: "700"
    },
    videoBtn: {
      width: 38,
      height: 38,
      borderRadius: 19,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.accentStrong,
      borderWidth: 1,
      borderColor: theme.accentStrong
    },
    callBtn: {
      width: 38,
      height: 38,
      borderRadius: 19,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.surfaceSoft,
      borderWidth: 1,
      borderColor: theme.border
    },
    loadingWrap: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center"
    },
    loadingText: {
      marginTop: 10,
      color: theme.muted,
      fontSize: 13,
      fontWeight: "700"
    },
    chatBody: {
      paddingHorizontal: 12,
      paddingTop: 12,
      paddingBottom: 18
    },
    emptyState: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      backgroundColor: theme.surface,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 14,
      marginTop: 8
    },
    emptyText: {
      color: theme.text,
      fontSize: 12,
      fontWeight: "700"
    },
    bubbleRow: {
      flexDirection: "row",
      marginBottom: 10
    },
    bubbleRowMe: {
      justifyContent: "flex-end"
    },
    bubbleRowOther: {
      justifyContent: "flex-start"
    },
    bubble: {
      maxWidth: "82%",
      borderRadius: 22,
      paddingHorizontal: 14,
      paddingVertical: 11,
      borderWidth: 1
    },
    bubbleMe: {
      backgroundColor: theme.accentStrong,
      borderColor: theme.accentStrong,
      borderBottomRightRadius: 8
    },
    bubbleOther: {
      backgroundColor: theme.surface,
      borderColor: theme.border,
      borderBottomLeftRadius: 8
    },
    pendingBubble: {
      opacity: 0.7
    },
    bubbleText: {
      color: theme.text,
      fontSize: 13,
      lineHeight: 19,
      fontWeight: "600"
    },
    bubbleTextMe: {
      color: "#FFFFFF"
    },
    metaRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      marginTop: 8,
      justifyContent: "flex-end"
    },
    timeText: {
      color: theme.muted,
      fontSize: 10,
      fontWeight: "700"
    },
    timeTextMe: {
      color: "rgba(255,255,255,0.8)"
    },
    composerShell: {
      flexDirection: "row",
      alignItems: "flex-end",
      gap: 10,
      paddingHorizontal: 12,
      paddingTop: 8,
      paddingBottom: Platform.OS === "ios" ? 18 : 12,
      backgroundColor: theme.surface,
      borderTopWidth: 1,
      borderTopColor: theme.border
    },
    inputWrap: {
      flex: 1,
      minHeight: 48,
      maxHeight: 118,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.surfaceSoft,
      paddingHorizontal: 14,
      justifyContent: "center"
    },
    input: {
      color: theme.text,
      fontSize: 13,
      lineHeight: 19,
      paddingVertical: 12,
      maxHeight: 96
    },
    sendBtn: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: theme.accentStrong,
      alignItems: "center",
      justifyContent: "center",
      shadowColor: "#000",
      shadowOpacity: isDark ? 0.28 : 0.16,
      shadowRadius: 10,
      shadowOffset: {
        width: 0,
        height: 4
      },
      elevation: 5
    },
    sendBtnDisabled: {
      opacity: 0.75
    }
  };
}