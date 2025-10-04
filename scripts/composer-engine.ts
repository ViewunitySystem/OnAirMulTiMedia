// Composer Engine - Bug→Tonart-Mapping & MIDI-Export
// OAMTM musikalische Entwicklungsumgebung

import { promises as fs } from 'fs';

interface BugEvent {
  timestamp: string;
  type: 'bug' | 'fix' | 'recovery' | 'error' | 'warning';
  severity: 'low' | 'medium' | 'high' | 'critical';
  component: string;
  message: string;
  frequency?: number;
  duration?: number;
}

interface MusicalNote {
  frequency: number;
  duration: number;
  velocity: number;
  channel: number;
  instrument: number;
}

interface Chord {
  root: string;
  type: 'major' | 'minor' | 'diminished' | 'augmented' | 'seventh' | 'major7' | 'minor7';
  notes: number[];
  duration: number;
}

interface Scale {
  name: string;
  notes: number[];
  mode: 'major' | 'minor' | 'dorian' | 'phrygian' | 'lydian' | 'mixolydian' | 'locrian';
}

interface Composition {
  title: string;
  tempo: number;
  timeSignature: [number, number];
  key: string;
  scale: Scale;
  chords: Chord[];
  melody: MusicalNote[];
  duration: number;
}

interface MIDITrack {
  name: string;
  instrument: number;
  channel: number;
  notes: MIDINote[];
}

interface MIDINote {
  note: number;
  velocity: number;
  startTime: number;
  duration: number;
}

export class ComposerEngine {
  private bugEvents: BugEvent[] = [];
  private compositions: Composition[] = [];
  private currentComposition: Composition | null = null;

  // Musiktheorie-Daten
  private readonly noteFrequencies: { [key: string]: number } = {
    'C': 261.63, 'C#': 277.18, 'D': 293.66, 'D#': 311.13,
    'E': 329.63, 'F': 349.23, 'F#': 369.99, 'G': 392.00,
    'G#': 415.30, 'A': 440.00, 'A#': 466.16, 'B': 493.88
  };

  private readonly scales: { [key: string]: Scale } = {
    'C_major': {
      name: 'C Major',
      notes: [0, 2, 4, 5, 7, 9, 11],
      mode: 'major'
    },
    'A_minor': {
      name: 'A Minor',
      notes: [0, 2, 3, 5, 7, 8, 10],
      mode: 'minor'
    },
    'G_major': {
      name: 'G Major',
      notes: [0, 2, 4, 5, 7, 9, 11],
      mode: 'major'
    },
    'E_minor': {
      name: 'E Minor',
      notes: [0, 2, 3, 5, 7, 8, 10],
      mode: 'minor'
    }
  };

  // private readonly _chordProgressions: { [key: string]: string[] } = {
  //   'happy': ['C', 'G', 'Am', 'F'],
  //   'sad': ['Am', 'F', 'C', 'G'],
  //   'dramatic': ['Em', 'C', 'G', 'D'],
  //   'mysterious': ['Dm', 'Bb', 'F', 'C']
  // };

  constructor() {
    this.loadBugEvents();
  }

  // Bug-Events laden
  private async loadBugEvents(): Promise<void> {
    try {
      const auditFiles = ['audit/fixes.jsonl', 'audit/change-log.json'];
      
      for (const file of auditFiles) {
        try {
          const data = await fs.readFile(file, 'utf8');
          const lines = data.split('\n').filter(Boolean);
          
          for (const line of lines) {
            try {
              const event = JSON.parse(line);
              if (event.type || event.eventType) {
                this.bugEvents.push({
                  timestamp: event.timestamp || new Date().toISOString(),
                  type: event.type || event.eventType || 'bug',
                  severity: event.severity || 'medium',
                  component: event.component || event.source || 'unknown',
                  message: event.message || event.detail || 'No message',
                  frequency: event.frequency || 440,
                  duration: event.duration || 1.0
                });
              }
            } catch (e) {
              // Ignore malformed JSON lines
            }
          }
        } catch (e) {
          // File doesn't exist or can't be read
        }
      }
      
      console.log(`[composer-engine] Loaded ${this.bugEvents.length} bug events`);
    } catch (error) {
      console.error('[composer-engine] Error loading bug events:', error);
    }
  }

