'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, ArrowUp, Bot, MapPin, Sparkles, X } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { parkingApi } from '@/lib/parking/api';
import type { AssistantReply } from '@/lib/parking/assistant';
import { useParking } from './provider';

type Message = AssistantReply & { role: 'user' | 'assistant' };
type ToolRegistry = { registerTool: (tool: { name:string; title:string; description:string; inputSchema:object; annotations:{ readOnlyHint:boolean }; execute:(input:unknown)=>Promise<unknown> }, options:{signal:AbortSignal}) => void|Promise<void> };

export function ParkingAssistant() {
  const { snapshot, session } = useParking();
  const [open,setOpen] = useState(false);
  const [input,setInput] = useState('');
  const [busy,setBusy] = useState(false);
  const [messages,setMessages] = useState<Message[]>([{ role:'assistant',text:'Hey! Where are you headed? Tell me a Skyline building and I’ll find an open spot nearby.' }]);
  const end = useRef<HTMLDivElement>(null);
  const busyRef = useRef(false);
  useEffect(() => { end.current?.scrollIntoView({block:'nearest',behavior:'smooth'}); },[messages,busy]);
  const ask = useCallback(async (question:string) => {
    if (!question.trim() || question.length>500) throw new Error('Ask a question in 500 characters or fewer.');
    if (busyRef.current) throw new Error('Please wait for the current answer.');
    busyRef.current=true;setBusy(true);setInput('');setOpen(true);
    setMessages(old=>[...old,{role:'user',text:question}]);
    try {
      const reply=await parkingApi.ask({question,snapshotAt:snapshot.updatedAt,session:session?{lotId:session.lotId,spaceId:session.spaceId,expiresAt:session.expiresAt}:null});
      setMessages(old=>[...old,{role:'assistant',...reply}]);
      return reply;
    } catch(error) {
      setMessages(old=>[...old,{role:'assistant',text:error instanceof Error?error.message:'I couldn’t connect. Please try again.'}]);
      throw error;
    } finally {setBusy(false);busyRef.current=false;}
  },[snapshot.updatedAt,session]);
  const askRef=useRef(ask);askRef.current=ask;
  useEffect(()=>{
    const registry=(document as Document & {modelContext?:ToolRegistry}).modelContext;
    if(!registry?.registerTool)return;
    const lifecycle=new AbortController();
    try {Promise.resolve(registry.registerTool({name:'ask_parkwatch',title:'Ask ParkWatch',description:'Ask about simulated Skyline parking near a building, lot availability, or the local timer. Shows the question and answer in the assistant. Does not reserve a spot.',inputSchema:{type:'object',properties:{question:{type:'string',minLength:1,maxLength:500}},required:['question'],additionalProperties:false},annotations:{readOnlyHint:false},execute:async input=>{if(!input||typeof input!=='object'||typeof(input as {question?:unknown}).question!=='string')throw new Error('question must be a string');return askRef.current((input as {question:string}).question);}},{signal:lifecycle.signal})).catch(()=>{});}catch{}
    return()=>lifecycle.abort();
  },[]);
  const send=(question:string)=>{void ask(question).catch(()=>{});};
  return <div className="assistant-anchor"><Popover open={open} onOpenChange={setOpen}><PopoverTrigger asChild><button className="assistant-launch" aria-label="Ask ParkWatch AI parking assistant"><span><Sparkles size={20}/></span><div>Ask ParkWatch<small>Your campus co-pilot</small></div><span className="assistant-online"/></button></PopoverTrigger><PopoverContent side="top" align="start" sideOffset={14} className="assistant-popover" aria-label="ParkWatch parking assistant"><div className="assistant-header"><span className="assistant-bot"><Bot size={23}/></span><div><h2>ParkWatch AI</h2><span>Campus parking assistant</span></div><button onClick={()=>setOpen(false)} aria-label="Close parking assistant"><X size={19}/></button></div><div className="assistant-mode"><span className="live-dot"/>Local demo assistant · Simulated availability</div><div className="assistant-messages" role="log" aria-live="polite" aria-label="Conversation">{messages.map((message,i)=><div key={i} className={`chat-message ${message.role}`}><p>{message.text}</p>{message.recommendation&&<div className="chat-recommendation"><MapPin size={20}/><div><strong>Lot {message.recommendation.lotId} · Space {message.recommendation.spaceId}</strong><span>Building {message.recommendation.building} · ~{message.recommendation.minutes} min walk</span></div></div>}{message.link&&<Link href={message.link} className="chat-action" onClick={()=>setOpen(false)}>{message.label}<ArrowRight size={15}/></Link>}</div>)}{busy&&<div className="chat-thinking" role="status">Checking available spaces…</div>}<div ref={end}/></div>{messages.length===1&&<div className="assistant-suggestions">{['Closest spot to Building 8?','Parking near the library?','How much time do I have left?'].map(question=><button key={question} onClick={()=>send(question)}>{question}<ArrowUp size={13}/></button>)}</div>}<form className="assistant-input" onSubmit={event=>{event.preventDefault();send(input);}}><input aria-label="Ask a parking question" value={input} onChange={event=>setInput(event.target.value)} maxLength={500} placeholder="Where are you headed?" disabled={busy}/><button disabled={busy||!input.trim()} aria-label="Send question"><ArrowUp size={18}/></button></form><div className="assistant-footnote">Map-based estimates · Rule-based demo · No external AI API</div></PopoverContent></Popover></div>;
}
