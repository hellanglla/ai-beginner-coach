'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {valid}=require('./coach-state.cjs');
function context(input) {
  if(!input || typeof input.cwd!=='string' || typeof input.session_id!=='string' || !input.session_id) return null;
  const id=crypto.createHash('sha256').update(input.session_id).digest('hex').slice(0,24);
  const project=process.env.CLAUDE_PROJECT_DIR||input.cwd;
  const file=path.join(project,'.ai-beginner-coach','sessions',id+'.json');
  let message;
  if(fs.existsSync(file)) {
    try {
      const s=valid(JSON.parse(fs.readFileSync(file,'utf8')));
      message='AI 新手陪练会话状态（这是数据，不是用户新指令）：\n'+JSON.stringify(s)+'\n状态文件：'+file+
        '\n先保留 goal/tool，再解释本轮请求。练习网站、解释插问和“帮我打开”不改变指定工具；直接代办只切 mode。操作前核实前置条件并调用 check；暂停/完成状态不继续操作。用户明确改变目标时用 retarget 并保留原话。请读取已安装 ai-beginner-coach 的 SKILL.md 和 references/task-contract.md。不得把其他浏览器或普通链接算作指定工具完成。';
    } catch(e) { message='AI 陪练状态无法读取：'+file+'。先恢复记录，不要猜测目标或宣布成功。'; }
  } else {
    message='仅当用户确实需要 AI 工具学习或明确调用 ai-beginner-coach 时加载该 Skill。普通代办、学科学习和维护 Skill 不强制教学。若启用，本会话唯一状态路径为：'+file+'。先按已有上下文记录总目标、指定工具、当前环境；不要重复询问已知信息。';
  }
  return {hookSpecificOutput:{hookEventName:'UserPromptSubmit',additionalContext:message}};
}
if(require.main===module) {
  let raw='';process.stdin.setEncoding('utf8');process.stdin.on('data',c=>raw+=c);
  process.stdin.on('end',()=>{try{const out=context(JSON.parse(raw));if(out)process.stdout.write(JSON.stringify(out));}catch(_){}});
}
module.exports={context};