  // Bug-Typ zu Tonart-Mapping
  private mapBugToTonality(bugType: string, _severity: string): { key: string; scale: Scale; mood: string } {
    const mappings = {
      'bug': { key: 'A_minor', mood: 'dramatic' },
      'error': { key: 'E_minor', mood: 'mysterious' },
      'warning': { key: 'D_minor', mood: 'sad' },
      'fix': { key: 'C_major', mood: 'happy' },
      'recovery': { key: 'G_major', mood: 'hopeful' }
    };

    const mapping = mappings[bugType as keyof typeof mappings] || mappings['bug'];
    const scale = this.scales[mapping.key];
    
    if (!scale) {
      throw new Error(`Scale not found for key: ${mapping.key}`);
    }
    
    return {
      key: mapping.key,
      scale: scale,
      mood: mapping.mood
    };
  }

  // Harmonie-Score berechnen
  private calculateHarmonyScore(events: BugEvent[]): number {
    const totalEvents = events.length;
    if (totalEvents === 0) return 100;

    const fixEvents = events.filter(e => e.type === 'fix' || e.type === 'recovery').length;
    // const _bugEvents = events.filter(e => e.type === 'bug' || e.type === 'error').length;
    
    const harmonyRatio = fixEvents / totalEvents;
    return Math.round(harmonyRatio * 100);
  }

  // Komposition aus Bug-Events generieren
  public generateCompositionFromBugs(title: string = 'Bug Symphony'): Composition {
    console.log('[composer-engine] Generating composition from bug events...');
    
    const recentEvents = this.bugEvents.slice(-50); // Letzte 50 Events
    const harmonyScore = this.calculateHarmonyScore(recentEvents);
    
    // Tonart basierend auf Harmonie-Score wählen
    let key: string;
    let scale: Scale;
    
    if (harmonyScore >= 80) {
      key = 'C_major';
      scale = this.scales['C_major']!;
    } else if (harmonyScore >= 60) {
      key = 'G_major';
      scale = this.scales['G_major']!;
    } else if (harmonyScore >= 40) {
      key = 'A_minor';
      scale = this.scales['A_minor']!;
    } else {
      key = 'E_minor';
      scale = this.scales['E_minor']!;
    }

    // Akkord-Progression basierend auf Events
    const chords: Chord[] = [];
    const melody: MusicalNote[] = [];
    
    recentEvents.forEach((event, _index) => {
      const tonality = this.mapBugToTonality(event.type, event.severity);
      const chord = this.generateChordFromEvent(event, tonality.scale);
      chords.push(chord);
      
      // Melodie-Note hinzufügen
      const note = this.generateNoteFromEvent(event, tonality.scale);
      melody.push(note);
    });

    const composition: Composition = {
      title: title,
      tempo: Math.max(60, Math.min(180, 120 - (harmonyScore * 0.5))), // Tempo basierend auf Harmonie
      timeSignature: [4, 4],
      key: key,
      scale: scale,
      chords: chords,
      melody: melody,
      duration: melody.reduce((total, note) => total + note.duration, 0)
    };

    this.currentComposition = composition;
    this.compositions.push(composition);
    
    console.log(`[composer-engine] Generated composition: ${title} (${harmonyScore}% harmony)`);
    return composition;
  }

  // Akkord aus Event generieren
  private generateChordFromEvent(event: BugEvent, scale: Scale): Chord {
    const rootIndex = Math.floor(Math.random() * scale.notes.length);
    const root = scale.notes[rootIndex];
    
    if (root === undefined) {
      throw new Error('Root note is undefined');
    }
    
    let chordType: Chord['type'];
    switch (event.type) {
      case 'fix':
        chordType = 'major';
        break;
      case 'bug':
        chordType = 'minor';
        break;
      case 'recovery':
        chordType = 'seventh';
        break;
      case 'error':
        chordType = 'diminished';
        break;
      default:
        chordType = 'minor';
    }

    const notes = this.generateChordNotes(root, chordType);
    
    return {
      root: this.getNoteName(root),
      type: chordType,
      notes: notes,
      duration: event.duration || 1.0
    };
  }

