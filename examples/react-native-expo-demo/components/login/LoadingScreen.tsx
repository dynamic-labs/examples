import { useEffect, useRef } from "react";
import { Animated, Image, StyleSheet, Text, View } from "react-native";

interface LoadingScreenProps {
  text?: string;
}

export default function LoadingScreen({
  text = "Loading...",
}: LoadingScreenProps) {
  const spinValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Create infinite spinning animation
    Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      })
    ).start();
  }, [spinValue]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          {/* Loader Image - Spinning 360 degrees */}
          <Animated.Image
            source={require("@/assets/images/icons/loader.png")}
            style={[
              styles.loader,
              {
                transform: [{ rotate: spin }],
              },
            ]}
            resizeMode="contain"
          />

          {/* Wallet Icon - Static in center */}
          <Image
            source={require("@/assets/images/icons/wallet-icon.png")}
            style={styles.walletIcon}
            resizeMode="contain"
          />
        </View>

        <Text style={styles.loadingText}>{text}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f0f0f",
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    alignItems: "center",
  },
  iconContainer: {
    width: 120,
    height: 120,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    marginBottom: 24,
  },
  loader: {
    width: 120,
    height: 120,
    position: "absolute",
  },
  walletIcon: {
    width: 64,
    height: 64,
    position: "absolute",
  },
  loadingText: {
    fontSize: 16,
    color: "#8a8a8a",
    fontWeight: "300",
  },
});
