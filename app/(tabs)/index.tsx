import React, { useState, useCallback } from "react";
import { View, Text, TextInput, Button, StyleSheet, ActivityIndicator, Alert } from "react-native";
import { VideoView, useVideoPlayer } from "expo-video";

// 1. Tipo de dato de la respuesta
interface RespuestaAPI {
  grupo: string;
  frase_similar: string;
  similitud: number;
  url_video: string;
}

const API_URL = "http://192.168.0.96:8000/buscar";

export default function Index() {
  const [texto, setTexto] = useState("");
  const [respuesta, setRespuesta] = useState<RespuestaAPI | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const traducir = useCallback(async () => {
    if (!texto.trim()) {
      Alert.alert("Error", "Por favor, ingresa una palabra o frase para traducir.");
      return;
    }

    setCargando(true);
    setRespuesta(null);
    setError(null);

    try {
      console.log(`Intentando conectar a: ${API_URL}`);

      let response;
      let lastError = null;

      // Reintento con backoff (máx 3 intentos)
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          response = await fetch(API_URL, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ texto }),
          });

          if (response.ok) break;
          throw new Error(`Error HTTP: ${response.status} - ${response.statusText}`);
        } catch (err) {
          lastError = err;
          console.error(`Intento ${attempt + 1} fallido. Esperando ${500 * (attempt + 1)}ms...`, err);
          await new Promise((resolve) => setTimeout(resolve, 500 * (attempt + 1)));
        }
      }

      if (!response || !response.ok) {
        throw lastError || new Error("Falló la conexión después de múltiples reintentos.");
      }

      const data: RespuestaAPI = await response.json();
      setRespuesta(data);
    } catch (err) {
      console.error("Error definitivo al conectar con la API:", err);
      const errorMessage = `No se pudo contactar al servidor de PLN. Detalle: ${(err as Error).message}. Asegúrate de que la API esté corriendo y la IP sea correcta.`;
      setError(errorMessage);
      Alert.alert("Error de Conexión", errorMessage);
      setRespuesta(null);
    } finally {
      setCargando(false);
    }
  }, [texto]);

  // 🎬 Player de video (usa la nueva API)
  const player = useVideoPlayer(
    respuesta?.url_video ? { uri: respuesta.url_video } : null,
    (player) => {
      if (player) {
        player.loop = true;
        player.play();
      }
    }
  );

  // ✅ Componente interno para mostrar resultado
  const RespuestaResultado = () => {
    if (respuesta) {
      return (
        <View style={styles.resultBox}>
          <Text style={styles.resultText}>
            Frase Sugerida ({respuesta.grupo}): {respuesta.frase_similar}
          </Text>
          <Text style={styles.similarityText}>
            Similitud: {(respuesta.similitud * 100).toFixed(2)}%
          </Text>
          {respuesta.url_video && (
            <Text style={{ fontSize: 10, marginTop: 5, color: "#007bff" }}>
              Video URL: {respuesta.url_video.substring(0, 40)}...
            </Text>
          )}
        </View>
      );
    }
    return null;
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerText}>Traductor Español → LSM</Text>
      </View>

      {/* Contenido principal */}
      <View style={styles.animationBox}>
        {cargando ? (
          <ActivityIndicator size="large" color="#FFD700" />
        ) : respuesta && respuesta.url_video ? (
          <VideoView
            style={styles.videoPlayer}
            player={player}
            allowsFullscreen
            allowsPictureInPicture
          />
        ) : (
          <Text style={{ color: "gray", textAlign: "center" }}>
            Ingresa una frase para ver la traducción en LSM.
          </Text>
        )}

        {/* Error visual */}
        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorTextTitle}>Error de Conexión:</Text>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
      </View>

      {/* Input y resultado */}
      <View style={styles.inputBox}>
        <TextInput
          style={styles.input}
          placeholder="Escribe una palabra o frase"
          value={texto}
          onChangeText={setTexto}
          editable={!cargando}
        />
        <Button title={cargando ? "Cargando..." : "Traducir"} onPress={traducir} disabled={cargando} />
        <RespuestaResultado />
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>Proyecto TT LSM</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: "#fff",
    width: "100%",
  },
  videoPlayer: {
    width: "100%",
    maxWidth: 360,
    // aspectRatio: 360*360,
    alignSelf: "center",
    borderRadius: 10,
    backgroundColor: "white",
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
  resultBox: {
    marginTop: 15,
    padding: 10,
    backgroundColor: "#eee",
    borderRadius: 8,
  },
  resultText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  similarityText: {
    fontSize: 14,
    color: "gray",
    marginTop: 5,
  },
  errorBox: {
    marginTop: 10,
    padding: 10,
    backgroundColor: "#fee2e2",
    borderColor: "#f87171",
    borderWidth: 1,
    borderRadius: 8,
    width: "100%",
    maxWidth: 350,
  },
  errorTextTitle: {
    fontWeight: "bold",
    color: "#b91c1c",
    marginBottom: 4,
  },
  errorText: {
    fontSize: 12,
    color: "#b91c1c",
  },
});