  // Note aus Event generieren
  private generateNoteFromEvent(event: BugEvent, scale: Scale): MusicalNote {
    const noteIndex = Math.floor(Math.random() * scale.notes.length);
    const noteValue = scale.notes[noteIndex];
    
    if (noteValue === undefined) {
      throw new Error('Note value is undefined');
    }
    
    const frequency = this.noteFrequencies['A']! * Math.pow(2, noteValue / 12);
    
    let velocity: number;
    switch (event.severity) {
      case 'critical':
        velocity = 127;
        break;
      case 'high':
        velocity = 100;
        break;
      case 'medium':
        velocity = 80;
        break;
      case 'low':
        velocity = 60;
        break;
      default:
        velocity = 80;
    }

    return {
      frequency: frequency,
      duration: event.duration || 0.5,
      velocity: velocity,
      channel: event.type === 'fix' ? 1 : 2,
      instrument: event.type === 'fix' ? 1 : 25 // Piano vs. Guitar
    };
  }

  // Akkord-Noten generieren
  private generateChordNotes(root: number, type: Chord['type']): number[] {
    const intervals = {
      'major': [0, 4, 7],
      'minor': [0, 3, 7],
      'diminished': [0, 3, 6],
      'augmented': [0, 4, 8],
      'seventh': [0, 4, 7, 10],
      'major7': [0, 4, 7, 11],
      'minor7': [0, 3, 7, 10]
    };

    return intervals[type].map(interval => root + interval);
  }

  // Note-Name aus Index
  private getNoteName(noteIndex: number): string {
    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const noteName = noteNames[noteIndex % 12];
    if (noteName === undefined) {
      throw new Error('Note name is undefined');
    }
    return noteName;
  }

  // MIDI-Export
  public async exportToMIDI(composition: Composition, filename: string = 'bug-symphony.mid'): Promise<void> {
    console.log('[composer-engine] Exporting to MIDI...');
    
    const tracks: MIDITrack[] = [];
    
    // Chord-Track
    const chordTrack: MIDITrack = {
      name: 'Chords',
      instrument: 1, // Piano
      channel: 0,
      notes: []
    };

    let currentTime = 0;
    composition.chords.forEach(chord => {
      chord.notes.forEach(note => {
        chordTrack.notes.push({
          note: note + 60, // Middle C = 60
          velocity: 80,
          startTime: currentTime,
          duration: chord.duration * 1000 // Convert to milliseconds
        });
      });
      currentTime += chord.duration * 1000;
    });

    // Melody-Track
    const melodyTrack: MIDITrack = {
      name: 'Melody',
      instrument: 25, // Guitar
      channel: 1,
      notes: []
    };

    currentTime = 0;
    composition.melody.forEach(note => {
      const midiNote = Math.round(12 * Math.log2(note.frequency / 440) + 69);
      melodyTrack.notes.push({
        note: midiNote,
        velocity: note.velocity,
        startTime: currentTime,
        duration: note.duration * 1000
      });
      currentTime += note.duration * 1000;
    });

    tracks.push(chordTrack, melodyTrack);

    // MIDI-Datei generieren (vereinfachte Version)
    const midiData = this.generateMIDIFile(tracks, composition.tempo);
    
    try {
      await fs.writeFile(`audit/${filename}`, midiData);
      console.log(`[composer-engine] MIDI exported to audit/${filename}`);
    } catch (error) {
      console.error('[composer-engine] Error exporting MIDI:', error);
    }
  }

