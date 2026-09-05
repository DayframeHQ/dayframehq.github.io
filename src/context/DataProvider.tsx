import { useCallback, useEffect, useMemo, useState, type PropsWithChildren } from 'react'
import { format } from 'date-fns'
import { DataContext } from './DataContext'
import { demoGoals, demoMeals, demoReminders, demoTrips, demoWorkout } from '../data/demo'
import type { DailyLog, Goal, MealEntry, Reminder, TravelPlan, WorkoutExercise } from '../types'
import { useAuth } from './AuthContext'
import { supabase } from '../lib/supabase'
import { flushQueuedWrites, queueWrite } from '../lib/offline'

const emptyDaily: DailyLog = { waterMl: 0, steps: 0, walkingMinutes: 0, sleepHours: 0, sleepQuality: 0 }
const demoDaily: DailyLog = { waterMl: 1500, steps: 6842, walkingMinutes: 24, sleepHours: 7.4, sleepQuality: 4 }

interface StoredData {
  daily: DailyLog
  meals: MealEntry[]
  reminders: Reminder[]
  goals: Goal[]
  trips: TravelPlan[]
  workout: WorkoutExercise[]
}

const demoDefaults: StoredData = { daily: demoDaily, meals: demoMeals, reminders: demoReminders, goals: demoGoals, trips: demoTrips, workout: demoWorkout }
const cleanDefaults: StoredData = { daily: emptyDaily, meals: [], reminders: [], goals: [], trips: [], workout: [] }

function loadDemo(): StoredData {
  try {
    const stored = localStorage.getItem('dayframe_demo_data')
    return stored ? { ...demoDefaults, ...JSON.parse(stored) as StoredData } : demoDefaults
  } catch { return demoDefaults }
}

