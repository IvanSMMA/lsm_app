import React, { useState, useCallback, useEffect } from "react";
import { View, Text, TextInput, Button, StyleSheet, ActivityIndicator, Alert } from "react-native";
import { VideoView, useVideoPlayer } from "expo-video";

// 1. Tipo de dato de la respuesta
interface RespuestaAPI {
  query: string;
  grupo: string | null;
  frase_similar: string;
  similitud: number;
  deletreo_activado: boolean;
  deletreo: string[] | null;
  total_caracteres: number | null;
  url_video: string;
  spell_urls: string[] | null;
}

const API_URL = "http://192.168.0.159:8000/buscar";

// Señales especiales (no son videos, son señales visuales)
const SIGNAL_MARKERS = {
  inicio: "SIGNAL_INICIO",
  fin: "SIGNAL_FIN"
};

// Caracteres especiales no permitidos
const CARACTERES_NO_PERMITIDOS = [
  '.', ',', ';', ':', '!', '-', '_', '@', '#', '$', '%', '&',
  '/', '\\', '(', ')', '[', ']', '{', '}', '+', '=', '*','0', '1', '2', '3', '4', '5', '6', '7', '8', '9'
];

const NOMBRES_CARACTERES: { [key: string]: string } = {
  '.': 'punto',
  ',': 'coma',
  ';': 'punto y coma',
  ':': 'dos puntos',
  '!': 'exclamación',
  '?': 'interrogación',
  '-': 'guión',
  '_': 'guión bajo',
  '@': 'arroba',
  '#': 'numeral',
  '$': 'dólar',
  '%': 'porcentaje',
  '&': 'ampersand',
  '/': 'barra',
  '\\': 'barra invertida',
  '(': 'paréntesis abierto',
  ')': 'paréntesis cerrado',
  '[': 'corchete abierto',
  ']': 'corchete cerrado',
  '{': 'llave abierta',
  '}': 'llave cerrada',
  '+': 'más',
  '=': 'igual',
  '*': 'asterisco',
  '"': 'comillas',
  "'": 'comilla simple'
};

