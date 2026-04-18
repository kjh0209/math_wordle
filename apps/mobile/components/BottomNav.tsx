import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { useRouter, usePathname } from 'expo-router';

export function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();

  const TABS = [
    { href: '/', activeIcon: require('../assets/sprites/bottomnav-map-active.png'), inactiveIcon: require('../assets/sprites/bottomnav-map.png'), label: 'Map' },
    { href: '/leaderboard', activeIcon: require('../assets/sprites/bottomnav-ranking-active.png'), inactiveIcon: require('../assets/sprites/bottomnav-ranking.png'), label: 'Ranking' },
  ];

  return (
    <View style={styles.nav}>
      {TABS.map(({ href, activeIcon, inactiveIcon, label }) => {
        const isActive = pathname === href;
        return (
          <TouchableOpacity key={href} style={styles.tab} onPress={() => router.push(href as never)} activeOpacity={0.8}>
            {isActive && <View style={styles.activeBar} />}
            <Image source={isActive ? activeIcon : inactiveIcon} style={styles.icon} />
            <Text style={[styles.label, isActive && styles.labelActive]}>{label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  nav: { 
    position: 'absolute', bottom: 0, left: 0, right: 0, height: 60, 
    backgroundColor: '#080e1c', borderTopWidth: 2, borderTopColor: '#1e2d4a', 
    flexDirection: 'row', justifyContent: 'space-around', zIndex: 100 
  },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 4 },
  activeBar: { position: 'absolute', top: 0, width: 28, height: 3, backgroundColor: '#eab308', borderBottomLeftRadius: 2, borderBottomRightRadius: 2 },
  icon: { width: 20, height: 20, marginBottom: 4, resizeMode: 'contain' },
  label: { fontSize: 10, fontFamily: 'monospace', textTransform: 'uppercase', color: '#4a5a7a', fontWeight: 'bold' },
  labelActive: { color: '#eab308' }
});
