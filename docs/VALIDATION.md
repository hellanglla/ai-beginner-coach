# 测试说明 / Validation notes

Version: **v0.5.0** · Date: **2026-10-28**

## v0.5.0：目标保持与入口修复

新增 9 组可执行 Node 测试（`node tests/coach-state.test.cjs`），全部通过。覆盖：入口字段与显示元数据；Ego Lite → 用途插问 → MBTI 练习 → 直接代办后的目标保持；缺失、错工具和自述证据；暂停/续接/显式改目标；持久化与重复启动；互斥写入；每轮会话注入和损坏状态；安装保留原设置；练习变更后旧结果失效；损坏安装配置的重试。

显示元数据经 Skill Creator 的生成脚本生成。其 Python quick_validate 由于缺少 PyYAML 未能运行；Node 结构检查只验证本包实际使用的简单 frontmatter、显示字段与引用文件，不是通用 YAML 校验器。

独立会话行为检查：

- Ego Lite 对话重放：执行者只获得 Skill 位置和原始对话，最后用户要求打开测试网站。实际回复保留 Ego Lite 目标，检查命令和进程；报告没有发现，但未断言没安装。下一步指向安装入口核实，没有把普通测试链接当作完成。
- 迁移情境：Zotero Connector 保存文章，用户要求直接代办。执行者保留 Zotero 指定路径，明确当前只读权限下尚未保存，没有把获取文章或给替代文件当作成功。

代码审阅发现并修复了：更换练习后仍可复用旧结果；数组型 evidence 序列化丢失；安装配置错误导致半成品无法重试。对应回归检查通过。

边界：以上没有实际安装或操作 Ego Lite，也没有在真实新手和全新客户端里完成端到端验收。证据记录由调用者提交，程序不能验证其真实性；check 命令只约束经由该命令的状态转换，不拦截任意 Agent 绕过它的工具操作。宿主实际发现 Skill、加载 hook 和跨轮保持目标仍需在目标客户端确认。以下 v0.4 测试保留为历史记录，不等同于 v0.5 全量重测。

### English summary

Nine executable Node test groups pass. Two independent read-only conversations checked the Ego Lite continuation and transfer to Zotero Connector. Neither performed a real browser task. The helper checks submitted state and evidence structure, not evidence truth or arbitrary tool calls. Actual host activation and end-to-end beginner success remain unverified. The official Python quick validator could not run without PyYAML; a package-specific Node structural check passed. The v0.4 results below are historical, not a full v0.5 retest.

[中文首页](../README.md) · [English README](../README.en.md)

## 中文

### 做了什么

测试关注“先听思路，再根据具体理解带做”，并检查陪练是否会依据新信息调整判断。

最近一轮由不同代理承担角色：一个代理按预先准备的隐含状态模拟新手；被测陪练只能看到逐轮用户消息，看不到隐含状态，也不能自己补写用户答案；另一个代理独立评估原始对话。

- **v0.3.0 基线**：10 类回答、32 条陪练回复。包括完全没想法、简略但正确、入口含糊、只会背术语、顺从复述、有可行路线、来源误解、嫌操作麻烦、只给链接、要求代办。
- **v0.4.0 初稿复测**：16 条陪练回复，包括改写情境，以及两条原始会话首轮的原样重放。其中一条覆盖原来的失败首轮；另一条只覆盖初始行为，不代表完整故障路径被重测。
- **终稿窄修正**：另一个独立代理对“假设整理 200 张图”的新输入回复一次，检查是否误将示例数量纳入真实任务。

### 发现与改进

| 观察 | 改进 | 复测证据范围 |
|---|---|---|
| 用户说打算搜资料，陪练却要求整理“刚才查到”的资料 | 区分计划、已完成、假设与转述 | 原失败首轮重放时，先问是否已有资料 |
| 复述术语后仍错误应用，陪练却过早说已理解 | 分开记录复述、提示下判断、新情境应用与实际操作 | 变化情境中保留未知，直到得到具体应用回答才局部肯定 |
| “在浏览器里聊天”有多种含义 | 先澄清输入位置，再判断具体能力 | 不把聊天网站的位置本身认定为错误 |
| 举例的一小时录音被写进真实检索要求 | 假设参数不自动成为任务约束 | 终稿冷启动明确把“200 张”保留为假设，询问实际用途 |

有效分支也被保留：只是不认识下载按钮时教按钮；知道交接但嫌麻烦时帮忙整理；完全没想法时给小例子；请求代办时不强制答题。

### 没有证明什么

