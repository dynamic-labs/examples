import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface NumericKeypadProps {
  onNumberPress: (num: string) => void;
  onBackspace: () => void;
}

export default function NumericKeypad({
  onNumberPress,
  onBackspace,
}: NumericKeypadProps) {
  return (
    <View style={styles.keypad}>
      <View style={styles.keypadRow}>
        {[1, 2, 3].map((num) => (
          <TouchableOpacity
            key={num}
            style={styles.keypadButton}
            onPress={() => onNumberPress(num.toString())}
          >
            <Text style={styles.keypadButtonText}>{num}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.keypadRow}>
        {[4, 5, 6].map((num) => (
          <TouchableOpacity
            key={num}
            style={styles.keypadButton}
            onPress={() => onNumberPress(num.toString())}
          >
            <Text style={styles.keypadButtonText}>{num}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.keypadRow}>
        {[7, 8, 9].map((num) => (
          <TouchableOpacity
            key={num}
            style={styles.keypadButton}
            onPress={() => onNumberPress(num.toString())}
          >
            <Text style={styles.keypadButtonText}>{num}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.keypadRow}>
        <TouchableOpacity
          style={styles.keypadButton}
          onPress={() => onNumberPress(".")}
        >
          <Text style={styles.keypadButtonText}>.</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.keypadButton}
          onPress={() => onNumberPress("0")}
        >
          <Text style={styles.keypadButtonText}>0</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.keypadButton} onPress={onBackspace}>
          <Ionicons name="backspace-outline" size={28} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  keypad: {
    marginTop: 8,
    marginBottom: 8,
    gap: 12,
  },
  keypadRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 62,
  },
  keypadButton: {
    width: 75,
    height: 55,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
  },
  keypadButtonText: {
    fontSize: 28,
    fontWeight: "300",
    color: "#fff",
  },
});
