# AI Beginner Coach

**Start with the learner’s plan. Find the specific gap. Help them complete a real task.**

[简体中文](README.md) · English

An Agent Skill for people with no technical background. It guides learners through using tools, searching with AI, and connecting steps such as research, organization, and writing into a repeatable workflow.

Current version: **v0.5.0** · [MIT license](LICENSE)

## Goal continuity and verified steps

Version 0.5 separates the learning goal, required tool, exercise and collaboration mode. A request to “open it” inherits the required tool; switching to direct assistance does not remove it. Node.js 18+ scripts persist per-session state, reject out-of-order or mismatched evidence, invalidate stale results after exercise changes, and block completion without result evidence.

Use `node scripts/install-local.cjs --project "PROJECT_PATH" --client claude` or `--client codex` from this repository. Claude receives a project skill plus a per-turn state hook; Codex receives a project skill. Existing skill directories are not overwritten. Verify actual host loading in a new task; file installation alone is not activation evidence.

Run `node tests/coach-state.test.cjs` for local regression checks. The helper validates submitted records, not their truth, and does not intercept tools that bypass it. No universal hard enforcement is claimed. Session records under `.ai-beginner-coach/sessions/` are private task data and must not be published. See [task contract](references/task-contract.md) (Chinese) and [validation](docs/VALIDATION.md).

## What it does

A beginner receives a useful GitHub link but does not know what the project does, where to send instructions, or how the tools fit together. This skill asks for their current plan before teaching, then distinguishes between:

- A missing understanding of how the parts work together.
- Understanding the idea but not knowing which button to click.
- Missing capabilities in the current AI client.
- Knowing what to do but wanting help with repetitive work.

It does not treat “I understand” as proof of mastery, or unfamiliar terminology as proof that someone needs to start over.

## Example conversation

**Learner:** A friend recommended Ego Lite. How do I use it?

**Coach:** How are you thinking of using it? Tell me what you think the first step would be. Share whatever comes to mind—it is fine if you have no idea yet.

The next response depends on the answer:

| Learner’s answer | Coaching response |
|---|---|
| “I have no idea.” | Offer a small example and a concrete starting point. |
| “Download it, install it, then give it to AI.” | Ask about one missing connection, such as where the task will be sent. |
| “Talk to AI inside Ego.” | Clarify whether this means an address bar, a chat website, or another interface. |
| “I understand the assistant/browser relationship, but not the download buttons.” | Help with the buttons and skip the concept lesson. |
| “I know I need to pass the sources to the next AI, but organizing them is tedious.” | Help prepare the handoff material. |

The cycle is **listen → clarify → explain the relevant gap → take one small action → verify → provide a reusable method**.

This is not a mandatory quiz. The coach uses a plan already provided, accepts “I don’t know,” and can switch to doing the work with explanations when requested.

## Supported learning tasks

1. **Tools and projects:** GitHub repositories, websites, desktop applications, plugins, and other skills. Ego Lite is a worked teaching case; current product instructions must be checked when used.
2. **AI search:** framing a question, finding sources, reading the underlying evidence, and checking limits rather than trusting a link alone.
3. **Workflows:** passing usable inputs between research, organization, and writing steps. Run a small example before deciding whether automation is needed.

## Installation

### With a skill-compatible AI client

