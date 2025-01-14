import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Alert, Vibration } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, MapEvent, Circle } from 'react-native-maps';
import * as Location from 'expo-location';
import Dialog from 'react-native-dialog';

interface MarkerData {
  coordinate: {
    latitude: number;
    longitude: number;
  };
  key: string;
}

const App: React.FC = () => {
  const [marker, setMarker] = useState<MarkerData | null>(null);
  const [userLocation, setUserLocation] = useState<Location.LocationObjectCoords | null>(null);
  const [radius, setRadius] = useState<number>(1000); // Default radius
  const [dialogVisible, setDialogVisible] = useState<boolean>(false);

  useEffect(() => {
    requestPermissions();
    const locationSubscription = Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: 20000, // Update every 20 seconds
        distanceInterval: 1,
      },
      (location) => {
        setUserLocation(location.coords);
        checkProximity(location.coords);
      }
    );

    return () => {
      locationSubscription.remove();
    };
  }, []);

  const requestPermissions = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      alert('Permission to access location was denied');
      return;
    }
  };

  const handleMapPress = (event: MapEvent) => {
    const newMarker: MarkerData = {
      coordinate: event.nativeEvent.coordinate,
      key: 'userMarker',
    };
    setMarker(newMarker);
    setDialogVisible(true);
  };

  const handleDialogSubmit = () => {
    setDialogVisible(false);
  };

  const checkProximity = (userCoords: Location.LocationObjectCoords) => {
    if (marker) {
      const distance = getDistance(userCoords, marker.coordinate);
      if (distance <= radius) {
        Alert.alert('You are within the specified radius of the marker!');
        Vibration.vibrate(5000); // Vibrate for 5 seconds
      }
    }
  };

  const getDistance = (coord1: Location.LocationObjectCoords, coord2: { latitude: number; longitude: number }) => {
    const R = 6371e3; // metres
    const φ1 = (coord1.latitude * Math.PI) / 180;
    const φ2 = (coord2.latitude * Math.PI) / 180;
    const Δφ = ((coord2.latitude - coord1.latitude) * Math.PI) / 180;
    const Δλ = ((coord2.longitude - coord1.longitude) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) *
      Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    const distance = R * c; // in metres
    return distance;
  };

  return (
    <View style={styles.container}>
      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={{
          latitude: 37.78825,
          longitude: -122.4324,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}
        onPress={handleMapPress}
      >
        {marker && (
          <>
            <Marker
              key={marker.key}
              coordinate={marker.coordinate}
            />
            <Circle
              center={marker.coordinate}
              radius={radius} // Use the user-defined radius
              strokeColor="rgba(0, 0, 255, 0.5)"
              fillColor="rgba(0, 0, 255, 0.1)"
            />
          </>
        )}
      </MapView>
      <Dialog.Container visible={dialogVisible}>
        <Dialog.Title>Set Radius</Dialog.Title>
        <Dialog.Input
          placeholder="Enter radius in meters"
          keyboardType="numeric"
          onChangeText={(text) => setRadius(Number(text))}
        />
        <Dialog.Button label="Cancel" onPress={() => setDialogVisible(false)} />
        <Dialog.Button label="OK" onPress={handleDialogSubmit} />
      </Dialog.Container>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
});

export default App;
