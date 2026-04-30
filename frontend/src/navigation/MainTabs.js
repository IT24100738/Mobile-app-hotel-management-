import React from 'react';
import { StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';

import RoomListScreen from '../screens/RoomListScreen';
import AddRoomScreen from '../screens/AddRoomScreen';
import RoomDetailScreen from '../screens/RoomDetailScreen';
import EditRoomScreen from '../screens/EditRoomScreen';

import BookingListScreen from '../screens/bookings/BookingListScreen';
import BookingDetailScreen from '../screens/bookings/BookingDetailScreen';
import BookingFormScreen from '../screens/bookings/BookingFormScreen';

import UserListScreen from '../screens/users/UserListScreen';
import UserDetailScreen from '../screens/users/UserDetailScreen';
import UserFormScreen from '../screens/users/UserFormScreen';

import PaymentListScreen from '../screens/payments/PaymentListScreen';
import PaymentDetailScreen from '../screens/payments/PaymentDetailScreen';
import PaymentFormScreen from '../screens/payments/PaymentFormScreen';

import ExperienceListScreen from '../screens/experiences/ExperienceListScreen';
import ExperienceDetailScreen from '../screens/experiences/ExperienceDetailScreen';
import ExperienceFormScreen from '../screens/experiences/ExperienceFormScreen';

import ReviewListScreen from '../screens/reviews/ReviewListScreen';
import ReviewDetailScreen from '../screens/reviews/ReviewDetailScreen';
import ReviewFormScreen from '../screens/reviews/ReviewFormScreen';
import { useAuth } from '../context/AuthContext';

const Tab = createBottomTabNavigator();
const RoomStack = createStackNavigator();
const BookingStack = createStackNavigator();
const UserStack = createStackNavigator();
const PaymentStack = createStackNavigator();
const ExperienceStack = createStackNavigator();
const ReviewStack = createStackNavigator();

function RoomStackScreen({ isAdmin }) {
  return (
    <RoomStack.Navigator initialRouteName="Rooms" screenOptions={stackOptions}>
      <RoomStack.Screen name="Rooms" component={RoomListScreen} options={{ title: 'Rooms' }} />
      <RoomStack.Screen name="RoomDetail" component={RoomDetailScreen} options={{ title: 'Room' }} />
      {isAdmin ? <RoomStack.Screen name="AddRoom" component={AddRoomScreen} options={{ title: 'Add Room' }} /> : null}
      {isAdmin ? <RoomStack.Screen name="EditRoom" component={EditRoomScreen} options={{ title: 'Edit Room' }} /> : null}
    </RoomStack.Navigator>
  );
}

function BookingStackScreen() {
  return (
    <BookingStack.Navigator initialRouteName="BookingList" screenOptions={stackOptions}>
      <BookingStack.Screen name="BookingList" component={BookingListScreen} options={{ title: 'Bookings' }} />
      <BookingStack.Screen name="BookingDetail" component={BookingDetailScreen} />
      <BookingStack.Screen name="BookingForm" component={BookingFormScreen} options={{ title: 'Booking' }} />
    </BookingStack.Navigator>
  );
}

function UserStackScreen() {
  return (
    <UserStack.Navigator initialRouteName="UserList" screenOptions={stackOptions}>
      <UserStack.Screen name="UserList" component={UserListScreen} options={{ title: 'Users' }} />
      <UserStack.Screen name="UserDetail" component={UserDetailScreen} />
      <UserStack.Screen name="UserForm" component={UserFormScreen} options={{ title: 'User' }} />
    </UserStack.Navigator>
  );
}

function PaymentStackScreen() {
  return (
    <PaymentStack.Navigator initialRouteName="PaymentList" screenOptions={stackOptions}>
      <PaymentStack.Screen name="PaymentList" component={PaymentListScreen} options={{ title: 'Payments' }} />
      <PaymentStack.Screen name="PaymentDetail" component={PaymentDetailScreen} />
      <PaymentStack.Screen name="PaymentForm" component={PaymentFormScreen} options={{ title: 'Payment' }} />
    </PaymentStack.Navigator>
  );
}

function ExperienceStackScreen({ isAdmin }) {
  return (
    <ExperienceStack.Navigator initialRouteName="ExperienceList" screenOptions={stackOptions}>
      <ExperienceStack.Screen name="ExperienceList" component={ExperienceListScreen} options={{ title: 'Experiences' }} />
      <ExperienceStack.Screen name="ExperienceDetail" component={ExperienceDetailScreen} />
      {isAdmin ? <ExperienceStack.Screen name="ExperienceForm" component={ExperienceFormScreen} options={{ title: 'Experience' }} /> : null}
    </ExperienceStack.Navigator>
  );
}

function ReviewStackScreen() {
  return (
    <ReviewStack.Navigator initialRouteName="ReviewList" screenOptions={stackOptions}>
      <ReviewStack.Screen name="ReviewList" component={ReviewListScreen} options={{ title: 'Reviews' }} />
      <ReviewStack.Screen name="ReviewDetail" component={ReviewDetailScreen} />
      <ReviewStack.Screen name="ReviewForm" component={ReviewFormScreen} options={{ title: 'Review' }} />
    </ReviewStack.Navigator>
  );
}

export default function MainTabs() {
  const { role } = useAuth();
  const isAdmin = role === 'admin';
  const isCustomer = role === 'customer';

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#0f766e',
        tabBarInactiveTintColor: '#78716c',
        tabBarLabelStyle: { fontWeight: '700', fontSize: 11 },
        tabBarStyle: {
          backgroundColor: '#fffdf8',
          borderTopColor: '#f3e8d7',
          borderTopWidth: 1,
          height: 66,
          paddingBottom: 8,
          paddingTop: 6,
        },
      }}
    >
      <Tab.Screen
        name="RoomsTab"
        children={() => <RoomStackScreen isAdmin={isAdmin} />}
        options={{
          title: 'Rooms',
          tabBarIcon: ({ color, size }) => <Ionicons name="bed" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="BookingsTab"
        component={BookingStackScreen}
        options={{
          title: 'Bookings',
          tabBarIcon: ({ color, size }) => <Ionicons name="calendar" size={size} color={color} />,
        }}
      />
      {isAdmin ? (
        <Tab.Screen
          name="UsersTab"
          component={UserStackScreen}
          options={{
            title: 'Users',
            tabBarIcon: ({ color, size }) => <Ionicons name="people" size={size} color={color} />,
          }}
        />
      ) : null}
      {!isCustomer ? (
        <Tab.Screen
          name="PaymentsTab"
          component={PaymentStackScreen}
          options={{
            title: 'Pay',
            tabBarIcon: ({ color, size }) => <Ionicons name="card" size={size} color={color} />,
          }}
        />
      ) : null}
      <Tab.Screen
        name="ExperiencesTab"
        children={() => <ExperienceStackScreen isAdmin={isAdmin} />}
        options={{
          title: 'Experiences',
          tabBarIcon: ({ color, size }) => <Ionicons name="map" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="ReviewsTab"
        component={ReviewStackScreen}
        options={{
          title: 'Reviews',
          tabBarIcon: ({ color, size }) => <Ionicons name="star" size={size} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: '#f8f4ee',
  },
  header: {
    backgroundColor: '#fffdf8',
    shadowColor: '#292524',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1c1917',
  },
});

const stackOptions = {
  headerStyle: styles.header,
  headerTitleStyle: styles.headerTitle,
  headerTintColor: '#1f2937',
  cardStyle: styles.screen,
};
