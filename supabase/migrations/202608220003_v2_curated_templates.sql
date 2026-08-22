-- Dayframe-curated V2 catalog. Public content only; no owner data.

begin;

insert into public.templates (id,slug,domain,name,short_description,goal,difficulty,status,featured) values
('10000000-0000-4000-8000-000000000001','full-body-minimum-effective','train','Full Body — Minimum Effective','One focused full-body session for constrained weeks.','General fitness','New','published',false),
('10000000-0000-4000-8000-000000000002','full-body-a-b','train','Full Body A/B','Two meaningfully spaced full-body sessions.','Build muscle','New','published',false),
('10000000-0000-4000-8000-000000000003','full-upper-lower','train','Full Body / Upper / Lower','A balanced three-day training week.','Build muscle','Intermediate','published',false),
('10000000-0000-4000-8000-000000000004','4-day-recomp-upper-lower-v2','train','4-Day Recomp — Upper/Lower','Four-day upper/lower plan with back, quad, push and posterior emphasis.','Recomp','Intermediate','published',true),
('10000000-0000-4000-8000-000000000005','upper-lower-push-pull-legs','train','Upper / Lower / Push / Pull / Legs','Five lifting days with two recovery days.','Build muscle','Intermediate','published',false),
('10000000-0000-4000-8000-000000000006','push-pull-legs-a-b','train','Push / Pull / Legs A/B','Six lifting days with distinct emphasis sessions.','Build muscle','Advanced','published',false),
('10000000-0000-4000-8000-000000000007','complete-fitness-seven-active-days','train','Complete Fitness — 7 Active Days','Four lifting days plus conditioning, mobility and recovery—not seven lifting days.','General fitness','Intermediate','published',false),
('10000000-0000-4000-8000-000000000101','programming-foundations','study','Programming Foundations','A 12-week starter track for practical programming fundamentals.','Build programming fluency','New','published',false),
('10000000-0000-4000-8000-000000000102','computer-science-software-engineers','study','Computer Science for Software Engineers','A complete 40-week computer-science roadmap for working engineers.','Build durable CS foundations','Intermediate','published',true),
('10000000-0000-4000-8000-000000000103','dsa-algorithms-foundations','study','DSA & Algorithms Foundations','A 12-week algorithms and data-structures foundation.','Improve problem solving','New','published',false),
('10000000-0000-4000-8000-000000000104','backend-engineer-foundations','study','Backend Engineer Foundations','A 20-week backend engineering foundation.','Become backend-ready','Intermediate','published',false),
('10000000-0000-4000-8000-000000000105','system-design-foundations','study','System Design Foundations','A 10-week introduction to designing scalable systems.','Build system-design skill','Intermediate','published',false),
('10000000-0000-4000-8000-000000000106','senior-backend-interview-sprint','study','Senior Software / Backend Interview — 8 Weeks','An intensive DSA, LLD, HLD, mock and behavioral interview sprint.','Prepare for senior interviews','Advanced','published',true),
('10000000-0000-4000-8000-000000000107','custom-imported-plan','study','Custom / Imported Plan','Build a roadmap manually or review an imported plan.','Use your own curriculum','Custom','published',false)
on conflict (slug) do nothing;

insert into public.template_versions (id,template_id,version,duration_weeks,days_per_week_min,days_per_week_max,expected_hours_per_week,expected_session_minutes,content,published_at,reviewed_at)
select ('20000000-0000-4000-8000-' || lpad(n::text,12,'0'))::uuid, ('10000000-0000-4000-8000-' || lpad(n::text,12,'0'))::uuid, '1.0', null,
case when n between 1 and 7 then n else null end, case when n between 1 and 7 then n else null end,
case when n between 1 and 7 then n * 1.1 else null end, 60,
jsonb_build_object('content_status',case when n between 1 and 7 then 'complete' else 'catalog' end,'phases','[]'::jsonb), now(), now()
from generate_series(1,7) n
on conflict (template_id,version) do nothing;

