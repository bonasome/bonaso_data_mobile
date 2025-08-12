import theme from '@/themes/themes';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';

export default function TabLayout() {
  return (
    <Tabs
        screenOptions={{
            headerShown: false,
            tabBarStyle: {
                backgroundColor: theme.colors.bonasoUberDarkAccent
            },
            tabBarActiveTintColor: '#fff',
      }}
    >
        <Tabs.Screen name="index" 
            options={{
                title: 'Home',
                tabBarIcon: ({ color, focused }) => (
                    <Ionicons name={focused ? 'home-sharp' : 'home-outline'} color={'#fff'} size={24} />
                ),
            }}
        />
        <Tabs.Screen name="record"  
            options={{
                title: 'Record',
                tabBarIcon: ({ color, focused }) => (
                    <Ionicons name={focused ? 'people-circle' : 'people-circle-outline'} color={color} size={24} />
                ),
            }}
        />
        <Tabs.Screen name="Tasks"  
            options={{
                title: 'My Tasks',
                tabBarIcon: ({ color, focused }) => (
                    <Ionicons name={focused ? 'library' : 'library-outline'} color={color} size={24} />
                ),
            }}
        />
        <Tabs.Screen name="about"  
            options={{
                title: 'About',
                tabBarIcon: ({ color, focused }) => (
                    <Ionicons name={focused ? 'information-circle' : 'information-circle-outline'} color={color} size={24} />
                ),
            }}
        />

    </Tabs>
  );
}