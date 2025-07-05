import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';

type Props = {
  messages: string[];
  scrollRef: React.RefObject<ScrollView | null>;
};

export default function ConsoleLog({ messages, scrollRef }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Console Messages:</Text>
      <ScrollView style={styles.scroll} ref={scrollRef}>
        {messages.map((msg, index) => (
          <Text key={index} style={styles.message}>{msg}</Text>
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