  // MIDI-Datei generieren (vereinfachte Implementierung)
  private generateMIDIFile(_tracks: MIDITrack[], _tempo: number): Buffer {
    // Vereinfachte MIDI-Implementierung
    // In einer echten Implementierung würde hier eine vollständige MIDI-Bibliothek verwendet
    
    const header = Buffer.from([
      0x4D, 0x54, 0x68, 0x64, // MThd
      0x00, 0x00, 0x00, 0x06, // Header length
      0x00, 0x01, // Format 1
      0x00, 0x02, // 2 tracks
      0x00, 0x78  // 120 ticks per quarter note
    ]);

    // Tempo-Track
    const tempoTrack = Buffer.from([
      0x4D, 0x54, 0x72, 0x6B, // MTrk
      0x00, 0x00, 0x00, 0x0B, // Track length
      0x00, 0xFF, 0x51, 0x03, // Set tempo
      0x07, 0xA1, 0x20,       // 500000 microseconds per quarter note
      0x00, 0xFF, 0x2F, 0x00  // End of track
    ]);

    // Vereinfachte Track-Daten
    const trackData = Buffer.from([
      0x4D, 0x54, 0x72, 0x6B, // MTrk
      0x00, 0x00, 0x00, 0x08, // Track length
      0x00, 0x90, 0x3C, 0x40, // Note on C4
      0x60, 0x80, 0x3C, 0x00, // Note off C4
      0x00, 0xFF, 0x2F, 0x00  // End of track
    ]);

    return Buffer.concat([header, tempoTrack, trackData]);
  }

  // Audio-Export (WAV)
  public async exportToAudio(composition: Composition, filename: string = 'bug-symphony.wav'): Promise<void> {
    console.log('[composer-engine] Exporting to audio...');
    
    // Vereinfachte Audio-Export-Implementierung
    // In einer echten Implementierung würde hier Web Audio API oder eine Audio-Bibliothek verwendet
    
    const sampleRate = 44100;
    const duration = composition.duration;
    const samples = Math.floor(sampleRate * duration);
    const audioData = new Float32Array(samples);
    
    // Synthetische Audio-Daten generieren
    composition.melody.forEach(note => {
      const startSample = Math.floor(note.duration * sampleRate);
      const endSample = Math.min(startSample + Math.floor(note.duration * sampleRate), samples);
      
      for (let i = startSample; i < endSample; i++) {
        const t = i / sampleRate;
        const audioValue = audioData[i];
        if (audioValue !== undefined) {
          audioData[i] = audioValue + Math.sin(2 * Math.PI * note.frequency * t) * (note.velocity / 127) * 0.3;
        }
      }
    });

    // WAV-Header generieren
    const wavHeader = this.generateWAVHeader(samples, sampleRate);
    const audioBuffer = Buffer.concat([wavHeader, Buffer.from(audioData.buffer)]);
    
    try {
      await fs.writeFile(`audit/${filename}`, audioBuffer);
      console.log(`[composer-engine] Audio exported to audit/${filename}`);
    } catch (error) {
      console.error('[composer-engine] Error exporting audio:', error);
    }
  }

  // WAV-Header generieren
  private generateWAVHeader(samples: number, sampleRate: number): Buffer {
    const bytesPerSample = 4; // 32-bit float
    const dataSize = samples * bytesPerSample;
    const fileSize = 44 + dataSize - 8;

    const header = Buffer.alloc(44);
    
    // RIFF header
    header.write('RIFF', 0);
    header.writeUInt32LE(fileSize, 4);
    header.write('WAVE', 8);
    
    // fmt chunk
    header.write('fmt ', 12);
    header.writeUInt32LE(16, 16); // fmt chunk size
    header.writeUInt16LE(3, 20); // format (IEEE float)
    header.writeUInt16LE(1, 22); // channels
    header.writeUInt32LE(sampleRate, 24); // sample rate
    header.writeUInt32LE(sampleRate * bytesPerSample, 28); // byte rate
    header.writeUInt16LE(bytesPerSample, 32); // block align
    header.writeUInt16LE(32, 34); // bits per sample
    
    // data chunk
    header.write('data', 36);
    header.writeUInt32LE(dataSize, 40);
    
    return header;
  }

