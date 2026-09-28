/**
 * components/EmergencySupportCard.js
 *
 * Emergency Support Card displayed when SoulSync detects a life-threatening
 * or crisis message.
 *
 * Header:
 *   🚨 YOU DON'T HAVE TO FACE THIS ALONE
 *
 * Buttons:
 *   [ 👤 Call Trusted Person ] -> Opens phone dialer (tel:) with saved contact
 *   [ 📞 Get Emergency Help ]   -> Opens phone dialer (tel:112)
 *   [ 💬 Continue Talking ]     -> Enables user input text
 *
 * Does NOT auto-call anyone. Does NOT send SMS or WhatsApp.
 * Every action opens the native phone dialer for the user to explicitly confirm.
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Animated,
  Linking, Platform, Modal, TextInput, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { getSupabase } from '../services/supabase';
import { CRISIS_RESOURCES } from '../utils/safety';

let _trustedContact = { name: '', number: '' };

export default function EmergencySupportCard({ onContinueChat, visible = true, userId = null }) {
  const slideAnim = useRef(new Animated.Value(60)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const [showResources, setShowResources] = useState(false);
  const [showTrustedModal, setShowTrustedModal] = useState(false);
  const [contactName, setContactName] = useState(_trustedContact.name);
  const [contactNumber, setContactNumber] = useState(_trustedContact.number);
  const [trustedPerson, setTrustedPerson] = useState({ name: _trustedContact.name, number: _trustedContact.number });

  useEffect(() => {
    if (visible) {
      slideAnim.setValue(60);
      fadeAnim.setValue(0);
      Animated.parallel([
        Animated.spring(slideAnim, { toValue: 0, tension: 55, friction: 10, useNativeDriver: false }),
        Animated.timing(fadeAnim, { toValue: 1, duration: 350, useNativeDriver: false }),
      ]).start();
    }
    loadTrustedContactFromProfile();
  }, [visible, userId]);

  const loadTrustedContactFromProfile = async () => {
    const supabase = getSupabase();
    if (!supabase) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const uid = userId || user?.id;
      if (!uid) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('trusted_contact_name, trusted_contact_phone')
        .eq('id', uid)
        .maybeSingle();

      if (profile && (profile.trusted_contact_name || profile.trusted_contact_phone)) {
        const name = profile.trusted_contact_name || 'Trusted Person';
        const phone = profile.trusted_contact_phone || '';
        _trustedContact = { name, number: phone };
        setTrustedPerson({ name, number: phone });
        setContactName(name);
        setContactNumber(phone);
      }
    } catch (e) {
      console.log('loadTrustedContactFromProfile notice:', e.message);
    }
  };

  const callNumber = (dialable) => {
    if (!dialable) {
      setShowTrustedModal(true);
      return;
    }
    const cleanNumber = dialable.replace(/[^\d+]/g, '');
    const url = `tel:${cleanNumber}`;
    Linking.canOpenURL(url).then(supported => {
      if (supported) {
        Linking.openURL(url);
      } else {
        Alert.alert('Open Dialer', `Please call ${cleanNumber} from your phone dialer.`);
      }
    }).catch(() => {
      Alert.alert('Open Dialer', `Please call ${cleanNumber} from your phone dialer.`);
    });
  };

  const handleCallEmergency = () => {
    callNumber('112');
  };

  const handleTrustedContact = () => {
    if (trustedPerson.number) {
      callNumber(trustedPerson.number);
    } else {
      setShowTrustedModal(true);
    }
  };

  const saveTrustedContact = async () => {
    if (!contactNumber.trim()) {
      Alert.alert('Number Required', 'Please enter a valid phone number.');
      return;
    }
    const name = contactName.trim() || 'Trusted Person';
    const number = contactNumber.trim();
    _trustedContact = { name, number };
    setTrustedPerson({ name, number });
    setShowTrustedModal(false);

    // Save to profile in Supabase
    const supabase = getSupabase();
    if (supabase) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase
            .from('profiles')
            .update({
              trusted_contact_name: name,
              trusted_contact_phone: number,
            })
            .eq('id', user.id);
        }
      } catch (e) {
        console.log('Failed saving trusted contact to profile:', e.message);
      }
    }

    callNumber(number);
  };

  if (!visible) return null;

  return (
    <Animated.View style={[styles.inlineWrapper, { transform: [{ translateY: slideAnim }], opacity: fadeAnim }]}>
      <LinearGradient
        colors={['#FFF5F5', '#FFEFEF', '#FFF7ED']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        {/* Header Title */}
        <View style={styles.topBar}>
          <Text style={styles.cardTitle}>🚨 YOU DON'T HAVE TO FACE THIS ALONE</Text>
        </View>
        <Text style={styles.cardSubtitle}>
          Please reach out right now. Support is available for you 24/7.
        </Text>

        {/* Action Button 1: Call Trusted Person */}
        <TouchableOpacity style={styles.trustedBtn} onPress={handleTrustedContact} activeOpacity={0.85}>
          <LinearGradient colors={['#7C3AED', '#5B21B6']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.btnGrad}>
            <Text style={styles.emergencyBtnIcon}>👤</Text>
            <View style={styles.btnTextCol}>
              <Text style={styles.btnLabel}>
                {trustedPerson.number ? `Call ${trustedPerson.name}` : '👤 Call Trusted Person'}
              </Text>
              <Text style={styles.btnSub}>
                {trustedPerson.number ? trustedPerson.number : 'Tap to call or set up your trusted person'}
              </Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* Action Button 2: Get Emergency Help */}
        <TouchableOpacity style={styles.emergencyBtn} onPress={handleCallEmergency} activeOpacity={0.85}>
          <LinearGradient colors={['#EF4444', '#DC2626']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.btnGrad}>
            <Text style={styles.emergencyBtnIcon}>📞</Text>
            <View style={styles.btnTextCol}>
              <Text style={styles.btnLabel}>📞 Get Emergency Help</Text>
              <Text style={styles.btnSub}>Call 112 (National Emergency Number)</Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* Action Button 3: Continue Talking */}
        <TouchableOpacity style={styles.continueBtn} onPress={onContinueChat} activeOpacity={0.85}>
          <View style={styles.continueBtnInner}>
            <Text style={styles.emergencyBtnIcon}>💬</Text>
            <View style={styles.btnTextCol}>
              <Text style={styles.continueBtnLabel}>💬 Continue Talking</Text>
              <Text style={styles.continueBtnSub}>I am right here with you to listen</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Expandable crisis helplines */}
        <TouchableOpacity onPress={() => setShowResources(r => !r)} style={styles.resourcesToggle} activeOpacity={0.7}>
          <Text style={styles.resourcesToggleText}>
            {showResources ? '▲ Hide helplines' : '▼ See more verified crisis helplines'}
          </Text>
        </TouchableOpacity>

        {showResources && (
          <View style={styles.resourcesList}>
            {CRISIS_RESOURCES.map((r, i) => (
              <TouchableOpacity key={i} style={styles.resourceRow} onPress={() => callNumber(r.dialable)} activeOpacity={0.75}>
                <Text style={styles.resourceEmoji}>{r.emoji}</Text>
                <View style={styles.resourceTextCol}>
                  <Text style={styles.resourceName}>{r.name}</Text>
                  <Text style={styles.resourceNumber}>{r.number}</Text>
                  <Text style={styles.resourceNote}>{r.note}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <Text style={styles.disclaimer}>
          SoulSync is a wellness companion. Clicking call buttons opens your phone dialer to confirm. No calls or SMS are sent automatically.
        </Text>
      </LinearGradient>

      {/* Trusted Contact Set Up Modal */}
      <Modal visible={showTrustedModal} transparent animationType="slide" onRequestClose={() => setShowTrustedModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>👤 Set Up Trusted Person</Text>
            <Text style={styles.modalSubtitle}>
              Save someone you trust (friend, family member, or counsellor). SoulSync will never contact them automatically.
            </Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Name (e.g. Mom, Best Friend)"
              placeholderTextColor="#9CA3AF"
              value={contactName}
              onChangeText={setContactName}
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Phone number"
              placeholderTextColor="#9CA3AF"
              value={contactNumber}
              onChangeText={setContactNumber}
              keyboardType="phone-pad"
            />
            <TouchableOpacity style={styles.modalSaveBtn} onPress={saveTrustedContact} activeOpacity={0.85}>
              <Text style={styles.modalSaveBtnText}>Save & Open Phone Dialer</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowTrustedModal(false)} style={styles.modalCancelBtn} activeOpacity={0.7}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  inlineWrapper: {
    marginTop: 14,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 8,
    width: '100%',
  },
  card: {
    padding: 18,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(239,68,68,0.22)',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#991B1B',
    letterSpacing: 0.2,
    flex: 1,
  },
  topCloseBtn: {
    padding: 6,
    borderRadius: 14,
    backgroundColor: 'rgba(239,68,68,0.12)',
  },
  topCloseBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#991B1B',
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 19,
    marginBottom: 14,
  },

  // Action buttons
  emergencyBtn: { borderRadius: 14, overflow: 'hidden', marginBottom: 10 },
  trustedBtn: { borderRadius: 14, overflow: 'hidden', marginBottom: 10 },
  btnGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
    borderRadius: 14,
  },
  emergencyBtnIcon: { fontSize: 22, width: 30, textAlign: 'center' },
  btnTextCol: { flex: 1 },
  btnLabel: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
  btnSub: { fontSize: 11.5, color: 'rgba(255,255,255,0.8)', marginTop: 2 },

  continueBtn: {
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(124,58,237,0.30)',
    backgroundColor: 'rgba(124,58,237,0.06)',
    marginBottom: 12,
  },
  continueBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
  },
  continueBtnLabel: { fontSize: 15, fontWeight: '700', color: '#4F46E5' },
  continueBtnSub: { fontSize: 11.5, color: '#6B7280', marginTop: 2 },

  // Resources
  resourcesToggle: { alignItems: 'center', paddingVertical: 6 },
  resourcesToggleText: { fontSize: 12.5, color: '#7C3AED', fontWeight: '600' },
  resourcesList: { marginTop: 8, gap: 8 },
  resourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 12,
    padding: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  resourceEmoji: { fontSize: 22, width: 28, textAlign: 'center' },
  resourceTextCol: { flex: 1 },
  resourceName: { fontSize: 13, fontWeight: '700', color: '#1F2937' },
  resourceNumber: { fontSize: 15, fontWeight: '800', color: '#EF4444', marginTop: 1 },
  resourceNote: { fontSize: 11, color: '#6B7280', marginTop: 1 },

  disclaimer: {
    fontSize: 10.5,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 15,
    marginTop: 10,
    paddingHorizontal: 4,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 28,
  },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#1F2937', textAlign: 'center', marginBottom: 6 },
  modalSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 20,
  },
  modalInput: {
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 13,
    fontSize: 15,
    color: '#1F2937',
    marginBottom: 12,
    backgroundColor: '#F9FAFB',
  },
  modalSaveBtn: {
    backgroundColor: '#7C3AED',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 10,
  },
  modalSaveBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },
  modalCancelBtn: { alignItems: 'center', paddingVertical: 8 },
  modalCancelText: { color: '#6B7280', fontSize: 14 },
});
