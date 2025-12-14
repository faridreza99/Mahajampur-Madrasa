import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../services/api';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const TimeTableScreen = ({ navigation }) => {
  const [timetable, setTimetable] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(0);

  useEffect(() => {
    fetchTimetable();
  }, []);

  const fetchTimetable = async () => {
    try {
      setLoading(true);
      const response = await api.get('/timetable');
      setTimetable(response.data);
    } catch (error) {
      console.error('Failed to fetch timetable:', error);
    } finally {
      setLoading(false);
    }
  };

  const PeriodCard = ({ period, index }) => (
    <View style={styles.periodCard}>
      <View style={styles.periodNumber}>
        <Text style={styles.periodNumberText}>{index + 1}</Text>
      </View>
      <View style={styles.periodDetails}>
        <Text style={styles.periodSubject}>{period?.subject || 'Free Period'}</Text>
        <Text style={styles.periodTeacher}>{period?.teacher || '-'}</Text>
        <Text style={styles.periodRoom}>{period?.room || '-'}</Text>
      </View>
      <Text style={styles.periodTime}>{period?.time || `${8 + index}:00`}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#1a1a2e', '#16213e']} style={styles.gradient}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backButton}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>TimeTable</Text>
          <View style={{ width: 30 }} />
        </View>

        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.daysContainer}
          contentContainerStyle={styles.daysContent}
        >
          {DAYS.map((day, index) => (
            <TouchableOpacity
              key={day}
              style={[styles.dayButton, selectedDay === index && styles.dayButtonActive]}
              onPress={() => setSelectedDay(index)}
            >
              <Text style={[styles.dayText, selectedDay === index && styles.dayTextActive]}>
                {day.substring(0, 3)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#00b894" />
          </View>
        ) : (
          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            <Text style={styles.dayTitle}>{DAYS[selectedDay]}</Text>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((_, index) => (
              <PeriodCard 
                key={index} 
                period={timetable?.schedule?.[DAYS[selectedDay]]?.[index]} 
                index={index}
              />
            ))}
          </ScrollView>
        )}
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
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
  },
  backButton: {
    color: '#fff',
    fontSize: 24,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  daysContainer: {
    maxHeight: 50,
  },
  daysContent: {
    paddingHorizontal: 20,
  },
  dayButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  dayButtonActive: {
    backgroundColor: '#00b894',
  },
  dayText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    fontWeight: '600',
  },
  dayTextActive: {
    color: '#fff',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
    marginTop: 16,
  },
  dayTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  periodCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
  },
  periodNumber: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#00b894',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  periodNumberText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  periodDetails: {
    flex: 1,
  },
  periodSubject: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  periodTeacher: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 13,
    marginTop: 2,
  },
  periodRoom: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 12,
    marginTop: 2,
  },
  periodTime: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 12,
  },
});

export default TimeTableScreen;
