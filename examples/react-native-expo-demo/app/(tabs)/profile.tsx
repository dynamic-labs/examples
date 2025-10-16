import { useReactiveClient } from "@dynamic-labs/react-hooks";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { dynamicClient } from "@/lib/dynamic";

export default function ProfileScreen() {
  const client = useReactiveClient(dynamicClient);
  const [copied, setCopied] = useState(false);

  // Get user information from Dynamic client
  const primaryWallet = client.auth.authenticatedUser?.verifiedCredentials?.[0];
  const walletAddress = primaryWallet?.address || "";

  // Format wallet address
  const formatAddress = (address: string) => {
    if (!address) return "";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Copy wallet address to clipboard
  const copyToClipboard = async () => {
    if (walletAddress) {
      await Clipboard.setStringAsync(walletAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Handle logout
  const handleLogout = async () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          try {
            await client.auth.logout();
          } catch (error) {
            console.error("Logout error:", error);
            Alert.alert("Error", "Failed to logout. Please try again.");
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
      >
        {/* Header */}
        <Text style={styles.title}>Profile</Text>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <Ionicons name="person" size={48} color="#5B8DEF" />
          </View>
          <TouchableOpacity onPress={copyToClipboard} activeOpacity={0.7}>
            <View style={styles.addressContainer}>
              <Text style={styles.walletAddress}>
                {formatAddress(walletAddress)}
              </Text>
              {copied ? (
                <Ionicons name="checkmark-circle" size={16} color="#8a8a8a" />
              ) : (
                <Ionicons name="copy-outline" size={16} color="#8a8a8a" />
              )}
            </View>
            <Text style={styles.fullAddress}>{walletAddress}</Text>
          </TouchableOpacity>
        </View>

        {/* Account Info Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Status</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Email Verified</Text>
              <Text style={styles.infoValue}>
                {client.auth.authenticatedUser?.verifiedCredentials?.some(
                  (cred: any) => cred.format === "email"
                )
                  ? "Yes"
                  : "No"}
              </Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Wallet Connected</Text>
              <Text style={styles.infoValue}>Yes</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Network</Text>
              <Text style={styles.infoValue}>Base</Text>
            </View>
          </View>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color="#FF3B30" />
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#0f0f0f",
  },
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 24,
  },
  profileCard: {
    backgroundColor: "#1a1a1a",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    marginBottom: 24,
  },
  avatarContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#5B8DEF30",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  addressContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  walletAddress: {
    fontSize: 20,
    fontWeight: "600",
    color: "#fff",
  },
  fullAddress: {
    fontSize: 12,
    color: "#8a8a8a",
    fontFamily: "monospace",
  },
  copiedText: {
    fontSize: 12,
    color: "#4CAF50",
    fontWeight: "600",
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 12,
  },
  infoCard: {
    backgroundColor: "#1a1a1a",
    borderRadius: 16,
    padding: 16,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  infoLabel: {
    fontSize: 16,
    color: "#8a8a8a",
  },
  infoValue: {
    fontSize: 16,
    fontWeight: "500",
    color: "#fff",
  },
  divider: {
    height: 1,
    backgroundColor: "#2a2a2a",
  },
  jsonText: {
    fontSize: 12,
    color: "#fff",
    fontFamily: "monospace",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    backgroundColor: "#1a1a1a",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#FF3B30",
    marginTop: 24,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FF3B30",
  },
});
