/**
 * components/EmergencySupportCard.js
 *
 * The Emergency Support Card that appears inside the chat when SoulSync
 * detects a life-threatening or suicidal message.
 *
 * Shows:
 *   - A warm header ("You are not alone")
 *   - Three action buttons: Call Emergency Services, Trusted Contact, Continue Chat
 *   - Expandable crisis resource list
 *
 * Does NOT auto-call anyone. Every action requires the user to press a button.
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Animated,
  Linking, Platform, Modal, TextInput, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { CRISIS_RESOURCES } from '../utils/safety';

// -- Trusted Contact mini-storage (session only, not persisted) --
// For a proper version, this would use AsyncStorage or Supabase.
let _trustedContact = { name: '', number: '' };

export default function EmergencySupportCard({ onContinueChat, visible = true }) {
  const slideAnim = useRef(new Animated.Value(60)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const [showResources, setShowResources] = useState(false);
  const [showTrustedModal, setShowTrustedModal] = useState(false);
  const [contactName, setContactName] = useState(_trustedContact.name);
  const [contactNumber, setContactNumber] = useState(_trustedContact.number);

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, { toValue: 0, tension: 55, friction: 10, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 1, duration: 350, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  const callNumber = (dialable) => {
    const url = `tel:${dialable}`;
    Linking.canOpenURL(url).then(supported => {
      if (supported) {
        Linking.openURL(url);
      } else {
        Alert.alert('Cannot open phone', `Please call ${dialable} manually.`);
      }
    }).catch(() => {
      Alert.alert('Cannot open phone', `Please call ${dialable} manually.`);
    });
  };

  const handleCallEmergency = () => {
    // Primary emergency action — opens 112
    callNumber('112');
  };

  const handleTrustedContact = () => {
    if (_trustedContact.number.trim()) {
      // Already have a trusted contact — call them
      callNumber(_trustedContact.number.replace(/\s/g, ''));
    } else {
      // Ask the user to add one
      setShowTrustedModal(true);
    }
  };

  const saveTrustedContact = () => {
    if (!contactNumber.trim()) {
      Alert.alert('Number required', 'Please enter a phone number.');
      return;
    }
    _trustedContact = { name: contactName.trim(), number: contactNumber.trim() };
    setShowTrustedModal(false);
    // Offer to call right away
    Alert.alert(
      `Call ${contactName.trim() || 'Trusted Person'}?`,
      `Do you want to call ${contactNumber.trim()} now?`,
      [
        { text: 'Not now', style: 'cancel' },
        { text: 'Call Now', onPress: () => callNumber(contactNumber.replace(/\s/g, '')) },
      ]
    );
  };

  if (!visible) return null;

  return (
    <Animated.View style={[styles.wrapper, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
      {/* Header */}
      <LinearGradient
        colors={['#FFF1F2', '#FFF7ED']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        {/* Top bar */}
        <View style={styles.topBar}>
          <Text style={styles.alertDot}>??</Text>
          <Text style={styles.cardTitle}>You are not alone</Text>
        </View>
        <Text style={styles.cardSubtitle}>
          Real people care about you right now. Choose what feels right:
        </Text>

        {/* -- Primary Action Buttons -- */}
        <TouchableOpacity style={styles.emergencyBtn} onPress={handleCallEmergency} activeOpacity={0.85}>
          <LinearGradient colors={['#EF4444', '#DC2626']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.btnGrad}>
            <Text style={styles.emergencyBtnIcon}>??</Text>
            <View style={styles.btnTextCol}>
              <Text style={styles.btnLabel}>Call Emergency Services</Text>
              <Text style={styles.btnSub}>Tap to open dial pad · 112</Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity style={styles.trustedBtn} onPress={handleTrustedContact} activeOpacity={0.85}>
          <LinearGradient colors={['#7C3AED', '#5B21B6']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.btnGrad}>
            <Text style={styles.emergencyBtnIcon}>??</Text>
            <View style={styles.btnTextCol}>
              <Text style={styles.btnLabel}>
                {_trustedContact.number ? `Call ${_trustedContact.name || 'Trusted Person'}` : 'Contact a Trusted Person'}
              </Text>
              <Text style={styles.btnSub}>
                {_trustedContact.number ? _trustedContact.number : 'Tap to add someone you trust'}
              </Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity style={styles.continueBtn} onPress={onContinueChat} activeOpacity={0.85}>
          <View style={styles.continueBtnInner}>
            <Text style={styles.emergencyBtnIcon}>??</Text>
            <View style={styles.btnTextCol}>
              <Text style={styles.continueBtnLabel}>Continue Talking with SoulSync</Text>
              <Text style={styles.continueBtnSub}>I am here to listen</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* -- Expandable crisis helplines -- */}
        <TouchableOpacity onPress={() => setShowResources(r => !r)} style={styles.resourcesToggle} activeOpacity={0.7}>
          <Text style={styles.resourcesToggleText}>
            {showResources ? '? Hide helplines' : '? See more helplines & crisis numbers'}
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

        {/* Disclaimer */}
        <Text style={styles.disclaimer}>
          SoulSync is a wellness companion, not an emergency service. Please use the numbers above for immediate help.
        </Text>
      </LinearGradient>

      {/* -- Trusted Contact Modal -- */}
      <Modal visible={showTrustedModal} transparent animationType="slide" onRequestClose={() => setShowTrustedModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>?? Add a Trusted Person</Text>
            <Text style={styles.modalSubtitle}>
              This is someone you trust — a friend, family member, or counsellor. SoulSync will never contact them automatically.
            </Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Their name (optional)"
              placeholderTextColor="#9CA3AF"
              value={contactName}
              onChangeText={setContactName}
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Their phone number"
              placeholderTextColor="#9CA3AF"
              value={contactNumber}
              onChangeText={setContactNumber}
              keyboardType="phone-pad"
            />
            <TouchableOpacity style={styles.modalSaveBtn} onPress={saveTrustedContact} activeOpacity={0.85}>
              <Text style={styles.modalSaveBtnText}>Save & Call Now</Text>
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
  wrapper: {
    marginHorizontal: 12,
    marginVertical: 8,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 8,
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
    gap: 8,
    marginBottom: 4,
  },
  alertDot: { fontSize: 14 },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1F2937',
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 19,
    marginBottom: 14,
  },

  // -- Action buttons --
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
  emergencyBtnIcon: { fontSize: 24, width: 32, textAlign: 'center' },
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

  // -- Resources --
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

  // -- Trusted Contact Modal --
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
