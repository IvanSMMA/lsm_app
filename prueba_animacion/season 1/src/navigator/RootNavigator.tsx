import React from 'react';
import { createStackNavigator, TransitionPresets } from '@react-navigation/stack';
import Home from '../00-Home/Home';
import Model3DScreen from '../17-React-Native-3D-Loading-Model/Model3DScreen';
import Character3DScreen from '../18-React-Native-3D-Character-With-Animation/Character3DScreen';
import Prueba3DScreen from '../18-React-Native-3D-Character-With-Animation/Prueba3DScreen';
import ShopUI3DScreen from '../25-React-Native-3D-Shop/ShopUI3DScreen';

export type RootStackParamList = {
  Home: undefined;
  Model3D: undefined;
  Character3D: undefined;
  Prueba3D: undefined; 
  ShopUI3D: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

const RootNavigator = () => {
  return (
    <Stack.Navigator
      initialRouteName="Home"
      screenOptions={{
        ...TransitionPresets.SlideFromRightIOS,
      }}
    >
      <Stack.Screen
        name="Home"
        component={Home}
        options={{
          headerShown: false,
        }}
      />

      <Stack.Screen
        name="Model3D"
        component={Model3DScreen}
        options={{
          title: '3D Model Loader',
          headerShown: true,
        }}
      />

      <Stack.Screen
        name="Character3D"
        component={Character3DScreen}
        options={{
          title: '3D Character Animation',
          headerShown: true,
        }}
      />

      <Stack.Screen
        name="Prueba3D"
        component={Prueba3DScreen}
        options={{
          title: '3D Animación de Prueba',
          headerShown: true,
        }}
      />

      <Stack.Screen
        name="ShopUI3D"
        component={ShopUI3DScreen}
        options={{
          title: '3D Shop UI',
          headerShown: true,
        }}
      />
    </Stack.Navigator>
  );
};

export default RootNavigator;
