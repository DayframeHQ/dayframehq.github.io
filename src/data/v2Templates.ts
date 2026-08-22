import type { PlanTemplate, TemplatePhase } from '../types/v2'

const exercise = (title: string, sets: number, repMin: number, repMax: number) => ({ type: 'exercise', title, metadata: { sets, rep_min: repMin, rep_max: repMax, target_rir: 2 } })
const train = (n: number, name: string, description: string, goal: string, difficulty: string, sessions: Array<{ title: string; day: number; exercises: ReturnType<typeof exercise>[] }>, featured = false): PlanTemplate => ({
  id: `train-${n}`, slug: `train-${n}-day`, domain: 'train', name, short_description: description, goal, difficulty, featured,
  version: { id: `train-${n}-v1`, version: '1.0', duration_weeks: 12, days_per_week_min: n, days_per_week_max: n, expected_hours_per_week: n * 1.1, expected_session_minutes: 65, content: { content_status: 'complete', phases: [{ name: 'Training cycle', start_week: 1, end_week: 12, blocks: [{ name: 'Weekly schedule', type: 'cycle', week: 1, sessions: sessions.map((s) => ({ title: s.title, day_offset: s.day, minutes: 65, items: s.exercises })) }] }] } },
})

const goldenTrain = train(4, '4-Day Recomp — Upper/Lower', 'Back, quad, push and posterior emphasis in four repeatable sessions.', 'Recomp', 'Intermediate', [
  { title: 'Upper A / Back emphasis', day: 1, exercises: [exercise('Pull-Ups',3,4,6),exercise('Lat Pulldown',3,8,10),exercise('Chest-Supported Machine Row',3,8,10),exercise('Incline Dumbbell Press',3,8,10),exercise('Reverse Pec Deck',3,12,15),exercise('EZ-Bar Biceps Curl',3,8,12),exercise('Hammer Curl',2,10,12),exercise('Cable Crunch',3,10,15)] },
  { title: 'Lower A / Quad emphasis', day: 3, exercises: [exercise('Leg Press',3,8,12),exercise('Leg Extension',3,10,15),exercise('Seated Leg Curl',3,10,15),exercise('Hip Thrust / Machine Hip Thrust',3,8,12),exercise('Calf Raise',4,10,15),exercise('Pallof Press',3,10,12)] },
  { title: 'Upper B / Push emphasis', day: 5, exercises: [exercise('Incline Dumbbell Bench Press',3,8,10),exercise('Dumbbell or Machine Chest Press',3,8,10),exercise('Machine Shoulder Press',3,8,12),exercise('Lean-In Dumbbell Lateral Raise',3,12,20),exercise('Cable Y-Raise',2,12,15),exercise('Neutral-Grip Cable/Machine Row',3,10,12),exercise('Face Pull',2,12,15),exercise('Overhead Cable Triceps Extension',3,10,15),exercise('Triceps Pushdown',2,10,15)] },
  { title: 'Lower B + Core', day: 6, exercises: [exercise('Seated or Lying Leg Curl',4,8,12),exercise('Hip Thrust or Glute Bridge',3,10,12),exercise('Leg Press',3,10,12),exercise('Leg Extension',2,12,15),exercise('Calf Raise',3,12,15),exercise('Dead Bug',3,8,10),exercise('Cable Crunch',3,12,15)] },
], true)

const studyMetadata = [
  ['study-programming','Programming Foundations',12,'Practical programming fundamentals.','New','Build programming fluency'],
  ['study-cs','Computer Science for Software Engineers',40,'Complete CS foundations for working engineers.','Intermediate','Build durable CS foundations'],
  ['study-dsa','DSA & Algorithms Foundations',12,'Algorithms and data structures foundation.','New','Improve problem solving'],
  ['study-backend','Backend Engineer Foundations',20,'A structured backend foundation.','Intermediate','Become backend-ready'],
  ['study-system-design','System Design Foundations',10,'Core scalable-system design concepts.','Intermediate','Build system-design skill'],
  ['study-interview','Senior Software / Backend Interview — 8 Weeks',8,'Intensive DSA, LLD, HLD, mock and behavioral sprint.','Advanced','Prepare for senior interviews'],
  ['study-custom','Custom / Imported Plan',0,'Build manually or review an imported roadmap.','Custom','Use your own curriculum'],
] as const

const phase = (name: string, start: number, weeks: string[]): TemplatePhase => ({ name, start_week: start, end_week: start + weeks.length - 1, blocks: weeks.map((title, index) => ({ name: `Week ${start + index} — ${title}`, type: 'week', week: start + index, sessions: [
  { title: `${title} — Learn`, day_offset: 0, minutes: 75, items: [{ type: 'lesson', title: `Learn ${title}`, minutes: 60 }] },
  { title: `${title} — Practice`, day_offset: 2, minutes: 75, items: [{ type: 'practice', title: `Practice and explain ${title}`, minutes: 60 }] },
  { title: `${title} — Review`, day_offset: 5, minutes: 60, items: [{ type: 'review', title: `Review notes and gaps from ${title}`, minutes: 45 }] },
] })) })

