import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface WalletHeaderProps {
  walletAddress: string;
}

export default function WalletHeader({ walletAddress }: WalletHeaderProps) {
  const [copied, setCopied] = useState(false);

  const formatAddress = (address: string) => {
    if (!address) return "";
    return `${address.slice(0, 5)}...${address.slice(-3)}`;
  };

  const copyToClipboard = async () => {
    if (walletAddress) {
      await Clipboard.setStringAsync(walletAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <View style={styles.userInfo}>
      <View style={styles.walletIcon}>
        <Ionicons name="wallet" size={28} color="#5B8DEF" />
      </View>
      <TouchableOpacity
        style={styles.userDetails}
        onPress={copyToClipboard}
        activeOpacity={0.7}
      >
        <View style={styles.addressContainer}>
          <Text style={styles.userName}>{formatAddress(walletAddress)}</Text>
          {copied ? (
            <Ionicons name="checkmark-circle" size={16} color="#8a8a8a" />
          ) : (
            <Ionicons name="copy-outline" size={14} color="#8a8a8a" />
          )}
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  walletIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#5B8DEF30",
    alignItems: "center",
    justifyContent: "center",
  },
  userDetails: {
    gap: 2,
  },
  addressContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  userName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
  },
});
