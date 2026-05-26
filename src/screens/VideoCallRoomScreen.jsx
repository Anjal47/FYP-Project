import React, { useEffect } from "react";
import { SafeAreaView, View, Text, ActivityIndicator, StyleSheet, Alert, Linking } from "react-native";
import { useAppTheme } from "../context/ThemeContext";
import { buildVideoRoom } from "../utils/videoCall";
import { useTranslate } from "../utils/localization";
export default function VideoCallRoomScreen({
  navigation,
  route
}) {
  const translate = useTranslate();
  const {
    theme
  } = useAppTheme();
  const {
    roomName,
    participantName,
    roomUrl,
    appointmentId,
    serviceType
  } = route.params || {};
  useEffect(() => {
    const builtRoom = !roomUrl && !roomName && appointmentId ? buildVideoRoom({
      appointmentId,
      serviceType
    }) : null;
    const url = roomUrl || (roomName ? `https://meet.jit.si/${encodeURIComponent(roomName)}` : "") || builtRoom?.webUrl || "";
    async function launch() {
      try {
        if (!url) throw new Error("Meeting link was missing.");
        await Linking.openURL(url);
      } catch (error) {
        Alert.alert(translate("Video call unavailable"), error?.message || "Could not open the meeting link.");
      } finally {
        navigation.goBack();
      }
    }
    launch();
  }, [appointmentId, navigation, participantName, roomName, roomUrl, serviceType]);
  return <SafeAreaView style={[styles.container, {
    backgroundColor: theme.background
  }]}>
      <View style={styles.content}>
        <ActivityIndicator size="large" color={theme.accentStrong} />
        <Text style={[styles.title, {
        color: theme.text
      }]}>{translate("Opening video call...")}</Text>
        <Text style={[styles.subtitle, {
        color: theme.muted
      }]}>{translate("If nothing happens, update the app bundle and try again.")}</Text>
      </View>
    </SafeAreaView>;
}
const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24
  },
  title: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: "800"
  },
  subtitle: {
    marginTop: 8,
    fontSize: 12,
    textAlign: "center",
    lineHeight: 18
  }
});