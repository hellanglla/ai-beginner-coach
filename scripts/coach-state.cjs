'use strict';
const fs = require('node:fs');
const path = require('node:path');
const STEPS = ['installed', 'running', 'connected', 'result'];
function required(value, name) { if (typeof value !== 'string' || !value.trim()) throw new Error('Missing ' + name); return value.trim(); }
function fresh(a) { return { schema: 1, goal: required(a.goal,'goal'), tool: required(a.tool,'tool'), client: required(a.client,'client'), exercise: '', mode: 'coach', status: 'active', evidence: {}, history: [] }; }
function valid(s) {
  if (!s || s.schema !== 1 || !['active','paused','completed'].includes(s.status) || !['coach','assist'].includes(s.mode) || !s.evidence || typeof s.evidence!=='object' || Array.isArray(s.evidence) || !Array.isArray(s.history) || typeof s.exercise!=='string') throw new Error('Invalid state');
  for (const k of ['goal','tool','client']) required(s[k],k);
  for (const [step,e] of Object.entries(s.evidence)) {
    if(!STEPS.includes(step)||!e||typeof e!=='object'||Array.isArray(e)||!['observed','user_report'].includes(e.source)) throw new Error('Invalid evidence');
    for(const k of ['via','client','detail','recordedAt']) required(e[k],k);
  }
  return s;
}
function observed(s, step) { const e=s.evidence[step]; return !!e && e.via===s.tool && e.client===s.client && e.source==='observed' && typeof e.detail==='string' && !!e.detail.trim(); }
function readiness(s, client, completion=false) {
  valid(s);
  if (s.status!=='active') return {ready:false, reason:s.status};
  if (client!==s.client) return {ready:false, reason:'client_changed'};
  const missing=STEPS.slice(0,completion?4:3).filter(step=>!observed(s,step));
  return {ready:missing.length===0, missing, goal:s.goal, tool:s.tool, exercise:s.exercise};
}
function transition(input, command, a={}) {
  const s=structuredClone(valid(input));
  if (command==='inspect') return s;
  if (command==='check') return readiness(s,required(a.client,'client'));
  if (command==='retarget') {
    const quote=required(a['user-request'],'user-request');
    const next=fresh(a);
    next.history=[...s.history,{event:'retarget',previous:{goal:s.goal,tool:s.tool,client:s.client},userRequest:quote}];
    return next;
  }
  if (command==='pause') { s.status='paused'; return s; }
  if (command==='resume') {
    if(s.status!=='paused') throw new Error('Only paused tasks can resume');
    s.status='active'; for(const step of STEPS.slice(1)) delete s.evidence[step]; return s;
  }
  if (s.status!=='active') throw new Error('Task is not active');
  if (command==='exercise') {
    const text=required(a.text,'text');
    if(text!==s.exercise) delete s.evidence.result;
    s.exercise=text;
  }
  else if (command==='mode') { if(!['coach','assist'].includes(a.value)) throw new Error('Invalid mode'); s.mode=a.value; }
  else if (command==='invalidate') {
    if(!STEPS.includes(a.step)) throw new Error('Invalid step');
    for(const step of STEPS.slice(STEPS.indexOf(a.step))) delete s.evidence[step];
  } else if (command==='evidence') {
    if(!STEPS.includes(a.step)) throw new Error('Invalid step');
    if(a.via!==s.tool || a.client!==s.client) throw new Error('Evidence tool/client mismatch');
    if(!['observed','user_report'].includes(a.source)) throw new Error('Invalid evidence source');
    if(STEPS.slice(0,STEPS.indexOf(a.step)).some(step=>!observed(s,step))) throw new Error('Verify prerequisites first');
    const detail=required(a.detail,'detail');
    for(const step of STEPS.slice(STEPS.indexOf(a.step))) delete s.evidence[step];
    s.evidence[a.step]={via:a.via,client:a.client,source:a.source,detail,recordedAt:new Date().toISOString()};
  } else if(command==='complete') {
    const r=readiness(s,required(a.client,'client'),true);
    if(!r.ready) throw new Error('Completion blocked: '+JSON.stringify(r));
    s.status='completed';
  } else throw new Error('Unknown command');
  return s;
}
function parse(args) {
  const command=args.shift(), options={};
  while(args.length) { const key=args.shift(); if(!key.startsWith('--')||!args.length) throw new Error('Expected --key value'); options[key.slice(2)]=args.shift(); }
  return {command,options};
}
function run(argv) {
  const {command,options:a}=parse([...argv]);
  const file=path.resolve(required(a.state,'state'));
  if(command==='start') {
    const s=fresh(a);
    fs.mkdirSync(path.dirname(file),{recursive:true});
    fs.writeFileSync(file,JSON.stringify(s,null,2)+'\n',{flag:'wx'});
    return {output:s,code:0};
  }
  const readonly=command==='inspect'||command==='check';
  let lock;
  try {
    if(!readonly) lock=fs.openSync(file+'.lock','wx');
    const current=valid(JSON.parse(fs.readFileSync(file,'utf8')));
    const next=transition(current,command,a);
    if(!readonly) {
      const temp=file+'.'+process.pid+'.tmp';
      try { fs.writeFileSync(temp,JSON.stringify(next,null,2)+'\n',{flag:'wx'}); fs.renameSync(temp,file); }
      finally { if(fs.existsSync(temp)) fs.unlinkSync(temp); }
    }
    return {output:next,code:command==='check'&&!next.ready?2:0};
  } finally { if(lock!==undefined) { fs.closeSync(lock); fs.unlinkSync(file+'.lock'); } }
}
if(require.main===module) {
  try { const r=run(process.argv.slice(2)); console.log(JSON.stringify(r.output)); process.exitCode=r.code; }
  catch(e) { console.error(JSON.stringify({error:e.message})); process.exitCode=1; }
}
module.exports={fresh,valid,transition,readiness,run};

