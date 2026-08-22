import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const allowedKinds=['nutrition_screenshot','study_plan_document','workout_plan_document']
const allowedMimes=['image/png','image/jpeg','image/webp','application/pdf','application/vnd.openxmlformats-officedocument.wordprocessingml.document','text/plain','text/markdown']

Deno.serve(async(request)=>{
  if(request.method!=='POST')return json({error:'Method not allowed'},405)
  const token=request.headers.get('Authorization')
  if(!token)return json({error:'Authentication required'},401)
  const supabase=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_ANON_KEY')!,{global:{headers:{Authorization:token}}})
  const {data:{user}}=await supabase.auth.getUser()
  if(!user)return json({error:'Authentication required'},401)
  let body:{kind?:string;mime_type?:string;size?:number;import_job_id?:string}
  try{body=await request.json()}catch{return json({error:'Invalid request'},400)}
  if(!body.kind||!allowedKinds.includes(body.kind)||!body.mime_type||!allowedMimes.includes(body.mime_type)||typeof body.size!=='number'||!Number.isFinite(body.size)||body.size<0||body.size>10_000_000)return json({error:'Unsupported import type or size'},400)
  if(body.import_job_id){const{data}=await supabase.from('import_jobs').select('id').eq('id',body.import_job_id).eq('user_id',user.id).maybeSingle();if(!data)return json({error:'Import job not found'},404)}
  const provider=Deno.env.get('DAYFRAME_IMPORT_PROVIDER')
  if(!provider)return json({error:'Automatic extraction is not configured. Review and enter values manually.',code:'provider_unavailable'},501)
  return json({error:'The configured provider adapter is not available in this build.',code:'adapter_unavailable'},501)
})

function json(body:Record<string,unknown>,status:number){return new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}})}
