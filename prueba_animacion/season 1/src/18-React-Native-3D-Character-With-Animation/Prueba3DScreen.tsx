import { StyleSheet, View } from 'react-native';
import React, { Suspense, useState } from 'react';
import { Canvas } from '@react-three/fiber/native';
import useControls from 'r3f-native-orbitcontrols';
import Prueba from './src/components/Prueba';
import Trigger from './src/components/Trigger';
import Loader from './src/components/Loader';
import { SafeAreaView } from 'react-native-safe-area-context';

const Prueba3DScreen = () => {
  const [OrbitControls, events] = useControls();
  const [loading, setLoading] = useState<boolean>(false);

  return (
    <SafeAreaView style={styles.container}>
      {loading && <Loader />}
      <View style={styles.modelContainer} {...events}>
        <Canvas
          events={null as any}
          onCreated={(state) => {
            const _gl: any = state.gl.getContext();
            const pixelStorei = _gl.pixelStorei.bind(_gl);
            _gl.pixelStorei = function (...args: any[]) {
              const [parameter] = args;
              switch (parameter) {
                case _gl.UNPACK_FLIP_Y_WEBGL:
                  return pixelStorei(...args);
              }
            };
          }}>
          <OrbitControls enablePan={false} />
          <ambientLight intensity={2.5} />
          <Suspense fallback={<Trigger setLoading={setLoading} />}>
            <Prueba />
          </Suspense>
        </Canvas>
      </View>
    </SafeAreaView>
  );
};

export default Prueba3DScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  modelContainer: {
    flex: 1,
  },
});
