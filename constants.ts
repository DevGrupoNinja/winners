
import { Athlete, MacroCycle, Workout, Competition, AssessmentData, GymWorkout, GymTemplate } from './types';

export const MOCK_ATHLETES: Athlete[] = [
  { 
    id: '1', 
    firstName: 'Cassiano', 
    lastName: 'Silva', 
    name: 'Cassiano Silva', 
    category: 'Absoluto', 
    birthDate: '1995-05-15',
    cpf: '123.456.789-00',
    address: 'Av. das Américas, 1000 - Rio de Janeiro, RJ',
    email: 'cassiano.silva@winners.com',
    phone: '(21) 98888-7777',
    status: 'Active',
    recentLoad: 55, 
    fatigueScore: 3, 
    bodyWeight: 72 
  },
  { 
    id: '2', 
    firstName: 'João', 
    lastName: 'Santos', 
    name: 'João Santos', 
    category: 'Absoluto', 
    birthDate: '1998-02-20',
    cpf: '222.333.444-55',
    address: 'Rua das Flores, 25 - São Paulo, SP',
    email: 'joao.santos@winners.com',
    phone: '(11) 97777-6666',
    status: 'Active',
    recentLoad: 80, 
    fatigueScore: 7, 
    bodyWeight: 78 
  },
  { 
    id: '3', 
    firstName: 'Pelaio', 
    lastName: 'Dias', 
    name: 'Pelaio Dias', 
    category: 'Absoluto', 
    birthDate: '2000-11-10',
    cpf: '999.888.777-66',
    address: 'Rua do Sol, 450 - Curitiba, PR',
    email: 'pelaio.dias@winners.com',
    phone: '(41) 96666-5555',
    status: 'Active',
    recentLoad: 45, 
    fatigueScore: 4, 
    bodyWeight: 64 
  },
  { 
    id: '4', 
    firstName: 'Pedro', 
    lastName: 'Lima', 
    name: 'Pedro Lima', 
    category: 'Absoluto', 
    birthDate: '1996-07-22',
    cpf: '444.555.666-77',
    address: 'Av. Central, 800 - Belo Horizonte, MG',
    email: 'pedro.lima@winners.com',
    phone: '(31) 95555-4444',
    status: 'Blocked',
    recentLoad: 90, 
    fatigueScore: 5, 
    bodyWeight: 81 
  },
  { 
    id: '5', 
    firstName: 'Ana', 
    lastName: 'Costa', 
    name: 'Ana Costa', 
    category: 'Absoluto', 
    birthDate: '1999-01-30',
    cpf: '777.888.999-00',
    address: 'Rua da Praia, 12 - Florianópolis, SC',
    email: 'ana.costa@winners.com',
    phone: '(48) 94444-3333',
    status: 'Active',
    recentLoad: 40, 
    fatigueScore: 2, 
    bodyWeight: 54 
  },
];

export const MOCK_MACRO: MacroCycle[] = [
  {
    id: 'mac1',
    name: 'Preparação Geral 2024',
    season: '2024 Season',
    startDate: '2024-02-01',
    endDate: '2024-12-15',
    isExpanded: true,
    mesos: [
      {
        id: 'mes1',
        name: 'Base Aeróbica I',
        startDate: '2024-02-01',
        endDate: '2024-03-31',
        isExpanded: true,
        micros: [
          { id: 'mic1', name: 'Micro 1 - Adaptação', startDate: '2024-02-01', endDate: '2024-02-07', focus: ['Resistência', 'Técnica'], volume: 25000, intensity: 'Low' },
          { id: 'mic2', name: 'Micro 2 - Carga', startDate: '2024-02-08', endDate: '2024-02-14', focus: ['Aeróbico A1'], volume: 32000, intensity: 'Medium' }
        ]
      }
    ]
  }
];

export const MOCK_COMPETITIONS: Competition[] = [
  { 
      id: 'c1', 
      name: 'Campeonato Brasileiro José Finkel', 
      location: 'Rio de Janeiro', 
      date: '10/11/2025', 
      endDate: '15/11/2025',
      category: 'Nacional',
      subCategory: 'Absoluto - Federado',
      status: 'Upcoming', 
      registeredAthletes: ['1', '2', '3', '4', '5'],
      individualEventsCount: 36,
      relaysCount: 8,
      events: [
          {
              id: 'ev1',
              name: '50M LIVRE Masculino',
              stage: '2º Etapa (sexta 15/10/2015)',
              type: 'Individual',
              isExpanded: true,
              heats: [
                  {
                      id: 'h1',
                      number: 1,
                      time: '14:30',
                      entries: [
                          { lane: 3, athleteId: '1' },
                          { lane: 2, athleteId: '2' }
                      ]
                  },
                  {
                      id: 'h2',
                      number: 3,
                      time: '14:45',
                      entries: [
                          { lane: 5, athleteId: '3' },
                          { lane: 4, athleteId: '4' }
                      ]
                  }
              ],
              results: []
          },
          {
              id: 'ev2',
              name: '50M LIVRE Feminino',
              stage: '2º Etapa (sexta 15/10/2015)',
              type: 'Individual',
              heats: [],
              results: []
          },
          {
              id: 'ev3',
              name: '100M LIVRE Masculino',
              stage: '2º Etapa (sexta 15/10/2015)',
              type: 'Individual',
              heats: [],
              results: []
          },
          {
              id: 'ev4',
              name: '200 LIVRE Masculino',
              stage: '2º Etapa (sexta 15/10/2015)',
              type: 'Individual',
              heats: [],
              results: []
          }
      ]
  }
];

