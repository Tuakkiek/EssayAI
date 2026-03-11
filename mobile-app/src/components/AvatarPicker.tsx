import React, { useState } from "react"
import {
  View, Text, StyleSheet, TouchableOpacity,
  Image, ActivityIndicator, Alert
} from "react-native"
import { Colors, Shadow, Spacing, Typography } from "@/constants/theme"
import { uploadAvatar } from "../services/uploadApi"

interface Props {
  userId:        string
  currentAvatar?: string | null
  onUploadDone:  (url: string) => void
}

export const AvatarPicker: React.FC<Props> = ({ userId, currentAvatar, onUploadDone }) => {
  const [uploading, setUploading] = useState(false)
  const [previewUri, setPreviewUri] = useState<string | null>(currentAvatar ?? null)

  const pickImage = async () => {
    // expo-image-picker must be installed at runtime — show install hint in DEV
    try {
      // Dynamic import so the component doesn't hard-crash if not installed
      const ImagePicker = await import("expo-image-picker" as never) as {
        requestMediaLibraryPermissionsAsync: () => Promise<{ granted: boolean }>
        launchImageLibraryAsync: (opts: object) => Promise<{
          canceled: boolean
          assets?: { uri: string; mimeType?: string; width: number; height: number }[]
        }>
        MediaTypeOptions: { Images: string }
      }

      const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync()
      if (!granted) {
        Alert.alert("Permission required", "Please allow photo access to upload an avatar.")
        return
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
      })

      if (result.canceled || !result.assets?.[0]) return

      const asset = result.assets[0]
      setPreviewUri(asset.uri)
      setUploading(true)

      const uploaded = await uploadAvatar(
        asset.uri,
        asset.mimeType ?? "image/jpeg",
        userId
      )

      setPreviewUri(uploaded.url)
      onUploadDone(uploaded.url)
      Alert.alert("Success", "Avatar updated!")
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Upload failed"
      Alert.alert("Upload Failed", msg)
      setPreviewUri(currentAvatar ?? null) // restore previous
    } finally {
      setUploading(false)
    }
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.avatarWrap} onPress={pickImage} activeOpacity={0.8} disabled={uploading}>
        {previewUri ? (
          <Image source={{ uri: previewUri }} style={styles.avatar} />
        ) : (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderIcon}>👤</Text>
          </View>
        )}

        {/* Overlay badge */}
        <View style={styles.badge}>
          {uploading
            ? <ActivityIndicator size="small" color={Colors.surface} />
            : <Text style={styles.badgeIcon}>📷</Text>
          }
        </View>
      </TouchableOpacity>

      <Text style={styles.hint}>
        {uploading ? "Uploading…" : "Tap to change photo"}
      </Text>
      <Text style={styles.sub}>JPEG, PNG, WebP · Max 5 MB</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container:      { alignItems: "center" },
  avatarWrap:     { position: "relative", marginBottom: Spacing.sm },
  avatar:         { width: 100, height: 100, borderRadius: 50, backgroundColor: Colors.surfaceAlt },
  placeholder:    { width: 100, height: 100, borderRadius: 50, backgroundColor: Colors.primaryLight, alignItems: "center", justifyContent: "center" },
  placeholderIcon:{ fontSize: 40 },
  badge:          { position: "absolute", bottom: 2, right: 2, width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.primary, alignItems: "center", justifyContent: "center", ...Shadow.sm },
  badgeIcon:      { fontSize: 13 },
  hint:           { ...Typography.bodySmall, fontWeight: "600", color: Colors.primary },
  sub:            { ...Typography.caption, color: Colors.textMuted, marginTop: 2 },
})