Use the [Skills CLI](https://github.com/vercel-labs/skills):

```bash
npx skills add hellanglla/ai-beginner-coach
```

Run it in a terminal and choose the AI client you actually use. Installation is project-scoped by default. For use across projects:

```bash
npx skills add hellanglla/ai-beginner-coach -g
```

At the time these instructions were checked, the CLI required Node.js 22.20 or later. Check its [official installation documentation](https://github.com/vercel-labs/skills#install-a-skill) for current requirements and supported clients. This requirement belongs to the installer; the skill itself is Markdown instructions and has no build step.

For manual installation, download this repository and place the folder containing `SKILL.md`, `references/`, and `agents/` in your client’s supported skill directory, named `ai-beginner-coach`. Paths vary by client. Keep the reference files, and refresh skill discovery or start a new session as your client requires.

### If you cannot install a skill yet

Paste this shorter prompt into your existing AI chat. **It offers a simplified coaching experience; it does not install the full skill.**

```text
Be my AI beginner coach. Ask how I plan to approach the task, then wait before teaching.
Use my own words to distinguish what I understand, what is unknown, and any specific misconception. Do not grade me or assume that everything I omit is something I do not understand.
Build on correct ideas. Ask one useful question about an unclear point. Explain a misconception with a small example.
If I have no idea, give me a concrete starting point. If I ask you to do the work, help within your actual capabilities and explain briefly.
Do not treat a plan as completed work, or numbers in a hypothetical example as my real requirements.
Guide one small action at a time, explaining where to do it and what success looks like.
When useful, use a changed situation to check application rather than only asking “Do you understand?” Leave a reusable method at the end.
Be honest if you cannot browse or control my computer. Never pretend you have researched or executed something.
```

## Usage

In clients that support name-based invocation:

```text
Use $ai-beginner-coach to teach me this project: https://github.com/citrolabs/ego-lite
Listen to my plan first, then guide me through my first real use.
```

```text
Use $ai-beginner-coach to teach me how to find free image organization tools with AI.
Start with how I would search, then help me check sources and limitations.
```

```text
Use $ai-beginner-coach to help me connect research, note organization, and article writing.
Let me explain my proposed steps first, then help me fill the gaps.
```

If `$name` is not supported, ask your client to use the “AI Beginner Coach” skill in natural language, or select it using that client’s documented interface.

## Capabilities and limits

- The skill shapes teaching behavior. It does not grant browsing, terminal, or computer-control capabilities. Missing capabilities lead to manual guidance or a clear explanation of what is needed.
- Installing a tool, receiving a summary, and completing a real task are different states. A result from another search tool is not evidence that Ego Lite was used.
- Progress can be saved when file tools are available, or provided as a copyable continuation note. Unsaved progress is not promised to persist.
- Installing this skill does not install Ego Lite or other example applications. Purchases, external messages, publishing, and account-data migration depend on the user’s specific authorization.
- Core instructions and reference files are currently written in Chinese, but instruct the assistant to use the learner’s language. This English README does not imply that all teaching materials have been translated or that English teaching scenarios have been validated.

## Validation status

The latest testing used separate roles: the coaching agent could not see the simulated learner’s hidden state and received each learner reply before choosing its next response. The v0.3.0 baseline contained 32 coach responses; the v0.4.0 draft retest contained 16; one final narrow correction received a separate cold-start check.

The tests exposed and informed fixes for treating plans as completed work, affirming understanding too early, and turning hypothetical parameters into real requirements. **These are simulated behavior tests, not evidence of learning outcomes with real beginners or successful installation on a clean machine.** Earlier browser execution checks are recorded separately from the latest teaching tests.

See [Validation notes](docs/VALIDATION.md) for methods, results, and limitations, and [scenarios.md](references/scenarios.md) for maintenance scenarios.

## Repository layout

```text
SKILL.md                    Core coaching behavior
agents/openai.yaml          Client-facing metadata
references/
  tool-onboarding.md        Tool and project onboarding
  ai-search.md              Search and source verification
  workflows.md              Workflows and data handoffs
  ego-lite-case.md          Ego Lite teaching case
  handoffs.md               Window changes, restarts, continuation
  scenarios.md              Maintenance scenarios
  design-sources.md         Design references and attribution
docs/VALIDATION.md          Chinese and English validation notes
```

## Feedback and acknowledgments

Open an [issue](https://github.com/hellanglla/ai-beginner-coach/issues) with your AI client, intended task, the response you received, and the point where you got stuck. Remove account details, credentials, and private material before sharing.

The design draws on teaching mechanisms in TuTor, Repo Tutor, Dex getting-started, and Devpost Hackathon Guide. The instructions were independently written; see [design sources](references/design-sources.md). This is not an official Ego Lite project.

License: [MIT](LICENSE).
