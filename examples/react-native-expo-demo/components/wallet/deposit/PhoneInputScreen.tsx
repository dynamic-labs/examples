import {
  Image,
  InputAccessoryView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

interface PhoneInputScreenProps {
  phone: string;
  onPhoneChange: (text: string) => void;
  onSubmit: () => void;
  phoneInputRef: React.RefObject<TextInput>;
}

export default function PhoneInputScreen({
  phone,
  onPhoneChange,
  onSubmit,
  phoneInputRef,
}: PhoneInputScreenProps) {
  // Format phone number as user types
  const formatPhoneNumber = (text: string) => {
    // Remove all non-digits
    const digits = text.replace(/\D/g, "");

    // Format as (XXX) XXX-XXXX
    if (digits.length <= 3) {
      return digits;
    } else if (digits.length <= 6) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    } else {
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(
        6,
        10
      )}`;
    }
  };

  const handlePhoneChange = (text: string) => {
    // Extract only digits
    const digits = text.replace(/\D/g, "");
    // Limit to 10 digits
    if (digits.length <= 10) {
      onPhoneChange(digits);
    }
  };

  const isPhoneValid = phone.length === 10;

  return (
    <>
      <View style={styles.card}>
        <View style={styles.iconContainer}>
          <Image
            source={require("@/assets/images/icons/lock-icon.png")}
            style={styles.lockIcon}
            resizeMode="contain"
          />
        </View>

        <Text style={styles.title}>Verify Your Phone</Text>
        <Text style={styles.subtitle}>
          Enter your phone number to receive a verification code
        </Text>

        <View style={styles.inputWrapper}>
          <View style={styles.inputContainer}>
            <Text style={styles.countryCode}>+1</Text>
            <TextInput
              ref={phoneInputRef}
              style={styles.input}
              value={formatPhoneNumber(phone)}
              onChangeText={handlePhoneChange}
              placeholder="(555) 123-4567"
              placeholderTextColor="#555555"
              keyboardType="phone-pad"
              keyboardAppearance="dark"
              returnKeyType="done"
              onSubmitEditing={isPhoneValid ? onSubmit : undefined}
              inputAccessoryViewID="phoneInputAccessory"
            />
          </View>

          <TouchableOpacity
            style={[
              styles.primaryButton,
              !isPhoneValid && styles.primaryButtonDisabled,
            ]}
            onPress={onSubmit}
            disabled={!isPhoneValid}
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

      <InputAccessoryView nativeID="phoneInputAccessory">
        <View style={{ height: 0 }} />
      </InputAccessoryView>
    </>
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
  inputWrapper: {
    width: "100%",
    marginBottom: 16,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 0,
    borderRadius: 14,
    paddingVertical: 18,
    paddingHorizontal: 18,
    marginBottom: 14,
    backgroundColor: "#1a1a1a",
  },
  countryCode: {
    fontSize: 17,
    fontWeight: "600",
    color: "#ffffff",
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 17,
    color: "#ffffff",
  },
  primaryButton: {
    backgroundColor: "#4779FF",
    borderRadius: 14,
    paddingVertical: 18,
    paddingHorizontal: 24,
    alignItems: "center",
  },
  primaryButtonDisabled: {
    opacity: 0.5,
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
