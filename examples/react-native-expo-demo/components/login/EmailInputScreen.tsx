import type { RefObject } from "react";
import {
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

interface EmailInputScreenProps {
  email: string;
  onEmailChange: (email: string) => void;
  onSubmit: () => void;
  emailInputRef: RefObject<TextInput>;
}

export default function EmailInputScreen({
  email,
  onEmailChange,
  onSubmit,
  emailInputRef,
}: EmailInputScreenProps) {
  return (
    <>
      {/* Logo */}
      <View style={styles.logoContainer}>
        <Image
          source={require("@/assets/images/dynamic-logo.png")}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

      {/* Card */}
      <View style={styles.card}>
        <Text style={styles.title}>Welcome</Text>
        <Text style={styles.subtitle}>Sign in with your email to continue</Text>

        <View style={styles.inputContainer}>
          <TextInput
            ref={emailInputRef}
            style={styles.input}
            value={email}
            onChangeText={onEmailChange}
            placeholder="Enter your email"
            placeholderTextColor="#555555"
            keyboardType="email-address"
            autoCapitalize="none"
            keyboardAppearance="dark"
          />
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={onSubmit}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryButtonText}>Continue</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Image
            source={require("@/assets/images/powered-by.png")}
            style={styles.footerLogo}
            resizeMode="contain"
          />
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  logoContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  logo: {
    width: 140,
    height: 140,
  },
  card: {
    width: "100%",
    backgroundColor: "#252525",
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    paddingHorizontal: 28,
    paddingTop: 36,
    paddingBottom: 24,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 10,
    color: "#ffffff",
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 28,
    color: "#8a8a8a",
    lineHeight: 24,
  },
  inputContainer: {
    width: "100%",
    marginBottom: 16,
  },
  input: {
    borderWidth: 0,
    borderRadius: 14,
    paddingVertical: 18,
    paddingHorizontal: 18,
    marginBottom: 14,
    fontSize: 17,
    backgroundColor: "#1a1a1a",
    color: "#ffffff",
  },
  primaryButton: {
    backgroundColor: "#4779FF",
    borderRadius: 14,
    paddingVertical: 18,
    paddingHorizontal: 24,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "600",
    letterSpacing: -0.2,
  },
  footer: {
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 0.5,
    borderTopColor: "#333333",
  },
  footerLogo: {
    width: 170,
    height: 18,
    opacity: 0.4,
  },
});
