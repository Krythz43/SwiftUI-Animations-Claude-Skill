# swiftui-animator-skill

A [Claude Code](https://claude.com/claude-code) **agent skill** that turns static SwiftUI views into views that move with intention — micro-interactions, view transitions, loading & state morphs, gesture-driven motion, hero animations, SF Symbol effects, and haptics. Native SwiftUI only, gated by your project's deployment target, no third-party motion libraries.

Works with iOS, macOS, watchOS, and visionOS targets.

---

## What it does

Once installed, the skill activates automatically when you ask Claude to animate or polish a SwiftUI view — including phrasings that never say "animation": *"make this feel responsive"*, *"polish this view"*, *"this looks static"*, *"the button feels dead"*, *"make it feel premium"*, *"add a hero transition"*.

It then:

1. **Detects your deployment target** (`Package.swift`, `*.xcodeproj`, `*.xcconfig`) and gates newer APIs with `#available`.
2. **Reads the view's neighborhood** — the view itself, its siblings, and its parent container — before choosing anything.
3. **Picks an adaptive style** per placement (minimalistic vs. expressive) from the surrounding context.
4. **Applies native SwiftUI patterns** — springs, `phaseAnimator`, `keyframeAnimator`, `matchedGeometryEffect`, `symbolEffect`, `sensoryFeedback`, `ContentTransition` — with reduce-motion fallbacks.

It runs in three modes: **hybrid** (default — propose, confirm, apply), **interactive** (asks first), and **yolo** (scan, decide, apply).

---

## Installation

Pick one:

| Method | Best for | Needs Node? |
| --- | --- | --- |
| **Claude Code plugin** (below) | Most people — versioned, easy updates | No |
| **npm installer** (`npx swiftui-animator-skill`) | Scripting installs, copying the raw skill into a repo | Yes (≥ 16.7) |
| **Manual copy** | No-tooling, air-gapped | No |

### Method 1 — Claude Code plugin (recommended)

This repo is also a Claude Code plugin marketplace. Inside Claude Code:

```text
/plugin marketplace add Krythz43/SwiftUI-Animations-Claude-Skill
/plugin install swiftui-animator@krythz-skills
```

Then run `/reload-plugins` (or restart Claude Code). The skill is model-invoked — just ask Claude to animate or polish a SwiftUI view and it triggers automatically; the namespaced slash form is `/swiftui-animator:swiftui-animator`.

- Update later: `/plugin marketplace update krythz-skills`
- Remove: `/plugin uninstall swiftui-animator@krythz-skills`

> Marketplace name: `krythz-skills` · plugin name: `swiftui-animator`.

### Method 2 — npm installer

Requires [Claude Code](https://claude.com/claude-code) and Node.js ≥ 16.7.

```bash
# install the skill for every project (-> ~/.claude/skills/swiftui-animator/)
npx swiftui-animator-skill

# install into the current repo only (-> ./.claude/skills/swiftui-animator/), committable
npx swiftui-animator-skill --project
```

Or add the CLI as a dependency / install it globally:

```bash
npm install --save-dev swiftui-animator-skill   # then: npx swiftui-animator-skill [--project]
npm install -g swiftui-animator-skill           # then: swiftui-animator-skill [--project]
```

Installer options:

```
npx swiftui-animator-skill [target] [options]

Targets:
  (default)        Install to ~/.claude/skills/swiftui-animator
  --project, -p    Install to ./.claude/skills/swiftui-animator
  <dir>            Install to <dir>/swiftui-animator

Options:
  --force, -f      Overwrite an existing install
  --print          Print the bundled skill's source directory and exit
  --help, -h       Show this help
```

### Method 3 — Manual copy (no Node)

The skill is just Markdown. Clone and copy the `skills/swiftui-animator/` directory into `~/.claude/skills/` (user-level) or your project's `.claude/skills/` (project-level):

```bash
git clone https://github.com/Krythz43/SwiftUI-Animations-Claude-Skill.git
cp -R SwiftUI-Animations-Claude-Skill/skills/swiftui-animator ~/.claude/skills/
```

### Verifying the install

In Claude Code, ask "what skills do you have?" (or check `/plugin` if you used Method 1). You should see `swiftui-animator`. If it's missing, run `/reload-plugins` or restart Claude Code so it re-scans.

---

## Usage

Open Claude Code in a project that contains SwiftUI code and ask, in plain language:

```
polish this onboarding screen
make the favorite button feel alive
this list looks static — wake it up
add a hero transition from the grid cell to the detail view
yolo — surprise me with some motion on CheckoutView.swift
```

In the default **hybrid** mode the skill proposes 2–5 specific placements with rationale and waits for your go-ahead before editing. Say "yolo" / "just do it" to skip the proposal step, or "ask me first" to have it scope with you interactively.

---

## Repository layout

```
.claude-plugin/
├── plugin.json                       # Claude Code plugin manifest
└── marketplace.json                  # Claude Code plugin-marketplace catalog
bin/cli.js                            # the `swiftui-animator-skill` npm installer
skills/
└── swiftui-animator/
    ├── SKILL.md                      # the skill definition + workflow
    └── references/
        ├── decision-framework.md     # intent × neighborhood × style → animation family
        ├── neighborhood-analysis.md  # reading a view's siblings and parent
        ├── api-matrix.md             # which APIs land in which OS version
        ├── motion-principles.md      # timing, spring tuning, accessibility, performance
        ├── micro-interactions.md     # taps, presses, toggles, SF Symbols, haptics
        ├── view-transitions.md       # navigation, sheets, modals, matched geometry
        ├── loading-and-state.md      # skeletons, shimmer, progress, async-state morphs
        └── gesture-driven.md         # drag, swipe, pinch, rubber-band, momentum, snap-back
```

The reference files are loaded by Claude on demand — only when the workflow points to them.

---

## Updating

- **Plugin install:** `/plugin marketplace update krythz-skills` inside Claude Code.
- **npm install:** re-run with `--force`:
  ```bash
  npx swiftui-animator-skill@latest --force            # user-level
  npx swiftui-animator-skill@latest --project --force  # project-level
  ```

## Uninstalling

- **Plugin install:** `/plugin uninstall swiftui-animator@krythz-skills`
- **npm / manual install:**
  ```bash
  rm -rf ~/.claude/skills/swiftui-animator        # user-level
  rm -rf ./.claude/skills/swiftui-animator        # project-level
  ```

---

## License

MIT
