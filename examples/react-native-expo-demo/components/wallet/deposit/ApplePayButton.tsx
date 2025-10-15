import { Platform, StyleSheet, Text, View } from "react-native";
import { WebView } from "react-native-webview";

interface ApplePayButtonProps {
  paymentUrl: string;
  isProcessing: boolean;
  onMessage: (event: any) => void;
}

export default function ApplePayButton({
  paymentUrl,
  isProcessing,
  onMessage,
}: ApplePayButtonProps) {
  return (
    // WebView with Coinbase Apple Pay button
    <View style={styles.applePayWebViewContainer}>
      {isProcessing && (
        <View style={styles.applePayLoadingOverlay}>
          <Text style={styles.loadingText}>Processing...</Text>
        </View>
      )}
      <WebView
        source={{ uri: paymentUrl }}
        onMessage={onMessage}
        style={styles.applePayWebView}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
        sharedCookiesEnabled={true}
        thirdPartyCookiesEnabled={true}
        scrollEnabled={false}
        bounces={false}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        allowsPaymentRequest={Platform.OS === "ios"}
        fraudulentWebsiteWarningEnabled={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  testModeBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#4CAF5020",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#4CAF50",
  },
  testModeTextContainer: {
    flex: 1,
  },
  testModeTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#4CAF50",
    marginBottom: 4,
  },
  testModeSubtext: {
    fontSize: 12,
    color: "#4CAF50",
    opacity: 0.8,
  },
  applePayWebViewContainer: {
    height: 80,
    width: "100%",
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#1a1a1a",
    position: "relative",
  },
  applePayWebView: {
    flex: 1,
    backgroundColor: "transparent",
  },
  applePayLoadingOverlay: {
    position: "absolute",
    height: 50,
    top: 13,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#0D0D0D",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
    borderRadius: 24,
    flexDirection: "row",
    gap: 10,
  },
  loadingText: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "600",
  },
});
