import React from 'react';
import {SafeAreaView, StyleSheet, Text} from 'react-native';

import CodePush from 'react-native-code-push';
import Navigaton from './src/navigation';

const App = () => {
  return (
    <SafeAreaView style={styles.root}>
      <Navigaton />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroudColor: '#F9FBFC',
  },
});

export default CodePush(App);