export const MOCK_WORKOUTS: Workout[] = [];
export const MOCK_GYM_WORKOUTS: GymWorkout[] = [];
export const MOCK_GYM_TEMPLATES: GymTemplate[] = [];

export const MOCK_ASSESSMENT_HISTORY: AssessmentData[] = [
  // Cassiano Silva
  { athleteId: '1', date: '2024-01-10', weight: 70.5, jumpHeight: 45, throwDistance: 8.2, wellnessScore: 8.0, wellnessDetails: { sleep: 8, fatigue: 4, pain: 2, stress: 3 } },
  { athleteId: '1', date: '2024-02-15', weight: 71.2, jumpHeight: 47, throwDistance: 8.5, wellnessScore: 7.2, wellnessDetails: { sleep: 7, fatigue: 6, pain: 4, stress: 5 } },
  { athleteId: '1', date: '2024-03-20', weight: 72.0, jumpHeight: 48, throwDistance: 8.8, wellnessScore: 9.1, wellnessDetails: { sleep: 9, fatigue: 2, pain: 1, stress: 2 } },
  
  // João Santos
  { athleteId: '2', date: '2024-01-12', weight: 79.5, jumpHeight: 52, throwDistance: 9.5, wellnessScore: 6.5, wellnessDetails: { sleep: 6, fatigue: 7, pain: 5, stress: 8 } },
  { athleteId: '2', date: '2024-02-14', weight: 78.8, jumpHeight: 55, throwDistance: 9.8, wellnessScore: 5.2, wellnessDetails: { sleep: 5, fatigue: 8, pain: 7, stress: 9 } },
  { athleteId: '2', date: '2024-03-18', weight: 78.0, jumpHeight: 58, throwDistance: 10.2, wellnessScore: 7.8, wellnessDetails: { sleep: 8, fatigue: 4, pain: 3, stress: 5 } },
  
  // Pelaio Dias
  { athleteId: '3', date: '2024-01-05', weight: 62.0, jumpHeight: 40, throwDistance: 7.0, wellnessScore: 9.2, wellnessDetails: { sleep: 9, fatigue: 2, pain: 1, stress: 1 } },
  { athleteId: '3', date: '2024-02-08', weight: 63.5, jumpHeight: 42, throwDistance: 7.4, wellnessScore: 8.5, wellnessDetails: { sleep: 8, fatigue: 3, pain: 2, stress: 3 } },
  { athleteId: '3', date: '2024-03-12', weight: 64.0, jumpHeight: 43, throwDistance: 7.8, wellnessScore: 8.0, wellnessDetails: { sleep: 8, fatigue: 4, pain: 4, stress: 4 } },

  // Pedro Lima
  { athleteId: '4', date: '2024-01-20', weight: 82.0, jumpHeight: 50, throwDistance: 9.0, wellnessScore: 7.5, wellnessDetails: { sleep: 7, fatigue: 5, pain: 5, stress: 6 } },
  { athleteId: '4', date: '2024-02-22', weight: 81.5, jumpHeight: 53, throwDistance: 9.4, wellnessScore: 8.2, wellnessDetails: { sleep: 8, fatigue: 3, pain: 3, stress: 4 } },
  { athleteId: '4', date: '2024-03-25', weight: 81.0, jumpHeight: 56, throwDistance: 9.9, wellnessScore: 9.5, wellnessDetails: { sleep: 9, fatigue: 1, pain: 1, stress: 1 } },

  // Ana Costa
  { athleteId: '5', date: '2024-01-15', weight: 55.0, jumpHeight: 38, throwDistance: 6.5, wellnessScore: 9.8, wellnessDetails: { sleep: 10, fatigue: 1, pain: 1, stress: 1 } },
  { athleteId: '5', date: '2024-02-18', weight: 54.5, jumpHeight: 40, throwDistance: 6.8, wellnessScore: 8.2, wellnessDetails: { sleep: 8, fatigue: 2, pain: 3, stress: 4 } },
  { athleteId: '5', date: '2024-03-22', weight: 54.0, jumpHeight: 41, throwDistance: 7.2, wellnessScore: 10.0, wellnessDetails: { sleep: 10, fatigue: 1, pain: 1, stress: 1 } },
];