所有学习者、界面描述及本轮工具回执都是模拟。本轮未安装软件、未操作真实浏览器，也未测量真人理解或独立操作成功率。此前在已有 Windows/Ego Lite 环境下做过公开网页读取与换网址检查，但它不能填补从零安装和真人学习的证据缺口。

不同代理运行与 Skill 修改同时发生，没有随机对照，不能把所有改善单独归因于文字修改。终稿最后一处窄修正只做了一个冷启动样本，没有重跑所有对话。核心测试以中文进行，英文场景未单独验证。

公开仓库提供方法、维护情境与整理后的结果；本地会话路径、账号上下文和完整运行记录没有作为分发内容发布。不要把这份说明当成可自动复跑的测试套件。

### 如何继续测试

从 [scenarios.md](../references/scenarios.md) 选择一个情境。给陪练 Skill、用户的当前请求和必要的原始材料，不给它期望答案或怀疑的缺陷。由另一个角色逐轮提供用户反馈，保留原始回答，再判断：

1. 判断是否有用户原话或实际结果支撑？
2. 是否分清“不知道”“理解错”“不会操作”和“不想手动做”？
3. 下一步是否真的因回答而改变？
4. 是否把计划、假设或工具自述误当成现实证据？
5. 纠正后有没有新的应用证据？没有时是否保留未知？

只依据观察到的问题改动规则。真实新手试用时，记录具体卡点，避免给学习者贴能力标签。

## English

### What was tested

The latest round evaluated whether the coach first listens to the learner’s plan, identifies a specific gap, and revises its guidance as new information arrives.

Separate agents handled the roles. One simulated learners with predefined hidden states. The coaching agent received messages turn by turn, could not see those states, and could not write the learner’s next reply. Another agent independently evaluated the original conversations.

- **v0.3.0 baseline:** 10 response types and 32 coach replies, covering no initial idea, concise but correct plans, ambiguous interfaces, jargon without application, agreeable repetition, viable plans, source misconceptions, repetitive-work burden, a bare link, and requests for direct help.
- **v0.4.0 draft retest:** 16 coach replies, with reworded scenarios and exact replays of two original opening messages. One replay covered an original failing opening; the other covered only initial behavior, not the complete failure path.
- **Final narrow correction:** a new independent agent responded once to a hypothetical “200 images” scenario, checking whether the example quantity would become a real task requirement.

### Findings and changes

| Observation | Change | Retest evidence |
|---|---|---|
| A plan to research was treated as research already completed | Separate planned, completed, hypothetical, and reported states | The original failing opening now prompted a check for existing material |
| A learner repeated terms but still misapplied them, while the coach affirmed understanding too early | Separate repetition, supported judgments, changed-situation application, and actual execution | The coach kept uncertainty until a concrete application supported a narrower acknowledgment |
| “Chat inside the browser” could mean different interfaces | Clarify the location before judging capability | A chat website’s location was not itself treated as a misconception |
| A hypothetical one-hour recording became a real search requirement | Do not turn example parameters into actual constraints | The final cold-start response kept “200 images” hypothetical and asked about the real use case |

Useful behaviors were retained: help with buttons when the concept is understood, help organize material when the obstacle is effort, offer a small example when the learner has no idea, and respect requests for direct assistance.

### What this does not establish

All learners, interface descriptions, and tool receipts in this round were simulated. No software was installed and no real browser was operated. No human learning or independent task-completion rate was measured. Earlier checks on an already configured Windows/Ego Lite environment opened public pages and changed the input URL; those checks do not establish successful setup on a clean machine or learning by a real beginner.

Agent runs and skill revisions changed together without a randomized control, so improvements cannot all be attributed to the text changes alone. The last narrow correction received one cold-start sample rather than a full rerun. Core scenarios were tested in Chinese; English scenarios were not separately validated.

This repository publishes the method, maintenance scenarios, and summarized findings. Local conversation paths, account context, and complete execution logs are not part of the distribution. These notes are not an automatically runnable test suite.

### How to continue testing

Choose a case from [scenarios.md](../references/scenarios.md). Give the coach the skill, the current user request, and necessary raw material without disclosing an expected answer or suspected defect. Have a separate role provide learner replies turn by turn and preserve the original responses. Check whether:

1. Judgments are supported by the learner’s words or observed results.
2. Unknowns, misconceptions, procedural difficulties, and a preference for assistance are distinguished.
3. The next action actually changes with the answer.
4. Plans, hypotheticals, or tool self-reports are mistaken for real evidence.
5. New application evidence follows a correction—or uncertainty remains explicit when it does not.

Change the skill in response to observed problems. During real beginner trials, record specific obstacles without assigning ability labels to learners.
