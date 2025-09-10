import { useState } from "react";
import { View, Text, TextInput, Button, StyleSheet } from "react-native";

export default function Index() {
  const [texto, setTexto] = useState("");
  const [respuesta, setRespuesta] = useState("");

  const traducir = () => {
    setRespuesta(`👉 Seña simulada para: "${texto}"`);
  };

  return (
    <View style={styles.container}>
      {/*Heaeder*/}
      <View style={styles.header}>
        <Text style={styles.headerText}>Traductor Español → LSM</Text>
      </View>

      {/*Espacio para animación */}
      <View style={styles.animationBox}>
        <Text style={{ color: "gray", textAlign: "center" }}>[Aquí va la animación]</Text>
      </View>

      {/*Input de texto*/}
      <View style={styles.inputBox}>
        <TextInput
          style={styles.input}
          placeholder="Escribe una palabra o frase"
          value={texto}
          onChangeText={setTexto}
        />
        <Button title="Traducir" onPress={traducir} />
        {respuesta}
      </View>
      {/* Fopoter */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>Proyecto TT LSM</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white", // fuerza fondo blanco
  },
  header: {
    backgroundColor: "#FFD700", // amarillo
    padding: 20,
    alignItems: "center",
  },
  headerText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "black",
  },
  animationBox: {
    flex: 3,
    justifyContent: "center",
    alignItems: "center",
  },
  inputBox: {
    flex: 2,
    padding: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    padding: 10,
    marginBottom: 10,
    backgroundColor: "white",
  },
  result: {
    marginTop: 20,
    fontSize: 16,
    textAlign: "center",
  },
  footer: {
    backgroundColor: "#FFD700",
    padding: 15,
    alignItems: "center",
  },
  footerText: {
    fontSize: 14,
    color: "black",
  },
});
