import { StyleSheet, Text, View } from "react-native";

export default function LegalNotice() {
  return (
    <View style={styles.legalNotice}>
      <Text style={styles.legalText}>
        By proceeding, you agree to Coinbase&apos;s{" "}
        <Text style={styles.legalLink}>Guest Checkout Terms</Text>,{" "}
        <Text style={styles.legalLink}>User Agreement</Text>, and{" "}
        <Text style={styles.legalLink}>Privacy Policy</Text>.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  legalNotice: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    padding: 12,
    borderRadius: 12,
    marginTop: 16,
  },
  legalText: {
    fontSize: 11,
    color: "#8a8a8a",
    lineHeight: 15,
    textAlign: "center",
  },
  legalLink: {
    color: "#5B8DEF",
  },
});
