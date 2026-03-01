import { ref, onMounted, onBeforeUnmount } from 'vue'

export type MidiStatus = 'unsupported' | 'pending' | 'connected' | 'disconnected' | 'denied'

export interface MidiCallbacks {
  onNoteOn?: (midi: number, velocity: number) => void
  onNoteOff?: (midi: number) => void
}

export function useMidi(callbacks: MidiCallbacks = {}) {
  const status = ref<MidiStatus>('pending')
  const deviceName = ref<string | null>(null)

  let access: MIDIAccess | null = null

  function handleMidiMessage(e: Event) {
    const msg = e as MIDIMessageEvent
    const data = msg.data
    if (!data || data.length < 3) return

    const cmd = data[0] & 0xf0
    const note = data[1]
    const velocity = data[2]

    if (cmd === 0x90 && velocity > 0) {
      callbacks.onNoteOn?.(note, velocity)
    } else if (cmd === 0x80 || (cmd === 0x90 && velocity === 0)) {
      callbacks.onNoteOff?.(note)
    }
  }

  function bindInputs() {
    if (!access) return
    let found = false
    access.inputs.forEach((input) => {
      input.onmidimessage = handleMidiMessage
      if (!found) {
        deviceName.value = input.name ?? 'MIDI Device'
        found = true
      }
    })
    status.value = found ? 'connected' : 'disconnected'
    if (!found) deviceName.value = null
  }

  function onStateChange() {
    bindInputs()
  }

  async function init() {
    if (!navigator.requestMIDIAccess) {
      status.value = 'unsupported'
      return
    }
    try {
      access = await navigator.requestMIDIAccess({ sysex: false })
      access.onstatechange = onStateChange
      bindInputs()
    } catch {
      status.value = 'denied'
    }
  }

  function cleanup() {
    if (access) {
      access.inputs.forEach((input) => { input.onmidimessage = null })
      access.onstatechange = null
    }
  }

  onMounted(init)
  onBeforeUnmount(cleanup)

  return { status, deviceName }
}
