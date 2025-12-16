import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  type TextInput,
  TouchableWithoutFeedback,
  View,
} from "react-native";

import EmailInputScreen from "@/components/login/EmailInputScreen";
import LoadingScreen from "@/components/login/LoadingScreen";
import OTPVerificationScreen from "@/components/login/OTPVerificationScreen";
import { dynamicClient } from "@/lib/dynamic";

// Toggle this to use Dynamic's built-in auth UI instead of custom flow
const USE_DYNAMIC_AUTH_UI = false;

const EmailSignIn = () => {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const hiddenInputRef = useRef<TextInput>(null);
  const emailInputRef = useRef<TextInput>(null);

  // Show Dynamic's built-in auth UI if enabled
  useEffect(() => {
    if (USE_DYNAMIC_AUTH_UI) dynamicClient.ui.auth.show();
  }, []);

  // If using Dynamic auth UI, don't render custom UI
  if (USE_DYNAMIC_AUTH_UI) return null;

  const handleSendOTP = async () => {
    try {
      await dynamicClient.auth.email.sendOTP(email);
      setOtpSent(true);
    } catch (error) {
      Alert.alert("Error", "Failed to send OTP. Please try again.");
      console.error("Send OTP error:", error);
    }
  };

  const handleBackToLogin = () => {
    setOtpSent(false);
    setOtp("");
    setEmail("");
  };

  const handleOtpChange = (text: string) => {
    // Extract only digits and limit to 6
    const digitsOnly = text.replace(/\D/g, "").slice(0, 6);
    setOtp(digitsOnly);

    // Auto-submit when we have 6 digits
    if (digitsOnly.length === 6) {
      setTimeout(() => {
        handleVerifyOTP(digitsOnly);
      }, 100);
    }
  };

  const handleVerifyOTP = async (otpCode?: string) => {
    const codeToVerify = otpCode || otp;
    if (codeToVerify.length !== 6) {
      Alert.alert("Error", "Please enter all 6 digits");
      return;
    }

    try {
      // Dismiss keyboard and show loading screen
      Keyboard.dismiss();
      setIsVerifying(true);

      await dynamicClient.auth.email.verifyOTP(codeToVerify);

      // Authentication successful - this will be handled by the layout
    } catch (error) {
      setIsVerifying(false);
      Alert.alert("Error", "Invalid OTP. Please try again.");
      console.error("Verify OTP error:", error);
    }
  };

  // Convert OTP string to array for display
  const otpArray = otp.split("").concat(Array(6 - otp.length).fill(""));

  // Show loading screen during verification
  if (isVerifying) {
    return <LoadingScreen text="Verifying Passcode" />;
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.innerContainer}>
          {!otpSent ? (
            <EmailInputScreen
              email={email}
              onEmailChange={setEmail}
              onSubmit={handleSendOTP}
              emailInputRef={emailInputRef as React.RefObject<TextInput>}
            />
          ) : (
            <OTPVerificationScreen
              otp={otp}
              otpArray={otpArray}
              email={email}
              onOtpChange={handleOtpChange}
              onBackToLogin={handleBackToLogin}
              hiddenInputRef={hiddenInputRef as React.RefObject<TextInput>}
            />
          )}
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f0f0f",
  },
  innerContainer: {
    flex: 1,
    justifyContent: "flex-end",
  },
});

export default EmailSignIn;