insert into public.template_versions (id,template_id,version,duration_weeks,days_per_week_min,days_per_week_max,expected_hours_per_week,expected_session_minutes,content,published_at,reviewed_at) values
('20000000-0000-4000-8000-000000000101','10000000-0000-4000-8000-000000000101','1.0',12,3,5,7,60,'{"content_status":"catalog","phases":[]}',now(),now()),
('20000000-0000-4000-8000-000000000102','10000000-0000-4000-8000-000000000102','1.0',40,4,6,10,75,'{"content_status":"complete","pacing":{"light":6,"standard":10,"intensive":15},"phases":[]}',now(),now()),
('20000000-0000-4000-8000-000000000103','10000000-0000-4000-8000-000000000103','1.0',12,4,6,8,75,'{"content_status":"catalog","phases":[]}',now(),now()),
('20000000-0000-4000-8000-000000000104','10000000-0000-4000-8000-000000000104','1.0',20,4,6,9,75,'{"content_status":"catalog","phases":[]}',now(),now()),
('20000000-0000-4000-8000-000000000105','10000000-0000-4000-8000-000000000105','1.0',10,3,5,7,75,'{"content_status":"catalog","phases":[]}',now(),now()),
('20000000-0000-4000-8000-000000000106','10000000-0000-4000-8000-000000000106','1.0',8,6,7,23,90,'{"content_status":"complete","allocation":{"dsa":10,"lld":6,"hld":4,"mocks":2,"behavioral":1},"phases":[]}',now(),now()),
('20000000-0000-4000-8000-000000000107','10000000-0000-4000-8000-000000000107','1.0',null,null,null,null,null,'{"content_status":"custom","phases":[]}',now(),now())
on conflict (template_id,version) do nothing;

-- Golden 4-Day Recomp: exact exercise order, sets and rep ranges.
update public.template_versions set content = $json${
  "content_status":"complete",
  "principles":{"progression":"When all prescribed sets reach the top of the rep range with target RIR, propose a small load increase for user confirmation.","disclaimer":"Science-informed Dayframe template."},
  "phases":[{"name":"4-Day Recomp","description":"Upper/lower training week","start_week":1,"end_week":12,"blocks":[{"name":"Weekly schedule","type":"cycle","week":1,"sessions":[
    {"title":"Upper A / Back emphasis","day_offset":1,"minutes":70,"items":[["Pull-Ups",3,4,6],["Lat Pulldown",3,8,10],["Chest-Supported Machine Row",3,8,10],["Incline Dumbbell Press",3,8,10],["Reverse Pec Deck",3,12,15],["EZ-Bar Biceps Curl",3,8,12],["Hammer Curl",2,10,12],["Cable Crunch",3,10,15]]},
    {"title":"Lower A / Quad emphasis","day_offset":3,"minutes":65,"items":[["Leg Press",3,8,12],["Leg Extension",3,10,15],["Seated Leg Curl",3,10,15],["Hip Thrust / Machine Hip Thrust",3,8,12],["Calf Raise",4,10,15],["Pallof Press",3,10,12]]},
    {"title":"Upper B / Push emphasis","day_offset":5,"minutes":75,"items":[["Incline Dumbbell Bench Press",3,8,10],["Dumbbell or Machine Chest Press",3,8,10],["Machine Shoulder Press",3,8,12],["Lean-In Dumbbell Lateral Raise",3,12,20],["Cable Y-Raise",2,12,15],["Neutral-Grip Cable/Machine Row",3,10,12],["Face Pull",2,12,15],["Overhead Cable Triceps Extension",3,10,15],["Triceps Pushdown",2,10,15]]},
    {"title":"Lower B + Core","day_offset":6,"minutes":65,"items":[["Seated or Lying Leg Curl",4,8,12],["Hip Thrust or Glute Bridge",3,10,12],["Leg Press",3,10,12],["Leg Extension",2,12,15],["Calf Raise",3,12,15],["Dead Bug",3,8,10],["Cable Crunch",3,12,15]]}
  ]}]}]
}$json$::jsonb where id='20000000-0000-4000-8000-000000000004';

