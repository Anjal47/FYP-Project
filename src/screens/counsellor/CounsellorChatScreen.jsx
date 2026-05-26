import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SafeAreaView, View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList, KeyboardAvoidingView, Platform, ActivityIndicator, Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Feather from "react-native-vector-icons/Feather";
import call from "react-native-phone-call";
import io from "socket.io-client";
import { useAppTheme } from "../../context/ThemeContext";
import { openVideoCall } from "../../utils/videoCall";
import { useTranslate } from "../../utils/localization";
const BASE_URL = "http://10.0.2.2:5000";
export default function CounsellorChatScreen({
  route,
  navigation
}) {
  const translate = useTranslate();
  const {
    theme,
    isDark
  } = useAppTheme();
  const styles = useMemo(() => StyleSheet.create(createStyles(theme, isDark)), [theme, isDark]);
  const {
    appointmentId,
    userName,
    userPhone
  } = route.params || {};
  const socketRef = useRef(null);
  const listRef = useRef(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const scrollBottom = () => {
    requestAnimationFrame(() => {
      listRef.current?.scrollToEnd({
        animated: true
      });
    });
  };
  const connectSocket = useCallback(token => {
    const socket = io(BASE_URL, {
      transports: ["websocket"],
      auth: {
        token: `Bearer ${token}`
      }
    });
    socketRef.current = socket;
    socket.on("connect", () => {
      socket.emit("chat:join", {
        appointmentId
      });
    });
    socket.on("chat:newMessage", ({
      message
    }) => {
      setMessages(prev => [...prev, message]);
    });
  }, [appointmentId]);
  const loadMessages = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const res = await fetch(`${BASE_URL}/api/chat/conversations/${appointmentId}/messages`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "Failed to load chat");
      setMessages(Array.isArray(data?.messages) ? data.messages : []);
      connectSocket(token);
    } catch (error) {
      Alert.alert(translate("Chat Error"), error?.message || "Could not open this conversation");
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  }, [appointmentId, connectSocket, navigation]);
  useEffect(() => {
    loadMessages();
    return () => socketRef.current?.disconnect();
  }, [loadMessages]);
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
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          text: text.trim()
        })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "Failed to send message");
      setMessages(prev => [...prev, data.message]);
      setText("");
    } catch (error) {
      Alert.alert(translate("Send Failed"), error?.message || "Could not send the message");
    } finally {
      setSending(false);
    }
  };
  const onVideoCall = () => {
    openVideoCall({
      appointmentId,
      serviceType: "counseling",
      participantName: userName || "Client"
    });
  };
  const onCall = async () => {
    const phone = String(userPhone || "").trim();
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
  const renderItem = ({
    item
  }) => {
    const isMe = item.senderRole === "counsellor";
    return <View style={[styles.row, isMe ? styles.right : styles.left]}>
        <View style={[styles.bubble, isMe ? styles.me : styles.other]}>
          <Text style={[styles.msg, isMe && styles.msgLight]}>{item.text}</Text>
          <Text style={[styles.time, isMe && styles.timeLight]}>
            {new Date(item.createdAt).toLocaleTimeString([], {
            hour: "numeric",
            minute: "2-digit"
          })}
          </Text>
        </View>
      </View>;
  };
  return <SafeAreaView style={styles.container}>
      <View style={styles.hero}>
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.backRow} onPress={() => navigation.goBack()} activeOpacity={0.88}>
            <View style={styles.backIconWrap}>
              <Feather name="arrow-left" size={18} color={theme.text} />
            </View>
            <View style={styles.backCopy}>
              <Text style={styles.eyebrow}>{translate("Counsellor Chat")}</Text>
              <Text style={styles.heroTitle}>{userName || "Conversation"}</Text>
            </View>
          </TouchableOpacity>

          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.callButton} onPress={onCall} activeOpacity={0.88}>
              <Feather name="phone-call" size={16} color={theme.text} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.videoButton} onPress={onVideoCall} activeOpacity={0.88}>
              <Feather name="video" size={16} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.settingsButton} onPress={() => navigation.navigate("Settings")} activeOpacity={0.88}>
              <Feather name="settings" size={17} color={theme.text} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {loading ? <View style={styles.loadingState}>
          <ActivityIndicator size="large" color={theme.accentStrong} />
          <Text style={styles.loadingText}>{translate("Loading conversation...")}</Text>
        </View> : <KeyboardAvoidingView style={styles.chatShell} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <FlatList ref={listRef} data={messages} renderItem={renderItem} keyExtractor={(item, index) => String(item?._id || `${item?.createdAt || "msg"}-${index}`)} contentContainerStyle={styles.listContent} ListEmptyComponent={<View style={styles.emptyState}>
                <Text style={styles.emptyTitle}>{translate("No messages yet")}</Text>
                <Text style={styles.emptyText}>{translate("Start the conversation with a calm, clear first message.")}</Text>
              </View>} />

          <View style={styles.composerWrap}>
            <View style={styles.inputBar}>
              <TextInput value={text} onChangeText={setText} placeholder={translate("Type your message")} placeholderTextColor={theme.muted} style={styles.input} multiline />
              <TouchableOpacity style={styles.send} onPress={send} disabled={sending} activeOpacity={0.9}>
                {sending ? <ActivityIndicator color="#FFFFFF" size="small" /> : <Feather name="send" size={18} color="#FFFFFF" />}
              </TouchableOpacity>
            </View>
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
    hero: {
      paddingHorizontal: 12,
      paddingTop: 12
    },
    backRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      flex: 1
    },
    topBar: {
      backgroundColor: theme.surface,
      borderRadius: 26,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 16,
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      shadowColor: "#000",
      shadowOpacity: isDark ? 0.2 : 0.06,
      shadowRadius: 14,
      shadowOffset: {
        width: 0,
        height: 8
      },
      elevation: 3
    },
    backIconWrap: {
      width: 42,
      height: 42,
      borderRadius: 21,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.surfaceSoft,
      borderWidth: 1,
      borderColor: theme.border
    },
    backCopy: {
      flex: 1
    },
    eyebrow: {
      color: theme.accentStrong,
      fontSize: 10,
      fontWeight: "800",
      textTransform: "uppercase",
      letterSpacing: 1
    },
    heroTitle: {
      marginTop: 4,
      color: theme.text,
      fontSize: 16,
      fontWeight: "800"
    },
    headerActions: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8
    },
    callButton: {
      width: 42,
      height: 42,
      borderRadius: 21,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.surfaceSoft,
      borderWidth: 1,
      borderColor: theme.border
    },
    videoButton: {
      width: 42,
      height: 42,
      borderRadius: 21,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.accentStrong,
      borderWidth: 1,
      borderColor: theme.accentStrong
    },
    settingsButton: {
      width: 42,
      height: 42,
      borderRadius: 21,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.surfaceSoft,
      borderWidth: 1,
      borderColor: theme.border
    },
    chatShell: {
      flex: 1,
      paddingHorizontal: 12,
      paddingTop: 12,
      paddingBottom: 10
    },
    loadingState: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center"
    },
    loadingText: {
      marginTop: 10,
      color: theme.muted,
      fontSize: 12,
      fontWeight: "700"
    },
    listContent: {
      paddingBottom: 16
    },
    row: {
      marginBottom: 10,
      flexDirection: "row"
    },
    left: {
      justifyContent: "flex-start"
    },
    right: {
      justifyContent: "flex-end"
    },
    bubble: {
      maxWidth: "78%",
      paddingHorizontal: 14,
      paddingVertical: 12,
      borderRadius: 18,
      borderWidth: 1
    },
    me: {
      backgroundColor: theme.accentStrong,
      borderColor: theme.accentStrong,
      borderBottomRightRadius: 8
    },
    other: {
      backgroundColor: theme.surface,
      borderColor: theme.border,
      borderBottomLeftRadius: 8
    },
    msg: {
      color: theme.text,
      fontSize: 13,
      lineHeight: 18,
      fontWeight: "600"
    },
    msgLight: {
      color: "#FFFFFF"
    },
    time: {
      fontSize: 10,
      color: theme.muted,
      marginTop: 6,
      fontWeight: "700",
      alignSelf: "flex-end"
    },
    timeLight: {
      color: "rgba(255,255,255,0.78)"
    },
    emptyState: {
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 24,
      padding: 20,
      alignItems: "center",
      marginTop: 20
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
      lineHeight: 18,
      textAlign: "center"
    },
    composerWrap: {
      paddingTop: 8
    },
    inputBar: {
      flexDirection: "row",
      alignItems: "flex-end",
      gap: 8,
      padding: 10,
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 24,
      shadowColor: "#000",
      shadowOpacity: isDark ? 0.16 : 0.05,
      shadowRadius: 10,
      shadowOffset: {
        width: 0,
        height: 6
      },
      elevation: 2
    },
    input: {
      flex: 1,
      maxHeight: 120,
      backgroundColor: theme.surfaceSoft,
      borderRadius: 16,
      paddingHorizontal: 12,
      paddingVertical: 11,
      color: theme.text,
      fontSize: 13,
      textAlignVertical: "top"
    },
    send: {
      width: 46,
      height: 46,
      borderRadius: 23,
      backgroundColor: theme.accentStrong,
      alignItems: "center",
      justifyContent: "center"
    }
  };
}