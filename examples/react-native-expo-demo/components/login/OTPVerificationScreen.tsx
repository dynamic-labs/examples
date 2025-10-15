import {
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";

interface OTPVerificationScreenProps {
  otp: string;
  otpArray: string[];
  email: string;
  onOtpChange: (text: string) => void;
  onBackToLogin: () => void;
  hiddenInputRef: React.RefObject<TextInput>;
}

export default function OTPVerificationScreen({
  otp,
  otpArray,
  email,
  onOtpChange,
  onBackToLogin,
  hiddenInputRef,
}: OTPVerificationScreenProps) {
  return (
    <View style={styles.card}>
      <View style={styles.iconContainer}>
        <Image
          source={require("@/assets/images/icons/lock-icon.png")}
          style={styles.lockIcon}
          resizeMode="contain"
        />
      </View>

      <Text style={styles.title}>Confirm Verification Code</Text>
      <Text style={styles.subtitle}>
        Enter the verification code sent to{"\n"}
        <Text style={styles.emailText}>{email}</Text>
      </Text>

      {/* Hidden input that captures all text input including paste */}
      <TextInput
        ref={hiddenInputRef}
        style={styles.hiddenInput}
        value={otp}
        onChangeText={onOtpChange}
        keyboardType="numeric"
        maxLength={6}
        autoFocus
        keyboardAppearance="dark"
      />

      {/* Visible OTP boxes */}
      <TouchableWithoutFeedback onPress={() => hiddenInputRef.current?.focus()}>
        <View style={styles.otpContainer}>
          {otpArray.map((digit, index) => (
            <View
              key={index}
              style={[
                styles.otpBox,
                digit && styles.otpBoxFilled,
                otp.length === index && styles.otpBoxActive,
              ]}
            >
              <Text style={styles.otpDigit}>{digit}</Text>
            </View>
          ))}
        </View>
      </TouchableWithoutFeedback>

      <TouchableOpacity style={styles.linkButton} onPress={onBackToLogin}>
        <Text style={styles.linkButtonText}>Sign in another way</Text>
      </TouchableOpacity>

      {/* Footer */}
      <View style={styles.footer}>
        <Image
          source={require("@/assets/images/powered-by.png")}
          style={styles.footerLogo}
          resizeMode="contain"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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
  iconContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  lockIcon: {
    width: 60,
    height: 60,
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
  emailText: {
    color: "#4779FF",
    fontWeight: "600",
  },
  hiddenInput: {
    position: "absolute",
    opacity: 0,
    width: 1,
    height: 1,
  },
  otpContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 24,
    gap: 10,
  },
  otpBox: {
    width: 50,
    height: 58,
    borderWidth: 0,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#1a1a1a",
  },
  otpBoxFilled: {
    backgroundColor: "#1a1f3a",
  },
  otpBoxActive: {
    backgroundColor: "#1f1f1f",
    borderWidth: 2,
    borderColor: "#4779FF",
  },
  otpDigit: {
    fontSize: 24,
    fontWeight: "600",
    color: "#ffffff",
  },
  linkButton: {
    paddingVertical: 12,
    alignItems: "center",
  },
  linkButtonText: {
    color: "#4779FF",
    fontSize: 15,
    fontWeight: "500",
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
