import { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { useReactiveClient } from "@dynamic-labs/react-hooks";
import { Ionicons } from "@expo/vector-icons";

import { dynamicClient } from "@/lib/dynamic";
import LoadingScreen from "../../login/LoadingScreen";
import PhoneInputScreen from "./PhoneInputScreen";
import PhoneOTPVerificationScreen from "./PhoneOTPVerificationScreen";

interface PhoneVerificationModalProps {
  visible: boolean;
  onClose: () => void;
  onVerified?: () => void;
}

export default function PhoneVerificationModal({
  visible,
  onClose,
  onVerified,
}: PhoneVerificationModalProps) {
  const client = useReactiveClient(dynamicClient);

  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const hiddenInputRef = useRef<TextInput>(null);
  const phoneInputRef = useRef<TextInput>(null);

  const handleSendOTP = async () => {
    if (phone.length !== 10) {
      Alert.alert("Error", "Please enter a valid 10-digit phone number");
      return;
    }

    try {
      console.info("[handleSendOTP] Sending OTP to:", phone);
      const response = await client.auth.updateUser({ phoneNumber: phone });

      console.info("[handleSendOTP] OTP sent successfully");
      if (response.isSmsVerificationRequired) setOtpSent(true);
    } catch (error) {
      Alert.alert(
        "Error",
        "Failed to send verification code. Please try again."
      );
      console.error("Send SMS OTP error:", error);
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

      await client.auth.verifyUserUpdateOtp(codeToVerify);

      // Verification successful
      setIsVerifying(false);
      onVerified?.();
    } catch (error) {
      setIsVerifying(false);
      console.error("Verify SMS OTP error:", error);
      Alert.alert("Error", "Invalid verification code. Please try again.");
      // Clear OTP so user can try again
      setOtp("");
    }
  };

  const handleBackToPhoneInput = () => {
    setOtpSent(false);
    setOtp("");
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

  // Reset state when modal closes
  const resetState = useCallback(() => {
    setPhone("");
    setOtp("");
    setOtpSent(false);
    setIsVerifying(false);
  }, []);

  useEffect(() => {
    if (!visible) {
      resetState();
    }
  }, [visible, resetState]);

  // Convert OTP string to array for display
  const otpArray = otp.split("").concat(Array(6 - otp.length).fill(""));

  const renderContent = () => {
    if (isVerifying) {
      return (
        <View style={styles.card}>
          <LoadingScreen text="Verifying Phone Number" />
        </View>
      );
    }

    if (!otpSent) {
      return (
        <PhoneInputScreen
          phone={phone}
          onPhoneChange={setPhone}
          onSubmit={handleSendOTP}
          phoneInputRef={phoneInputRef as React.RefObject<TextInput>}
        />
      );
    }

    return (
      <PhoneOTPVerificationScreen
        otp={otp}
        otpArray={otpArray}
        phone={phone}
        onOtpChange={handleOtpChange}
        onBack={handleBackToPhoneInput}
        hiddenInputRef={hiddenInputRef as React.RefObject<TextInput>}
      />
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      presentationStyle="overFullScreen"
      onRequestClose={isVerifying ? undefined : onClose}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={isVerifying ? undefined : onClose}
        disabled={isVerifying}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalContent}
          keyboardVerticalOffset={0}
        >
          <>
            {/* Close Button */}
            {!isVerifying && (
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={28} color="#fff" />
              </TouchableOpacity>
            )}

            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <View style={styles.content}>{renderContent()}</View>
            </TouchableWithoutFeedback>
          </>
        </KeyboardAvoidingView>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "transparent",
  },
  closeButton: {
    position: "absolute",
    top: 20,
    right: 20,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    borderRadius: 20,
  },
  content: {
    backgroundColor: "transparent",
  },
  card: {
    width: "100%",
    height: 400,
    backgroundColor: "#252525",
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    overflow: "hidden",
  },
});
