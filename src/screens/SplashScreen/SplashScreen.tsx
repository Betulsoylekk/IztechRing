import React, {useEffect} from 'react';
import {View, Image, Dimensions, Text} from 'react-native';
import {useNavigation} from '@react-navigation/native';

const SplashScreen = () => {
  const navigation = useNavigation();

  useEffect(() => {
    setTimeout(() => {
      navigation.replace('Map');
    }, 1000);
  }, []);

  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff',
      }}>
      <Image
        style={{
          width: Dimensions.get('window').width / 3,
          height: Dimensions.get('window').height / 3,
          resizeMode: 'contain',
          marginBottom: 60,
          marginLeft: 10
        }}
        source={require('../../assets/images/logo.png')}
      />
    </View>
  );
};

export default SplashScreen;
