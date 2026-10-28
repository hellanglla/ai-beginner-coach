'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {fresh,transition:t,readiness,run}=require('../scripts/coach-state.cjs');
const {context}=require('../scripts/claude-session-hook.cjs');
const {install}=require('../scripts/install-local.cjs');
const init=()=>fresh({goal:'学会并实际使用 Ego Lite',tool:'Ego Lite',client:'test-client'});
test('Skill 入口字段和客户端显示信息符合当前包的结构要求',()=>{
 const root=path.join(__dirname,'..');
 const skill=fs.readFileSync(path.join(root,'SKILL.md'),'utf8').replaceAll('\r\n','\n');
 const front=skill.match(/^---\n([\s\S]*?)\n---/);assert.ok(front);
 const lines=front[1].split('\n');assert.equal(lines.length,2);
 assert.equal(lines[0],'name: ai-beginner-coach');
 assert.match(lines[1],/^description: .+/);assert.ok(lines[1].length<1037);assert.doesNotMatch(lines[1],/[<>]/);
 const yaml=fs.readFileSync(path.join(root,'agents','openai.yaml'),'utf8');
 const short=JSON.parse(yaml.match(/short_description: (".*")/)[1]);assert.ok(short.length>=25&&short.length<=64);
 const prompt=JSON.parse(yaml.match(/default_prompt: (".*")/)[1]);assert.match(prompt,/\$ai-beginner-coach/);
 for(const match of skill.matchAll(/\]\((references\/[^)]+)\)/g))assert.ok(fs.existsSync(path.join(root,match[1])),match[1]);
});

