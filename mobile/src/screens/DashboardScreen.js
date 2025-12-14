import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import { useNavigation, DrawerActions } from '@react-navigation/native';

const FeatureCard = ({ title, subtitle, colors, icon, onPress }) => (
  <TouchableOpacity style={styles.card} onPress={onPress}>
    <LinearGradient
      colors={colors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.cardGradient}
    >
      <View style={styles.cardIcon}>
        <Text style={styles.cardIconText}>{icon}</Text>
      </View>
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.cardSubtitle}>{subtitle}</Text>
    </LinearGradient>
  </TouchableOpacity>
);

const QuickButton = ({ title, icon, onPress }) => (
  <TouchableOpacity style={styles.quickButton} onPress={onPress}>
    <View style={styles.quickButtonIcon}>
      <Text style={styles.quickButtonIconText}>{icon}</Text>
    </View>
    <Text style={styles.quickButtonText}>{title}</Text>
  </TouchableOpacity>
);

const getTimeOfDayGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
};

const formatRole = (role) => {
  if (!role) return '';
  return role.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

const DashboardScreen = ({ navigation }) => {
  const { user } = useAuth();
  const nav = useNavigation();
  const role = user?.role || 'student';

  const openDrawer = () => {
    nav.dispatch(DrawerActions.openDrawer());
  };

  const featureCards = [
    {
      title: 'Ask GiNi',
      subtitle: 'AI Assistant',
      colors: ['#00b894', '#00cec9'],
      icon: '🤖',
      screen: 'Assistant',
    },
    {
      title: 'Quiz',
      subtitle: 'Test Yourself',
      colors: ['#f39c12', '#e74c3c'],
      icon: '📝',
      screen: 'Quiz',
    },
    {
      title: 'Summary',
      subtitle: 'Quick Notes',
      colors: ['#9b59b6', '#8e44ad'],
      icon: '📋',
      screen: 'Summary',
    },
    {
      title: 'Notes',
      subtitle: 'Study Material',
      colors: ['#6c5ce7', '#a29bfe'],
      icon: '📚',
      screen: 'Notes',
    },
  ];

  const quickButtons = [
    { title: 'TimeTable', icon: '📅', screen: 'TimeTable' },
    { title: 'Calendar', icon: '🗓️', screen: 'Calendar' },
    { title: 'Students', icon: '👥', screen: 'StudentList' },
    { title: 'Staff', icon: '👨‍🏫', screen: 'StaffList' },
  ];

  const filteredQuickButtons = role === 'student' 
    ? quickButtons.filter(b => b.title !== 'Students')
    : quickButtons;

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#1a1a2e', '#16213e']}
        style={styles.gradient}
      >
        <View style={styles.header}>
          <TouchableOpacity style={styles.menuButton} onPress={openDrawer}>
            <Text style={styles.menuButtonText}>☰</Text>
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.greeting}>Hi, {getTimeOfDayGreeting()}</Text>
            <Text style={styles.userName}>{formatRole(role)}</Text>
          </View>
          <TouchableOpacity 
            style={styles.notificationButton} 
            onPress={() => navigation.navigate('Communication')}
          >
            <Text style={styles.notificationButtonText}>🔔</Text>
          </TouchableOpacity>
        </View>

        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.sectionTitle}>AI Features</Text>
          <View style={styles.cardsContainer}>
            {featureCards.map((card, index) => (
              <FeatureCard
                key={index}
                title={card.title}
                subtitle={card.subtitle}
                colors={card.colors}
                icon={card.icon}
                onPress={() => navigation.navigate(card.screen)}
              />
            ))}
          </View>

          <Text style={styles.sectionTitle}>Academics</Text>
          <View style={styles.quickButtonsContainer}>
            {filteredQuickButtons.map((button, index) => (
              <QuickButton
                key={index}
                title={button.title}
                icon={button.icon}
                onPress={() => navigation.navigate(button.screen)}
              />
            ))}
          </View>

          <TouchableOpacity 
            style={styles.communicationButton}
            onPress={() => navigation.navigate('Communication')}
          >
            <LinearGradient
              colors={['#00b894', '#00cec9']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.communicationGradient}
            >
              <Text style={styles.communicationIcon}>💬</Text>
              <Text style={styles.communicationText}>Communication</Text>
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  gradient: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  menuButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuButtonText: {
    fontSize: 22,
    color: '#fff',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  greeting: {
    color: '#888',
    fontSize: 14,
  },
  userName: {
    color: '#00b894',
    fontSize: 18,
    fontWeight: 'bold',
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationButtonText: {
    fontSize: 20,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 24,
    marginBottom: 16,
  },
  cardsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    width: '48%',
    height: 140,
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  cardGradient: {
    flex: 1,
    padding: 16,
    justifyContent: 'space-between',
  },
  cardIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardIconText: {
    fontSize: 20,
  },
  cardTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  cardSubtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
  },
  quickButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickButton: {
    width: '23%',
    alignItems: 'center',
  },
  quickButtonIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickButtonIconText: {
    fontSize: 24,
  },
  quickButtonText: {
    color: '#fff',
    fontSize: 12,
    textAlign: 'center',
  },
  communicationButton: {
    marginTop: 24,
    marginBottom: 24,
    borderRadius: 12,
    overflow: 'hidden',
  },
  communicationGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  communicationIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  communicationText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default DashboardScreen;
