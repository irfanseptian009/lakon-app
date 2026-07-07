/**
 * Offline media caching — copies picked images/files INTO the app sandbox so
 * they survive even if the original is deleted (module 1: screenshots &
 * brochures; module 5: vault documents; module 9: voice memos).
 */
import * as DocumentPicker from 'expo-document-picker';
import { Directory, File, Paths } from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';

function sandboxDir(name: string): Directory {
  const dir = new Directory(Paths.document, name);
  if (!dir.exists) dir.create({ intermediates: true });
  return dir;
}

function copyIntoSandbox(sourceUri: string, folder: string, ext: string): string {
  const dest = new File(sandboxDir(folder), `${Date.now()}-${Math.round(Math.random() * 1e6)}.${ext}`);
  new File(sourceUri).copySync(dest);
  return dest.uri;
}

/** Pick an image from the gallery and cache a copy offline. Returns sandbox URI or null. */
export async function pickAndCacheImage(folder: string): Promise<string | null> {
  const res = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    quality: 0.8,
  });
  if (res.canceled || !res.assets?.[0]) return null;
  const asset = res.assets[0];
  const ext = asset.uri.split('.').pop()?.toLowerCase() || 'jpg';
  return copyIntoSandbox(asset.uri, folder, ext);
}

/** Pick any document and cache a copy offline. Returns { uri, name } or null. */
export async function pickAndCacheDocument(
  folder: string
): Promise<{ uri: string; name: string } | null> {
  const res = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true, type: '*/*' });
  if (res.canceled || !res.assets?.[0]) return null;
  const asset = res.assets[0];
  const ext = asset.name.split('.').pop()?.toLowerCase() || 'bin';
  const uri = copyIntoSandbox(asset.uri, folder, ext);
  return { uri, name: asset.name };
}

/** Move a finished recording into the memos folder. Returns the final URI. */
export function persistRecording(tempUri: string): string {
  return copyIntoSandbox(tempUri, 'memos', 'm4a');
}

export function deleteSandboxFile(uri: string | null | undefined) {
  if (!uri) return;
  try {
    const f = new File(uri);
    if (f.exists) f.delete();
  } catch {
    // ignore — file may already be gone
  }
}
