# 任务入口、状态与验证

## 必须保持的关系

总目标是“使用 Ego Lite”，练习可以是“打开人格测试网站”。后续“帮我打开”继承指定工具。直接代办改变教学方式，不解除工具约束。退出陪练改变协作方式；“结束这个测试”暂停当前练习；“不用 Ego Lite，普通浏览器也行”才是工具变更。维护本 Skill 时不要启动教学流程。

最小状态：goal、tool、exercise、client、mode、status、evidence。未知保持未知，不从用户说“好了”推断全部依赖已满足。不得把任务记录放进安装的 Skill 内或公开提交私人任务。

## 有执行能力时

要求 Node.js 18+，无额外依赖。`scripts/coach-state.cjs` 接收命令和 `--state <独立路径>`；每个命令只修改此文件。优先使用 Claude hook 输出的路径；其他客户端在项目 `.ai-beginner-coach/sessions/` 下使用独立会话文件。路径带空格时加引号。以下参数应按已知上下文填写，不把占位符直接交给新手运行。

- `start --state PATH --goal TEXT --tool TEXT --client TEXT`：首次建档，已有记录则拒绝覆盖。
- `exercise --state PATH --text TEXT`：记录练习，不改总目标与工具。
- `mode --state PATH --value assist|coach`：改变协作方式。
- `inspect --state PATH`：每轮恢复状态。
- `evidence --state PATH --step installed|running|connected|result --via TOOL --client CLIENT --source observed|user_report --detail TEXT`：记录实际检查回执摘要。必须按顺序；工具和客户端必须匹配。只有 observed 的记录满足自动操作检查，用户报告仍保留但待核实。
- `check --state PATH --client CLIENT`：返回 ready 或待核实依赖；阻塞退出码为 2。解释、查官方资料和安装准备无需先通过此检查。
- `complete --state PATH --client CLIENT`：要求所有依赖和实际 result 证据，不接受“给了链接”作为 result。
- `invalidate --state PATH --step STEP`：浏览器退出、连接失败或环境变化时撤销此步骤及后续证据。
- `pause --state PATH`：用户结束当前测试时暂停，禁止继续操作。
- `resume --state PATH`：用户要继续时恢复，并清除运行、连接、结果证据，重新核实。
- `retarget --state PATH --goal TEXT --tool TEXT --client TEXT --user-request TEXT`：仅依据用户明确变更的原话执行。重置练习和所有证据，保留变更历史。非空原话不等于程序已理解授权，Agent 必须核实语义。

检查结果为 ready 仍需确认记录未过期；程序无法知道浏览器刚刚退出。不要为了通过检查编造 evidence。check 不执行浏览器动作，也不拦截绕过它的 Agent 工具调用。

## 入口与平台边界

标准 Skill 根目录为 SKILL.md，支持 Skill 的客户端可按 README 安装。`scripts/install-local.cjs` 提供 Claude 项目级安装与每轮状态恢复 hook，并提供 Codex 项目级 Skill 安装。它不安装 Ego Lite，也不授予浏览器权限。

Claude 的 UserPromptSubmit hook 在每轮带回当前会话状态；尚未建档时只提醒按意图加载 Skill。它不猜测用户意图并自动改写目标，不自动代用户填证据。Codex 等无此 hook 的客户端，由 Skill 在每轮调用 inspect；必须通过实际对话验证是否执行。

只有宿主把所有有关操作接到检查器后面，才有操作层拦截。目前本项目提供状态命令的程序检查、Claude 的状态注入和其他客户端的指令协议，不承诺任意 Agent 永不偏离。

## 本次失败路径的正确推进

“学用 Ego Lite”建档 → 用途问题就地简答并保留状态 → “能做 MBTI 吗”记录为候选练习 → “现在帮我打开”检查 Ego Lite 安装/启动/连接 → 缺什么处理什么 → 通过 Ego Lite 实际操作后记录结果。

可以先查到测试网站，但用户自己点普通链接不满足指定浏览器目标。用户明确取消后立即停止，不借复盘继续部署。
