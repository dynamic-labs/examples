import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Image } from "expo-image";

interface Token {
  symbol: string;
  name: string;
  balance: number;
  decimals: number;
  logoURI: string;
  marketValue?: number;
}

interface TokenItemProps {
  token: Token;
  onPress?: () => void;
}

export default function TokenItem({ token, onPress }: TokenItemProps) {
  const formattedBalance = token.balance.toFixed(Math.min(token.decimals, 6));
  const formattedValue = `$${(token.marketValue || 0).toFixed(2)}`;

  return (
    <TouchableOpacity style={styles.tokenItem} onPress={onPress}>
      <View style={styles.tokenItemLeft}>
        {token.logoURI ? (
          <Image
            source={token.logoURI}
            style={styles.tokenIcon}
            contentFit="cover"
          />
        ) : (
          <View style={styles.tokenIconPlaceholder}>
            <Text style={styles.tokenIconText}>?</Text>
          </View>
        )}
        <View style={styles.tokenInfo}>
          <Text style={styles.tokenSymbol}>{token.symbol}</Text>
          <Text style={styles.tokenName}>{token.name}</Text>
        </View>
      </View>
      <View style={styles.tokenItemRight}>
        <Text style={styles.tokenBalance}>{formattedBalance}</Text>
        <Text style={styles.tokenValue}>{formattedValue}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  tokenItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 4,
    marginBottom: 4,
  },
  tokenItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  tokenIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  tokenIconPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#5B8DEF30",
    alignItems: "center",
    justifyContent: "center",
  },
  tokenIconText: {
    fontSize: 20,
    color: "#fff",
  },
  tokenInfo: {
    gap: 2,
  },
  tokenSymbol: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  tokenName: {
    fontSize: 13,
    color: "#8a8a8a",
  },
  tokenItemRight: {
    alignItems: "flex-end",
    gap: 2,
  },
  tokenBalance: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  tokenValue: {
    fontSize: 13,
    color: "#8a8a8a",
  },
});
