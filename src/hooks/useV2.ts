import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import * as repo from '../repositories/v2Repository'
import type { Domain, PlanTemplate } from '../types/v2'

export function useIdentity() {
  const auth = useAuth()
  return { user: auth.user, isDemo: auth.isDemo }
}

export function useDemoInvalidation() {
  const client=useQueryClient()
  useEffect(()=>{const refresh=()=>void client.invalidateQueries({queryKey:['v2']});window.addEventListener('dayframe-v2-demo-change',refresh);return()=>window.removeEventListener('dayframe-v2-demo-change',refresh)},[client])
}

export function useTemplates(domain: Domain) {
  const identity=useIdentity(); useDemoInvalidation()
  return useQuery({queryKey:['v2','templates',domain,identity.isDemo],queryFn:()=>repo.listTemplates(identity,domain)})
}
export function usePlans(domain?:Domain){const identity=useIdentity();useDemoInvalidation();return useQuery({queryKey:['v2','plans',domain,identity.isDemo],queryFn:()=>repo.listPlans(identity,domain)})}
export function usePlannedSessions(from:string,to:string,domain?:Domain){const identity=useIdentity();useDemoInvalidation();return useQuery({queryKey:['v2','planned',domain,from,to,identity.isDemo],queryFn:()=>repo.listPlannedSessions(identity,from,to,domain)})}
export function useStudySessions(from:string,to:string){const identity=useIdentity();useDemoInvalidation();return useQuery({queryKey:['v2','study-sessions',from,to,identity.isDemo],queryFn:()=>repo.listStudySessions(identity,from,to)})}
export function useStudyNotes(){const identity=useIdentity();useDemoInvalidation();return useQuery({queryKey:['v2','notes',identity.isDemo],queryFn:()=>repo.listStudyNotes(identity)})}
export function useStudyAttempts(from:string,to:string){const identity=useIdentity();useDemoInvalidation();return useQuery({queryKey:['v2','attempts',from,to,identity.isDemo],queryFn:()=>repo.listStudyAttempts(identity,from,to)})}
export function useReviews(from:string,to:string){const identity=useIdentity();useDemoInvalidation();return useQuery({queryKey:['v2','reviews',from,to,identity.isDemo],queryFn:()=>repo.listReviews(identity,from,to)})}
export function useResources(){const identity=useIdentity();return useQuery({queryKey:['v2','resources',identity.isDemo],queryFn:()=>repo.listResources(identity)})}
export function useLearningResources(){const identity=useIdentity();return useQuery({queryKey:['v2','learning-resources',identity.isDemo],queryFn:()=>repo.listLearningResources(identity)})}
export function useProblemAttempts(itemId?:string){const identity=useIdentity();useDemoInvalidation();return useQuery({queryKey:['v2','problem-attempts',itemId,identity.isDemo],queryFn:()=>repo.listProblemAttempts(identity,itemId!),enabled:Boolean(itemId)})}
export function useItemReviews(taskId?:string|null){const identity=useIdentity();useDemoInvalidation();return useQuery({queryKey:['v2','item-reviews',taskId,identity.isDemo],queryFn:()=>repo.listItemReviews(identity,taskId!),enabled:Boolean(taskId)})}
export function useNutritionSummary(date:string){const identity=useIdentity();useDemoInvalidation();return useQuery({queryKey:['v2','nutrition-summary',date,identity.isDemo],queryFn:()=>repo.getNutritionSummary(identity,date)})}
export function useNutritionPreferences(){const identity=useIdentity();return useQuery({queryKey:['v2','nutrition-preferences',identity.isDemo],queryFn:()=>repo.getNutritionPreferences(identity)})}
export function useRecipes(){const identity=useIdentity();return useQuery({queryKey:['v2','recipes',identity.isDemo],queryFn:()=>repo.listRecipes(identity)})}
export function useProgressData(from:string,to:string){const identity=useIdentity();useDemoInvalidation();return useQuery({queryKey:['v2','progress',from,to,identity.isDemo],queryFn:()=>repo.getProgressData(identity,from,to)})}
export function useLifeExtended(){const identity=useIdentity();useDemoInvalidation();return useQuery({queryKey:['v2','life',identity.isDemo],queryFn:()=>repo.listLifeExtended(identity)})}

export function useCopyTemplate(){const identity=useIdentity();const client=useQueryClient();return useMutation({mutationFn:({template,startDate}:{template:PlanTemplate;startDate:string})=>repo.copyTemplate(identity,template,startDate),onSuccess:()=>void client.invalidateQueries({queryKey:['v2']})})}
export function useV2Mutation<TInput>(mutationFn:(identity:repo.RepoIdentity,input:TInput)=>Promise<unknown>){const identity=useIdentity();const client=useQueryClient();return useMutation({mutationFn:(input:TInput)=>mutationFn(identity,input),onSuccess:()=>void client.invalidateQueries({queryKey:['v2']})})}
