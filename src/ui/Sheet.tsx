import React from 'react';
import {
  KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/ThemeContext';
import { radius, space } from '@/theme/tokens';
import { IconButton } from './IconButton';
import { Txt } from './Txt';

/** Bottom sheet modal for add/edit forms. */
export function Sheet({
  visible,
  onClose,
  title,
  children,
}: {
  visible: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1, justifyContent: 'flex-end' }}
      >
        <Pressable style={{ flex: 1, backgroundColor: c.scrim }} onPress={onClose} />
        <View
          style={{
            backgroundColor: c.surfaceRaised,
            borderTopLeftRadius: radius.xxl,
            borderTopRightRadius: radius.xxl,
            paddingHorizontal: space.screenPad,
            paddingTop: 14,
            paddingBottom: Math.max(insets.bottom, 16) + 8,
            maxHeight: '86%',
          }}
        >
          <View
            style={{
              width: 40,
              height: 4,
              borderRadius: 2,
              backgroundColor: c.borderStrong,
              alignSelf: 'center',
              marginBottom: 12,
            }}
          />
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 16,
            }}
          >
            <Txt size={20} weight="black" color={c.textStrong} letterSpacing={-0.4}>
              {title}
            </Txt>
            <IconButton icon="x" size={36} variant="ghost" onPress={onClose} accessibilityLabel="Tutup" />
          </View>
          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            {children}
            <View style={{ height: 8 }} />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
