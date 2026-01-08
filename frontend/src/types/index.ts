
export enum CycleType {
  MACRO = 'MACRO',
  MESO = 'MESO',
  MICRO = 'MICRO'
}

export interface MicroCycle {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  focus: string[];
  volume: number;
  intensity: 'Low' | 'Medium' | 'High';
}

export interface MesoCycle {
  id: string;
  name: string;
  startDate?: string;
  endDate?: string;
  micros: MicroCycle[];
  isExpanded?: boolean;
}

export interface MacroCycle {
  id: string;
  name: string;
  season: string;
  startDate?: string;
  endDate?: string;
  model?: string;
  architecture?: string;
  mesos: MesoCycle[];
  isExpanded?: boolean;
}

export interface WorkoutSubdivision {
  id: string;
  type: 'DDR' | 'DCR';
  seriesOrder: number;
  distance: number;
  description: string;
  category: string;
  interval: string;
  pause: string;
  targetLoads?: string[];
  totalDistance: number;
  daRe: string;
  daEr: string;
  functionalBase: string;
}

export interface WorkoutBlock {
  id: string;
  order: number;
  exerciseName: string;
  mainSet: string;
  observations: string;
  volume: number;
  ddr: string;
  dcr: string;
  athleteCount: number;
  rpe: string;
  exhaustion: string;
  fatigue: string;
  subdivisions: WorkoutSubdivision[];
}

export interface SessionEvaluation {
  athleteId: string;
  athleteName: string;
  rpe: number;
  exhaustion: number;
  times?: string;
}

export interface WorkoutSession {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  attendanceCount: number;
  attendees: string[];
  blockEvaluations: Record<string, SessionEvaluation[]>;
  gymEvaluations?: Record<string, Record<string, string[]>>;
}

export interface Workout {
  id: string;
  title: string;
  date: string;
  time: string;
  profile: 'Velocidade' | 'Fundo' | 'Meio Fundo' | 'Técnica';
  category: string;
  tags: string[];
  totalVolume: number;
  status: 'Planned' | 'Completed';
  ddr: number;
  dcr: number;
  density: number;
  functionalBase: string;
  parentSessionId?: number;
  blocks: WorkoutBlock[];
  history: WorkoutSession[];
  feedbacks?: BackendSessionFeedback[];
}

export interface BackendSessionFeedback {
  id: number;
  session_id: number;
  series_id: number | null;  // NEW: feedback per series
  athlete_id: number;
  rpe_real: number | null;
  exhaustion_level: string | null;
  notes: string | null;
  attendance: string;
}

export interface GymExercise {
  id: string;
  name: string;
  executionMode: string;
  sets: number;
  reps: string;
  restInterval: string;
  observation?: string;
  targetLoad?: string;
  physicalMotorCapacity?: string;
  targetLoads?: number[];  // Numeric percentages (e.g., [50, 60, 70] for 50%, 60%, 70%)
}

export interface GymFeedback {
  id: number;
  session_id: number;
  athlete_id: number;
  performed_loads: Record<string, number[]>;
  notes?: string;
  attendance: string;
}

export interface GymTemplate {
  id: string;
  title: string;
  category: string;
  author: string;
  lastUpdated: string;
  exercises: GymExercise[];
  observations?: string;
}

export interface GymWorkout {
  id: string;
  title: string;
  category: string;
  status: string; // 'Planned' | 'Completed'
  date: string;
  time: string;
  sourceTemplateName?: string;
  parent_session_id?: number | null;
  exercises: GymExercise[];
  history: WorkoutSession[];
  attendanceCount?: number;
  feedbacks?: GymFeedback[];
}

export interface Athlete {
  id: string;
  firstName: string;
  lastName: string;
  name: string; // firstName + lastName
  birthDate: string;
  cpf: string;
  address: string;
  email: string;
  phone: string;
  category: string;
  avatarUrl?: string;
  status: 'Active' | 'Blocked';
  recentLoad?: number;
  attendance?: boolean;
  fatigueScore?: number;
  bodyWeight?: number;
}

// --- Competitions Live Tracking ---

export interface SplitTime {
  distance: string;
  time: number; // milliseconds
}

export interface LiveEntryTiming {
  athleteId: string;
  lane: number;
  frequency?: number;
  splits: SplitTime[];
  finished: boolean;
  finalTime?: number;
}

export interface HeatEntry {
  lane: number;
  athleteId?: string; // Individual
  relayAthletes?: string[]; // Relay (max 4)
  totalAge?: number; // Relay
}

export interface CompetitionEventHeat {
  id: string;
  number: number;
  time?: string;
  entries: HeatEntry[];
  liveTiming?: LiveEntryTiming[];
}

export interface CompetitionResultEntry {
  athleteId: string;
  athleteName: string;
  time: string; // Formatted time
  timeMs: number;
  rank?: number;
  medal?: 'GOLD' | 'SILVER' | 'BRONZE' | null;
  trophy?: string | null;
  frequency?: number;
  splits?: SplitTime[];
  isOfficial?: boolean;
}

export interface CompetitionEvent {
  id: string;
  name: string;
  stage: string;
  type: 'Individual' | 'Relay';
  heats: CompetitionEventHeat[];
  results: CompetitionResultEntry[];
  isExpanded?: boolean;
}

export interface Competition {
  id: string;
  name: string;
  location: string;
  date: string;
  endDate?: string;
  category: string;
  subCategory?: string;
  status: 'Upcoming' | 'Past';
  isActive?: boolean;
  registeredAthletes: string[];
  events: CompetitionEvent[];
  individualEventsCount?: number;
  relaysCount?: number;
}

export interface AssessmentData {
  id?: number;
  athleteId: string;
  date: string;
  weight?: number;
  jumpHeight?: number;
  throwDistance?: number;
  observation?: string;
  wellnessScore?: number;
  wellnessId?: number;
  wellnessDetails?: {
    sleep: number;
    fatigue: number;
    pain: number;
    stress: number;
  };
}

export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  cpf?: string;
  phone?: string;
  role: 'COACH' | 'ADMIN' | 'ATHLETE';
  isActive: boolean;
  isSuperuser: boolean;
  avatarUrl?: string;
}