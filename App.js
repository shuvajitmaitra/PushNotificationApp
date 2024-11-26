import React from 'react';
import {Text, View} from 'react-native';
import usePushNotifications from './src/hooks/usePushNotifications';

const App = () => {
  const {error, isTokenSent} = usePushNotifications();

  return (
    <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
      <Text>Push Notification Example</Text>
      {error && <Text style={{color: 'red'}}>Error: {error}</Text>}
      {!isTokenSent && <Text>Sending device token to backend...</Text>}
    </View>
  );
};

export default App;
