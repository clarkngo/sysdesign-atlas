import type { NodeKind } from '../data/types'

// Synthesized UI sounds (Web Audio, no asset files): soft console-style
// blips that match the blueprint / control-room look of the atlas.

export type SoundName =
  | NodeKind
  | 'deselect'
  | 'scenario'
  | 'zoomIn'
  | 'zoomOut'
  | 'fit'
  | 'toggleOn'

const STORAGE_KEY = 'sda-sound-enabled'
const MASTER_VOLUME = 0.18

let ctx: AudioContext | null = null
let master: GainNode | null = null
let enabled = readEnabled()

function readEnabled(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) !== 'false'
  } catch {
    return true
  }
}

export function isSoundEnabled() {
  return enabled
}

export function setSoundEnabled(on: boolean) {
  enabled = on
  try {
    localStorage.setItem(STORAGE_KEY, String(on))
  } catch {
    // storage unavailable; keep in-memory setting
  }
}

function audio() {
  if (!ctx) {
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext
    if (!Ctor) return null
    ctx = new Ctor()
    master = ctx.createGain()
    master.gain.value = MASTER_VOLUME
    master.connect(ctx.destination)
  }
  if (ctx.state === 'suspended') void ctx.resume()
  return ctx
}

interface ToneOpts {
  freq: number
  to?: number
  start?: number
  dur?: number
  type?: OscillatorType
  gain?: number
  detune?: number
}

function tone(ac: AudioContext, o: ToneOpts) {
  const t0 = ac.currentTime + (o.start ?? 0)
  const dur = o.dur ?? 0.12
  const osc = ac.createOscillator()
  const env = ac.createGain()
  osc.type = o.type ?? 'sine'
  osc.frequency.setValueAtTime(o.freq, t0)
  if (o.to) osc.frequency.exponentialRampToValueAtTime(o.to, t0 + dur)
  if (o.detune) osc.detune.value = o.detune
  env.gain.setValueAtTime(0.0001, t0)
  env.gain.exponentialRampToValueAtTime(o.gain ?? 0.6, t0 + 0.008)
  env.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
  osc.connect(env).connect(master!)
  osc.start(t0)
  osc.stop(t0 + dur + 0.02)
}

function sweep(ac: AudioContext, from: number, to: number, dur: number, gain: number) {
  const t0 = ac.currentTime
  const len = Math.ceil(ac.sampleRate * dur)
  const buf = ac.createBuffer(1, len, ac.sampleRate)
  const data = buf.getChannelData(0)
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1
  const src = ac.createBufferSource()
  src.buffer = buf
  const filter = ac.createBiquadFilter()
  filter.type = 'bandpass'
  filter.Q.value = 1.2
  filter.frequency.setValueAtTime(from, t0)
  filter.frequency.exponentialRampToValueAtTime(to, t0 + dur)
  const env = ac.createGain()
  env.gain.setValueAtTime(0.0001, t0)
  env.gain.exponentialRampToValueAtTime(gain, t0 + dur * 0.35)
  env.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
  src.connect(filter).connect(env).connect(master!)
  src.start(t0)
}

export function playSound(name: SoundName) {
  if (!enabled) return
  const ac = audio()
  if (!ac || !master) return

  switch (name) {
    case 'challenge':
      // Low, steady sonar ping
      tone(ac, { freq: 330, dur: 0.22, type: 'sine', gain: 0.7 })
      tone(ac, { freq: 660, dur: 0.18, type: 'sine', gain: 0.15 })
      break
    case 'solution':
      // Bright rising fifth: "path found"
      tone(ac, { freq: 587, dur: 0.1, type: 'triangle', gain: 0.5 })
      tone(ac, { freq: 880, dur: 0.16, type: 'triangle', gain: 0.5, start: 0.07 })
      break
    case 'blocker':
      // Soft falling warning with a slight beat
      tone(ac, { freq: 392, to: 311, dur: 0.2, type: 'square', gain: 0.12 })
      tone(ac, { freq: 392, to: 311, dur: 0.2, type: 'sine', gain: 0.4, detune: 12 })
      break
    case 'deselect':
      tone(ac, { freq: 520, to: 340, dur: 0.08, type: 'sine', gain: 0.3 })
      break
    case 'scenario':
      // Map unfolding: airy sweep + quick arpeggio
      sweep(ac, 400, 3200, 0.35, 0.25)
      ;[440, 554, 659].forEach((f, i) =>
        tone(ac, { freq: f, dur: 0.14, type: 'triangle', gain: 0.35, start: 0.06 + i * 0.06 }),
      )
      break
    case 'zoomIn':
      tone(ac, { freq: 700, to: 1000, dur: 0.06, type: 'sine', gain: 0.3 })
      break
    case 'zoomOut':
      tone(ac, { freq: 1000, to: 700, dur: 0.06, type: 'sine', gain: 0.3 })
      break
    case 'fit':
      sweep(ac, 2400, 600, 0.22, 0.2)
      break
    case 'toggleOn':
      tone(ac, { freq: 660, dur: 0.06, type: 'sine', gain: 0.4 })
      tone(ac, { freq: 990, dur: 0.08, type: 'sine', gain: 0.4, start: 0.05 })
      break
  }
}
