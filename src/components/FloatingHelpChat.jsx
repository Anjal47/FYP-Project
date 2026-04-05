import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import Icon from "react-native-vector-icons/Feather";
import { useAppTheme } from "../context/ThemeContext";

const ORANGE = "#FF7A1A";

const quickReplies = {
  "How do I report?":
    "Open Reporting, choose the type, fill in the details, and submit.",
  "How do I donate?":
    "Open Donate / Charity to view approved requests or ask for support.",
  "How do I contact a counselor?":
    "Open Counseling and continue to Visit Counselors or the counseling form.",
  "How do I pay a fine?":
    "Open Traffic and use Pay Fine to continue the payment flow.",
};

const initialMessages = [
  {
    id: "welcome",
    from: "bot",
    text: "Hi, I can answer a few quick app questions.",
  },
];

export default function FloatingHelpChat({
  bottom = 110,
  fabBottom = 145,
  popupWidth = 280,
}) {
  const { theme, isDark } = useAppTheme();
  const [chatState, setChatState] = useState({
    isOpen: false,
    messages: initialMessages,
  });
  const styles = useMemo(
    () =>
      StyleSheet.create({
        chatPopup: {
          position: "absolute",
          backgroundColor: theme.surface,
          borderRadius: 20,
          padding: 16,
          elevation: 6,
          zIndex: 1000,
          shadowColor: "#000",
          shadowOpacity: isDark ? 0.22 : 0.12,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 4 },
        },
        chatHeader: {
          flexDirection: "row",
          alignItems: "center",
          marginBottom: 14,
        },
        chatHeaderIcon: {
          width: 38,
          height: 38,
          borderRadius: 19,
          backgroundColor: theme.surfaceSoft,
          justifyContent: "center",
          alignItems: "center",
          marginRight: 10,
        },
        chatHeaderCopy: {
          flex: 1,
        },
        chatTitle: {
          fontSize: 16,
          fontWeight: "700",
          color: theme.text,
        },
        chatSubtitle: {
          fontSize: 12,
          color: theme.muted,
          marginTop: 2,
        },
        chatCloseButton: {
          width: 28,
          height: 28,
          borderRadius: 14,
          backgroundColor: theme.surfaceSoft,
          justifyContent: "center",
          alignItems: "center",
        },
        chatMessages: {
          marginBottom: 14,
        },
        chatBubble: {
          maxWidth: "88%",
          paddingHorizontal: 12,
          paddingVertical: 10,
          borderRadius: 14,
          marginBottom: 8,
        },
        botBubble: {
          alignSelf: "flex-start",
          backgroundColor: theme.surfaceSoft,
        },
        userBubble: {
          alignSelf: "flex-end",
          backgroundColor: ORANGE,
        },
        chatBubbleText: {
          fontSize: 13,
          lineHeight: 18,
        },
        botBubbleText: {
          color: theme.text,
        },
        userBubbleText: {
          color: "#FFFFFF",
        },
        quickReplyWrap: {
          flexDirection: "row",
          flexWrap: "wrap",
          gap: 8,
        },
        quickReplyChip: {
          backgroundColor: theme.surfaceSoft,
          borderRadius: 999,
          paddingHorizontal: 12,
          paddingVertical: 8,
        },
        quickReplyText: {
          color: ORANGE,
          fontSize: 12,
          fontWeight: "700",
        },
        chatFab: {
          position: "absolute",
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
          shadowOffset: { width: 0, height: 3 },
        },
        chatFabIcon: {
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: "rgba(255,255,255,0.14)",
          justifyContent: "center",
          alignItems: "center",
        },
      }),
    [theme, isDark]
  );

  const toggleChat = () => {
    setChatState((prev) => ({
      ...prev,
      isOpen: !prev.isOpen,
    }));
  };

  const handleQuickReply = (question) => {
    const answer = quickReplies[question];

    setChatState((prev) => ({
      isOpen: true,
      messages: [
        ...prev.messages,
        {
          id: `${question}-user-${prev.messages.length}`,
          from: "user",
          text: question,
        },
        {
          id: `${question}-bot-${prev.messages.length}`,
          from: "bot",
          text: answer,
        },
      ],
    }));
  };

  return (
    <>
      {chatState.isOpen ? (
        <View
          style={[
            styles.chatPopup,
            {
              right: 20,
              bottom: fabBottom + 64,
              width: popupWidth,
            },
          ]}
        >
          <View style={styles.chatHeader}>
            <View style={styles.chatHeaderIcon}>
              <Icon name="message-circle" size={18} color={ORANGE} />
            </View>
            <View style={styles.chatHeaderCopy}>
              <Text style={styles.chatTitle}>Help Chat</Text>
              <Text style={styles.chatSubtitle}>Quick answers only</Text>
            </View>
            <TouchableOpacity
              style={styles.chatCloseButton}
              onPress={toggleChat}
              activeOpacity={0.9}
            >
              <Icon name="x" size={16} color="#777" />
            </TouchableOpacity>
          </View>

          <View style={styles.chatMessages}>
            {chatState.messages.slice(-2).map((message) => (
              <View
                key={message.id}
                style={[
                  styles.chatBubble,
                  message.from === "user" ? styles.userBubble : styles.botBubble,
                ]}
              >
                <Text
                  style={[
                    styles.chatBubbleText,
                    message.from === "user"
                      ? styles.userBubbleText
                      : styles.botBubbleText,
                  ]}
                >
                  {message.text}
                </Text>
              </View>
            ))}
          </View>

          <View style={styles.quickReplyWrap}>
            {Object.keys(quickReplies).map((question) => (
              <TouchableOpacity
                key={question}
                style={styles.quickReplyChip}
                onPress={() => handleQuickReply(question)}
                activeOpacity={0.9}
              >
                <Text style={styles.quickReplyText}>{question}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ) : null}

      <TouchableOpacity
        style={[styles.chatFab, { right: 18, bottom: fabBottom }]}
        onPress={toggleChat}
        activeOpacity={0.92}
      >
        <View style={styles.chatFabIcon}>
          <Icon name="message-circle" size={20} color="#FFFFFF" />
        </View>
      </TouchableOpacity>
    </>
  );
}
