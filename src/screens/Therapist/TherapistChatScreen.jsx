import React, { useEffect, useMemo, useRef, useState } from "react";
import { SafeAreaView, View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList, KeyboardAvoidingView, Platform, ActivityIndicator, Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Feather from "react-native-vector-icons/Feather";
import call from "react-native-phone-call";
import io from "socket.io-client";
import { openVideoCall } from "../../utils/videoCall";
import { useTranslate } from "../../utils/localization";
const BASE_URL = "http://10.0.2.2:5000";
const ORANGE = "#FF7A1A";

/**
 * TherapistChatScreen
 *
 * route.params:
 * - appointmentId (required)
 * - clientName (required-ish: we fallback to "Client")
 */
export default function TherapistChatScreen({
  navigation,
  route
}) {
  const translate = useTranslate();
  const {
    appointmentId,
    clientName,
    clientPhone
  } = route.params || {};
  const SAFE_NAME = String(clientName || "Client").trim() || "Client";
  const UI = useMemo(() => ({
    bg: "#F4F4F4",
    card: "#FFFFFF",
    text: translate("#111"),
    mut: "#666",
    line: "#E3E3E3",
    orange: ORANGE
  }), []);
  const listRef = useRef(null);
  const socketRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");

  /* ----------------------------- API CALLS ----------------------------- */

  async function apiGetMessages(token) {
    const res = await fetch(`${BASE_URL}/api/chat/conversations/${appointmentId}/messages`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json?.message || "Failed to load messages");
    return json;
  }
  async function apiSendMessage(token, msgText) {
    const res = await fetch(`${BASE_URL}/api/chat/conversations/${appointmentId}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        text: msgText
      })
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json?.message || "Failed to send message");
    return json;
  }

  /* --------------------------- SOCKET.IO --------------------------- */

  const connectSocket = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) return;
      const socket = io(BASE_URL, {
        transports: ["websocket"],
        auth: {
          token: `Bearer ${token}`
        }
      });
      socketRef.current = socket;
      socket.on("connect", () => {
        socket.emit("chat:join", {
          appointmentId: String(appointmentId)
        });
      });
      socket.on("chat:newMessage", payload => {
        if (String(payload?.appointmentId) !== String(appointmentId)) return;
        const msg = payload?.message;
        if (!msg) return;
        setMessages(prev => {
          const exists = prev.some(m => String(m?._id) === String(msg?._id));
          if (exists) return prev;
          return [...prev, msg];
        });
      });
      socket.on("connect_error", () => {
        // ignore, REST still works
      });
    } catch (e) {
      // ignore
    }
  };
  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      try {
        if (listRef.current && messages.length > 0) {
          listRef.current.scrollToEnd({
            animated: true
          });
        }
      } catch (e) {}
    });
  };

  /* ----------------------------- LOAD ----------------------------- */

  const load = async () => {
    try {
      if (!appointmentId) {
        Alert.alert(translate("Error"), translate("Appointment not found"));
        navigation.goBack();
        return;
      }
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
      const json = await apiGetMessages(token);
      setMessages(Array.isArray(json?.messages) ? json.messages : []);
      await connectSocket();
    } catch (e) {
      Alert.alert(translate("Error"), e?.message || "Could not open chat");
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
    return () => {
      try {
        if (socketRef.current) {
          socketRef.current.emit("chat:leave", {
            appointmentId: String(appointmentId)
          });
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

  /* ----------------------------- SEND ----------------------------- */

  const onSend = async () => {
    const trimmed = String(text || "").trim();
    if (!trimmed || sending) return;
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

      // optimistic message
      const tempId = `temp-${Date.now()}`;
      const tempMsg = {
        _id: tempId,
        text: trimmed,
        senderRole: "therapist",
        createdAt: new Date().toISOString(),
        pending: true
      };
      setMessages(prev => [...prev, tempMsg]);
      setText("");
      const json = await apiSendMessage(token, trimmed);
      const saved = json?.message;
      if (saved) {
        setMessages(prev => prev.map(m => String(m._id) === String(tempId) ? saved : m));
      }
    } catch (e) {
      Alert.alert(translate("Send failed"), e?.message || "Message not sent");
    } finally {
      setSending(false);
    }
  };
  const onVideoCall = () => {
    openVideoCall({
      appointmentId,
      serviceType: "therapy",
      participantName: SAFE_NAME
    });
  };
  const onCall = async () => {
    const phone = String(clientPhone || "").trim();
    if (!phone) {
      Alert.alert(translate("Phone unavailable"), translate("This client has not added a phone number yet."));
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

  /* ----------------------------- RENDER ----------------------------- */

  const renderItem = ({
    item
  }) => {
    const role = String(item?.senderRole || "").toLowerCase();
    const isMe = role === "therapist";
    const nameLabel = isMe ? "You" : SAFE_NAME;
    return <View style={[styles.bubbleRow, isMe ? styles.rowMe : styles.rowOther]}>
        <View style={[styles.bubbleWrap, isMe ? styles.wrapMe : styles.wrapOther]}>
          {/* Name label */}
          <Text style={[styles.nameLabel, isMe ? styles.nameMe : styles.nameOther]}>
            {nameLabel}
          </Text>

          {/* Bubble */}
          <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleOther, item?.pending ? styles.pendingBubble : null]}>
            <Text style={styles.bubbleText}>{item?.text || ""}</Text>
            <Text style={styles.timeText}>
              {item?.createdAt ? new Date(item.createdAt).toLocaleTimeString() : ""}
            </Text>
          </View>
        </View>
      </View>;
  };
  return <SafeAreaView style={[styles.container, {
    backgroundColor: UI.bg
  }]}>
      {/* Header */}
      <View style={[styles.header, {
      borderBottomColor: UI.line,
      backgroundColor: UI.card
    }]}>
        <TouchableOpacity style={styles.backRow} onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={20} color={UI.text} />
          <Text style={[styles.headerTitle, {
          color: UI.text
        }]} numberOfLines={1}>
            {`Chat with ${SAFE_NAME}`}
          </Text>
        </TouchableOpacity>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.callBtn} onPress={onCall} activeOpacity={0.88}>
            <Feather name="phone-call" size={16} color={UI.text} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.videoBtn} onPress={onVideoCall} activeOpacity={0.88}>
            <Feather name="video" size={16} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      {loading ? <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={UI.orange} />
          <Text style={[styles.loadingTxt, {
        color: UI.mut
      }]}>{translate("Opening chatâ€¦")}</Text>
        </View> : <KeyboardAvoidingView style={styles.flexFill} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <FlatList ref={listRef} data={messages} keyExtractor={it => String(it?._id || it?.id || Math.random())} renderItem={renderItem} contentContainerStyle={styles.chatBody} showsVerticalScrollIndicator={false} onContentSizeChange={scrollToBottom} />

          {/* Input Bar */}
          <View style={[styles.inputBar, {
        backgroundColor: UI.card,
        borderTopColor: UI.line
      }]}>
            <TextInput value={text} onChangeText={setText} placeholder={translate("Type a messageâ€¦")} placeholderTextColor="#9A9A9A" style={[styles.input, {
          borderColor: UI.line
        }]} multiline />

            <TouchableOpacity activeOpacity={0.85} style={[styles.sendBtn, sending && styles.sendBtnDisabled]} onPress={onSend} disabled={sending}>
              {sending ? <ActivityIndicator color="#fff" /> : <Feather name="send" size={18} color="#fff" />}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>}
    </SafeAreaView>;
}
const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  flexFill: {
    flex: 1
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10
  },
  backRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "900",
    flex: 1
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  callBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#F7F7F7",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E8E8E8"
  },
  videoBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: ORANGE,
    alignItems: "center",
    justifyContent: "center"
  },
  loadingWrap: {
    paddingTop: 50,
    alignItems: "center"
  },
  loadingTxt: {
    marginTop: 10,
    fontWeight: "800"
  },
  chatBody: {
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 10
  },
  bubbleRow: {
    marginBottom: 12,
    flexDirection: "row"
  },
  rowMe: {
    justifyContent: "flex-end"
  },
  rowOther: {
    justifyContent: "flex-start"
  },
  bubbleWrap: {
    maxWidth: "82%"
  },
  wrapMe: {
    alignItems: "flex-end"
  },
  wrapOther: {
    alignItems: "flex-start"
  },
  nameLabel: {
    fontSize: 11,
    fontWeight: "900",
    marginBottom: 6
  },
  nameMe: {
    color: ORANGE
  },
  nameOther: {
    color: "#444"
  },
  bubble: {
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#EEE"
  },
  // Therapist bubble
  bubbleMe: {
    backgroundColor: "#FFF4E8"
  },
  // Client bubble
  bubbleOther: {
    backgroundColor: "#FFFFFF"
  },
  bubbleText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111"
  },
  timeText: {
    marginTop: 6,
    fontSize: 10,
    fontWeight: "700",
    color: "#777"
  },
  pendingBubble: {
    opacity: 0.65
  },
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
    padding: 12,
    borderTopWidth: 1
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
    borderWidth: 1
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
    shadowOffset: {
      width: 0,
      height: 3
    }
  },
  sendBtnDisabled: {
    opacity: 0.7
  }
});