import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

function placeholder(name: string) {
  return function PlaceholderScreen() {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>{name}</Text>
      </View>
    );
  };
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#040a18', alignItems: 'center', justifyContent: 'center' },
  text: { color: '#fff', fontSize: 16 },
});

export const ProductoresScreen = placeholder('Productores');
export const CompaniasScreen = placeholder('Compañías');
export const ReportesScreen = placeholder('Reportes');
