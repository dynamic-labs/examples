import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { Animated, Image, StyleSheet, Text, View } from "react-native";
import { ChainEnum } from "@dynamic-labs/sdk-api-core";

import { dynamicClient } from "@/lib/dynamic";
import TokenItem from "./TokenItem";
import { useReactiveClient } from "@dynamic-labs/react-hooks";

interface Token {
  symbol: string;
  name: string;
  balance: number;
  decimals: number;
  logoURI: string;
  marketValue?: number;
}

interface TokenListProps {
  selectedNetworkId?: number | string | null;
  onTokenPress?: (token: Token) => void;
}

const TokenList = forwardRef<{ refresh: () => Promise<void> }, TokenListProps>(
  ({ selectedNetworkId, onTokenPress }, ref) => {
    const client = useReactiveClient(dynamicClient);
    const [tokens, setTokens] = useState<Token[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const spinValue = useRef(new Animated.Value(0)).current;

    useEffect(() => {
      // Create infinite spinning animation for loader
      Animated.loop(
        Animated.timing(spinValue, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        })
      ).start();
    }, [spinValue]);

    const fetchBalances = useCallback(async () => {
      try {
        const wallet = client.wallets.primary;

        if (!wallet || !selectedNetworkId) {
          setIsLoading(false);
          return;
        }

        const networkId =
          typeof selectedNetworkId === "string"
            ? parseInt(selectedNetworkId, 10)
            : selectedNetworkId;

        const chainBalances = await client.wallets.getMultichainBalances({
          balanceRequest: {
            filterSpamTokens: true,
            balanceRequests: [
              {
                address: wallet.address,
                chain: ChainEnum.Evm,
                networkIds: [networkId],
              },
            ],
          },
        });

        const balances = chainBalances[0]?.networks[0]?.balances || [];
        setTokens(balances);
      } catch (error) {
        console.error("Error fetching balances:", error);
        setTokens([]);
      } finally {
        setIsLoading(false);
      }
    }, [client.wallets, selectedNetworkId]);

    useEffect(() => {
      fetchBalances();
    }, [fetchBalances, selectedNetworkId]);

    // Expose refresh method to parent via ref
    useImperativeHandle(ref, () => ({
      refresh: fetchBalances,
    }));

    const spin = spinValue.interpolate({
      inputRange: [0, 1],
      outputRange: ["0deg", "360deg"],
    });

    if (isLoading) {
      return (
        <View style={styles.tokensSection}>
          <Text style={styles.tokensSectionTitle}>Tokens</Text>
          <View style={styles.loadingContainer}>
            <View style={styles.loaderIconContainer}>
              {/* Loader Image - Spinning 360 degrees */}
              <Animated.Image
                source={require("@/assets/images/icons/loader.png")}
                style={[
                  styles.loaderImage,
                  {
                    transform: [{ rotate: spin }],
                  },
                ]}
                resizeMode="contain"
              />

              {/* Wallet Icon - Static in center */}
              <Image
                source={require("@/assets/images/icons/wallet-icon.png")}
                style={styles.walletIconImage}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.loadingText}>Loading tokens...</Text>
          </View>
        </View>
      );
    }

    if (tokens.length === 0) {
      return (
        <View style={styles.tokensSection}>
          <Text style={styles.tokensSectionTitle}>Tokens</Text>
          <View style={styles.emptyContainer}>
            <View style={styles.emptyContent}>
              <Image
                source={require("@/assets/images/empty-state.png")}
                style={styles.emptyImage}
                resizeMode="contain"
              />
              <View style={styles.emptyTextContainer}>
                <Text style={styles.emptyText}>No tokens found</Text>
                <Text style={styles.emptySubtext}>
                  Your token balances will appear here
                </Text>
              </View>
            </View>
          </View>
        </View>
      );
    }
    return (
      <View style={styles.tokensSection}>
        <Text style={styles.tokensSectionTitle}>Tokens</Text>
        {tokens.map((token, index) => (
          <TokenItem
            key={`${token.symbol}-${index}`}
            token={token}
            onPress={() => onTokenPress?.(token)}
          />
        ))}
      </View>
    );
  }
);

TokenList.displayName = "TokenList";

export default TokenList;

const styles = StyleSheet.create({
  tokensSection: {
    gap: 0,
  },
  tokensSectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 4,
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 32,
    paddingHorizontal: 20,
  },
  loaderIconContainer: {
    width: 80,
    height: 80,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    marginBottom: 16,
  },
  loaderImage: {
    width: 80,
    height: 80,
    position: "absolute",
  },
  walletIconImage: {
    width: 42,
    height: 42,
    position: "absolute",
  },
  loadingText: {
    fontSize: 14,
    color: "#8a8a8a",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 0,
    paddingHorizontal: 0,
    marginVertical: -20,
  },
  emptyContent: {
    alignItems: "center",
    gap: 0,
  },
  emptyImage: {
    width: 440,
    height: 440,
    marginVertical: -40,
  },
  emptyTextContainer: {
    alignItems: "center",
    gap: 0,
    marginTop: -40,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  emptySubtext: {
    fontSize: 14,
    color: "#8a8a8a",
    textAlign: "center",
  },
});