export default function Index() {
  const [texto, setTexto] = useState("");
  const [respuesta, setRespuesta] = useState<RespuestaAPI | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorValidacion, setErrorValidacion] = useState<{ caracter: string, nombre: string } | null>(null);
  // Estados para la reproducción secuencial de deletreo
  const [indiceLetraActual, setIndiceLetraActual] = useState(0);
  const [videoActual, setVideoActual] = useState<string | null>(null);
  const [secuenciaCompleta, setSecuenciaCompleta] = useState<string[]>([]);
  const [enPausa, setEnPausa] = useState(false);

  // Validar caracteres antes de traducir
  const validarTexto = (texto: string): { valido: boolean; caracterInvalido?: string; nombreCaracter?: string } => {
    for (const char of texto) {
      if (CARACTERES_NO_PERMITIDOS.includes(char)) {
        return {
          valido: false,
          caracterInvalido: char,
          nombreCaracter: NOMBRES_CARACTERES[char] || 'número'
        };
      }
    }
    return { valido: true };
  };

  const traducir = useCallback(async () => {
    setErrorValidacion(null);
    if (!texto.trim()) {
      Alert.alert("Error", "Por favor, ingresa una palabra o frase para traducir.");
      return;
    }

    // Validar caracteres
    const validacion = validarTexto(texto);
    if (!validacion.valido) {
      setErrorValidacion({
        caracter: validacion.caracterInvalido!,
        nombre: validacion.nombreCaracter!,
      });
      // También limpiamos el resultado anterior y cargando
      setRespuesta(null);
      setCargando(false);
      setError(null);
      return;
    }

    setCargando(true);
    setRespuesta(null);
    setError(null);
    setIndiceLetraActual(0);
    setVideoActual(null);
    setSecuenciaCompleta([]);
    setEnPausa(false);

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

      // Inicializar el video correspondiente
      if (data.deletreo_activado && data.spell_urls && data.spell_urls.length > 0) {
        // Crear secuencia: INICIO + letras + FIN
        const secuencia = [
          SIGNAL_MARKERS.inicio,
          ...data.spell_urls,
          SIGNAL_MARKERS.fin
        ];
        setSecuenciaCompleta(secuencia);
        setVideoActual(secuencia[0]);
        setIndiceLetraActual(0);
      } else if (data.url_video) {
        setVideoActual(data.url_video);
      }

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

  // Player de video (solo si no es una señal)
  const esSenal = videoActual === SIGNAL_MARKERS.inicio || videoActual === SIGNAL_MARKERS.fin;

  const player = useVideoPlayer(
    videoActual && !esSenal ? { uri: videoActual } : null,
    (player) => {
      if (player) {
        player.loop = false;
        player.muted = false;
        player.play();
      }
    }
  );

  // Efecto para manejar la reproducción de videos y señales
  useEffect(() => {
    if (!videoActual) return;

    // Si es una señal, mostrarla por 2 segundos y pasar al siguiente
    if (videoActual === SIGNAL_MARKERS.inicio || videoActual === SIGNAL_MARKERS.fin) {
      const timer = setTimeout(() => {
        if (respuesta?.deletreo_activado && secuenciaCompleta.length > 0) {
          const siguienteIndice = indiceLetraActual + 1;

          if (siguienteIndice < secuenciaCompleta.length) {
            setIndiceLetraActual(siguienteIndice);
            setVideoActual(secuenciaCompleta[siguienteIndice]);
          } else {
            // Terminó la secuencia completa, reiniciar
            setTimeout(() => {
              setIndiceLetraActual(0);
              setVideoActual(secuenciaCompleta[0]);
            }, 1000);
          }
        }
      }, 2000); // Mostrar señal por 2 segundos

      return () => clearTimeout(timer);
    }

    // Si no es una señal, manejar videos normales
    if (!player) return;

    const subscription = player.addListener('playingChange', (newStatus) => {
      if (newStatus.isPlaying === false && player.status === 'readyToPlay' && !enPausa) {
        // Video terminó
        if (respuesta?.deletreo_activado && secuenciaCompleta.length > 0) {
          // Modo deletreo: reproducir secuencia completa
          const siguienteIndice = indiceLetraActual + 1;

          if (siguienteIndice < secuenciaCompleta.length) {
            // Hay más videos en la secuencia
            setEnPausa(true);
            setTimeout(() => {
              setIndiceLetraActual(siguienteIndice);
              setVideoActual(secuenciaCompleta[siguienteIndice]);
              setEnPausa(false);
            }, 100); // Pausa de 500ms entre videos
          } else {
            // Terminó la secuencia completa, reiniciar
            setEnPausa(true);
            setTimeout(() => {
              setIndiceLetraActual(0);
              setVideoActual(secuenciaCompleta[0]);
              setEnPausa(false);
            }, 1000); // Pausa de 1 segundo antes de reiniciar
          }
        } else {
          // Modo frase: loop con pausa de 1 segundo
          setEnPausa(true);
          setTimeout(() => {
            if (player && videoActual) {
              player.replay();
              setEnPausa(false);
            }
          }, 1000); // Pausa de 1 segundo entre repeticiones
        }
      }
    });

    return () => {
      subscription.remove();
    };
  }, [player, videoActual, respuesta, indiceLetraActual, secuenciaCompleta, enPausa]);

  // Actualizar el player cuando cambia el video actual (solo si no es señal)
  useEffect(() => {
    const esSenal = videoActual === SIGNAL_MARKERS.inicio || videoActual === SIGNAL_MARKERS.fin;
    if (videoActual && player && !enPausa && !esSenal) {
      player.replace({ uri: videoActual });
      player.play();
    }
  }, [videoActual, enPausa, player]);

  const obtenerEstadoReproduccion = () => {
    if (!respuesta?.deletreo_activado || secuenciaCompleta.length === 0) {
      return "";
    }

    const totalLetras = respuesta.deletreo?.length || 0;

    // Índice 0 es INICIO
    if (indiceLetraActual === 0) {
      return "▶ SEÑAL DE INICIO";
    }

    // Último índice es FIN
    if (indiceLetraActual === secuenciaCompleta.length - 1) {
      return "▶ SEÑAL DE FIN";
    }

    // En medio, mostrar la letra actual
    const indiceLetra = indiceLetraActual - 1; // Restar 1 porque el índice 0 es INICIO
    if (respuesta.deletreo && indiceLetra >= 0 && indiceLetra < respuesta.deletreo.length) {
      return `▶ Letra ${indiceLetra + 1} de ${totalLetras}: ${respuesta.deletreo[indiceLetra]}`;
    }

    return "";
  };

  const RespuestaResultado = () => {
    if (respuesta) {
      const titulo = respuesta.deletreo_activado
        ? "Deletreo Activado (Similitud Baja)"
        : `Frase Sugerida (${respuesta.grupo})`;

      const fraseMostrada = respuesta.frase_similar;

      return (
        <View style={styles.resultBox}>
          <Text style={styles.resultText}>
            {titulo}: {fraseMostrada}
          </Text>

          {/* Mostrar lista de deletreo si está activo */}
          {respuesta.deletreo_activado && respuesta.deletreo && (
            <>
              <Text style={styles.similarityText}>
                Letras: {respuesta.deletreo.join(", ")}
              </Text>
              <Text style={styles.progressText}>
                {obtenerEstadoReproduccion()}
              </Text>
              <Text style={styles.infoText}>
                🔄 La secuencia se repetirá automáticamente
              </Text>
            </>
          )}

          {!respuesta.deletreo_activado && (
            <Text style={styles.infoText}>
              🔄 El video se repetirá automáticamente
            </Text>
          )}

          <Text style={styles.similarityText}>
            Similitud: {(respuesta.similitud * 100).toFixed(2)}%
          </Text>
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
        ) : errorValidacion ? ( // 👈 NUEVA LÓGICA DE ERROR DE VALIDACIÓN
          <View style={[styles.videoPlayer, styles.errorValidationContainer]}>
            <Text style={styles.errorValidationTitle}>❌ Carácter No Permitido ❌</Text>
            <Text style={styles.errorValidationText}>
              {`El carácter "${errorValidacion.caracter}" (${errorValidacion.nombre}) no está permitido.`}
            </Text>
            <Text style={styles.errorValidationSubtitle}>
              Solo se permiten letras y espacios para la traducción.
            </Text>
          </View>
       ) : videoActual === SIGNAL_MARKERS.inicio ? (
            // Mostrar señal de INICIO en el espacio del video
            <View style={styles.videoPlayer}>
              <View style={styles.signalContainer}>
                <View style={[styles.signalCircle, styles.signalInicio]}>
                  <Text style={styles.signalText}>INICIO</Text>
                </View>
              </View>
            </View>
          ) : videoActual === SIGNAL_MARKERS.fin ? (
            // Mostrar señal de FIN en el espacio del video
            <View style={styles.videoPlayer}>
              <View style={styles.signalContainer}>
                <View style={[styles.signalCircle, styles.signalFin]}>
                  <Text style={styles.signalText}>FIN</Text>
                </View>
              </View>
            </View>
          ) : videoActual ? (
            <>
              <VideoView
                style={styles.videoPlayer}
                player={player}
                // allowsFullscreen
                // allowsPictureInPicture
              />
              {enPausa && (
                <View style={styles.pauseIndicator}>
                  <Text style={styles.pauseText}>⏸ Pausa</Text>
                </View>
              )}
            </>
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
          placeholder="Escribe una palabra o frase (solo letras)"
          value={texto}
          onChangeText={setTexto}
          editable={!cargando}
        />
        <Button
          title={cargando ? "Cargando..." : "Traducir"}
          onPress={traducir}
          disabled={cargando}
        />
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
    aspectRatio: 1,
    alignSelf: "center",
    borderRadius: 10,
    backgroundColor: "#f5f5f5",
  },
  pauseIndicator: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  pauseText: {
    color: "white",
    fontSize: 14,
    fontWeight: "bold",
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
  progressText: {
    fontSize: 14,
    color: "#007bff",
    marginTop: 5,
    fontWeight: "600",
  },
  infoText: {
    fontSize: 12,
    color: "#666",
    marginTop: 5,
    fontStyle: "italic",
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
  signalContainer: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ffffffff",
    borderRadius: 10,
  },
  signalCircle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  signalInicio: {
    backgroundColor: "#FFD700", // Amarillo
  },
  signalFin: {
    backgroundColor: "#4169E1", // Azul
  },
  signalText: {
    fontSize: 32,
    fontWeight: "bold",
    color: "white",
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  errorValidationContainer: {
  justifyContent: "center",
  alignItems: "center",
  backgroundColor: "#ffe0e0", // Un rojo muy suave
  padding: 20,
  borderWidth: 2,
  borderColor: "#e53e3e", // Rojo
  width: "100%",
},
errorValidationTitle: {
  fontSize: 18,
  fontWeight: "bold",
  color: "#e53e3e",
  marginBottom: 10,
  textAlign: "center",
},
errorValidationText: {
  fontSize: 16,
  color: "#333",
  marginBottom: 5,
  textAlign: "center",
},
errorValidationSubtitle: {
  fontSize: 14,
  color: "#666",
  marginTop: 10,
  textAlign: "center",
  fontStyle: "italic",
},
});