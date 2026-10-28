'use strict';
const fs=require('node:fs'),path=require('node:path');
function install(project,client) {
  if(!['claude','codex'].includes(client))throw new Error('client must be claude or codex');
  const source=path.resolve(__dirname,'..');
  const root=path.resolve(project);
  const relative=path.join(client==='claude'?'.claude':'.agents','skills','ai-beginner-coach');
  const destination=path.join(root,relative);
  if(destination===source)throw new Error('Install destination equals source');
  if(fs.existsSync(destination))throw new Error('Skill destination exists; compare versions before replacing');
  let settings,raw,config;
  if(client==='claude') {
    settings=path.join(root,'.claude','settings.local.json');
    raw=fs.existsSync(settings)?fs.readFileSync(settings,'utf8'):null;
    config=raw?JSON.parse(raw):{};
    if(!config||typeof config!=='object'||Array.isArray(config))throw new Error('Invalid settings');
    if(config.hooks && (typeof config.hooks!=='object'||Array.isArray(config.hooks)))throw new Error('Invalid hooks');
    if(config.hooks?.UserPromptSubmit && !Array.isArray(config.hooks.UserPromptSubmit))throw new Error('Invalid UserPromptSubmit');
    const script=path.join(destination,'scripts','claude-session-hook.cjs').replaceAll('\\','/');
    config.hooks??={};config.hooks.UserPromptSubmit??=[];
    if(!config.hooks.UserPromptSubmit.some(group=>(group.hooks||[]).some(h=>(h.args||[]).includes(script)))) {
      config.hooks.UserPromptSubmit.push({hooks:[{type:'command',command:'node',args:[script],timeout:5,statusMessage:'恢复 AI 陪练任务目标…'}]});
    }
  }
  fs.mkdirSync(path.dirname(destination),{recursive:true});
  const staging=fs.mkdtempSync(path.join(path.dirname(destination),'.coach-install-'));
  let moved=false;
  const settingsTemp=settings?settings+'.coach-'+process.pid+'.tmp':null;
  try {
    for(const name of ['SKILL.md','agents','references','scripts'])fs.cpSync(path.join(source,name),path.join(staging,name),{recursive:true});
    if(settings) {
      if(raw!==null)fs.writeFileSync(settings+'.coach-backup-'+Date.now(),raw,{flag:'wx'});
      fs.writeFileSync(settingsTemp,JSON.stringify(config,null,2)+'\n',{flag:'wx'});
    }
    fs.renameSync(staging,destination);moved=true;
    if(settings)fs.renameSync(settingsTemp,settings);
  } catch(e) {
    if(moved)fs.rmSync(destination,{recursive:true,force:true});
    throw e;
  } finally {
    if(fs.existsSync(staging))fs.rmSync(staging,{recursive:true,force:true});
    if(settingsTemp&&fs.existsSync(settingsTemp))fs.unlinkSync(settingsTemp);
  }
  return {installed:destination,client,hostLoaded:false,verification:'Open a new task and verify the loaded skill path and state before claiming activation'};
}
if(require.main===module) {
  try {
    const args=process.argv.slice(2),project=args[args.indexOf('--project')+1],client=args[args.indexOf('--client')+1];
    if(!args.includes('--project')||!args.includes('--client')||!project||!client)throw new Error('Usage: node scripts/install-local.cjs --project PATH --client claude|codex');
    console.log(JSON.stringify(install(project,client)));
  } catch(e){console.error(e.message);process.exitCode=1;}
}
module.exports={install};