export function DataProvider({ children }: PropsWithChildren) {
  const auth = useAuth()
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [data, setData] = useState<StoredData>(() => auth.isDemo ? loadDemo() : cleanDefaults)
  const [syncPending, setSyncPending] = useState(() => !navigator.onLine)
  const [activeWorkoutSessionId, setActiveWorkoutSessionId] = useState<string | null>(null)
  const dateKey = format(selectedDate, 'yyyy-MM-dd')
  const workoutDraftKey = useCallback((plannedSessionId: string) => `dayframe_workout_draft_${auth.user?.id ?? 'demo'}_${plannedSessionId}`, [auth.user?.id])

  const persist = useCallback(async (table: string, payload: Record<string, unknown>, operation: 'insert' | 'update' | 'delete' = 'insert') => {
    if (auth.isDemo || !auth.user || !supabase) return
    const withOwner = operation === 'insert' ? { ...payload, user_id: auth.user.id } : payload
    if (!navigator.onLine) {
      await queueWrite({ table, operation, payload: withOwner })
      setSyncPending(true)
      return
    }
    let error: { message: string } | null = null
    if (operation === 'insert') ({ error } = await supabase.from(table).insert(withOwner))
    if (operation === 'update') {
      const { id, ...values } = withOwner
      ;({ error } = await supabase.from(table).update(values).eq('id', id))
    }
    if (operation === 'delete') ({ error } = await supabase.from(table).delete().eq('id', withOwner.id))
    if (error) {
      await queueWrite({ table, operation, payload: withOwner })
      setSyncPending(true)
    }
  }, [auth.isDemo, auth.user])

  useEffect(() => {
    if (auth.isDemo) localStorage.setItem('dayframe_demo_data', JSON.stringify(data))
  }, [auth.isDemo, data])

  useEffect(() => {
    if (!activeWorkoutSessionId || !data.workout.length) return
    localStorage.setItem(workoutDraftKey(activeWorkoutSessionId), JSON.stringify(data.workout))
  }, [activeWorkoutSessionId, data.workout, workoutDraftKey])

  useEffect(() => {
    if (auth.isDemo || !auth.user || !supabase) return
    const client = supabase
    let cancelled = false
    const load = async () => {
      const [mealsResult, remindersResult, goalsResult, tripsResult, activityResult, sleepResult, recoveryResult, bodyResult, painResult] = await Promise.all([
        client.from('meal_entries').select('*').eq('entry_date', dateKey).order('created_at'),
        client.from('reminders').select('*').or(`due_at.gte.${dateKey}T00:00:00,due_at.is.null`).order('due_at'),
        client.from('goals').select('*').order('created_at'),
        client.from('travel_plans').select('*').order('created_at'),
        client.from('activity_logs').select('*').eq('activity_date', dateKey).order('created_at', { ascending: false }),
        client.from('sleep_logs').select('*').eq('sleep_date', dateKey).order('created_at', { ascending: false }).limit(1),
        client.from('recovery_logs').select('*').eq('log_date', dateKey).order('created_at', { ascending: false }).limit(1),
        client.from('body_measurements').select('*').gte('measured_at', `${dateKey}T00:00:00`).lte('measured_at', `${dateKey}T23:59:59`).order('measured_at', { ascending: false }).limit(1),
        client.from('pain_logs').select('*').gte('logged_at', `${dateKey}T00:00:00`).lte('logged_at', `${dateKey}T23:59:59`).order('logged_at', { ascending: false }).limit(1),
      ])
      if (cancelled) return
      const activities = activityResult.data ?? []
      const sleep = sleepResult.data?.[0]
      const recovery = recoveryResult.data?.[0]
      const body = bodyResult.data?.[0]
      const pain = painResult.data?.[0]
      setData((current) => ({
        ...current,
        meals: (mealsResult.data ?? []).map((item) => ({ id: item.id, name: item.name, meal: item.meal_type as MealEntry['meal'], calories: Number(item.calories), protein: Number(item.protein_g), carbs: Number(item.carbs_g), fat: Number(item.fat_g), source: item.source as MealEntry['source'] })),
        reminders: (remindersResult.data ?? []).map((item) => ({ id: item.id, title: item.title, time: item.due_at ? new Date(item.due_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : undefined, completed: item.completed, category: item.category ?? 'General' })),
        goals: (goalsResult.data ?? []).map((item) => ({ id: item.id, title: item.title, category: item.category ?? 'Personal', progress: Number(item.progress), nextAction: item.next_action ?? 'Define the first step', status: item.status === 'completed' ? 'completed' : 'active' })),
        trips: (tripsResult.data ?? []).map((item) => ({ id: item.id, destination: item.destination, country: item.country ?? '', dates: item.start_date ? `${item.start_date}–${item.end_date ?? ''}` : 'Dates not set', status: item.status as TravelPlan['status'], progress: item.status === 'Completed' ? 100 : item.status === 'Booked' ? 80 : 25 })),
        daily: {
          waterMl: Number(recovery?.hydration_ml ?? 0),
          steps: Number(activities.find((item) => item.activity_type === 'steps')?.steps ?? 0),
          walkingMinutes: Number(activities.find((item) => item.activity_type === 'walk')?.duration_minutes ?? 0),
          sleepHours: Number(sleep?.duration_minutes ?? 0) / 60,
          sleepQuality: Number(sleep?.quality ?? 0),
          weight: body?.weight_kg ? Number(body.weight_kg) : undefined,
          pain: pain ? { score: Number(pain.score), location: pain.body_location, note: pain.notes ?? undefined } : undefined,
        },
      }))
    }
    void load()
    return () => { cancelled = true }
  }, [auth.isDemo, auth.user, dateKey])

  useEffect(() => {
    const online = () => {
      if (supabase && !auth.isDemo) void flushQueuedWrites(supabase).then((count) => setSyncPending(count > 0))
      else setSyncPending(false)
    }
    const offline = () => setSyncPending(true)
    window.addEventListener('online', online)
    window.addEventListener('offline', offline)
    return () => { window.removeEventListener('online', online); window.removeEventListener('offline', offline) }
  }, [auth.isDemo])

  const value = useMemo(() => ({
    selectedDate,
    setSelectedDate,
    ...data,
    syncPending,
    addMeal: (entry: Omit<MealEntry, 'id'>) => {
      const item = { ...entry, id: crypto.randomUUID() }
      setData((current) => ({ ...current, meals: [...current.meals, item] }))
      void persist('meal_entries', { id: item.id, entry_date: dateKey, meal_type: entry.meal, name: entry.name, calories: entry.calories, protein_g: entry.protein, carbs_g: entry.carbs, fat_g: entry.fat, source: entry.source })
    },
    updateDaily: (patch: Partial<DailyLog>) => {
      setData((current) => ({ ...current, daily: { ...current.daily, ...patch } }))
      if (patch.steps !== undefined) void persist('activity_logs', { activity_date: dateKey, activity_type: 'steps', steps: patch.steps })
      if (patch.walkingMinutes !== undefined) void persist('activity_logs', { activity_date: dateKey, activity_type: 'walk', duration_minutes: patch.walkingMinutes })
      if (patch.waterMl !== undefined) void persist('recovery_logs', { log_date: dateKey, hydration_ml: patch.waterMl })
      if (patch.sleepHours !== undefined) void persist('sleep_logs', { sleep_date: dateKey, duration_minutes: Math.round(patch.sleepHours * 60), quality: patch.sleepQuality ?? null })
      if (patch.weight !== undefined) void persist('body_measurements', { measured_at: `${dateKey}T12:00:00`, weight_kg: patch.weight })
      if (patch.pain) void persist('pain_logs', { logged_at: new Date().toISOString(), score: patch.pain.score, body_location: patch.pain.location, notes: patch.pain.note })
    },
    toggleReminder: (id: string) => {
      const item = data.reminders.find((reminder) => reminder.id === id)
      setData((current) => ({ ...current, reminders: current.reminders.map((reminder) => reminder.id === id ? { ...reminder, completed: !reminder.completed } : reminder) }))
      void persist('reminders', { id, completed: !item?.completed, completed_at: item?.completed ? null : new Date().toISOString() }, 'update')
    },
    addReminder: (title: string, time?: string) => {
      const item = { id: crypto.randomUUID(), title, time, completed: false, category: 'General' }
      setData((current) => ({ ...current, reminders: [...current.reminders, item] }))
      void persist('reminders', { id: item.id, title, category: 'General', due_at: time ? `${dateKey}T${time}` : `${dateKey}T12:00:00` })
    },
    addGoal: (title: string, category: string) => {
      const item: Goal = { id: crypto.randomUUID(), title, category, progress: 0, nextAction: 'Define the first step', status: 'active' }
      setData((current) => ({ ...current, goals: [...current.goals, item] }))
      void persist('goals', { id: item.id, title, category, progress: 0, next_action: item.nextAction })
    },
    addTrip: (destination: string, country: string) => {
      const item: TravelPlan = { id: crypto.randomUUID(), destination, country, dates: 'Dates not set', status: 'Wishlist', progress: 5 }
      setData((current) => ({ ...current, trips: [...current.trips, item] }))
      void persist('travel_plans', { id: item.id, destination, country, status: 'Wishlist' })
    },
    updateSet: (exerciseId: string, setId: string, field: 'weight' | 'reps' | 'rir' | 'completed' | 'notes', next: number | boolean | string) => setData((current) => ({ ...current, workout: current.workout.map((exercise) => exercise.id !== exerciseId ? exercise : { ...exercise, sets: exercise.sets.map((item) => item.id === setId ? { ...item, [field]: next } : item) }) })),
    loadWorkoutFromPlan: async (items: Array<{ id: string; title: string; metadata: Record<string, unknown> }>, plannedSessionId?: string) => {
      const mapped: WorkoutExercise[] = items.map((item) => {
        const trackingMode=item.metadata.tracking_mode==='duration'?'duration':'sets_reps';const sets=trackingMode==='duration'?1:Number(item.metadata.sets??3);const repMin=trackingMode==='duration'?Number(item.metadata.duration_minutes??20):Number(item.metadata.rep_min??8);const repMax=trackingMode==='duration'?repMin:Number(item.metadata.rep_max??12)
        return { id: item.id, name: item.title, trackingMode, activityType:String(item.metadata.activity_type??'other') as WorkoutExercise['activityType'], repRange: trackingMode==='duration'?`${repMin} min`:`${repMin}–${repMax} reps`, previous: 'No prior performance', sets: Array.from({ length: sets }, () => ({ id: crypto.randomUUID(), weight: 0, reps: repMin, rir: trackingMode==='duration'?0:Number(item.metadata.target_rir ?? 2), completed: false, notes: '' })) }
      })
      let initial = mapped
      if (plannedSessionId) {
        try {
          const draft = JSON.parse(localStorage.getItem(workoutDraftKey(plannedSessionId)) ?? 'null') as WorkoutExercise[] | null
          if (Array.isArray(draft) && draft.length) initial = draft
        } catch { /* Ignore a malformed local draft and use the persisted prescription. */ }
      }
      setData((current) => ({ ...current, workout: initial }))
      setActiveWorkoutSessionId(plannedSessionId ?? null)
      if (initial !== mapped) return
      if (!auth.isDemo && supabase && auth.user) {
        const client=supabase
        const enriched=await Promise.all(mapped.map(async(exercise)=>{
          if(exercise.trackingMode==='duration')return exercise
          const searchName=exercise.name.split(/\s+\/\s+|\s+or\s+/i)[0]
          const {data:reference}=await client.from('exercises').select('id').ilike('name',searchName).limit(1).maybeSingle()
          if(!reference)return exercise
          const {data:last}=await client.from('set_logs').select('weight,reps,rir,performed_at,exercise_logs!inner(exercise_id)').eq('exercise_logs.exercise_id',reference.id).eq('completed',true).order('performed_at',{ascending:false}).limit(1).maybeSingle()
          return last?{...exercise,previous:`${Number(last.weight)} kg × ${last.reps} · ${last.rir ?? '—'} RIR`,sets:exercise.sets.map((set)=>({...set,weight:Number(last.weight)}))}:exercise
        }))
        setData((current)=>({...current,workout:enriched}))
      }
    },
    copyStarterTemplate: () => {
      setData((current) => ({ ...current, workout: demoWorkout.map((exercise) => ({ ...exercise, sets: exercise.sets.map((item) => ({ ...item })) })) }))
      void persist('workout_programs', { name: '4-Day Recomp — Upper/Lower', description: 'Copied from the public Dayframe template', is_active: true, start_date: dateKey })
    },
    saveWorkout: async (plannedSessionId?: string) => {
      const clearDraft = () => { if (plannedSessionId) localStorage.removeItem(workoutDraftKey(plannedSessionId)); setActiveWorkoutSessionId(null) }
      if(auth.isDemo){const walkingMinutes=data.workout.filter((exercise)=>exercise.trackingMode==='duration'&&exercise.activityType==='walk').flatMap((exercise)=>exercise.sets).filter((set)=>set.completed).reduce((sum,set)=>sum+set.reps,0);if(walkingMinutes)setData((current)=>({...current,daily:{...current.daily,walkingMinutes:current.daily.walkingMinutes+walkingMinutes}}));clearDraft();return}
      if(!auth.user||!supabase){clearDraft();return}
      const { data: session, error } = await supabase.from('workout_sessions').insert({ user_id: auth.user.id, planned_session_id: plannedSessionId ?? null, session_date: dateKey, started_at: new Date().toISOString(), completed_at: new Date().toISOString(), status: 'completed' }).select('id').single()
      if (error || !session) throw error ?? new Error('Could not create workout session')
      try {
        for (const [index, exercise] of data.workout.entries()) {
          const searchName=exercise.name.split(/\s+\/\s+|\s+or\s+/i)[0]
          let { data: exerciseRow } = await supabase.from('exercises').select('id').ilike('name', searchName).limit(1).maybeSingle()
          if (!exerciseRow) { const created=await supabase.from('exercises').insert({user_id:auth.user.id,name:exercise.name,category:'Custom',is_system:false}).select('id').single();if(created.error)throw created.error;exerciseRow=created.data }
          const { data: log, error: logError } = await supabase.from('exercise_logs').insert({ user_id: auth.user.id, workout_session_id: session.id, exercise_id: exerciseRow.id, position: index }).select('id').single()
          if (logError || !log) throw logError ?? new Error(`Could not save ${exercise.name}`)
          const completed=exercise.sets.filter((set)=>set.completed)
          if(exercise.trackingMode==='duration'){
            const minutes=completed.reduce((sum,set)=>sum+set.reps,0)
            if(minutes){const movementNotes=completed.map((set)=>set.notes?.trim()).filter(Boolean).join(' · ');const {error:activityError}=await supabase.from('activity_logs').insert({user_id:auth.user.id,activity_date:dateKey,activity_type:exercise.activityType??'other',duration_minutes:minutes,source_type:'manual',notes:[`Logged from Workouts · ${exercise.name}`,movementNotes].filter(Boolean).join(' · ')});if(activityError)throw activityError}
          }else{
            const rows=completed.map((set,setIndex)=>({user_id:auth.user!.id,exercise_log_id:log.id,set_number:setIndex+1,weight:set.weight,reps:set.reps,rir:set.rir,notes:set.notes?.trim()||null,completed:true,performed_at:new Date().toISOString()}))
            if(rows.length){const {error:setError}=await supabase.from('set_logs').insert(rows);if(setError)throw setError}
          }
        }
        if(plannedSessionId){const {error:plannedError}=await supabase.from('planned_sessions').update({status:'completed',completed_at:new Date().toISOString()}).eq('id',plannedSessionId);if(plannedError)throw plannedError}
      } catch (saveError) {
        await supabase.from('workout_sessions').delete().eq('id', session.id)
        throw saveError
      }
      clearDraft()
    },
    resetDemo: () => setData({ ...demoDefaults, daily: { ...demoDaily }, meals: [...demoMeals], reminders: [...demoReminders], goals: [...demoGoals], trips: [...demoTrips], workout: demoWorkout.map((exercise) => ({ ...exercise, sets: exercise.sets.map((item) => ({ ...item })) })) }),
  }), [auth.isDemo, auth.user, data, dateKey, persist, selectedDate, syncPending, workoutDraftKey])

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}
