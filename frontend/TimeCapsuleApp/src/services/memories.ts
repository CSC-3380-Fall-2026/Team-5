import { API_BASE_URL } from './api';
import { getAuthToken } from './authStorage';
import { Memory } from '../context/CapsuleContext';
export async function loadCapsuleMemories(
  id: string,
  signal?: AbortSignal,
): Promise<{ locked: boolean; memories: Memory[] }> {
  const token = await getAuthToken();
  if (!token) throw new Error('Please log in again.');
  const response = await fetch(
    `${API_BASE_URL}/api/capsules/${encodeURIComponent(id)}/memories`,
    { signal, headers: { Authorization: `Bearer ${token}` } },
  );
  if (response.status === 423) return { locked: true, memories: [] };
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Unable to load memories.');
  return {
    locked: false,
    memories: data.memories.map((m: any) => ({
      id: String(m.id),
      text: m.content,
      photoUri: m.photoData || '',
      latitude: m.latitude,
      longitude: m.longitude,
      locationName: m.locationName,
    })),
  };
}
