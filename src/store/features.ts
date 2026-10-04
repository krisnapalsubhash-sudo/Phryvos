import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface FeatureFlags {
  minimalistMode: boolean; // Master toggle for clean, distraction-free UI
  cosmicRadio: boolean; // Floating ambient lo-fi / rain radio dock
  gamesAndActivities: boolean; // Games lobby, Ludo, Chess, Dilemmas
  storiesAndFleeting: boolean; // 24h fleeting stories & viewer
  voiceDrops: boolean; // Voice snippet cards & audio waveforms
  midnightDrops: boolean; // Dark velvet typography confession cards
  whisperToStranger: boolean; // Secret DM whisper buttons
  soundEffects: boolean; // Instant Web Audio feedback sounds
  timeCapsules: boolean; // Cosmic message in a bottle
}

export interface UserSurveyData {
  discoverySource?: string;
  presetChosen?: 'full' | 'minimalist' | 'custom';
  completedAt?: string;
}

interface FeaturesState {
  flags: FeatureFlags;
  survey: UserSurveyData;
  setFlag: (key: keyof FeatureFlags, value: boolean) => void;
  toggleFlag: (key: keyof FeatureFlags) => void;
  setMinimalistMode: (enabled: boolean) => void;
  applyPreset: (preset: 'full' | 'minimalist' | 'custom') => void;
  setSurveyData: (data: Partial<UserSurveyData>) => void;
  resetToDefaults: () => void;
}

const DEFAULT_FLAGS: FeatureFlags = {
  minimalistMode: false,
  cosmicRadio: true,
  gamesAndActivities: true,
  storiesAndFleeting: true,
  voiceDrops: true,
  midnightDrops: true,
  whisperToStranger: true,
  soundEffects: true,
  timeCapsules: true,
};

const MINIMALIST_FLAGS: FeatureFlags = {
  minimalistMode: true,
  cosmicRadio: false,
  gamesAndActivities: false,
  storiesAndFleeting: false,
  voiceDrops: false,
  midnightDrops: false,
  whisperToStranger: false,
  soundEffects: false,
  timeCapsules: false,
};

export const useFeaturesStore = create<FeaturesState>()(
  persist(
    (set, get) => ({
      flags: DEFAULT_FLAGS,
      survey: {},

      setFlag: (key, value) =>
        set((state) => {
          const nextFlags = { ...state.flags, [key]: value };
          // If turning on an extra feature, minimalistMode turns false
          if (value === true && key !== 'minimalistMode') {
            nextFlags.minimalistMode = false;
          }
          return { flags: nextFlags };
        }),

      toggleFlag: (key) =>
        set((state) => {
          const nextVal = !state.flags[key];
          const nextFlags = { ...state.flags, [key]: nextVal };
          if (nextVal === true && key !== 'minimalistMode') {
            nextFlags.minimalistMode = false;
          }
          return { flags: nextFlags };
        }),

      setMinimalistMode: (enabled) =>
        set(() => ({
          flags: enabled ? { ...MINIMALIST_FLAGS } : { ...DEFAULT_FLAGS, minimalistMode: false },
        })),

      applyPreset: (preset) =>
        set((state) => {
          if (preset === 'minimalist') {
            return {
              flags: { ...MINIMALIST_FLAGS },
              survey: { ...state.survey, presetChosen: 'minimalist' },
            };
          }
          if (preset === 'full') {
            return {
              flags: { ...DEFAULT_FLAGS },
              survey: { ...state.survey, presetChosen: 'full' },
            };
          }
          return {
            survey: { ...state.survey, presetChosen: 'custom' },
          };
        }),

      setSurveyData: (data) =>
        set((state) => ({
          survey: { ...state.survey, ...data },
        })),

      resetToDefaults: () =>
        set({
          flags: DEFAULT_FLAGS,
        }),
    }),
    {
      name: 'phryvos-feature-flags',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