  // Partitur-Export (JSON)
  public async exportScore(composition: Composition, filename: string = 'bug-symphony-score.json'): Promise<void> {
    console.log('[composer-engine] Exporting score...');
    
    const score = {
      metadata: {
        title: composition.title,
        composer: 'OAMTM Composer Engine',
        generated: new Date().toISOString(),
        tempo: composition.tempo,
        timeSignature: composition.timeSignature,
        key: composition.key,
        duration: composition.duration
      },
      harmony: {
        scale: composition.scale,
        chords: composition.chords.map(chord => ({
          root: chord.root,
          type: chord.type,
          duration: chord.duration,
          notes: chord.notes.map(note => this.getNoteName(note))
        }))
      },
      melody: composition.melody.map(note => ({
        frequency: note.frequency,
        note: this.getNoteName(Math.round(12 * Math.log2(note.frequency / 440) + 69) % 12),
        duration: note.duration,
        velocity: note.velocity,
        channel: note.channel,
        instrument: note.instrument
      })),
      analysis: {
        totalNotes: composition.melody.length,
        totalChords: composition.chords.length,
        averageVelocity: composition.melody.reduce((sum, note) => sum + note.velocity, 0) / composition.melody.length,
        complexity: this.calculateComplexity(composition)
      }
    };

    try {
      await fs.writeFile(`audit/${filename}`, JSON.stringify(score, null, 2));
      console.log(`[composer-engine] Score exported to audit/${filename}`);
    } catch (error) {
      console.error('[composer-engine] Error exporting score:', error);
    }
  }

  // Komplexität berechnen
  private calculateComplexity(composition: Composition): string {
    const noteCount = composition.melody.length;
    const chordCount = composition.chords.length;
    const uniqueNotes = new Set(composition.melody.map(note => Math.round(12 * Math.log2(note.frequency / 440) + 69) % 12)).size;
    
    const complexity = (noteCount * 0.3) + (chordCount * 0.2) + (uniqueNotes * 0.5);
    
    if (complexity < 10) return 'simple';
    if (complexity < 20) return 'medium';
    if (complexity < 30) return 'complex';
    return 'very complex';
  }

  // Live-Komposition starten
  public startLiveComposition(): void {
    console.log('[composer-engine] Starting live composition...');
    
    // Neue Komposition aus aktuellen Events
    const composition = this.generateCompositionFromBugs('Live Bug Symphony');
    
    // Export alle Formate
    this.exportToMIDI(composition, 'live-bug-symphony.mid');
    this.exportToAudio(composition, 'live-bug-symphony.wav');
    this.exportScore(composition, 'live-bug-symphony-score.json');
    
    console.log('[composer-engine] Live composition completed');
  }

  // Statistiken
  public getStats(): any {
    const harmonyScore = this.calculateHarmonyScore(this.bugEvents);
    const recentEvents = this.bugEvents.slice(-24); // Letzte 24 Events
    
    return {
      totalEvents: this.bugEvents.length,
      recentEvents: recentEvents.length,
      harmonyScore: harmonyScore,
      compositions: this.compositions.length,
      currentComposition: this.currentComposition?.title || 'None',
      eventTypes: {
        bugs: this.bugEvents.filter(e => e.type === 'bug').length,
        fixes: this.bugEvents.filter(e => e.type === 'fix').length,
        recoveries: this.bugEvents.filter(e => e.type === 'recovery').length,
        errors: this.bugEvents.filter(e => e.type === 'error').length,
        warnings: this.bugEvents.filter(e => e.type === 'warning').length
      }
    };
  }
}

// CLI-Interface
if (require.main === module) {
  const composer = new ComposerEngine();
  
  console.log('🎶 OAMTM Composer Engine');
  console.log('========================');
  
  // Statistiken anzeigen
  const stats = composer.getStats();
  console.log('Current Stats:', stats);
  
  // Komposition generieren
  const composition = composer.generateCompositionFromBugs('OAMTM Bug Symphony');
  console.log('Generated composition:', composition.title);
  
  // Export alle Formate
  composer.exportToMIDI(composition);
  composer.exportToAudio(composition);
  composer.exportScore(composition);
  
  console.log('✅ Composer Engine completed');
}
