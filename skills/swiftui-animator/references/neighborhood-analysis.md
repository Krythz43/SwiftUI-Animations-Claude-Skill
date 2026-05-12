# Neighborhood analysis

The single most important habit when adding SwiftUI animations is **looking outside the view you're editing**. A button is not a button — it is a button inside a row inside a list inside a navigation stack, and each of those layers narrows what motion is appropriate.

This file gives you a checklist and three worked examples.

## The three rings

### Ring 1 — The view itself

Answer these in order before touching code:

1. **Kind.** Is it a button, label, image, card, sheet content, list cell, status indicator, hero element, or container?
2. **State space.** What discrete states can it be in? (idle, hover, pressed, disabled, loading, selected, success, error, empty)
3. **Interaction model.** What does the user do — tap, long-press, drag, scroll, hover, focus, or none (the view animates from system events)?
4. **Frequency.** Will the user trigger this animation 100× a session, 5× a session, or once?
5. **Salience.** Is this primary action, supporting affordance, decoration, or status?

Use the answers to seed a style guess (minimalistic vs expressive) before reading further.

### Ring 2 — Siblings

Look up to the immediate parent's body. List the siblings in the same stack / grid / forEach.

1. **Are siblings the same shape?** (list of rows, grid of cards). If yes, this is rhythmic — be careful animating one in a way that breaks the row.
2. **Do siblings already animate?** Search for `withAnimation`, `.animation(`, `.transition(`, `phaseAnimator`, `.symbolEffect` in the parent file. If yes, **match the spring family** and **stagger by 40–80ms** rather than introducing a different motion language.
3. **Is there a hero among them?** If exactly one sibling is meaningfully larger, brighter, or labeled as primary — your animation can lean expressive even if the others are calm.

### Ring 3 — The parent

Walk up the file/view hierarchy until you find the screen container. Note which of these applies:

| Parent | Animation implication |
|---|---|
| `List` / `Form` | ≤ 300ms; avoid offsets; lean on selection and `.swipeActions` transitions |
| `LazyVStack` / `LazyVGrid` | Same as List but you can stagger appearance — cap at first 3 visible items |
| `ScrollView` | Avoid `.offset` on appear; prefer opacity + scale |
| `Sheet` / `.sheet` / `.popover` | Don't double-transition; delay child animations ~250ms past `onAppear` |
| `NavigationStack` push | Use `.navigationTransition(.zoom(...))` (iOS 18) for hero, or manual overlay |
| `TabView` selection | Animate first-paint additions only; let the tab transition own page motion |
| `ZStack` overlay | You can animate freely — overlays are presentation moments |
| Root screen body | Open canvas — phase animators, keyframes, hero entrances all OK |

## Worked examples

### Example A — "Animate the favorite button on this row"

```swift
List(items) { item in
  HStack {
    Text(item.title)
    Spacer()
    Button { item.isFavorite.toggle() } label: {
      Image(systemName: item.isFavorite ? "heart.fill" : "heart")
    }
  }
}
```

Ring 1: Button, two states, tap-driven, frequent, supporting affordance.
Ring 2: Siblings are `Text` and `Spacer` — calm, no existing animation.
Ring 3: `List` row → ≤ 300ms, no offsets.

**Verdict:** minimalistic. Use `.symbolEffect(.bounce.up, value: item.isFavorite)` on the heart, plus a single `.sensoryFeedback(.impact(weight: .light), trigger: item.isFavorite)`. No scale on the button itself — it is already inside a touch target. No row-level animation.

### Example B — "Make the onboarding card feel alive on appear"

```swift
ZStack {
  Color.appBackground
  VStack(spacing: 24) {
    Image("hero")
    Text("Welcome").font(.largeTitle)
    Text("Subtitle copy")
    Button("Get started") { ... }
  }
  .padding()
}
```

Ring 1: Multi-element hero composition, single appear event, once-per-user, primary salience.
Ring 2: Siblings are mixed (image, two labels, button) — no rhythm to respect.
Ring 3: Root screen — open canvas.

**Verdict:** expressive. Stagger appearance: image scales-from-0.9 with `.bouncy`, title fades + offsets-from-12, subtitle fades, button fades-from-bottom. Total length ≤ 900ms. Use `.transition` driven by an `appeared` `@State` flipped in `.onAppear` with `withAnimation(.smooth(duration: 0.6).delay(index * 0.08))`. Reduce-motion fallback: instant fade only.

### Example C — "Add a swipe gesture to the card"

```swift
ScrollView {
  ForEach(cards) { card in
    CardView(card: card)
      .padding(.horizontal)
  }
}
```

Ring 1: Card view, gesture-driven, drag interaction, frequent in this surface.
Ring 2: Cards are siblings in a vertical scroll — the user is already scrolling vertically.
Ring 3: `ScrollView` — vertical drag conflicts with horizontal swipe; need `.simultaneousGesture` and direction lock.

**Verdict:** minimalistic on the gesture side (live tracking with rubber-band beyond ±120pt, spring snap-back at `.snappy`), expressive only at the threshold crossing (haptic + brief scale dip). Dispatch the actual delete after the spring completes.

## When you're stuck

If neighborhood analysis comes back with conflicting signals, default to **the more conservative choice** and surface the trade-off in your proposal so the user can override.

If the file is large and reading parents would balloon the context, ask the user to confirm the parent type rather than guessing. A one-line confirmation beats a wrong assumption.
