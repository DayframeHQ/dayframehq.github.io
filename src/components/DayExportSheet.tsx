import { useState } from 'react'
import { Bell, Check, Clipboard, ExternalLink, NotebookPen, Share2 } from 'lucide-react'
import { Sheet } from './Sheet'
import type { DayExport, DayExportCategory } from '../lib/dayExport'

const shortcutName='Dayframe to Reminders'

export function DayExportSheet({open,onClose,value}:{open:boolean;onClose:()=>void;value:DayExport}){
  const[showSetup,setShowSetup]=useState(false);const[message,setMessage]=useState('');const[busy,setBusy]=useState(false);const[shortcutReady,setShortcutReady]=useState(()=>localStorage.getItem('dayframe_reminders_shortcut_ready')==='true')
  const exportedKey=`dayframe_reminders_export_${value.date}`;const exportedBefore=localStorage.getItem(exportedKey)==='true';const empty=!value.items.length
  const share=async(target:'notes'|'reminders')=>{setBusy(true);setMessage('');try{if(navigator.share){await navigator.share({title:value.title,text:value.noteText,url:window.location.href});setMessage(target==='notes'?'Shared. Choose Notes and its destination folder in Apple’s sheet.':'Shared as one day summary. Choose Reminders in Apple’s sheet.')}else{await copyText(value.noteText);setMessage('Sharing is unavailable here, so the checklist was copied.')}}catch(error){if(error instanceof DOMException&&error.name==='AbortError')return;setMessage('The share sheet could not open. The checklist is still available to copy.')}finally{setBusy(false)}}
  const runShortcut=()=>{if(!shortcutReady){setShowSetup(true);return}setMessage('');localStorage.setItem(exportedKey,'true');window.location.href=`shortcuts://run-shortcut?name=${encodeURIComponent(shortcutName)}&input=text&text=${encodeURIComponent(value.reminderPayload)}`;setMessage('Sent to the Dayframe Reminders shortcut.')}
  const copy=async()=>{try{await copyText(value.noteText);setMessage('Today’s checklist copied.')}catch{setMessage('Your browser blocked clipboard access.')}}
  return <Sheet open={open} onClose={onClose} title="Export this day" description="Take the selected day into the apps you already use.">
    <article className="day-export-preview" aria-label="Day export preview"><div className="row-between"><div><p className="eyebrow">Selected day</p><h3>{value.title.replace('Dayframe — ','')}</h3></div><span className="badge">{value.items.length} item{value.items.length===1?'':'s'}</span></div>{empty?<p className="muted small">Nothing is scheduled yet. Add work to this date before exporting.</p>:<div className="day-export-sections">{(['Train','Study','Travel']as DayExportCategory[]).map((category)=>{const items=value.items.filter((item)=>item.category===category);return items.length?<section key={category}><strong>{category}</strong>{items.map((item)=><div className="day-export-item" key={item.id}><span><Check size={13}/></span><div><b>{item.title}</b>{item.detail&&<small>{item.detail}</small>}</div></div>)}</section>:null})}</div>}</article>
    <div className="day-export-actions section">
      <button className="day-export-action" disabled={empty||busy} onClick={()=>void runShortcut()}><span className="icon-bubble"><Bell size={19}/></span><span><strong>Add to Apple Reminders</strong><small>{shortcutReady?'Separate dated reminders through your Shortcut':'One-time Shortcut setup required'}</small></span><ExternalLink size={16}/></button>
      <button className="day-export-action" disabled={empty||busy} onClick={()=>void share('notes')}><span className="icon-bubble"><NotebookPen size={19}/></span><span><strong>Save to Apple Notes</strong><small>Choose Notes and a folder in the Apple share sheet</small></span><Share2 size={16}/></button>
      <button className="day-export-action" disabled={empty||busy} onClick={()=>void copy()}><span className="icon-bubble"><Clipboard size={19}/></span><span><strong>Copy checklist</strong><small>Works on every device and notes app</small></span><Clipboard size={16}/></button>
    </div>
    {exportedBefore&&!showSetup&&<p className="export-notice small">This date was already handed to the Shortcut on this device. Export again only if you intend to create another copy.</p>}
    {showSetup&&<ShortcutSetup onReady={()=>{localStorage.setItem('dayframe_reminders_shortcut_ready','true');setShortcutReady(true);setShowSetup(false);setMessage('Shortcut marked ready. Tap Add to Apple Reminders again.')}} onShare={()=>void share('reminders')}/>}
    {message&&<p className="auth-message small" role="status">{message}</p>}
  </Sheet>
}

function ShortcutSetup({onReady,onShare}:{onReady:()=>void;onShare:()=>void}){
  const openShortcuts=()=>{window.location.href='shortcuts://create-shortcut'}
  return <article className="card card-pad shortcut-setup section"><p className="eyebrow">Set up once</p><h3>Create “{shortcutName}”</h3><p className="muted small">This is what turns one Dayframe export into separate, dated Apple reminders. Apple requires the automation and permission to live on your device.</p><ol className="shortcut-steps"><li>Open Shortcuts and create a shortcut named exactly <strong>{shortcutName}</strong>.</li><li>Add <strong>Get Dictionary from Input</strong>, then get the <strong>items</strong> value.</li><li>Add <strong>Repeat with Each</strong>. Inside it, read <strong>title</strong>, <strong>notes</strong> and <strong>dueAt</strong>.</li><li>Add <strong>New Reminder</strong> using those values. Choose your Dayframe list or use Ask Each Time.</li></ol><div className="row progressive-actions"><button className="btn btn-primary" onClick={openShortcuts}><ExternalLink size={16}/>Open Shortcuts</button><button className="btn btn-secondary" onClick={onReady}>I’ve created it</button></div><button className="link-button small" onClick={onShare}>Skip setup and share one day-summary reminder</button></article>
}

async function copyText(text:string){
  if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(text);return}
  const area=document.createElement('textarea');area.value=text;area.style.position='fixed';area.style.opacity='0';document.body.appendChild(area);area.select();const copied=document.execCommand('copy');area.remove();if(!copied)throw new Error('Clipboard unavailable')
}
