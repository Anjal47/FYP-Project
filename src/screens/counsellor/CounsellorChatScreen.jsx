import React, { useEffect, useRef, useState } from "react";
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
import Feather from "react-native-vector-icons/Feather";
import io from "socket.io-client";

const BASE_URL = "http://10.0.2.2:5000";
const ORANGE = "#FF7A1A";

export default function CounsellorChatScreen({ route, navigation }) {
  const { appointmentId, userName } = route.params || {};
  const socketRef = useRef(null);
  const listRef = useRef(null);

  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const scrollBottom = () => {
    requestAnimationFrame(() => {
      listRef.current?.scrollToEnd({ animated: true });
    });
  };

  const loadMessages = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const res = await fetch(`${BASE_URL}/api/chat/conversations/${appointmentId}/messages`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      setMessages(data.messages || []);
      connectSocket(token);
    } catch (e) {
      Alert.alert("Chat Error", e.message);
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const connectSocket = (token) => {
    const socket = io(BASE_URL, {
      transports: ["websocket"],
      auth: { token: `Bearer ${token}` },
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("chat:join", { appointmentId });
    });

    socket.on("chat:newMessage", ({ message }) => {
      setMessages((prev) => [...prev, message]);
    });
  };

  useEffect(() => {
    loadMessages();
    return () => socketRef.current?.disconnect();
  }, []);

  useEffect(scrollBottom, [messages]);

  const send = async () => {
    if (!text.trim()) return;

    try {
      setSending(true);
      const token = await AsyncStorage.getItem("token");

      const res = await fetch(`${BASE_URL}/api/chat/conversations/${appointmentId}/messages`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      setMessages((p) => [...p, data.message]);
      setText("");
    } catch (e) {
      Alert.alert("Send Failed", e.message);
    } finally {
      setSending(false);
    }
  };

  const renderItem = ({ item }) => {
    const isMe = item.senderRole === "counsellor";
    return (
      <View style={[s.row, isMe ? s.right : s.left]}>
        <View style={[s.bubble, isMe ? s.me : s.other]}>
          <Text style={s.msg}>{item.text}</Text>
          <Text style={s.time}>{new Date(item.createdAt).toLocaleTimeString()}</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={22} />
        </TouchableOpacity>
        <Text style={s.headerTxt}>{userName || "Chat"}</Text>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={ORANGE} />
      ) : (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <FlatList
            ref={listRef}
            data={messages}
            renderItem={renderItem}
            keyExtractor={(i) => i._id}
            contentContainerStyle={{ padding: 14 }}
          />

          <View style={s.inputBar}>
            <TextInput
              value={text}
              onChangeText={setText}
              placeholder="Type message..."
              style={s.input}
              multiline
            />
            <TouchableOpacity style={s.send} onPress={send} disabled={sending}>
              {sending ? <ActivityIndicator color="#fff" /> : <Feather name="send" size={18} color="#fff" />}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F4F4F4" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
  headerTxt: { fontSize: 18, fontWeight: "900" },
  row: { marginBottom: 10, flexDirection: "row" },
  left: { justifyContent: "flex-start" },
  right: { justifyContent: "flex-end" },
  bubble: {
    maxWidth: "75%",
    padding: 12,
    borderRadius: 16,
  },
  me: { backgroundColor: "#FFF4E8" },
  other: { backgroundColor: "#fff" },
  msg: { fontSize: 14, fontWeight: "700" },
  time: { fontSize: 10, color: "#777", marginTop: 4 },
  inputBar: {
    flexDirection: "row",
    padding: 10,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderColor: "#eee",
  },
  input: {
    flex: 1,
    backgroundColor: "#F2F2F2",
    borderRadius: 14,
    padding: 10,
    fontWeight: "700",
  },
  send: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: ORANGE,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
});
