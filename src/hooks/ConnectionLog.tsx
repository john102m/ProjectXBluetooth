import React from 'react';
import { ScrollView, Text, View, StyleSheet } from 'react-native';

type Props = {
  log: string[];
};

export default function ConnectionLog({ log }: Props) {
  if (!log || log.length === 0) {return null;}

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Connection Log:</Text>
      <ScrollView style={styles.scrollBox}>
        {log.map((entry, index) => (
          <Text key={index} style={styles.entry}>
            {entry}
          </Text>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 20,
    paddingBottom: 50,
  },
  title: {
    fontWeight: 'bold',
  },
  scrollBox: {
    maxHeight: 100,
  },
  entry: {
    fontSize: 12,
  },
});
