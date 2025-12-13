import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: '#1a365d',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          contentStyle: {
            backgroundColor: '#0d1b2a',
          },
        }}
      >
        <Stack.Screen
          name="index"
          options={{
            title: 'Blueprint Vision',
            headerLargeTitle: true,
          }}
        />
      </Stack>
    </>
  );
}
