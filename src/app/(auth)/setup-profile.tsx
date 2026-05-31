// app/(auth)/setup-profile.tsx

import { supabase } from '@/api/client'
import { Button } from '@/components/ui/Button'
import { useAuthStore } from '@/store/auth.store'
import { AntDesign } from '@expo/vector-icons'
import * as ImagePicker from 'expo-image-picker'
import { router } from 'expo-router'
import { useState } from 'react'
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'

export default function SetupProfileScreen() {
  const { user, setProfile } = useAuthStore()

  const [username, setUsername] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [avatarUri, setAvatarUri] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [avatarWarning, setAvatarWarning] = useState<string | null>(null)

  function clearError() {
    if (error) setError(null)
    if (avatarWarning) setAvatarWarning(null)
  }

  // ─── Avatar picker ──────────────────────────────────────────────────────────

  async function pickAvatar() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1], // force square crop
      quality: 0.7,
    })

    if (!result.canceled) {
      setAvatarUri(result.assets[0].uri)
      clearError()
    }
  }

  // ─── Upload avatar to Supabase Storage ──────────────────────────────────────

  async function uploadAvatar(uri: string, userId: string): Promise<string | null> {
    try {
      const ext = uri.split('.').pop() ?? 'jpg'
      const path = `${userId}/avatar.${ext}`

      const response = await fetch(uri)
      const arrayBuffer = await response.arrayBuffer()

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, arrayBuffer, { upsert: true, contentType: `image/${ext}` })

      if (uploadError) {
        console.error('[setup-profile] Avatar upload failed:', uploadError)
        return null
      }

      const { data } = supabase.storage.from('avatars').getPublicUrl(path)
      return data.publicUrl
    } catch (e) {
      console.error('[setup-profile] Avatar upload error:', e)
      return null
    }
  }

  // ─── Submit ─────────────────────────────────────────────────────────────────

  async function handleSubmit() {
    if (!user) {
      router.replace('/(auth)/sign-in')
      return
    }

    const trimmedUsername = username.trim().toLowerCase()
    const trimmedDisplayName = displayName.trim()

    if (!trimmedUsername) {
      setError('Username is required.')
      return
    }
    if (trimmedUsername.length < 3) {
      setError('Username must be at least 3 characters.')
      return
    }
    if (!/^[a-z0-9_]+$/.test(trimmedUsername)) {
      setError('Username can only contain letters, numbers, and underscores.')
      return
    }

    setLoading(true)
    setError(null)

    // Check username isn't already taken
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', trimmedUsername)
      .maybeSingle()

    if (existing) {
      setError('That username is already taken.')
      setLoading(false)
      return
    }

    // Upload avatar if one was picked
    let avatarUrl: string | null = null
    if (avatarUri) {
      avatarUrl = await uploadAvatar(avatarUri, user.id)
      if (!avatarUrl) {
        setAvatarWarning('Photo could not be uploaded. Your profile will be saved without it.')
      }
    }

    // Upsert the profile row (trigger may have already created one on signup)
    const { data: profile, error: insertError } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        username: trimmedUsername,
        display_name: trimmedDisplayName || null,
        avatar_url: avatarUrl,
      })
      .select()
      .single()

    if (insertError) {
      if (insertError.code === '23505') {
        setError('That username is already taken.')
      } else {
        setError('Something went wrong. Please try again.')
        console.error('[setup-profile] Upsert error:', insertError)
      }
      setLoading(false)
      return
    }

    setProfile(profile)
    setLoading(false)
    router.replace('/(onboarding)')
  }

  const disabled = loading || !username.trim()

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.inner}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Set up your profile</Text>
          <Text style={styles.subtitle}>
            This is how friends will find and recognise you.
          </Text>
        </View>

        {/* Avatar picker */}
        <TouchableOpacity style={styles.avatarWrap} onPress={pickAvatar} activeOpacity={0.85}>
          <View style={styles.avatar}>
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
            ) : (
              <AntDesign name="camera" size={26} color="#626262" />
            )}
          </View>
          <View style={styles.avatarBadge}>
            <AntDesign name="camera" size={13} color="#FFFFFF" />
          </View>
        </TouchableOpacity>
        <Text style={styles.avatarCaption}>
          {avatarUri ? 'Tap to change' : 'Add a photo · optional'}
        </Text>

        <View style={styles.form}>
          <View>
            <Text style={styles.label}>Username</Text>
            <View style={styles.usernameRow}>
              <Text style={styles.atSign}>@</Text>
              <TextInput
                style={styles.usernameInput}
                placeholder="giorgi_g"
                placeholderTextColor="#626262"
                value={username}
                onChangeText={(v) => { setUsername(v); clearError() }}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
                maxLength={30}
              />
            </View>
            <Text style={styles.hint}>Letters, numbers, underscores only.</Text>
          </View>

          <View>
            <Text style={styles.label}>
              Display name <Text style={styles.optional}>(optional)</Text>
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Giorgi"
              placeholderTextColor="#626262"
              value={displayName}
              onChangeText={(v) => { setDisplayName(v); clearError() }}
              returnKeyType="done"
              onSubmitEditing={handleSubmit}
              maxLength={50}
            />
          </View>

          {avatarWarning && <Text style={styles.warning}>{avatarWarning}</Text>}
          {error && <Text style={styles.error}>{error}</Text>}

          <Button
            label="Continue"
            onPress={handleSubmit}
            disabled={disabled}
            loading={loading}
            style={styles.cta}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000000',
  },
  inner: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 48,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#898989',
    lineHeight: 20,
    textAlign: 'center',
  },
  avatarWrap: {
    alignSelf: 'center',
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#191919',
    borderWidth: 0.5,
    borderColor: '#3B3B3B',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#0044FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#000000',
  },
  avatarCaption: {
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 36,
    fontSize: 12,
    color: '#626262',
  },
  form: {
    gap: 18,
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
    color: '#C4C4C4',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  optional: {
    fontWeight: '400',
    color: '#626262',
    textTransform: 'none',
    letterSpacing: 0,
  },
  usernameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#191919',
    borderWidth: 0.5,
    borderColor: '#3B3B3B',
    borderRadius: 10,
    paddingHorizontal: 14,
  },
  atSign: {
    fontSize: 15,
    color: '#626262',
    marginRight: 2,
  },
  usernameInput: {
    flex: 1,
    paddingVertical: 13,
    fontSize: 15,
    color: '#FFFFFF',
  },
  input: {
    backgroundColor: '#191919',
    borderWidth: 0.5,
    borderColor: '#3B3B3B',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 15,
    color: '#FFFFFF',
  },
  hint: {
    fontSize: 12,
    color: '#626262',
    marginTop: 6,
  },
  warning: {
    fontSize: 13,
    color: '#FFBB00',
    paddingHorizontal: 2,
  },
  error: {
    fontSize: 13,
    color: '#EA4942',
    paddingHorizontal: 2,
  },
  cta: {
    marginTop: 4,
  },
})