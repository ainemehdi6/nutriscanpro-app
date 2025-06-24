import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { User, Settings, Target, LogOut, Edit3, Mail } from 'lucide-react-native';
import { useAuth } from '@/hooks/useAuth';
import Button from '@/components/Button';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              await logout();
              router.replace('/auth/login');
            } catch (error) {
              Alert.alert('Error', 'Failed to sign out');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleEditProfile = () => {
    // TODO: Implement edit profile screen
    Alert.alert('Coming Soon', 'Profile editing will be available soon!');
  };

  const handleEditGoals = () => {
    // TODO: Implement goals editing screen
    Alert.alert('Coming Soon', 'Goal editing will be available soon!');
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#8B5CF6', '#7C3AED']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View style={styles.avatarContainer}>
            <User size={32} color="white" />
          </View>
          <Text style={styles.userName}>{user?.name}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profile Information</Text>
          
          <TouchableOpacity style={styles.settingItem} onPress={handleEditProfile}>
            <View style={styles.settingIcon}>
              <Edit3 size={18} color="#8B5CF6" />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Edit Profile</Text>
              <Text style={styles.settingSubtitle}>Update your personal information</Text>
            </View>
          </TouchableOpacity>

          <View style={styles.settingItem}>
            <View style={styles.settingIcon}>
              <Mail size={18} color="#8B5CF6" />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Email</Text>
              <Text style={styles.settingSubtitle}>{user?.email}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Nutrition Goals</Text>
          
          <TouchableOpacity style={styles.settingItem} onPress={handleEditGoals}>
            <View style={styles.settingIcon}>
              <Target size={18} color="#22C55E" />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Daily Goals</Text>
              <Text style={styles.settingSubtitle}>
                {user?.goals?.[0]?.calories 
                  ? `${user.goals[0].calories} calories daily`
                  : 'Set your daily nutrition targets'
                }
              </Text>
            </View>
          </TouchableOpacity>

          {user?.goals?.[0] && (
            <View style={styles.goalsContainer}>
              <View style={styles.goalItem}>
                <Text style={styles.goalLabel}>Calories</Text>
                <Text style={styles.goalValue}>{user.goals[0]?.calories}</Text>
              </View>
              <View style={styles.goalItem}>
                <Text style={styles.goalLabel}>Protein</Text>
                <Text style={styles.goalValue}>{user.goals[0]?.protein}g</Text>
              </View>
              <View style={styles.goalItem}>
                <Text style={styles.goalLabel}>Carbs</Text>
                <Text style={styles.goalValue}>{user.goals[0]?.carbs}g</Text>
              </View>
              <View style={styles.goalItem}>
                <Text style={styles.goalLabel}>Fat</Text>
                <Text style={styles.goalValue}>{user.goals[0]?.fat}g</Text>
              </View>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>
          
          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingIcon}>
              <Settings size={18} color="#6B7280" />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>App Settings</Text>
              <Text style={styles.settingSubtitle}>Notifications, preferences, and more</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.logoutSection}>
          <Button
            title={loading ? 'Signing Out...' : 'Sign Out'}
            onPress={handleLogout}
            variant="outline"
            disabled={loading}
            style={styles.logoutButton}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 30,
    alignItems: 'center',
  },
  headerContent: {
    alignItems: 'center',
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: 'white',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 12,
    color: '#6B7280',
  },
  goalsContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  goalItem: {
    alignItems: 'center',
  },
  goalLabel: {
    fontSize: 10,
    color: '#6B7280',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  goalValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  logoutSection: {
    marginTop: 20,
    marginBottom: 40,
  },
  logoutButton: {
    borderColor: '#EF4444',
  },
});