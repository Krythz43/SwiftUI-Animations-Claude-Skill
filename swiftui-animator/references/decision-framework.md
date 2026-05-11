# Decision framework

When you've identified what kind of motion is appropriate, use this matrix to choose a specific animation pattern. Cross the user's intent (left column) with the neighborhood signal to find the recommended family, then go to the relevant category file for the actual SwiftUI pattern.

## Intent → category map

| User intent | Category | Default style | Notes |
|---|---|---|---|
| "make this button feel good when tapped" | micro-interactions | minimalistic | scale 0.96 + spring; haptic only on confirmation buttons |
| "highlight the favorite/like action" | micro-interactions | expressive | SF Symbol bounce + sensoryFeedback; brief particle if hero context |
| "transition between two views smoothly" | view-transitions | minimalistic → expressive depending on hero importance | matchedGeometryEffect when shared element exists, else .transition |
| "show that something is loading" | loading-and-state | minimalistic for inline, expressive for full-screen | skeleton/shimmer for content; phaseAnimator for hero loaders |
| "communicate success/error" | loading-and-state | expressive (rarely triggered) | symbolEffect + haptic + 1.0–1.4s presence |
| "drag to dismiss / swipe to delete" | gesture-driven | minimalistic | rubber-band beyond bounds; spring-back on release; never animate-on-finger |
| "make the screen feel alive when it appears" | view-transitions + micro-interactions | depends on hierarchy | staggered .transition on children; cap at ~3 staggered elements |
| "polish, but you decide" | open — start with neighborhood analysis | adaptive | yolo path lives here |

## Neighborhood → pattern overrides

These overrides take precedence over the table above when the neighborhood says so.

### Sibling rhythm

- **All siblings static and identical (e.g., List rows)** → only animate state changes (selection, expand, swipe action), never appearance of every row. Animating every row on appear is "tunnel vision motion" and feels cheap.
- **Siblings already animate** → match their spring family or stagger by 40–80ms. Don't introduce a third spring style.
- **Single hero element among static siblings** → expressive choice is OK; you have permission to break rhythm because the element is meant to stand out.

### Parent container

- **Inside a `List` / `LazyVStack` row** → keep total duration ≤ 300ms; users scroll fast and long animations clash with scroll velocity.
- **Inside a `ScrollView`** → avoid `.offset` animations on appear; they conflict with scroll position. Prefer opacity + scale.
- **Inside a `Sheet` / `.presentationDetents`** → the sheet itself is animating in. Don't add another transition to its root content; animate only after `.onAppear` settles (~250ms delay).
- **Inside `NavigationStack` push** → matchedGeometryEffect requires a `.navigationTransition(.zoom(...))` companion (iOS 18+) or a manual hero overlay below.
- **Inside `TabView` selection** → if you animate the destination, you'll fight the tab transition. Animate only first-paint additions.
- **Inside a `Form`** → keep things very calm. Forms are functional surfaces; bouncy springs feel out of place.
- **Root of a screen** → expressive choices live here. Phase animators, keyframe sequences, hero entrances, all welcome.

### View role

- **Form / settings row** → minimalistic; respect platform conventions (chevrons don't bounce).
- **Empty state illustration** → expressive licensed; this is a moment.
- **Status / alert / error banner** → minimalistic + announce via accessibility. Motion is not a replacement for VoiceOver feedback.
- **Onboarding / paywall** → expressive licensed; users only see this once and motion sells the moment.
- **Dashboard tile / stat card** → minimalistic on data updates (numericText), expressive on milestone reaches.

## Style → family preference (within a category)

When you've chosen a category, the style narrows the family.

### micro-interactions

- minimalistic: `scaleEffect` + `.snappy`, opacity, `.symbolEffect(.bounce.byLayer)`
- expressive: `phaseAnimator` for multi-step state, particle bursts via `Canvas` + `TimelineView`, layered `.symbolEffect` with `variableValue:`

### view-transitions

- minimalistic: `.transition(.opacity.combined(with: .scale(scale: 0.96)))`
- expressive: `matchedGeometryEffect`, `navigationTransition(.zoom(...))` (iOS 18), custom `AnyTransition` driven by a `phaseAnimator`

### loading-and-state

- minimalistic: skeleton with subtle phase shift, indeterminate `ProgressView`, opacity pulse
- expressive: shimmer (gradient mask + phaseAnimator), keyframe loaders, `.contentTransition(.numericText())` for animated counters

### gesture-driven

- minimalistic: spring snap-back, rubber-band beyond bounds, opacity-based feedback
- expressive: keyframe-driven momentum overshoot, `dragRotationEffect`, layered haptics on threshold crossings

## Anti-patterns (always reject)

- Adding `.animation(...)` without a `value:` (deprecated, animates every change).
- Looping animations on always-visible views without a quiet state — death by motion.
- Bouncy springs on data-entry fields, sliders, scrubbers, or anything tracking direct manipulation.
- Symbol effects on icons that don't make sense to animate (chevrons, status dots, decorative glyphs).
- Per-row appearance animations in long lists (> 10 visible items).
- Hero `matchedGeometryEffect` without a corresponding `.id` / namespace handshake on both sides.
- Animations longer than ~600ms on every-tap UI.
- Using `withAnimation` to animate SF Symbols when `.symbolEffect()` exists.
- Animating shadow / blur radius continuously — expensive and rarely worth it.
