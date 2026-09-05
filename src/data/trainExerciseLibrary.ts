export type ExerciseTracking = 'sets_reps' | 'duration'

export interface TrainExerciseOption {
  id: string
  name: string
  category: 'Strength' | 'Bodyweight' | 'Core' | 'Cardio' | 'Mobility'
  tracking: ExerciseTracking
  sets: number
  repMin: number
  repMax: number
  minutes?: number
  activityType?: 'walk' | 'swim' | 'other'
}

const strength = [
  'Back Squat','Front Squat','Goblet Squat','Leg Press','Leg Extension','Seated Leg Curl','Lying Leg Curl','Romanian Deadlift','Conventional Deadlift','Hip Thrust','Glute Bridge','Walking Lunge','Bulgarian Split Squat','Calf Raise',
  'Bench Press','Incline Dumbbell Press','Machine Chest Press','Overhead Press','Machine Shoulder Press','Dumbbell Lateral Raise','Cable Y-Raise','Pull-Ups','Lat Pulldown','Barbell Row','Chest-Supported Row','Seated Cable Row','Face Pull','Reverse Pec Deck','Biceps Curl','Hammer Curl','Triceps Pushdown','Overhead Triceps Extension',
]

const bodyweight = ['Push-Ups','Bodyweight Squat','Reverse Lunge','Step-Ups','Dips','Inverted Row','Assisted Pull-Ups','Burpees','Mountain Climbers']
const core = ['Crunches','Cable Crunch','Bicycle Crunch','Reverse Crunch','Plank','Side Plank','Dead Bug','Bird Dog','Hanging Leg Raise','Pallof Press','Russian Twist']

const setBased = (names:string[],category:TrainExerciseOption['category'],sets=3,repMin=8,repMax=12):TrainExerciseOption[] => names.map((name)=>({id:name.toLowerCase().replace(/[^a-z0-9]+/g,'-'),name,category,tracking:'sets_reps',sets,repMin,repMax}))
const duration = (id:string,name:string,category:TrainExerciseOption['category'],minutes:number,activityType:'walk'|'swim'|'other'='other'):TrainExerciseOption => ({id,name,category,tracking:'duration',sets:1,repMin:minutes,repMax:minutes,minutes,activityType})

export const trainExerciseLibrary:TrainExerciseOption[] = [
  ...setBased(strength,'Strength'),
  ...setBased(bodyweight,'Bodyweight',3,10,15),
  ...setBased(core,'Core',3,10,20),
  duration('walking','Walking','Cardio',30,'walk'),
  duration('brisk-walking','Brisk Walking','Cardio',30,'walk'),
  duration('treadmill-walking','Treadmill Walking','Cardio',25,'walk'),
  duration('running','Running','Cardio',25),
  duration('cycling','Cycling','Cardio',30),
  duration('rowing','Rowing','Cardio',20),
  duration('swimming','Swimming','Cardio',30,'swim'),
  duration('stair-climbing','Stair Climbing','Cardio',20),
  duration('elliptical','Elliptical','Cardio',25),
  duration('jump-rope','Jump Rope','Cardio',15),
  duration('mobility-flow','Mobility Flow','Mobility',15),
  duration('full-body-stretching','Full-body Stretching','Mobility',15),
  duration('yoga','Yoga','Mobility',30),
  duration('foam-rolling','Foam Rolling','Mobility',15),
]
