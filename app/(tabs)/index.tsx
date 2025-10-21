import { useState } from "react";
import { View, Text, TextInput, Button, StyleSheet, ActivityIndicator, Alert } from "react-native";

// *** IMPORTANTE: REEMPLAZA ESTO CON LA IP REAL DE TU COMPUTADORA O URL DE DESPLIEGUE ***
const API_URL = "http://192.168.0.96:8000/buscar"; 

export default function Index() {
  const [texto, setTexto] = useState("");
  const [respuesta, setRespuesta] = useState(null); // Usaremos un objeto para la respuesta
  const [cargando, setCargando] = useState(false); // Nuevo estado para indicar carga

  const traducir = async () => {
    if (!texto.trim()) {
      Alert.alert("Error", "Por favor, ingresa una palabra o frase para traducir.");
      return;
    }
    
    setCargando(true); // Empieza la carga

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ texto: texto }), // Envía el texto en formato JSON
      });

      if (!response.ok) {
        // Manejo de errores HTTP (ej: 404, 500)
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const data = await response.json(); // Parsea la respuesta JSON

      // La API devuelve: { "grupo": "...", "frase_similar": "...", "similitud": 0.8457 }
      setRespuesta(data); 

    } catch (error) {
      console.error("Error al conectar con la API:", error);
      Alert.alert("Error de Conexión", "No se pudo contactar al servidor de PLN. Asegúrate de que la API esté corriendo y la IP sea correcta.");
      setRespuesta(null);
    } finally {
      setCargando(false); // Finaliza la carga, sin importar el resultado
    }
  };
  
  const RespuestaResultado = () => {
    // 🛑 CORRECCIÓN: Verifica que 'respuesta' exista y no sea null antes de acceder a sus propiedades
    if (respuesta) { 
      return (
        <View style={styles.resultBox}>
          {/* Aquí ya es seguro usar respuesta.grupo, respuesta.frase_similar, etc. */}
          <Text style={styles.resultText}>
            Frase Sugerida ({respuesta.grupo}): **{respuesta.frase_similar}**
          </Text>
          <Text style={styles.similarityText}>
            Similitud: {(respuesta.similitud * 100).toFixed(2)}%
          </Text>
          {/* Lógica de animación pendiente */}
        </View>
      );
    }
    // Si la respuesta es null (valor inicial), retorna null para no renderizar nada
    return null; 
  }

  return (
    <View style={styles.container}>
      {/*... Header ...*/}
      <View style={styles.header}>
        <Text style={styles.headerText}>Traductor Español → LSM</Text>
      </View>

      {/*Espacio para animación */}
      <View style={styles.animationBox}>
        {cargando ? (
          <ActivityIndicator size="large" color="#FFD700" />
        ) : (
          <Text style={{ color: "gray", textAlign: "center" }}>[Aquí va la animación]</Text>
        )}
        
      </View>

      {/*Input de texto*/}
      <View style={styles.inputBox}>
        <TextInput
          style={styles.input}
          placeholder="Escribe una palabra o frase"
          value={texto}
          onChangeText={setTexto}
          editable={!cargando} // Deshabilita la edición mientras carga
        />
        <Button 
          title={cargando ? "Cargando..." : "Traducir"} 
          onPress={traducir} 
          disabled={cargando} // Deshabilita el botón mientras carga
        />
        <RespuestaResultado /> {/* Muestra el resultado aquí */}
      </View>

      {/*... Footer ...*/}
      <View style={styles.footer}>
        <Text style={styles.footerText}>Proyecto TT LSM</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // ... estilos existentes ...
  // AGREGAR: Estilos para el resultado
  resultBox: {
    marginTop: 15,
    padding: 10,
    backgroundColor: '#eee',
    borderRadius: 8,
  },
  resultText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  similarityText: {
    fontSize: 14,
    color: 'gray',
    marginTop: 5,
  },
  // ... estilos existentes (incluye `container`, `header`, `headerText`, etc.)
  container: {
    flex: 1,
    backgroundColor: "white", 
  },
  header: {
    backgroundColor: "#FFD700", 
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