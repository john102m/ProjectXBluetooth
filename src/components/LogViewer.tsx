import React from 'react';
import { ScrollView, Text, View, StyleSheet } from 'react-native';

type Props = {
  title: string;
  entries: string[];
  scrollRef?: React.RefObject<ScrollView | null>; // optional
};

export default function LogViewer({ title, entries, scrollRef }: Props) {
  if (!entries || entries.length === 0) {return null;}

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>{title}</Text>
      <ScrollView style={styles.scroll} ref={scrollRef}>
        {entries.map((entry, index) => (
          <Text key={index} style={styles.message}>{entry}</Text>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    margin: 20,
    padding: 10,
    backgroundColor: '#eee',
    height: 150,
  },
  heading: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  scroll: {
    maxHeight: 120,
  },
  message: {
    fontSize: 14,
  },
});
