import React, { useState, useCallback, useEffect } from "react";
import { View, Text, TextInput, Button, StyleSheet, ActivityIndicator, Alert, TouchableOpacity } from "react-native";
import { VideoView, useVideoPlayer } from "expo-video";
import { MaterialIcons } from "@expo/vector-icons"; 

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

// const API_URL = "https://modulo-pln-vf.onrender.com/buscar";
const API_URL = "https://ivanSNMA-singai-pln-matcher.hf.space/buscar"

const SIGNAL_MARKERS = {
  inicio: "SIGNAL_INICIO",
  fin: "SIGNAL_FIN",
  espacio: "SIGNAL_ESPACIO" 
};


const CARACTERES_NO_PERMITIDOS = [
  '.', ',', ';', ':', '!', '-', '_', '@', '#', '$', '%', '&', "'", '"',
  '/', '\\', '(', ')', '[', ']', '{', '}', '=', '*', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9'
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
  
  
  const [indiceLetraActual, setIndiceLetraActual] = useState(0);
  const [videoActual, setVideoActual] = useState<string | null>(null);
  const [secuenciaCompleta, setSecuenciaCompleta] = useState<string[]>([]);
  const [enPausa, setEnPausa] = useState(false);
  const [pausadoPorUsuario, setPausadoPorUsuario] = useState(false);
  const [deletreoInfo, setDeletreoInfo] = useState<string[]>([]);
  
  
  const mostrarAyuda = () => {
  Alert.alert(
    "💡 ¿CÓMO FUNCIONA SignAI?",
    `
ESTRUCTURA DE LA TRADUCCIÓN:

1. ENTRADA DE TEXTO:
   - Solo se permiten LETRAS y ESPACIOS.
   - Usa el símbolo '+' para CONCATENAR varias frases en una sola secuencia (Ej: mi nombre es+Juan).

2. CARACTERES NO PERMITIDOS:
   - Los números y la mayoría de los SÍMBOLOS (.,;:-_@#$...) serán RECHAZADOS.

3. FLUJO DE REPRODUCCIÓN SECUENCIAL:
   - INICIO: La secuencia comienza con la señal AMARILLA (INICIO).
   - FIN: La secuencia termina con la señal AZUL (FIN).
   - ESPACIOS: Los espacios se representan con la señal VERDE [ _ ].

4. CONTROLES:
   - Los botones PAUSA/PLAY (⏸/▶) y REINICIO (🔄) aparecen debajo del reproductor para controlar la secuencia.
    `,
    [{ text: "ENTENDIDO" }]
  );
};
  
  
  const reiniciarApp = useCallback(() => {
    setTexto("");
    setRespuesta(null);
    setCargando(false);
    setError(null);
    setErrorValidacion(null);
    setIndiceLetraActual(0);
    setVideoActual(null);
    setSecuenciaCompleta([]);
    setEnPausa(false);
    setPausadoPorUsuario(false);
    setDeletreoInfo([]);
  }, []);

  
  const avanzarSecuencia = useCallback(() => {
    
    
    setIndiceLetraActual(prevIndice => {
        const siguienteIndice = prevIndice + 1;
        const totalElementos = secuenciaCompleta.length; 

        
        if (siguienteIndice < totalElementos) {
            
            setEnPausa(true);
            setTimeout(() => {
                setVideoActual(secuenciaCompleta[siguienteIndice]);
                setEnPausa(false);
            }, 1000);
        } else {
            
            setEnPausa(true);
            setTimeout(() => {
                setVideoActual(secuenciaCompleta[0]);
                setIndiceLetraActual(0); 
                setEnPausa(false);
            }, 1000); 
            return 0; 
        }
        
        return siguienteIndice; 
    });
  }, [secuenciaCompleta]);

  const reiniciarReproduccion = useCallback(() => {
    if (secuenciaCompleta.length > 0) {
      setPausadoPorUsuario(false); 
      setIndiceLetraActual(0);
      setVideoActual(secuenciaCompleta[0]);
      setEnPausa(false);
      
    }
  }, [secuenciaCompleta]);

  
  const validarTexto = (texto: string): { valido: boolean; caracterInvalido?: string; nombreCaracter?: string } => {
    
    const textoSinMas = texto.replace(/\+/g, '');
    
    for (const char of textoSinMas) {
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

  
  const procesarMultiplesFrases = async (textoCompleto: string): Promise<{
    secuencia: string[],
    deletreoInfo: string[]
  }> => {
    const frases = textoCompleto.split('+').map(f => f.trim()).filter(f => f.length > 0);
    
    let secuenciaFinal: string[] = [];
    let deletreoInfoFinal: string[] = [];

    for (const frase of frases) {
      try {
        const response = await fetch(API_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ texto: frase }),
        });

        if (!response.ok) {
          throw new Error(`Error HTTP: ${response.status}`);
        }

        const data: RespuestaAPI = await response.json();

        if (data.deletreo_activado && data.spell_urls && data.spell_urls.length > 0) {
          
          const urlsProcesadas = data.spell_urls.map((url, index) => {
            const deletreado = data.deletreo || [];
            
            
            if (deletreado[index] === "espacio" && url === "") {
                return SIGNAL_MARKERS.espacio;
            }
            
            return url;
          });
          
          secuenciaFinal.push(...urlsProcesadas);
          
          
          if (data.deletreo) {
            deletreoInfoFinal.push(...data.deletreo);
          }
        } else if (data.url_video) {
          
          secuenciaFinal.push(data.url_video);
          deletreoInfoFinal.push(data.frase_similar);
        }
      } catch (err) {
        console.error(`Error al procesar frase "${frase}":`, err);
        throw err;
      }
      
      
      if (secuenciaFinal.length > 0 && frase !== frases[frases.length - 1]) {
        secuenciaFinal.push(SIGNAL_MARKERS.espacio);
        deletreoInfoFinal.push("espacio");
      }
    }

    return { secuencia: secuenciaFinal, deletreoInfo: deletreoInfoFinal };
  };

  const traducir = useCallback(async () => {
    setErrorValidacion(null);
    if (!texto.trim()) {
      Alert.alert("Error", "Por favor, ingresa una palabra o frase para traducir.");
      return;
    }

    
    const validacion = validarTexto(texto);
    if (!validacion.valido) {
      setErrorValidacion({
        caracter: validacion.caracterInvalido!,
        nombre: validacion.nombreCaracter!,
      });
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
    setPausadoPorUsuario(false);
    setDeletreoInfo([]);

    try {
      console.log(`Intentando conectar a: ${API_URL}`);
      
      
      const { secuencia, deletreoInfo } = await procesarMultiplesFrases(texto);
      
      if (secuencia.length === 0) {
           setError("No se pudo obtener la secuencia de videos. La respuesta de la API fue vacía.");
           return;
      }

      
      const secuenciaConSenales = [
        SIGNAL_MARKERS.inicio,
        ...secuencia,
        SIGNAL_MARKERS.fin
      ];

      setSecuenciaCompleta(secuenciaConSenales);
      setDeletreoInfo(deletreoInfo);
      setVideoActual(secuenciaConSenales[0]);
      setIndiceLetraActual(0);

      
      setRespuesta({
        query: texto,
        grupo: null,
        frase_similar: deletreoInfo.join(" "),
        similitud: 1.0,
        deletreo_activado: true, 
        deletreo: deletreoInfo,
        total_caracteres: deletreoInfo.length,
        url_video: "",
        spell_urls: secuencia
      });

    } catch (err) {
      console.error("Error al conectar con la API:", err);
      const errorMessage = `No se pudo contactar al servidor. Detalle: ${(err as Error).message}`;
      setError(errorMessage);
      Alert.alert("Error de Conexión", errorMessage);
      setRespuesta(null);
    } finally {
      setCargando(false);
    }
  }, [texto]);

  
  const togglePausa = () => {
    setPausadoPorUsuario(prev => !prev);
  };

  
  const esSenal = videoActual === SIGNAL_MARKERS.inicio || 
                  videoActual === SIGNAL_MARKERS.fin || 
                  videoActual === SIGNAL_MARKERS.espacio;

  const player = useVideoPlayer(
    videoActual && !esSenal ? { uri: videoActual } : null,
    (player) => {
      if (player) {
        player.loop = false;
        player.muted = true;
        
        if (!pausadoPorUsuario) {
          player.play();
        }
      }
    }
  );

  
  useEffect(() => {
    
    if (pausadoPorUsuario) {
      player?.pause();
      return;
    }

    
    if (!videoActual || enPausa) return;

    
    if (esSenal) {
      const duracion = videoActual === SIGNAL_MARKERS.espacio ? 500 : 500;
      
      const timer = setTimeout(avanzarSecuencia, duracion);
      return () => clearTimeout(timer);
    }

    
    if (!player) return;

    
    player.replace({ uri: videoActual });
    if (!player.playing) {
        player.play();
    }
    
    
    const subscription = player.addListener('playingChange', (newStatus) => {
        
        
        if (newStatus.isPlaying === false && !pausadoPorUsuario) {
             avanzarSecuencia(); 
        }
    });

    return () => {
      subscription.remove();
    };
  }, [videoActual, pausadoPorUsuario, esSenal, player, avanzarSecuencia, enPausa]);


  
  


  const obtenerEstadoReproduccion = () => {
    if (secuenciaCompleta.length === 0) {
      return "";
    }

    
    if (indiceLetraActual === 0) {
      return "▶ SEÑAL DE INICIO";
    }

    
    if (indiceLetraActual === secuenciaCompleta.length - 1) {
      return "▶ SEÑAL DE FIN";
    }

    
    const indiceReal = indiceLetraActual - 1;

    
    const elementoActual = deletreoInfo[indiceReal];

    if (videoActual === SIGNAL_MARKERS.espacio || elementoActual === "espacio") {
      return `▶ Elemento ${indiceReal + 1} de ${deletreoInfo.length}: [espacio]`;
    }

    if (deletreoInfo && indiceReal >= 0 && indiceReal < deletreoInfo.length) {
      return `▶ Elemento ${indiceReal + 1} de ${deletreoInfo.length}: ${elementoActual}`;
    }

    return "";
  };

  
  const VideoControls = () => {
    const mostrarControles = secuenciaCompleta.length > 0;

    if (!mostrarControles) {
      return null;
    }

    return (
      <View style={styles.controlsContainer}>
        {/* Botón de Pausa / Reanudar */}
        <TouchableOpacity
          style={[styles.controlButton, pausadoPorUsuario && styles.controlButtonActive]}
          onPress={togglePausa}
        >
          <MaterialIcons
            name={pausadoPorUsuario ? "play-arrow" : "pause"}
            size={24}
            color="white"
          />
        </TouchableOpacity>

        {/* Botón de Reiniciar Secuencia */}
        <TouchableOpacity
          style={[styles.controlButton, styles.controlButtonRestart]}
          onPress={reiniciarReproduccion}
        >
          <MaterialIcons
            name="restart-alt"
            size={24}
            color="white"
          />
        </TouchableOpacity>
      </View>
    );
  }

  const RespuestaResultado = () => {
    if (respuesta) {
      const titulo = respuesta.deletreo_activado
        ? "Traducción en Progreso"
        : `Frase Sugerida (${respuesta.grupo})`;

      const fraseMostrada = respuesta.frase_similar;

      return (
        <View style={styles.resultBox}>
          <Text style={styles.resultText}>
            {titulo}: {fraseMostrada}
          </Text>

          {respuesta.deletreo_activado && respuesta.deletreo && (
            <>
              <Text style={styles.similarityText}>
                Secuencia: {respuesta.deletreo.join(", ")}
              </Text>
              <Text style={styles.progressText}>
                {obtenerEstadoReproduccion()}
              </Text>

            </>
          )}

          {!respuesta.deletreo_activado && (
            <Text style={styles.infoText}>
              🔄 El video se repetirá automáticamente
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
        <Text style={styles.headerText}>SignAI <MaterialIcons name="waving-hand" size={24} color="#000000ff" /></Text>
      </View>

      {/* Contenido principal */}
      <View style={styles.animationBox}>

        {/* 🆕 Botones de Ayuda y Reinicio de App */}
        <View style={styles.overlayButtons}>
          {/* Botón de Pista/Ayuda (Esquina Superior Izquierda) */}
          <TouchableOpacity
            style={[styles.utilityButton, styles.helpButton]}
            onPress={mostrarAyuda}
            disabled={cargando}
          >
            <MaterialIcons name="emoji-objects" size={24} color="#000000ff" />
          </TouchableOpacity>

          {/* Botón de Reinicio de App (Esquina Superior Derecha) */}
          <TouchableOpacity
            style={[styles.utilityButton, styles.homeButton]}
            onPress={reiniciarApp}
            disabled={cargando}
          >
            <MaterialIcons name="stop-circle" size={24} color="#000" />
          </TouchableOpacity>
        </View>
        {/* -------------------------------------- */}

        {cargando ? (
          <ActivityIndicator size="large" color="#FFD700" />
        ) : errorValidacion ? (
          <View style={[styles.videoPlayer, styles.errorValidationContainer]}>
            <Text style={styles.errorValidationTitle}>⛔ Carácter No Permitido ⛔</Text>
            <Text style={styles.errorValidationText}>
              {`El carácter "${errorValidacion.caracter}" (${errorValidacion.nombre}) no está permitido.`}
            </Text>
            <Text style={styles.errorValidationSubtitle}>
              Solo se permiten letras, espacios y el símbolo + para concatenar frases.
            </Text>
          </View>
        ) : videoActual === SIGNAL_MARKERS.inicio ? (
          <View style={styles.videoPlayer}>
            <View style={styles.signalContainer}>
              <View style={[styles.signalCircle, styles.signalInicio]}>
                <Text style={styles.signalText}>INICIO</Text>
              </View>
            </View>
          </View>
        ) : videoActual === SIGNAL_MARKERS.fin ? (
          <View style={styles.videoPlayer}>
            <View style={styles.signalContainer}>
              <View style={[styles.signalCircle, styles.signalFin]}>
                <Text style={styles.signalText}>FIN</Text>
              </View>
            </View>
          </View>
        ) : videoActual === SIGNAL_MARKERS.espacio ? (
          <View style={styles.videoPlayer}>
            <View style={styles.signalContainer}>
              <View style={[styles.signalCircle, styles.signalEspacio]}>
                <Text style={styles.signalText}>[ _ ]</Text>
              </View>
            </View>
          </View>
        ) : videoActual ? (
          <VideoView
            style={styles.videoPlayer}
            player={player}
            nativeControls={false}
          />
        ) : (
  <View style={styles.videoPlayer}>
    <View style={styles.welcomeContainer}>
      
      {/* 1. Icono de Saludo Grande (MaterialIcons: waving-hand o similar) */}
      <Text style={styles.welcomeText}>🙌🏻</Text>
      {/* <MaterialIcons name="waving-hand" size={90} color="#000000ff" style={styles.wavingHand} /> */}

      {/* 2. Nombre de la Aplicación en Grande */}
      <Text style={styles.welcomeText}>SignAI</Text>

      {/* 3. Subtítulo opcional (opcional, para dar contexto) */}
      <Text style={styles.subtitleText}>
        Ingresa una frase para ver la traducción en LSM
      </Text>
    </View>
  </View>
)}

        {/* Error visual */}
        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorTextTitle}>Error de Conexión:</Text>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
      </View>

      {/* Controles de Video */}
      <VideoControls />

      {/* Input y resultado */}
      <View style={styles.inputBox}>
        <TextInput
          style={styles.input}
          placeholder="Ingresa cualquier texto"
          placeholderTextColor="#A9A9A9"
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
        <Text style={styles.footerText}>SignAI</Text>
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
    
    position: 'relative',
  },
  
  overlayButtons: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 10, 
  },
  utilityButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    borderColor: '#ccc',
    borderWidth: 1,
  },
  helpButton: {
    
  },
  homeButton: {
    
  },
  
  videoPlayer: {
    width: "100%",
    maxWidth: 360,
    aspectRatio: 1,
    alignSelf: "center",
    borderRadius: 10,
    backgroundColor: "#ffffffff",
    overflow: "hidden",
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
    backgroundColor: '#fff',
  },
  controlButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#007bff",
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  controlButtonActive: {
    backgroundColor: "#007bff", 
  },
  controlButtonRestart: {
    backgroundColor: "#007bff", 
  },
  controlButtonText: {
    color: "white",
    fontSize: 18,
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
    backgroundColor: "#ffffff",
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
    backgroundColor: "#FFD700",
  },
  signalFin: {
    backgroundColor: "#4169E1",
  },
  signalEspacio: {
    backgroundColor: "#000000ff",
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
    backgroundColor: "#ffe0e0",
    padding: 20,
    borderWidth: 2,
    borderColor: "#e53e3e",
    width: "70%",
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

  



welcomeContainer: {
  flex: 1,
  justifyContent: 'center',
  alignItems: 'center',
  backgroundColor: '#fff',
  width: '100%',
},
welcomeText: {
  fontSize: 48,
  fontWeight: 'bold',
  color: '#000000ff', 
  textAlign: 'center',
  marginTop: 10,
},
subtitleText: {
  fontSize: 16,
  color: 'gray',
  marginTop: 10,
},
wavingHand: {
  
  transform: [{ rotate: '20deg' }], 
},
emojiText: {
  fontSize: 90, 
  textAlign: 'center',
},
});

