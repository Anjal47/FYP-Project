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
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Icon from "react-native-vector-icons/Feather";
import io from "socket.io-client";

const ORANGE = "#FF7A1A";
const BASE_URL = "http://10.0.2.2:5000";

/**
 * TherapyChatScreen
 * ✅ Same chat backend endpoints used for both counselor + therapist.
 * ✅ Real-time via Socket.IO + saves messages in DB.
 *
 * Expects route.params:
 * - appointmentId (string)
 * - therapistName (string)
 */
export default function TherapyChatScreen({ navigation, route }) {
  const { appointmentId, therapistName } = route.params || {};

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

  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");

  async function apiGetMessages(token) {
    const res = await fetch(`${BASE_URL}/api/chat/conversations/${appointmentId}/messages`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json?.message || "Failed to load messages");
    return json;
  }

  async function apiSendMessage(token, msgText) {
    const res = await fetch(`${BASE_URL}/api/chat/conversations/${appointmentId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ text: msgText }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json?.message || "Failed to send message");
    return json;
  }

  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      if (listRef.current && messages.length > 0) {
        listRef.current.scrollToEnd({ animated: true });
      }
    });
  };

  const connectSocket = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) return;

      // IMPORTANT: use auth header for socket (server must read it)
      const socket = io(BASE_URL, {
        transports: ["websocket"],
        auth: { token: `Bearer ${token}` },
      });

      socketRef.current = socket;

      socket.on("connect", () => {
        // join appointment room
        socket.emit("chat:join", { appointmentId: String(appointmentId) });
      });

      socket.on("chat:newMessage", (payload) => {
        if (String(payload?.appointmentId) !== String(appointmentId)) return;
        const msg = payload?.message;
        if (!msg) return;

        setMessages((prev) => {
          // avoid duplicates
          const exists = prev.some((m) => String(m?._id) === String(msg?._id));
          if (exists) return prev;
          return [...prev, msg];
        });
      });

      socket.on("connect_error", () => {
        // don’t annoy user – realtime will silently fail but REST will work
      });
    } catch (e) {
      // ignore
    }
  };

  const load = async () => {
    try {
      if (!appointmentId) {
        Alert.alert("Missing appointment", "No appointmentId found for this chat.");
        navigation.goBack();
        return;
      }

      const token = await AsyncStorage.getItem("token");
      if (!token) {
        navigation.reset({ index: 0, routes: [{ name: "Login" }] });
        return;
      }

      const json = await apiGetMessages(token);
      setMessages(Array.isArray(json?.messages) ? json.messages : []);
      await connectSocket();
    } catch (e) {
      Alert.alert("Error", e?.message || "Could not open chat");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    return () => {
      try {
        if (socketRef.current) {
          socketRef.current.emit("chat:leave", { appointmentId: String(appointmentId) });
          socketRef.current.disconnect();
        }
      } catch (e) {}
    };
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

      // optimistic UI
      const tempMsg = {
        _id: `temp-${Date.now()}`,
        text: trimmed,
        senderRole: "user",
        createdAt: new Date().toISOString(),
        pending: true,
      };

      setMessages((prev) => [...prev, tempMsg]);
      setText("");

      const json = await apiSendMessage(token, trimmed);
      const saved = json?.message;

      if (saved) {
        setMessages((prev) => prev.map((m) => (m._id === tempMsg._id ? saved : m)));
      }
    } catch (e) {
      Alert.alert("Send failed", e?.message || "Message not sent");
    } finally {
      setSending(false);
    }
  };

  const renderItem = ({ item }) => {
    const isMe = String(item?.senderRole || "").toLowerCase() === "user";

    return (
      <View style={[styles.bubbleRow, isMe ? { justifyContent: "flex-end" } : { justifyContent: "flex-start" }]}>
        <View
          style={[
            styles.bubble,
            isMe ? styles.bubbleMe : styles.bubbleOther,
            item?.pending ? { opacity: 0.6 } : null,
          ]}
        >
          <Text style={styles.bubbleText}>{item?.text || ""}</Text>
          <Text style={styles.timeText}>
            {item?.createdAt ? new Date(item.createdAt).toLocaleTimeString() : ""}
          </Text>
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
            {therapistName || "Therapist Chat"}
          </Text>
        </TouchableOpacity>
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
  },
  backRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  headerTitle: { fontSize: 18, fontWeight: "900", color: "#111", flex: 1 },

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
  timeText: { marginTop: 6, fontSize: 10, fontWeight: "700", color: "#777" },

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
