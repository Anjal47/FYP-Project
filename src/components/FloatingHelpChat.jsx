import React, { useEffect, useMemo, useRef, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform, useWindowDimensions } from "react-native";
import Icon from "react-native-vector-icons/Feather";
import { useAppTheme } from "../context/ThemeContext";
import { sendHelpChatMessage } from "../utils/helpChatApi";
import { useTranslate } from "../utils/localization";
const ORANGE = "#FF7A1A";
const quickReplies = ["How do I report an issue?", "How do I donate?", "How do I contact a counsellor?", "How do I reach NGO support?"];
export default function FloatingHelpChat({
  bottom = 110,
  fabBottom = 145,
  popupWidth = 320
}) {
  const translate = useTranslate();
  const {
    language,
    theme,
    isDark
  } = useAppTheme();
  const {
    width
  } = useWindowDimensions();
  const scrollRef = useRef(null);
  const [draft, setDraft] = useState("");
  const welcomeMessage = useMemo(() => ({
    id: "welcome",
    from: "bot",
    text: translate("Hi, ask me about reports, donations, counseling, therapy, traffic, NGO support, or helpline numbers.")
  }), [translate]);
  const translatedQuickReplies = useMemo(() => quickReplies.map(question => ({
    id: question,
    label: translate(question)
  })), [translate]);
  const [chatState, setChatState] = useState({
    isOpen: false,
    messages: [welcomeMessage],
    isLoading: false
  });
  const resolvedPopupWidth = Math.min(popupWidth, width - 24);
  const popupBottom = Math.max(bottom, fabBottom + 64);
  useEffect(() => {
    setChatState(prev => {
      if (!prev.messages.some(message => message.id === "welcome")) {
        return prev;
      }
      return {
        ...prev,
        messages: prev.messages.map(message => message.id === "welcome" ? welcomeMessage : message)
      };
    });
  }, [welcomeMessage]);
  useEffect(() => {
    if (!chatState.isOpen) return;
    const timeoutId = setTimeout(() => {
      scrollRef.current?.scrollToEnd({
        animated: true
      });
    }, 40);
    return () => clearTimeout(timeoutId);
  }, [chatState.isOpen, chatState.isLoading, chatState.messages.length]);
  const styles = useMemo(() => StyleSheet.create({
    chatPopup: {
      position: "absolute",
      right: 20,
      backgroundColor: theme.surface,
      borderRadius: 20,
      padding: 14,
      elevation: 6,
      zIndex: 1000,
      shadowColor: "#000",
      shadowOpacity: isDark ? 0.22 : 0.12,
      shadowRadius: 8,
      shadowOffset: {
        width: 0,
        height: 4
      },
      borderWidth: 1,
      borderColor: theme.border
    },
    chatHeader: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 12
    },
    chatHeaderIcon: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: theme.surfaceSoft,
      justifyContent: "center",
      alignItems: "center",
      marginRight: 10
    },
    chatHeaderCopy: {
      flex: 1
    },
    chatTitle: {
      fontSize: 16,
      fontWeight: "700",
      color: theme.text
    },
    chatSubtitle: {
      fontSize: 12,
      color: theme.muted,
      marginTop: 2
    },
    chatCloseButton: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: theme.surfaceSoft,
      justifyContent: "center",
      alignItems: "center"
    },
    chatMessages: {
      maxHeight: 250,
      marginBottom: 12
    },
    chatBubble: {
      maxWidth: "88%",
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderRadius: 14,
      marginBottom: 8
    },
    botBubble: {
      alignSelf: "flex-start",
      backgroundColor: theme.surfaceSoft
    },
    userBubble: {
      alignSelf: "flex-end",
      backgroundColor: ORANGE
    },
    chatBubbleText: {
      fontSize: 13,
      lineHeight: 18
    },
    loadingBubble: {
      minWidth: 66,
      alignItems: "center"
    },
    botBubbleText: {
      color: theme.text
    },
    userBubbleText: {
      color: "#FFFFFF"
    },
    quickReplyWrap: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
      marginBottom: 12
    },
    quickReplyChip: {
      backgroundColor: theme.surfaceSoft,
      borderRadius: 999,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderWidth: 1,
      borderColor: theme.border
    },
    quickReplyText: {
      color: ORANGE,
      fontSize: 12,
      fontWeight: "700"
    },
    inputRow: {
      flexDirection: "row",
      alignItems: "flex-end",
      gap: 8
    },
    inputWrap: {
      flex: 1,
      minHeight: 46,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.surfaceElevated,
      paddingHorizontal: 12,
      justifyContent: "center"
    },
    input: {
      color: theme.text,
      fontSize: 13,
      paddingVertical: Platform.OS === "ios" ? 12 : 8
    },
    sendButton: {
      width: 46,
      height: 46,
      borderRadius: 23,
      backgroundColor: ORANGE,
      alignItems: "center",
      justifyContent: "center"
    },
    sendButtonDisabled: {
      opacity: 0.7
    },
    chatFab: {
      position: "absolute",
      right: 18,
      width: 52,
      height: 52,
      backgroundColor: ORANGE,
      borderRadius: 26,
      justifyContent: "center",
      alignItems: "center",
      elevation: 5,
      zIndex: 1000,
      shadowColor: "#000",
      shadowOpacity: 0.18,
      shadowRadius: 8,
      shadowOffset: {
        width: 0,
        height: 3
      }
    },
    chatFabIcon: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: "rgba(255,255,255,0.14)",
      justifyContent: "center",
      alignItems: "center"
    }
  }), [theme, isDark]);
  const toggleChat = () => {
    setChatState(prev => ({
      ...prev,
      isOpen: !prev.isOpen
    }));
  };
  const sendMessage = async rawText => {
    const text = String(rawText ?? draft).trim();
    if (!text || chatState.isLoading) return;
    const userMessage = {
      id: `user-${Date.now()}`,
      from: "user",
      text
    };
    const historyForApi = chatState.messages.filter(item => item.id !== "welcome").slice(-8).map(item => ({
      role: item.from === "user" ? "user" : "assistant",
      content: item.text
    }));
    setDraft("");
    setChatState(prev => ({
      ...prev,
      isOpen: true,
      isLoading: true,
      messages: [...prev.messages, userMessage]
    }));
    try {
      const result = await sendHelpChatMessage({
        message: text,
        history: historyForApi,
        preferredLanguage: language
      });
      setChatState(prev => ({
        ...prev,
        isLoading: false,
        messages: [...prev.messages, {
          id: `bot-${Date.now()}`,
          from: "bot",
          text: String(result?.reply || "").trim() || translate("I could not generate a reply right now. Please try again.")
        }]
      }));
    } catch (error) {
      setChatState(prev => ({
        ...prev,
        isLoading: false,
        messages: [...prev.messages, {
          id: `bot-error-${Date.now()}`,
          from: "bot",
          text: error?.message || translate("Help chat is unavailable right now. Please try again.")
        }]
      }));
    }
  };
  const handleQuickReply = question => {
    sendMessage(question);
  };
  return <>
      {chatState.isOpen ? <KeyboardAvoidingView style={[styles.chatPopup, {
      bottom: popupBottom,
      width: resolvedPopupWidth
    }]} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <View style={styles.chatHeader}>
            <View style={styles.chatHeaderIcon}>
              <Icon name="message-circle" size={18} color={ORANGE} />
            </View>
            <View style={styles.chatHeaderCopy}>
              <Text style={styles.chatTitle}>{translate("Help Chat")}</Text>
              <Text style={styles.chatSubtitle}>{translate("Simple AI assistant")}</Text>
            </View>
            <TouchableOpacity style={styles.chatCloseButton} onPress={toggleChat} activeOpacity={0.9}>
              <Icon name="x" size={16} color="#777" />
            </TouchableOpacity>
          </View>

          <ScrollView ref={scrollRef} style={styles.chatMessages} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {chatState.messages.map(message => <View key={message.id} style={[styles.chatBubble, message.from === "user" ? styles.userBubble : styles.botBubble]}>
                <Text style={[styles.chatBubbleText, message.from === "user" ? styles.userBubbleText : styles.botBubbleText]}>
                  {message.text}
                </Text>
              </View>)}
            {chatState.isLoading ? <View style={[styles.chatBubble, styles.botBubble, styles.loadingBubble]}>
                <ActivityIndicator size="small" color={ORANGE} />
              </View> : null}
          </ScrollView>

          <View style={styles.quickReplyWrap}>
            {translatedQuickReplies.map(item => <TouchableOpacity key={item.id} style={styles.quickReplyChip} onPress={() => handleQuickReply(item.id)} activeOpacity={0.9} disabled={chatState.isLoading}>
                <Text style={styles.quickReplyText}>{item.label}</Text>
              </TouchableOpacity>)}
          </View>

          <View style={styles.inputRow}>
            <View style={styles.inputWrap}>
              <TextInput value={draft} onChangeText={setDraft} style={styles.input} placeholder={translate("Ask for help...")} placeholderTextColor={theme.muted} editable={!chatState.isLoading} returnKeyType="send" onSubmitEditing={() => sendMessage()} maxLength={300} />
            </View>
            <TouchableOpacity style={[styles.sendButton, (!draft.trim() || chatState.isLoading) && styles.sendButtonDisabled]} onPress={() => sendMessage()} activeOpacity={0.92} disabled={!draft.trim() || chatState.isLoading}>
              {chatState.isLoading ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Icon name="send" size={18} color="#FFFFFF" />}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView> : null}

      <TouchableOpacity style={[styles.chatFab, {
      bottom: fabBottom
    }]} onPress={toggleChat} activeOpacity={0.92}>
        <View style={styles.chatFabIcon}>
          <Icon name="message-circle" size={20} color="#FFFFFF" />
        </View>
      </TouchableOpacity>
    </>;
}
