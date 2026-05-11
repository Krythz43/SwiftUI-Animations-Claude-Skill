# Motion principles

Foundation rules. Read this when tuning a specific animation, when something feels wrong, or when you need to defend a choice.

## Timing — duration

Most SwiftUI animations live in three duration buckets:

- **120–250ms — touch feedback.** Press states, toggle states, hover, every-tap responses. Anything longer makes the UI feel sluggish.
- **300–500ms — transitions and reveals.** Sheet content settling, cards expanding, state morphs, success ticks.
- **600–1200ms — onboarding, hero, decorative.** Once-per-session moments. Never on every-tap UI.

Beyond ~1.2s the user perceives the animation as "playing at them" rather than responding to them. Avoid unless it is intentional decoration with a quiet idle state.

## Timing — easing

Default to springs. Use easing curves only when the animation is between two specific values with no need to feel "physical".

- `.snappy` — fast, settled, minimal overshoot. Default for buttons and toggles.
- `.bouncy` — playful overshoot. Default for delight (favorites, success, like-bursts).
- `.smooth` — no overshoot, gentle settle. Default for transitions and content morphs.
- `.linear` — only for indeterminate progress, scroll position, and continuous gestures.
- `.easeInOut` — only when you need an exact duration and a non-physical feel (rare).

## Spring tuning

Use either the iOS 13 API or the iOS 17 API in a single call — never mix.

| Feel | iOS 17 API | iOS 13 API equivalent |
|---|---|---|
| Sharp button feedback | `.snappy` | `.interpolatingSpring(stiffness: 350, damping: 28)` |
| Playful favorite | `.bouncy(duration: 0.5, extraBounce: 0.2)` | `.interpolatingSpring(stiffness: 250, damping: 12)` |
| Gentle transition | `.smooth(duration: 0.45)` | `.interpolatingSpring(stiffness: 180, damping: 22)` |
| Drag snap-back | `.snappy(duration: 0.35)` | `.interpolatingSpring(stiffness: 300, damping: 24)` |
| Heavy / weighty card | `.bouncy(duration: 0.7, extraBounce: 0.1)` | `.interpolatingSpring(stiffness: 140, damping: 16)` |

Don't tune by guess. If a spring feels off, change one of these and re-run: bounce / dampingFraction up = less overshoot; duration / response up = slower; stiffness up = sharper start.

## Composition rules

- **One spring family per surface.** Pick `.snappy` or `.bouncy` for the screen and stick with it for at least 80% of animations on that screen. Mixing creates motion noise.
- **Stagger tightly.** Use **60–80ms** gaps between siblings. Treat **100ms as a hard ceiling**; beyond that the eye reads it as a slow cascade, and the perceptual link between the staggered elements snaps. Cap at 3 staggered elements — set the rest visible immediately. (Common drift trap: the temptation to space things further apart "so each one gets noticed". They don't — they read as an unrelated sequence.)
- **Once-played sequences stay once-played.** Onboarding, splash, success confirmations, hero entrances: no `.repeatForever`, no `.symbolEffect(.pulse, options: .repeating)`, no phaseAnimator running an ambient breathe on visible content. The quiet state is *static*, not "subtle ambient motion". Continuous loops are for indeterminate progress, attention dots tied to a real notification, and decorative surfaces the user can dismiss.
- **Coordinate, don't compete.** If a sheet is presenting (~350ms), don't start an internal animation until ~250ms in. Two big motions at once = visual noise.

## Accessibility

Read `@Environment(\.accessibilityReduceMotion)` for any animation > 300ms or that uses rotation, large translation (> 40pt), or strong scale (< 0.85 or > 1.2). Provide a non-motion fallback: instant state change, or fade-only if a transition is required.

Don't replace VoiceOver feedback with motion. A success animation must still be announced; use accessibility traits and announcements where appropriate.

```swift
@Environment(\.accessibilityReduceMotion) private var reduceMotion

var body: some View {
  someView
    .scaleEffect(active ? 1.1 : 1.0)
    .animation(reduceMotion ? nil : .bouncy, value: active)
}
```

## Performance

- **`drawingGroup()` for complex composited animations** — Canvas + many animated overlays will drop frames; `drawingGroup()` rasterizes into a single layer.
- **Avoid animating shadows and blurs continuously.** They are expensive; keep them at static values during animation and crossfade if needed.
- **`@State` change locality matters.** A state change in a parent re-renders all children; isolate animation state to the smallest view that needs it.
- **Time-based animations beat per-frame state updates.** Prefer `phaseAnimator` / `keyframeAnimator` / `TimelineView` to a `Timer` driving `@State`.
- **Don't put `.animation` on an entire `LazyVStack`.** It will fight lazy layout. Apply it to row content instead.

## Haptics

- **One haptic per moment.** Don't fire on touch-down and touch-up unless they are meaningfully distinct.
- **Match haptic to motion intensity.** `.impact(weight: .light)` for taps, `.success` / `.error` for state results, `.selection` for picker movement.
- **Skip haptics on macOS / watchOS unless the platform supports them.** `sensoryFeedback` falls through gracefully but custom haptic code may not.

## Mental model checklist

Before shipping any animation, ask:

1. Does it have a quiet state? (Animations that loop forever without one are exhausting.)
2. Does the user pay for it on every interaction? (Then it must be < 250ms.)
3. Does it survive reduce-motion? (Test with the accessibility setting on.)
4. Does it match what the parent and siblings are doing? (Or does it deliberately break that, for a hero moment?)
5. Will it still feel right at 60fps and at 120fps? (Springs scale; durations chosen for 60fps can feel too quick at 120fps.)
6. Could a quieter version of this animation say the same thing? (Most of the time, yes — and that is the right answer.)