const csPhases = [
  phase('Phase 0 — Developer Tools',1,['Terminal, Git and environment','Debugging, testing and CI']),
  phase('Phase 1 — Software Construction',3,['Programming models','OOP and abstraction','Software quality','LLD foundation project']),
  phase('Phase 2 — DSA + Discrete Math',7,['Complexity, arrays and hashing','Two pointers and sliding window','Search, stacks and linked lists','Trees, BST and heaps','Graphs','Greedy, intervals, backtracking and trie','Dynamic programming','Mixed DSA assessment']),
  phase('Phase 3 — Computer Architecture',15,['Data and memory','Assembly concepts','CPU execution','Memory hierarchy']),
  phase('Phase 4 — Operating Systems',19,['Processes and kernel boundary','Concurrency','Virtual memory','Filesystems and I/O']),
  phase('Phase 5 — Networking',23,['Network layers','Transport','Application networking','Networking project']),
  phase('Phase 6 — Database Systems',27,['Relational foundations','Storage and indexes','Query execution','Transactions','Durability and distribution']),
  phase('Phase 7 — Backend + Distributed Systems',32,['Backend API foundations','Performance primitives','Service architecture','Distributed systems','System design']),
  phase('Phase 8 — Security + Reliability',37,['Security','Reliability']),
  phase('Phase 9 — Capstone',39,['Production-style capstone','Harden and review']),
]

const interviewPhases = [phase('8-Week Interview Sprint',1,['Arrays, Hashing and Prefix Sum','Two Pointers, Sliding Window and Linked Lists','Binary Search, Stack and Monotonic Stack','Trees, BST and Heap','Graphs, Topological Sort and Union Find','Dynamic Programming','Greedy, Intervals, Backtracking and Trie','Mixed timed interview mode'])]

const studyTemplates: PlanTemplate[] = studyMetadata.map(([id,name,weeks,description,difficulty,goal], index) => ({
  id, slug: id, domain: 'study', name, short_description: description, goal, difficulty, featured: index === 1 || index === 5,
  sources: index===1?[
    {title:'The Missing Semester',author_or_org:'MIT',url:'https://missing.csail.mit.edu/'},
    {title:'CS 61C',author_or_org:'UC Berkeley',url:'https://cs61c.org/'},
    {title:'Database Systems',author_or_org:'Carnegie Mellon University',url:'https://15445.courses.cs.cmu.edu/'},
    {title:'OWASP Top Ten',author_or_org:'OWASP Foundation',url:'https://owasp.org/www-project-top-ten/'},
    {title:'Site Reliability Engineering',author_or_org:'Google',url:'https://sre.google/sre-book/table-of-contents/'},
  ]:index===5?[
    {title:'LeetCode Problems',author_or_org:'LeetCode',url:'https://leetcode.com/problemset/'},
    {title:'System Design Primer',author_or_org:'donnemartin',url:'https://github.com/donnemartin/system-design-primer'},
  ]:[],
  version: { id: `${id}-v1`, version: '1.0', duration_weeks: weeks || null, days_per_week_min: index === 5 ? 6 : 3, days_per_week_max: index === 5 ? 7 : 6, expected_hours_per_week: index === 5 ? 23 : index === 1 ? 10 : null, expected_session_minutes: 75, content: { content_status: index === 1 || index === 5 ? 'complete' : index === 6 ? 'custom' : 'catalog', pacing: index === 1 ? { light: 6, standard: 10, intensive: 15 } : undefined, phases: index === 1 ? csPhases : index === 5 ? interviewPhases : [] } },
}))

export const trainTemplates: PlanTemplate[] = [
  train(1,'Full Body — Minimum Effective','Minimum-frequency option for constrained weeks.','General fitness','New',[{title:'Full Body',day:0,exercises:[exercise('Leg Press or Squat Variation',3,6,10),exercise('Incline DB or Machine Press',3,6,10),exercise('Lat Pulldown or Pull-Up',3,6,10),exercise('Leg Curl',3,8,12)]}]),
  train(2,'Full Body A/B','Two spaced full-body sessions.','Build muscle','New',[{title:'Full Body A',day:0,exercises:[exercise('Leg Press',3,6,10),exercise('Incline DB Press',3,8,10),exercise('Lat Pulldown',3,8,10)]},{title:'Full Body B',day:3,exercises:[exercise('Hip Thrust',3,8,12),exercise('Machine Chest Press',3,8,12),exercise('Chest-Supported Row',3,8,12)]}]),
  train(3,'Full Body / Upper / Lower','Balanced three-day training week.','Build muscle','Intermediate',[{title:'Full Body',day:0,exercises:[exercise('Leg Press',3,8,10),exercise('Incline DB Press',3,8,10),exercise('Lat Pulldown',3,8,10)]},{title:'Upper',day:2,exercises:[exercise('Pull-Up or Pulldown',3,6,10),exercise('Machine Chest Press',3,8,10)]},{title:'Lower',day:4,exercises:[exercise('Leg Press / Squat Variation',3,6,10),exercise('Leg Curl',3,8,12)]}]),
  goldenTrain,
  train(5,'Upper / Lower / Push / Pull / Legs','Five lifting days with recovery spacing.','Build muscle','Intermediate',['Upper','Lower','Push','Pull','Legs'].map((title,day)=>({title,day,exercises:[exercise(`${title} primary movement`,3,6,10),exercise(`${title} accessory`,3,10,15)]}))),
  train(6,'Push / Pull / Legs A/B','Six lifting days with changing emphasis.','Build muscle','Advanced',['Push A','Pull A','Legs A','Push B','Pull B','Legs B'].map((title,day)=>({title,day,exercises:[exercise(`${title} primary movement`,3,6,10),exercise(`${title} accessory`,3,10,15)]}))),
  train(7,'Complete Fitness — 7 Active Days','Four lifting days plus conditioning, mobility and recovery—not seven lifting sessions.','General fitness','Intermediate',['Upper A','Lower A','Conditioning','Upper B','Lower B','Zone 2 + mobility','Recovery'].map((title,day)=>({title,day,exercises:[exercise(title.includes('Upper')||title.includes('Lower')?`${title} training`:`${title} activity`,3,8,12)]}))),
]

export { studyTemplates }
export const allTemplates = [...trainTemplates, ...studyTemplates]