test('练习变化使旧结果失效，畸形状态不能写入假成功',()=>{
 let s=init();for(const step of ['installed','running','connected','result'])s=evidence(s,step);
 s=t(s,'exercise',{text:'换另一篇文章'});
 assert.equal(readiness(s,'test-client').ready,true);
 assert.throws(()=>t(s,'complete',{client:'test-client'}),/blocked/);
 assert.equal(s.evidence.result,undefined);
 assert.throws(()=>t({...init(),evidence:[]},'inspect'),/Invalid state/);
 assert.throws(()=>t({...init(),exercise:42},'inspect'),/Invalid state/);
});
test('损坏设置导致安装失败时不遗留 Skill，修好后可以重试',()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'coach-install-invalid-'));
 try{
 fs.mkdirSync(path.join(root,'.claude'),{recursive:true});
 const settings=path.join(root,'.claude','settings.local.json');
 fs.writeFileSync(settings,'bad json');
 assert.throws(()=>install(root,'claude'));
 assert.equal(fs.existsSync(path.join(root,'.claude','skills','ai-beginner-coach')),false);
 assert.equal(fs.readFileSync(settings,'utf8'),'bad json');
 fs.writeFileSync(settings,'{}');
 assert.equal(install(root,'claude').client,'claude');
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});
function evidence(s,step,extra={}) {return t(s,'evidence',{step,via:'Ego Lite',client:'test-client',source:'observed',detail:'模拟工具回执：'+step,...extra});}
test('完整回放：用途插问、练习选择、代办不丢失指定工具，未连接不可操作',()=>{
 let s=init();
 s=t(s,'inspect'); // 用途插问
 s=t(s,'exercise',{text:'打开免费 MBTI 测试网站'});
 s=t(s,'mode',{value:'assist'});
 assert.equal(s.tool,'Ego Lite');assert.equal(s.goal,init().goal);
 assert.deepEqual(readiness(s,'test-client').missing,['installed','running','connected']);
 assert.throws(()=>t(s,'complete',{client:'test-client'}),/blocked/);
 assert.throws(()=>evidence(s,'result',{via:'普通浏览器'}),/mismatch/);
 assert.throws(()=>evidence(s,'result'),/prerequisites/);
});
test('逐步证据、用户自述、重启和环境变化',()=>{
 let s=evidence(init(),'installed',{source:'user_report'});
 assert.equal(readiness(s,'test-client').ready,false);
 assert.throws(()=>evidence(s,'running'),/prerequisites/);
 s=evidence(init(),'installed');s=evidence(s,'running');s=evidence(s,'connected');
 assert.equal(readiness(s,'test-client').ready,true);
 assert.equal(readiness(s,'another-client').reason,'client_changed');
 assert.throws(()=>t(s,'complete',{client:'test-client'}),/blocked/);
 s=evidence(s,'result');assert.equal(t(s,'complete',{client:'test-client'}).status,'completed');
 s=t(s,'invalidate',{step:'running'});assert.deepEqual(readiness(s,'test-client').missing,['running','connected']);
});
test('暂停、续接、显式变更会清理过时证据',()=>{
 let s=evidence(init(),'installed');s=evidence(s,'running');s=evidence(s,'connected');
 s=t(s,'pause');assert.equal(readiness(s,'test-client').reason,'paused');
 assert.throws(()=>evidence(s,'result'),/not active/);
 s=t(s,'resume');assert.deepEqual(readiness(s,'test-client').missing,['running','connected']);
 assert.throws(()=>t(s,'retarget',{goal:'普通浏览器打开',tool:'default',client:'test-client'}),/user-request/);
 s=t(s,'retarget',{goal:'普通浏览器打开',tool:'default',client:'test-client','user-request':'不用 Ego Lite，普通浏览器也行'});
 assert.equal(s.tool,'default');assert.deepEqual(s.evidence,{});assert.equal(s.history.length,1);
});
test('CLI 持久化、重复启动、无效更新和并发锁',()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'coach-state-test-'));const file=path.join(root,'s.json');
 try{
 const call=(cmd,...args)=>run([cmd,'--state',file,...args]);
 call('start','--goal','使用浏览器','--tool','Ego Lite','--client','test-client');
 const before=fs.readFileSync(file,'utf8');
 assert.throws(()=>call('start','--goal','覆盖','--tool','x','--client','y'));
 assert.throws(()=>call('complete','--client','test-client'));
 assert.equal(fs.readFileSync(file,'utf8'),before);
 assert.equal(call('check','--client','test-client').code,2);
 fs.writeFileSync(file+'.lock','');assert.throws(()=>call('mode','--value','assist'));
 fs.unlinkSync(file+'.lock');call('mode','--value','assist');
 assert.equal(call('inspect').output.mode,'assist');
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});
test('每轮注入状态，不依赖“帮我打开”命中学习关键词；损坏状态不猜测',()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'coach-hook-test-'));
 const old=process.env.CLAUDE_PROJECT_DIR;process.env.CLAUDE_PROJECT_DIR=root;
 try{
 const input={cwd:root,session_id:'session-a',prompt:'帮我打开吧'};
 const bootstrap=context(input).hookSpecificOutput.additionalContext;
 const file=bootstrap.split('状态路径为：')[1].split('。')[0];
 fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,JSON.stringify(init()));
 assert.match(context(input).hookSpecificOutput.additionalContext,/"tool":"Ego Lite"/);
 assert.notEqual(context({...input,session_id:'session-b'}).hookSpecificOutput.additionalContext,context(input).hookSpecificOutput.additionalContext);
 fs.writeFileSync(file,'broken');assert.match(context(input).hookSpecificOutput.additionalContext,/无法读取/);
 assert.equal(context({cwd:root}),null);
 }finally{if(old===undefined)delete process.env.CLAUDE_PROJECT_DIR;else process.env.CLAUDE_PROJECT_DIR=old;fs.rmSync(root,{recursive:true,force:true});}
});
test('原有 hooks 保留，Claude 和 Codex 安装入口完整，安装不声称客户端已加载',()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'coach-install-test-'));
 try{
 fs.mkdirSync(path.join(root,'.claude'),{recursive:true});
 const settings=path.join(root,'.claude','settings.local.json');
 const existing={hooks:{UserPromptSubmit:[{hooks:[{type:'command',command:'existing'}]}]},permissions:{allow:['Read']}};
 fs.writeFileSync(settings,JSON.stringify(existing));
 const result=install(root,'claude');assert.equal(result.hostLoaded,false);
 const config=JSON.parse(fs.readFileSync(settings,'utf8'));
 assert.deepEqual(config.permissions,existing.permissions);assert.deepEqual(config.hooks.UserPromptSubmit[0],existing.hooks.UserPromptSubmit[0]);
 assert.equal(config.hooks.UserPromptSubmit.length,2);
 assert.ok(fs.existsSync(path.join(result.installed,'SKILL.md')));
 assert.throws(()=>install(root,'claude'),/exists/);
 const codex=install(root,'codex');assert.ok(fs.existsSync(path.join(codex.installed,'references','task-contract.md')));
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});

