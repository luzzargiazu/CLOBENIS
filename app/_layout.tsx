import { Stack } from "expo-router";
import React from "react";

export default function Layout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="login" />
      <Stack.Screen name="hom" />
      <Stack.Screen name="Amigos" />
      <Stack.Screen name="Chat" />
      <Stack.Screen name="Perfil" />
      <Stack.Screen name="EditarPerfil" />
      <Stack.Screen name="BuscarAmigos" />
    </Stack>
  );
}
