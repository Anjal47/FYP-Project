import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  AppState,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Icon from "react-native-vector-icons/Feather";
import { io } from "socket.io-client";

const ORANGE = "#FF7A1A";
const BASE_URL = "http://10.0.2.2:5000";

/**
 * ✅ CHAT API
 * GET  /api/chat/conversations/:appointmentId/messages
 * POST /api/chat/conversations/:appointmentId/messages   { text }
 */

async function apiGetMessages(token, appointmentId) {
  const res = await fetch(`${BASE_URL}/api/chat/conversations/${appointmentId}/messages`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.message || "Failed to load messages");
  return json; // { ok:true, messages:[...] }
}

async function apiSendMessage(token, appointmentId, text) {
  const res = await fetch(`${BASE_URL}/api/chat/conversations/${appointmentId}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ text }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.message || "Failed to send message");
  return json; // { ok:true, message:{...} }
}

const safeTime = (iso) => {
  try {
    if (!iso) return "";
    return new Date(iso).toLocaleTimeString();
  } catch {
    return "";
  }
};

export default function CounselingChatScreen({ navigation, route }) {
  const { appointmentId, counsellorName } = route.params || {};

  const UI = useMemo(
    () => ({
      bg: "#F4F4F4",
      card: "#FFFFFF",
      text: "#111",
      mut: "#666",
      line: "#E3E3E3",
      orange: ORANGE,
    }),
    []
  );

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
          listRef.current.scrollToEnd({ animated: true });
        } catch {}
      }
    });
  };

  const load = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        navigation.reset({ index: 0, routes: [{ name: "Login" }] });
        return;
      }
      tokenRef.current = token;

      const json = await apiGetMessages(token, appointmentId);
      setMessages(Array.isArray(json?.messages) ? json.messages : []);
    } catch (e) {
      Alert.alert("Error", e?.message || "Could not load chat");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Dedup helper: prevent duplicates from REST optimistic + socket echo
  const addMessageIfNotExists = (msg) => {
    if (!msg) return;
    setMessages((prev) => {
      const id = String(msg?._id || msg?.id || "");
      if (!id) return prev;

      const exists = prev.some((m) => String(m?._id || m?.id || "") === id);
      return exists ? prev : [...prev, msg];
    });
  };

  // ✅ Setup socket (real-time)
  const setupSocket = async () => {
    try {
      const token = tokenRef.current || (await AsyncStorage.getItem("token"));
      if (!token) return;

      // avoid reconnect duplication
      if (socketRef.current) return;

      const socket = io(BASE_URL, {
        transports: ["websocket"],
        auth: { token },
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 600,
      });

      socketRef.current = socket;

      socket.on("connect", () => {
        setSocketReady(true);
        socket.emit("chat:join", { appointmentId });
      });

      socket.on("disconnect", () => {
        setSocketReady(false);
      });

      socket.on("chat:joined", () => {});

      socket.on("chat:error", (payload) => {
        const msg = payload?.message || "Socket error";
        // do not spam alerts
        console.log("chat:error:", msg);
      });

      // ✅ receive new messages instantly
      socket.on("chat:newMessage", ({ appointmentId: apptId, message }) => {
        if (String(apptId) === String(appointmentId)) {
          addMessageIfNotExists(message);
        }
      });

      // optional typing:
      // socket.on("chat:typing", ({ typing, userId }) => { ... });
    } catch (e) {
      console.log("socket setup error:", e?.message);
    }
  };

  // ✅ Clean up socket
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

    return () => {
      teardownSocket();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ✅ When app comes back foreground, reconnect socket if needed
  useEffect(() => {
    const sub = AppState.addEventListener("change", (nextAppState) => {
      const prev = appStateRef.current;
      appStateRef.current = nextAppState;

      // background -> active
      if (prev.match(/inactive|background/) && nextAppState === "active") {
        if (!socketRef.current) setupSocket();
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
        navigation.reset({ index: 0, routes: [{ name: "Login" }] });
        return;
      }

      // ✅ optimistic UI
      const tempId = `temp-${Date.now()}`;
      const tempMsg = {
        _id: tempId,
        text: trimmed,
        senderRole: "user",
        createdAt: new Date().toISOString(),
        pending: true,
      };

      setMessages((prev) => [...prev, tempMsg]);
      setText("");

      const json = await apiSendMessage(token, appointmentId, trimmed);
      const saved = json?.message;

      if (saved) {
        // replace temp with saved
        setMessages((prev) => prev.map((m) => (m._id === tempId ? saved : m)));
      }
      // socket will also broadcast; dedup prevents duplicates
    } catch (e) {
      Alert.alert("Send failed", e?.message || "Message not sent");
    } finally {
      setSending(false);
    }
  };

  const renderItem = ({ item }) => {
    const isMe = String(item?.senderRole || "").toLowerCase() === "user";

    return (
      <View
        style={[
          styles.bubbleRow,
          isMe ? { justifyContent: "flex-end" } : { justifyContent: "flex-start" },
        ]}
      >
        <View
          style={[
            styles.bubble,
            isMe ? styles.bubbleMe : styles.bubbleOther,
            item?.pending ? { opacity: 0.6 } : null,
          ]}
        >
          <Text style={styles.bubbleText}>{item?.text || ""}</Text>

          <View style={styles.metaRow}>
            {!isMe ? (
              <Icon name="user" size={12} color="#777" />
            ) : (
              <Icon name={item?.pending ? "clock" : "check"} size={12} color="#777" />
            )}
            <Text style={styles.timeText}>{safeTime(item?.createdAt)}</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: UI.bg }]}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backRow} onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={20} color={UI.text} />
          <Text style={styles.headerTitle} numberOfLines={1}>
            {counsellorName || "Chat"}
          </Text>
        </TouchableOpacity>

        <View style={styles.statusPill}>
          <View
            style={[
              styles.dot,
              { backgroundColor: socketReady ? "#22C55E" : "#F59E0B" },
            ]}
          />
          <Text style={styles.statusTxt}>{socketReady ? "Live" : "Connecting"}</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={UI.orange} />
          <Text style={styles.loadingTxt}>Opening chat…</Text>
        </View>
      ) : (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(it) => String(it?._id || it?.id || Math.random())}
            renderItem={renderItem}
            contentContainerStyle={styles.chatBody}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={scrollToBottom}
          />

          {/* INPUT BAR */}
          <View style={styles.inputBar}>
            <TextInput
              value={text}
              onChangeText={setText}
              placeholder="Type a message…"
              placeholderTextColor="#9A9A9A"
              style={styles.input}
              multiline
            />

            <TouchableOpacity
              activeOpacity={0.85}
              style={[styles.sendBtn, sending ? { opacity: 0.7 } : null]}
              onPress={onSend}
              disabled={sending}
            >
              {sending ? <ActivityIndicator color="#fff" /> : <Icon name="send" size={18} color="#fff" />}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  header: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: "#E3E3E3",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  backRow: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  headerTitle: { fontSize: 18, fontWeight: "900", color: "#111", flex: 1 },

  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#F6F6F6",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "#EAEAEA",
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  statusTxt: { fontSize: 12, fontWeight: "900", color: "#555" },

  loadingWrap: { paddingTop: 50, alignItems: "center" },
  loadingTxt: { marginTop: 10, fontWeight: "800", color: "#666" },

  chatBody: { paddingHorizontal: 14, paddingTop: 14, paddingBottom: 10 },

  bubbleRow: { marginBottom: 10, flexDirection: "row" },
  bubble: {
    maxWidth: "80%",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#EEE",
  },
  bubbleMe: { backgroundColor: "#FFF4E8" },
  bubbleOther: { backgroundColor: "#FFFFFF" },

  bubbleText: { fontSize: 14, fontWeight: "700", color: "#111" },

  metaRow: { marginTop: 8, flexDirection: "row", alignItems: "center", gap: 6 },
  timeText: { fontSize: 10, fontWeight: "800", color: "#777" },

  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
    padding: 12,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#EEE",
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 110,
    borderRadius: 14,
    backgroundColor: "#F2F2F2",
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    fontWeight: "700",
    color: "#111",
    borderWidth: 1,
    borderColor: "#E3E3E3",
  },
  sendBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: ORANGE,
    alignItems: "center",
    justifyContent: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 7,
    shadowOffset: { width: 0, height: 3 },
  },
});
