/* eslint-disable react-native/no-inline-styles */
import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  ScrollView,
  View,
  Alert,
  Platform,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {
  GestureHandlerRootView,
  TouchableWithoutFeedback,
} from 'react-native-gesture-handler';
import {SafeAreaView} from 'react-native-safe-area-context';
import {MotiView} from 'moti';
import ArrowIcon from '../assets/icons/ArrowIcon.svg';
import YoutubeIcon from '../assets/icons/YoutubeIcon.svg';
import {StackNavigationProp} from '@react-navigation/stack';
import {RootStackParamList} from '../navigator/RootNavigator';

interface Data {
  navigate: keyof RootStackParamList;
  title: string;
}

const Home = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const {width} = useWindowDimensions();

  // 👇 Se agregó la nueva pantalla "Prueba3D"
  const data: Data[] = [
    {navigate: 'Model3D', title: '17. Loading 3D Model'},
    {navigate: 'Character3D', title: '18. 3D Character With Animation'},
    {navigate: 'Prueba3D', title: '18b. 3D Animación de Prueba'}, // ✅ nueva opción
    {navigate: 'ShopUI3D', title: '25. 3D Shop UI With React Three Fiber'},
  ];

  return (
    <GestureHandlerRootView style={{flex: 1}}>
      <SafeAreaView style={styles.container}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <MotiView
            from={{opacity: 0, translateY: 50}}
            animate={{opacity: 1, translateY: 0}}
            style={[styles.cardContainer, {width: width * 0.95}]}>
            <View>
              <Text style={styles.cardText}>React Native</Text>
              <Text style={styles.cardText}>3D Animations</Text>
            </View>

            <TouchableWithoutFeedback
              onPress={() =>
                Alert.alert(
                  'Tutorials',
                  'Disponibles los modelos 3D (17, 18, 18b, 25).',
                )
              }>
              <MotiView style={[styles.cardButton, {width: width * 0.8}]}>
                <YoutubeIcon width={40} height={40} />
                <Text style={styles.cardButtonText}>View 3D Tutorials</Text>
              </MotiView>
            </TouchableWithoutFeedback>
          </MotiView>

          {data.map((v, i) => (
            <TouchableOpacity
              key={i}
              onPress={() => {
                if (
                  (v.navigate === 'Model3D' ||
                    v.navigate === 'Character3D' ||
                    v.navigate === 'Prueba3D' || // 👈 agregada aquí también
                    v.navigate === 'ShopUI3D') &&
                  Platform.OS === 'ios'
                ) {
                  Alert.alert(
                    '3D Feature',
                    'Los modelos 3D no se renderizan en simulador iOS. Usa un dispositivo físico o emulador Android.',
                    [
                      {text: 'Cancelar', style: 'cancel'},
                      {
                        text: 'Continuar',
                        onPress: () => navigation.navigate(v.navigate as any),
                      },
                    ],
                  );
                } else {
                  navigation.navigate(v.navigate as any);
                }
              }}>
              <MotiView
                style={styles.listContainer}
                from={{opacity: 0, translateY: 50, scale: 0.8}}
                animate={{opacity: 1, translateY: 0, scale: 1}}
                transition={{delay: 100 + i * 150}}>
                <Text style={styles.listText}>{v.title}</Text>
                <ArrowIcon width={14} height={14} />
              </MotiView>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
};

export default Home;

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#F6F6F6'},
  cardContainer: {
    flex: 1,
    justifyContent: 'space-around',
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: '#1C6BC8',
    aspectRatio: 16 / 9,
    marginTop: 10,
    borderRadius: 25,
  },
  cardText: {
    color: 'white',
    fontSize: 28,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  cardButton: {
    backgroundColor: 'white',
    height: 46,
    borderRadius: 12.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardButtonText: {color: 'black', fontSize: 16, marginLeft: 10},
  listContainer: {
    padding: 20,
    margin: 10,
    borderRadius: 25,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  listText: {color: 'black'},
});
