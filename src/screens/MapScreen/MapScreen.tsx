import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Animated,
  PanResponder,
  Platform,
  FlatList,
  Modal,
  Pressable,
} from 'react-native';
import MapView, {
  Marker,
  Polyline,
  PROVIDER_GOOGLE,
  PROVIDER_DEFAULT,
} from 'react-native-maps';
import {useNavigation} from '@react-navigation/native';
import {WINDOW_HEIGHT} from '../../utils';
import Icon from 'react-native-vector-icons/FontAwesome5';
import getPath from '../../helpers/GetPath';

const BOTTOM_SHEET_MAX_HEIGHT = WINDOW_HEIGHT * 0.6;
const BOTTOM_SHEET_MIN_HEIGHT = WINDOW_HEIGHT * 0.1;
const MAX_UPWARD_TRANSLATE_Y =
  BOTTOM_SHEET_MIN_HEIGHT - BOTTOM_SHEET_MAX_HEIGHT; // negative number;
const MAX_DOWNWARD_TRANSLATE_Y = 0;
const DRAG_THRESHOLD = 50;

const MapScreen = () => {
  const navigation = useNavigation();

  const [modalVisible, setModalVisible] = useState(false);

  const animatedValue = useRef(new Animated.Value(0)).current;
  const lastGestureDy = useRef(0);
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        animatedValue.setOffset(lastGestureDy.current);
      },
      onPanResponderMove: (e, gesture) => {
        animatedValue.setValue(gesture.dy);
      },
      onPanResponderRelease: (e, gesture) => {
        animatedValue.flattenOffset();
        lastGestureDy.current += gesture.dy;
        if (gesture.dy > 0) {
          // dragging down
          if (gesture.dy <= DRAG_THRESHOLD) {
            springAnimation('up');
          } else {
            springAnimation('down');
          }
        } else {
          // dragging up
          if (gesture.dy >= -DRAG_THRESHOLD) {
            springAnimation('down');
          } else {
            springAnimation('up');
          }
        }
      },
    }),
  ).current;

  const springAnimation = (direction: 'up' | 'down') => {
    console.log('direction', direction);
    lastGestureDy.current =
      direction === 'down' ? MAX_DOWNWARD_TRANSLATE_Y : MAX_UPWARD_TRANSLATE_Y;
    Animated.spring(animatedValue, {
      toValue: lastGestureDy.current,
      useNativeDriver: true,
    }).start();
  };

  const bottomSheetAnimation = {
    transform: [
      {
        translateY: animatedValue.interpolate({
          inputRange: [MAX_UPWARD_TRANSLATE_Y, MAX_DOWNWARD_TRANSLATE_Y],
          outputRange: [MAX_UPWARD_TRANSLATE_Y, MAX_DOWNWARD_TRANSLATE_Y],
          extrapolate: 'clamp',
        }),
      },
    ],
  };

  const departures = [
    {
      key: '1',
      route: 'Kampüs İçi Ring Güzergahı\n(Rektörlük-Mimarlık Fakültesi)',
      times:
        '08:40\n09:00\n09:30\n10:00\n10:30\n11:00\n11:30\n14:00\n14:30\n15:00\n15:30\n16:00\n16:30',
    },
    {
      key: '2',
      route: 'Gülbahçe - Kampüs',
      times: '08:20\n12:15\n12:30\n13:20\n17:15',
    },
  ];

  // Identify the stops
  const [busStops, setBusStops] = useState([
    {latitude: 38.318349, longitude: 26.643567},
    {latitude: 38.316639, longitude: 26.641265},
    {latitude: 38.316031, longitude: 26.640011},
    {latitude: 38.3162, longitude: 26.638158},
    {latitude: 38.317667, longitude: 26.638506},
    {latitude: 38.319092, longitude: 26.638841},
    {latitude: 38.320428, longitude: 26.639147},
    {latitude: 38.323398, longitude: 26.639834},
    {latitude: 38.323908, longitude: 26.637552},
    {latitude: 38.324648, longitude: 26.635303},
    {latitude: 38.325228, longitude: 26.632637},
    {latitude: 38.324181, longitude: 26.632467},
    {latitude: 38.322756, longitude: 26.632144},
    {latitude: 38.323745, longitude: 26.630919},
    {latitude: 38.318315, longitude: 26.641673},
    // {latitude: 38.319226, longitude: 26.642514},
    // {latitude: 38.319446, longitude: 26.642733},
    {latitude: 38.319572, longitude: 26.643062},
  ]);

  const [busLocation, setBusLocation] = useState({
    latitude: 0,
    longitude: 0,
    // latitude: 38.319226,
    // longitude: 26.642514,
  });

  const [busData, setBusData] = useState({});

  const [path, setPath] = useState([]);

  const [eta, setEta] = useState([]);

  const renderItem = ({item, index}) => (
    <View>
      {index === 0 && (
        <>
          <View style={styles.listContainer}>
            <Text style={styles.stop}>
              {'Hareket Yeri: '}
              {item.stopName}
            </Text>
            <View style={styles.row}>
              <Icon name="bus-alt" size={20} color="#000" style={styles.icon} />
              <Text style={styles.info}>
                {item.arrivalTime}
                {'dk'}
              </Text>
            </View>
          </View>
          <View style={styles.separator} />
        </>
      )}

      {index !== 0 && (
        <>
          <View style={styles.listContainer}>
            <Text style={styles.stop}>{item.stopName}</Text>
            <View style={styles.row}>
              <Icon name="bus-alt" size={20} color="#000" style={styles.icon} />
              <Text style={styles.info}>
                {item.arrivalTime}
                {'dk'}
              </Text>
            </View>
          </View>
          <View style={styles.separator} />
        </>
      )}
    </View>
  );

  const renderDepartureTimes = ({item, index}) => (
    <View style={styles.listContainer}>
      <Text style={styles.route}>{item.route}</Text>
      <View style={styles.row}>
        <Icon name="clock" size={18} color="#000" style={styles.icon} />
        <Text style={styles.time}>{item.times}</Text>
      </View>
      <View style={styles.separator} />
    </View>
  );

  useEffect(() => {
    const BASE_URL = 'https://iztech-ring-34b938d165aa.herokuapp.com/api';
    const BASE_URL_ETAS = 'https://iztech-ring-34b938d165aa.herokuapp.com';

    getPath('38.3183515,26.6435979', '38.3242134,26.6310109')
      .then(coords => setPath(coords))
      .catch(err => console.log('Error! Something went wrong.'));

    // const enable = () => {
    //   const json = {
    //     latitude: 38.32428,
    //     longitude: 26.63096,
    //     deviceId: 2,
    //   };
    //   return fetch(`${BASE_URL}/buses/1/locations`, {
    //     method: 'POST',
    //     headers: {
    //       'Content-Type': 'application/json',
    //     },
    //     body: JSON.stringify(json),
    //   }).then(response => response);
    // };

    // enable()
    //   .then(res => {
    //     console.log('enable', res.status);
    //   })
    //   .catch(error => {
    //     console.error('enable error:', error);
    //   });

    const updateBusLocation = () => {
      return fetch(`${BASE_URL}/buses/locations/latest`).then(response =>
        response.json(),
      );
    };

    const updateETA = () => {
      return fetch(`${BASE_URL_ETAS}/eta/`).then(response => response.json());
    };

    function init() {
      updateBusLocation().then(data => {
        const latitude = data[0]?.latitude;
        const longitude = data[0]?.longitude;
        if (latitude && longitude) {
          setBusLocation({latitude, longitude});
          setBusData(data[0]?.bus);
        } else {
          setBusLocation({latitude: 0, longitude: 0});
          setBusData({});
        }
      });

      updateETA().then(data => {
        const etas = data[0]?.etas;
        if (etas) {
          setEta(etas);
        } else {
          setEta([]);
        }
      });
    }

    init();

    const interval = setInterval(() => {
      init();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const isEmptyObject = obj => {
    return Object.entries(obj).length === 0;
  };

  const getDirectionName = direction => {
    return direction === 'INBOUND' ? 'Gidiş' : 'Dönüş';
  };

  return (
    <View style={styles.container}>
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(!modalVisible);
        }}>
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <FlatList
              data={departures}
              renderItem={renderDepartureTimes}
              keyExtractor={item => item.key}
            />
            <Pressable
              style={styles.button}
              onPress={() => setModalVisible(!modalVisible)}>
              <Text style={styles.textStyle}>Kapat</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <MapView
        style={styles.map}
        provider={
          Platform.OS === 'android' ? PROVIDER_GOOGLE : PROVIDER_DEFAULT
        }
        initialRegion={{
          latitude: 38.3192722,
          longitude: 26.6364812,
          latitudeDelta: 0.012,
          longitudeDelta: 0.0154,
        }}>
        {path.length > 0 && (
          <Polyline coordinates={path} strokeWidth={7} strokeColor="#6495ED" />
        )}
        {busStops.map((stop, index) => (
          <Marker
            key={index}
            coordinate={stop}
            icon={require('../../assets/images/stop.png')}
          />
        ))}
        <Marker
          coordinate={busLocation}
          icon={require('../../assets/images/ring.png')}
        />
      </MapView>

      <View style={{position: 'absolute', top: 20, left: 20}}>
        <View
          style={{
            backgroundColor: 'white',
            padding: 10,
            flexDirection: 'row',
            borderRadius: 20,
            height: 40,
            width: 40,
            justifyContent: 'center',
          }}>
          <Pressable onPress={() => setModalVisible(true)}>
            <Icon name="info" size={19} color="#000" />
          </Pressable>
        </View>
      </View>

      <View style={{position: 'absolute', top: 20, right: 20}}>
        <View
          style={{backgroundColor: 'white', padding: 10, flexDirection: 'row'}}>
          <Text style={{color: '#000', fontSize: 16}}>Ring Yönü: </Text>
          {!isEmptyObject(busData) ? (
            <Text style={{color: '#000', fontSize: 16}}>
              {getDirectionName(busData.direction)}
            </Text>
          ) : (
            <Text style={{color: '#000', fontSize: 16}}>--</Text>
          )}
        </View>
      </View>

      <Animated.View style={[styles.bottomSheet, bottomSheetAnimation]}>
        <View style={styles.draggableArea} {...panResponder.panHandlers}>
          <View style={styles.dragHandle} />
        </View>
        <View style={styles.list}>
          {eta.length !== 0 ? (
            <FlatList
              data={eta}
              renderItem={renderItem}
              keyExtractor={item => item.key}
            />
          ) : (
            <View style={{alignItems: 'center', justifyContent: 'center'}}>
              <Text style={{color: '#000', fontSize: 16, fontWeight: 'bold'}}>
                Şuan uygun ring bulunmamaktadır!
              </Text>
            </View>
          )}
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  bottomSheet: {
    position: 'absolute',
    width: '100%',
    height: BOTTOM_SHEET_MAX_HEIGHT,
    bottom: BOTTOM_SHEET_MIN_HEIGHT - BOTTOM_SHEET_MAX_HEIGHT,
    ...Platform.select({
      android: {elevation: 3},
      ios: {
        shadowColor: '#a8bed2',
        shadowOpacity: 1,
        shadowRadius: 6,
        shadowOffset: {
          width: 2,
          height: 2,
        },
      },
    }),
    backgroundColor: '#D3D3D3',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
  },
  draggableArea: {
    width: 132,
    height: 32,
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dragHandle: {
    marginTop: 8,
    width: 100,
    height: 6,
    backgroundColor: '#000000',
    borderRadius: 10,
  },
  list: {
    flex: 1,
  },
  listContainer: {},
  stop: {
    fontSize: 18,
    color: '#000',
    fontWeight: 'bold',
    marginLeft: 15,
    marginTop: 15,
  },
  row: {
    flexDirection: 'row',
  },
  icon: {
    marginTop: 20,
    marginLeft: 15,
  },
  info: {
    fontSize: 18,
    color: '#000',
    fontWeight: 'bold',
    marginLeft: 30,
    marginTop: 20,
  },
  separator: {
    height: 1,
    backgroundColor: '#000',
    marginTop: 15,
  },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 5,
  },
  modalView: {
    margin: 15,
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  button: {},

  textStyle: {
    color: '#000',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 18,
    color: '#D82251',
  },
  route: {
    fontSize: 18,
    color: '#000',
    fontWeight: 'bold',
    marginLeft: 15,
  },
  time: {
    fontSize: 18,
    color: '#000',
    fontWeight: 'bold',
    marginLeft: 20,
    marginTop: 15,
  },
});

export default MapScreen;
