import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface WrongRecord {
  id: string
  targetNote: { letter: string; octave: number; accidental: string; displayName: string }
  userAnswerMidi: number
  userAnswerName: string
  groupId: string
  groupLabel: string
  timestamp: number
}

const STORAGE_KEY = 'wrongBook'

function loadRecords(): WrongRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export const useWrongBookStore = defineStore('wrongBook', () => {
  const records = ref<WrongRecord[]>(loadRecords())

  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records.value))
  }

  function addRecord(record: Omit<WrongRecord, 'id' | 'timestamp'>) {
    records.value.push({
      ...record,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: Date.now(),
    })
    save()
  }

  function removeRecord(id: string) {
    records.value = records.value.filter(r => r.id !== id)
    save()
  }

  function clearAll() {
    records.value = []
    save()
  }

  function getByGroup(groupId: string): WrongRecord[] {
    return records.value.filter(r => r.groupId === groupId)
  }

  return { records, addRecord, removeRecord, clearAll, getByGroup }
})