-- Convert compact workout exercise tuples to normalized item objects expected by the copy RPC.
update public.template_versions v set content = jsonb_set(v.content,'{phases,0,blocks,0,sessions}',(
  select jsonb_agg(jsonb_set(s,'{items}',(
    select jsonb_agg(jsonb_build_object('type','exercise','title',i->>0,'metadata',jsonb_build_object('sets',(i->>1)::int,'rep_min',(i->>2)::int,'rep_max',(i->>3)::int,'target_rir',2)))
    from jsonb_array_elements(s->'items') i)))
  from jsonb_array_elements(v.content#>'{phases,0,blocks,0,sessions}') s
)) where v.id='20000000-0000-4000-8000-000000000004';

-- The other availability plans retain their catalog-prescribed structure. Each is explicitly copyable.
update public.template_versions set content = $json${
  "content_status":"complete",
  "phases":[{
    "name":"Full Body",
    "start_week":1,
    "end_week":12,
    "blocks":[{
      "name":"Weekly schedule",
      "type":"cycle",
      "week":1,
      "sessions":[{
        "title":"Full Body / Minimum Effective",
        "day_offset":0,
        "minutes":75,
        "items":[
          {"type":"exercise","title":"Leg Press or Squat Variation","metadata":{"sets":3,"rep_min":6,"rep_max":10,"target_rir":2}},
          {"type":"exercise","title":"Incline DB or Machine Press","metadata":{"sets":3,"rep_min":6,"rep_max":10,"target_rir":2}},
          {"type":"exercise","title":"Lat Pulldown or Pull-Up","metadata":{"sets":3,"rep_min":6,"rep_max":10,"target_rir":2}},
          {"type":"exercise","title":"Leg Curl","metadata":{"sets":3,"rep_min":8,"rep_max":12,"target_rir":2}},
          {"type":"exercise","title":"Chest-Supported Row","metadata":{"sets":3,"rep_min":8,"rep_max":12,"target_rir":2}},
          {"type":"exercise","title":"Lateral Raise","metadata":{"sets":2,"rep_min":12,"rep_max":20,"target_rir":2}},
          {"type":"exercise","title":"Biceps Curl","metadata":{"sets":2,"rep_min":8,"rep_max":15,"target_rir":2}},
          {"type":"exercise","title":"Triceps Extension","metadata":{"sets":2,"rep_min":8,"rep_max":15,"target_rir":2}},
          {"type":"exercise","title":"Cable Crunch or Pallof Press","metadata":{"sets":2,"rep_min":10,"rep_max":15,"target_rir":2}}
        ]
      }]
    }]
  }]
}$json$::jsonb where id='20000000-0000-4000-8000-000000000001';

create function pg_temp.dayframe_workout_content(p_schedule jsonb) returns jsonb language sql immutable as $$
  with normalized_sessions as (
    select jsonb_agg(
      jsonb_build_object(
        'title', s->>'title',
        'day_offset', (s->>'day')::int,
        'minutes', coalesce((s->>'minutes')::int, 65),
        'items', (
          select jsonb_agg(
            jsonb_build_object(
              'type', coalesce(i->>4, 'exercise'),
              'title', i->>0,
              'metadata', jsonb_build_object(
                'sets', coalesce((i->>1)::int, 1),
                'rep_min', coalesce((i->>2)::int, 1),
                'rep_max', coalesce((i->>3)::int, 1),
                'target_rir', 2
              )
            )
          )
          from jsonb_array_elements(s->'items') i
        )
      ) order by (s->>'day')::int
    ) as sessions
    from jsonb_array_elements(p_schedule) s
  )
  select jsonb_build_object(
    'content_status', 'complete',
    'principles', jsonb_build_object(
      'progression', 'Double progression with user-confirmed load changes',
      'target_rir', 'Begin around 2–3 RIR; established working sets typically use 1–2 RIR.'
    ),
    'phases', jsonb_build_array(
      jsonb_build_object(
        'name', 'Training cycle',
        'start_week', 1,
        'end_week', 12,
        'blocks', jsonb_build_array(
          jsonb_build_object(
            'name', 'Weekly schedule',
            'type', 'cycle',
            'week', 1,
            'sessions', normalized_sessions.sessions
          )
        )
      )
    )
  )
  from normalized_sessions
$$;

update public.template_versions set content=pg_temp.dayframe_workout_content($j$[
{"title":"Full Body A","day":0,"items":[["Leg Press",3,6,10],["Incline Dumbbell Press",3,8,10],["Lat Pulldown",3,8,10],["Seated Leg Curl",3,10,15],["Lateral Raise",3,12,20],["EZ-Bar Biceps Curl",2,8,12],["Cable Crunch",3,10,15]]},
{"title":"Full Body B","day":3,"items":[["Hip Thrust",3,8,12],["Machine Chest Press",3,8,12],["Chest-Supported Machine Row",3,8,12],["Leg Extension",3,10,15],["Calf Raise",3,10,15],["Overhead Cable Triceps Extension",2,10,15],["Pallof Press",3,10,12]]}
]$j$) where id='20000000-0000-4000-8000-000000000002';

update public.template_versions set content=pg_temp.dayframe_workout_content($j$[
{"title":"Full Body","day":0,"items":[["Leg Press",3,8,10],["Incline Dumbbell Press",3,8,10],["Lat Pulldown",3,8,10],["Seated Leg Curl",3,10,15],["Lateral Raise",3,12,20],["Cable Crunch",3,10,15]]},
{"title":"Upper","day":2,"items":[["Pull-Ups",3,6,10],["Machine Chest Press",3,8,10],["Chest-Supported Machine Row",3,8,12],["Machine Shoulder Press",3,8,12],["Reverse Pec Deck",2,12,15],["EZ-Bar Biceps Curl",2,8,12],["Overhead Cable Triceps Extension",2,10,15]]},
{"title":"Lower","day":4,"items":[["Leg Press / Squat Variation",3,6,10],["Leg Curl",3,8,12],["Hip Thrust",3,8,12],["Leg Extension",3,10,15],["Calf Raise",4,10,15],["Pallof Press",3,10,12]]}
]$j$) where id='20000000-0000-4000-8000-000000000003';

update public.template_versions set content=pg_temp.dayframe_workout_content($j$[
{"title":"Upper","day":0,"items":[["Incline Press",3,6,10],["Pulldown / Pull-Up",3,6,10],["Chest-Supported Row",3,8,12],["Machine Shoulder Press",3,8,12],["Lateral Raise",2,12,20],["Curl",2,8,12],["Triceps Extension",2,10,15]]},
{"title":"Lower","day":1,"items":[["Leg Press / Squat",3,6,10],["Leg Curl",3,8,12],["Hip Thrust",3,8,12],["Leg Extension",2,10,15],["Calf Raise",3,10,15],["Core",3,8,15]]},
{"title":"Push","day":3,"items":[["Incline Press",3,8,10],["Chest Press",3,8,12],["Shoulder Press",2,8,12],["Lateral Raise",3,12,20],["Overhead Triceps Extension",3,10,15],["Pushdown",2,10,15]]},
{"title":"Pull","day":4,"items":[["Pulldown / Pull-Up",3,6,10],["Chest-Supported Row",3,8,12],["Neutral-Grip Row",2,10,12],["Reverse Pec Deck",3,12,20],["EZ-Bar Biceps Curl",3,8,12],["Hammer Curl",2,10,15]]},
{"title":"Legs","day":5,"items":[["Leg Press / Squat",3,8,12],["Leg Curl",3,8,12],["Hip Thrust",3,8,12],["Leg Extension",3,10,15],["Calf Raise",4,10,15],["Core",3,8,15]]}
]$j$) where id='20000000-0000-4000-8000-000000000005';

update public.template_versions set content=pg_temp.dayframe_workout_content($j$[
{"title":"Push A / Chest emphasis","day":0,"items":[["Incline Press",3,6,10],["Machine Chest Press",3,8,12],["Shoulder Press",2,8,12],["Lateral Raise",3,12,20],["Overhead Triceps Extension",3,10,15],["Pushdown",2,10,15]]},
{"title":"Pull A / Lat emphasis","day":1,"items":[["Pull-Up / Pulldown",3,6,10],["Neutral-Grip Row",3,8,12],["Straight-Arm Pulldown",2,10,15],["Reverse Pec Deck",3,12,20],["EZ-Bar Biceps Curl",3,8,12],["Hammer Curl",2,10,15]]},
{"title":"Legs A / Quad emphasis","day":2,"items":[["Squat / Leg Press",3,6,10],["Leg Extension",3,10,15],["Seated Leg Curl",3,10,15],["Hip Thrust",2,8,12],["Calf Raise",4,10,15],["Core",3,8,15]]},
{"title":"Push B / Delt emphasis","day":3,"items":[["Shoulder Press",3,6,10],["Incline Dumbbell Press",3,8,12],["Lateral Raise",4,12,20],["Cable Y-Raise",2,12,15],["Overhead Triceps Extension",3,10,15],["Pushdown",2,10,15]]},
{"title":"Pull B / Upper-back emphasis","day":4,"items":[["Chest-Supported Row",3,6,10],["Pulldown",3,8,12],["Machine / Cable Row",3,8,12],["Face Pull",2,12,20],["Incline Curl",3,8,12],["Hammer Curl",2,10,15]]},
{"title":"Legs B / Posterior emphasis","day":5,"items":[["Hip Thrust or appropriate hinge",3,6,10],["Leg Curl",4,8,12],["Leg Press",3,10,12],["Leg Extension",2,12,15],["Calf Raise",4,10,15],["Core",3,8,15]]}
]$j$) where id='20000000-0000-4000-8000-000000000006';

update public.template_versions set content=pg_temp.dayframe_workout_content($j$[
{"title":"Upper A","day":0,"items":[["Upper A resistance training",1,45,75,"activity"]]},
{"title":"Lower A","day":1,"items":[["Lower A resistance training",1,45,75,"activity"]]},
{"title":"Zone 2 / easy swim / cardio","day":2,"items":[["Zone 2, easy swim or cardio",1,30,60,"activity"]]},
{"title":"Upper B","day":3,"items":[["Upper B resistance training",1,45,75,"activity"]]},
{"title":"Lower B","day":4,"items":[["Lower B resistance training",1,45,75,"activity"]]},
{"title":"Conditioning / longer cardio","day":5,"items":[["Conditioning or longer cardio",1,30,75,"activity"]]},
{"title":"Recovery / mobility / walking","day":6,"items":[["Recovery, mobility or walking",1,20,60,"activity"]]}
]$j$) where id='20000000-0000-4000-8000-000000000007';

-- Golden 40-week CS roadmap. Week descriptions are the source of session tasks;
-- sessions remain roll-forward friendly and may be skipped/tested out by the user.
do $$
declare phases jsonb;
begin
  with weeks(week,phase_name,title,topics,deliverable) as (values
  (1,'Phase 0 — Developer Tools','Terminal, Git and the development environment','Shell, terminal, Git, SSH, processes, environment variables, pipes, redirection and permissions','Operate a development environment comfortably from terminal and Git'),
  (2,'Phase 0 — Developer Tools','Engineering tooling','Debugging, profiling, testing, package management, CI basics and responsible AI-assisted development','Diagnose and repair a deliberately broken small application'),
  (3,'Phase 1 — Software Construction','Programming models','Recursion, iteration, functions, scope, mutability, abstraction and complexity intuition',null),
  (4,'Phase 1 — Software Construction','OOP and abstraction','Objects, interfaces, composition, inheritance tradeoffs, encapsulation and dependency inversion',null),
  (5,'Phase 1 — Software Construction','Software quality','SOLID heuristics, cohesion, coupling, refactoring, tests, error handling, dependency injection and patterns',null),
  (6,'Phase 1 — Software Construction','LLD foundation project','Choose Library, Parking Lot or Expense Splitter; capture requirements, entities, interfaces, relationships, extensibility, tests and tradeoffs','Complete a tested low-level design'),
  (7,'Phase 2 — DSA + Discrete Math','Complexity, arrays and hashing','Complexity, arrays, hashing, prefix sums and basic logic/proof intuition',null),
  (8,'Phase 2 — DSA + Discrete Math','Two pointers and sliding window','Opposite-end, same-direction, fast/slow, read/write, partition, merge; fixed and variable windows',null),
  (9,'Phase 2 — DSA + Discrete Math','Search, stacks and linked lists','Exact/boundary/rotated/binary-search-on-answer; stack, monotonic stack and linked list',null),
  (10,'Phase 2 — DSA + Discrete Math','Trees, BST and heaps','Tree traversal, binary search trees and heap foundations',null),
  (11,'Phase 2 — DSA + Discrete Math','Graphs','Representation, BFS, DFS, components, cycles, topological sort, union find and grid graphs',null),
  (12,'Phase 2 — DSA + Discrete Math','Greedy and search','Greedy, intervals, backtracking and trie',null),
  (13,'Phase 2 — DSA + Discrete Math','Dynamic programming','State, transition, base case and order; memoization, tabulation, 1D, 2D, subsequence, grid and knapsack',null),
  (14,'Phase 2 — DSA + Discrete Math','Mixed DSA assessment','Timed work, explanation, correctness, complexity, alternatives and review','Complete and review a mixed assessment'),
  (15,'Phase 3 — Computer Architecture','Data and memory','Binary, hexadecimal, integer/floating representation, C memory model, stack, heap, pointers and layout',null),
  (16,'Phase 3 — Computer Architecture','Assembly concepts','ISA, registers, stack frames, calling conventions and RISC-V basics',null),
  (17,'Phase 3 — Computer Architecture','CPU execution','Datapath, instruction cycle, ALU, pipelining, hazards and performance',null),
  (18,'Phase 3 — Computer Architecture','Memory hierarchy','Caches, locality, misses, virtual-memory introduction and parallelism',null),
  (19,'Phase 4 — Operating Systems','Processes and kernel boundary','Processes, kernel/user boundary, system calls, context switching and IPC',null),
  (20,'Phase 4 — Operating Systems','Concurrency','Threads, races, mutexes, semaphores, condition variables, deadlocks and scheduling',null),
  (21,'Phase 4 — Operating Systems','Virtual memory','Address spaces, paging, page faults, allocation and protection',null),
  (22,'Phase 4 — Operating Systems','Filesystems and I/O','Files, directories, metadata/inodes, buffering, caching, persistence and crash implications',null),
  (23,'Phase 5 — Networking','Network layers','Ethernet intuition, IP, routing, NAT and DNS',null),
  (24,'Phase 5 — Networking','Transport','TCP, UDP, reliability, sequence/ACK intuition, congestion and flow control',null),
  (25,'Phase 5 — Networking','Application networking','HTTP, HTTPS, TLS, proxies, load balancing, CDN, WebSocket and RPC concepts',null),
  (26,'Phase 5 — Networking','Networking project','Build a small TCP service, HTTP server or networking exercise','Complete a working networking project'),
  (27,'Phase 6 — Database Systems','Relational foundations','Relational model, SQL, schema design, normalization and relational algebra intuition',null),
  (28,'Phase 6 — Database Systems','Storage and indexes','Pages, buffer pools, row/column layout, compression, hash tables, B/B+ trees and indexes',null),
  (29,'Phase 6 — Database Systems','Query execution','Joins, sorting, aggregation, execution plans, planner and optimization',null),
  (30,'Phase 6 — Database Systems','Transactions','ACID, isolation, locks, MVCC, anomalies and serializability',null),
  (31,'Phase 6 — Database Systems','Durability and distribution','WAL, checkpoints, recovery, replication, partitioning and distributed database tradeoffs',null),
  (32,'Phase 7 — Backend + Distributed Systems','Backend API foundations','Contracts, REST/RPC, validation, authn/authz, idempotency, pagination, versioning and errors','Build an API'),
  (33,'Phase 7 — Backend + Distributed Systems','Performance primitives','Caching, Redis concepts, cache-aside, invalidation, rate limiting, queues, async jobs and search',null),
  (34,'Phase 7 — Backend + Distributed Systems','Service architecture','Modular monoliths, microservices, boundaries, discovery, observability, tracing, deployment and failure domains',null),
  (35,'Phase 7 — Backend + Distributed Systems','Distributed systems','RPC, partial failure, time, replication, consistency, availability, linearizability, consensus and leaders',null),
  (36,'Phase 7 — Backend + Distributed Systems','System design','Sharding, replication, CDN, queues, caches, databases, backpressure, capacity and tradeoffs','Design URL Shortener and one larger system'),
  (37,'Phase 8 — Security + Reliability','Security','Threat modeling, access control, validation, injection, crypto basics, secrets, SSRF, supply chain and API security',null),
  (38,'Phase 8 — Security + Reliability','Reliability','SLI/SLO, monitoring, alerting, overload, retries, cascading failures, incidents, postmortems and releases',null),
  (39,'Phase 9 — Capstone','Production-style capstone','API, persistence, authentication, justified caching/async work, tests, deployment, telemetry and architecture docs','Build one coherent production-style application'),
  (40,'Phase 9 — Capstone','Harden and review','Load test, profile, bottlenecks, failure tests, security/architecture review, refactor, docs and retrospective','Publish the final review and retrospective')
  ), blocks as (
    select phase_name, min(week) start_week, max(week) end_week,
      jsonb_agg(jsonb_build_object('name','Week '||week||' — '||title,'type','week','week',week,'description',topics,'sessions',jsonb_build_array(
        jsonb_build_object('title',title||' — Learn','day_offset',0,'minutes',75,'items',jsonb_build_array(jsonb_build_object('type','lesson','title','Learn: '||topics,'minutes',60))),
        jsonb_build_object('title',title||' — Practice','day_offset',2,'minutes',75,'items',jsonb_build_array(jsonb_build_object('type','practice','title','Practice and explain from memory','minutes',60))),
        jsonb_build_object('title',title||' — Review','day_offset',5,'minutes',60,'items',jsonb_build_array(jsonb_build_object('type','review','title',coalesce(deliverable,'Review notes, gaps and next actions'),'minutes',45)))
      )) order by week) blocks
    from weeks group by phase_name
  ) select jsonb_agg(jsonb_build_object('name',phase_name,'start_week',start_week,'end_week',end_week,'blocks',blocks) order by start_week) into phases from blocks;
  update public.template_versions set content = content || jsonb_build_object('phases',phases,'extended_dsa_bank',jsonb_build_object('total',241,'note','Extended practice bank; not all items are mandatory in the 40-week roadmap.')) where id='20000000-0000-4000-8000-000000000102';
end $$;

-- Golden 8-week interview sprint: DSA + LLD + HLD + mock + behavioral every week.
do $$
declare blocks jsonb;
begin
  with weeks(week,dsa,target,lld,hld,mock) as (values
  (1,'Arrays + Hashing + Prefix Sum',15,'OOP, SOLID, composition, interfaces, DI; Singleton, Factory, Strategy, Builder, Observer','DNS, HTTP/HTTPS, Load Balancer, Reverse Proxy, CDN','Coding'),
  (2,'Two Pointers + Sliding Window + Linked List',15,'Parking Lot, Library, ATM','SQL, NoSQL, Redis, object storage and indexes','Design'),
  (3,'Binary Search + Stack + Monotonic Stack',15,'Splitwise, Elevator, Chess','Replication, partitioning, sharding and consistent hashing','Coding'),
  (4,'Trees + BST + Heap',18,'BookMyShow, Inventory, Notification System','Kafka, queues, pub/sub and event systems','Design'),
  (5,'Graphs + Topological Sort + Union Find',18,'Logging Framework and Rate Limiter','Retries, idempotency, circuit breakers, rate limits and failure handling','Coding'),
  (6,'Dynamic Programming 1D + 2D',18,'Timed LLD; reimplement and review an older design','URL Shortener and Twitter Feed','Design'),
  (7,'Greedy + Intervals + Backtracking + Trie',17,'Timed LLD; reimplement and review an older design','WhatsApp, Uber and Instagram','Coding'),
  (8,'Mixed timed interview mode',12,'Timed LLD; reimplement and review an older design','YouTube, Drive-like storage and timed HLD','Full interview simulation')
  ) select jsonb_agg(jsonb_build_object('name','Week '||week,'type','week','week',week,'description',dsa,'sessions',jsonb_build_array(
    jsonb_build_object('title','DSA — '||dsa,'day_offset',0,'minutes',120,'items',jsonb_build_array(jsonb_build_object('type','problem','title','Target approximately '||target||' problems','minutes',120))),
    jsonb_build_object('title','LLD — '||lld,'day_offset',1,'minutes',90,'items',jsonb_build_array(jsonb_build_object('type','design','title',lld,'minutes',90))),
    jsonb_build_object('title','DSA practice and review','day_offset',2,'minutes',120,'items',jsonb_build_array(jsonb_build_object('type','problem','title','Continue the weekly DSA target','minutes',120))),
    jsonb_build_object('title','HLD — '||hld,'day_offset',3,'minutes',90,'items',jsonb_build_array(jsonb_build_object('type','design','title',hld,'minutes',90))),
    jsonb_build_object('title','Mock — '||mock,'day_offset',5,'minutes',120,'items',jsonb_build_array(jsonb_build_object('type','mock','title',mock||' mock; capture outcome, hints, communication, gaps, confidence and next action','minutes',120))),
    jsonb_build_object('title','Behavioral STAR stories','day_offset',6,'minutes',60,'items',jsonb_build_array(jsonb_build_object('type','explain','title','Leadership, conflict, failure, ownership, ambiguity or cross-team story','minutes',60)))
  )) order by week) into blocks from weeks;
  update public.template_versions set content = content || jsonb_build_object('phases',jsonb_build_array(jsonb_build_object('name','8-Week Interview Sprint','start_week',1,'end_week',8,'blocks',blocks)),'core_problem_target',128) where id='20000000-0000-4000-8000-000000000106';
end $$;

insert into public.template_sources(id,template_version_id,title,author_or_org,url,source_type,description,position) values
('30000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000102','The Missing Semester of Your CS Education','MIT','https://missing.csail.mit.edu/','course','Developer tooling reference.',1),
('30000000-0000-4000-8000-000000000002','20000000-0000-4000-8000-000000000102','CS 61C','UC Berkeley','https://cs61c.org/','course','Computer architecture reference.',2),
('30000000-0000-4000-8000-000000000003','20000000-0000-4000-8000-000000000102','CS 144: Introduction to Computer Networking','Stanford University','https://cs144.github.io/','course','Networking reference.',3),
('30000000-0000-4000-8000-000000000004','20000000-0000-4000-8000-000000000102','Database Systems','Carnegie Mellon University','https://15445.courses.cs.cmu.edu/','course','Database systems reference.',4),
('30000000-0000-4000-8000-000000000005','20000000-0000-4000-8000-000000000102','OWASP Top Ten','OWASP Foundation','https://owasp.org/www-project-top-ten/','documentation','Application security reference.',5),
('30000000-0000-4000-8000-000000000006','20000000-0000-4000-8000-000000000102','Site Reliability Engineering','Google','https://sre.google/sre-book/table-of-contents/','book','Public reliability engineering reference.',6),
('30000000-0000-4000-8000-000000000007','20000000-0000-4000-8000-000000000106','LeetCode Problems','LeetCode','https://leetcode.com/problemset/','problem_set','Problem links and manual Dayframe attempts only; no scraping or automatic sync.',1),
('30000000-0000-4000-8000-000000000008','20000000-0000-4000-8000-000000000106','System Design Primer','donnemartin','https://github.com/donnemartin/system-design-primer','repository','Public system-design reference.',2)
on conflict (id) do nothing;

insert into public.study_topics(id,name,slug,area,is_system) values
('40000000-0000-4000-8000-000000000001','Arrays','arrays','dsa',true),
('40000000-0000-4000-8000-000000000002','Hash Maps','hash-maps','dsa',true),
('40000000-0000-4000-8000-000000000003','Two Pointers','two-pointers','dsa',true),
('40000000-0000-4000-8000-000000000004','Sliding Window','sliding-window','dsa',true),
('40000000-0000-4000-8000-000000000005','Binary Search','binary-search','dsa',true),
('40000000-0000-4000-8000-000000000006','Trees','trees','dsa',true),
('40000000-0000-4000-8000-000000000007','Graphs','graphs','dsa',true),
('40000000-0000-4000-8000-000000000008','Dynamic Programming','dynamic-programming','dsa',true),
('40000000-0000-4000-8000-000000000009','Operating Systems','operating-systems','operating_systems',true),
('40000000-0000-4000-8000-000000000010','Networking','networking','networking',true),
('40000000-0000-4000-8000-000000000011','Databases','databases','databases',true),
('40000000-0000-4000-8000-000000000012','System Design','system-design','system_design',true),
('40000000-0000-4000-8000-000000000013','Security','security','security',true),
('40000000-0000-4000-8000-000000000014','Reliability','reliability','reliability',true)
on conflict (id) do nothing;

commit;
