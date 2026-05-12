# View transitions

Animations between views — push / pop, sheets, modals, hero / matched element. The biggest differentiator between "feels like a Figma demo" and "feels like a shipped app" is what happens between screens, not within them.

## When to use

- Pushing / popping a `NavigationStack`
- Presenting / dismissing sheets, popovers, alerts
- Switching between two `if` branches in a parent view
- Hero / shared element across screens (image → detail)
- Custom card-to-detail expansions

## Patterns

### 1. Conditional view crossfade with scale

The default for "two states of the same area" — empty state ↔ content, sign-in ↔ home.

```swift
Group {
  if isSignedIn {
    HomeView()
  } else {
    SignInView()
  }
}
.transition(.opacity.combined(with: .scale(scale: 0.98)))
.animation(.smooth(duration: 0.35), value: isSignedIn)
```

Apply the `.animation` modifier on the parent so both branches share it. The `Group` wrapper ensures the transition reads correctly.

### 2. Asymmetric transitions (entry ≠ exit)

When the entry should feel different from the exit — e.g., new content slides up from bottom, but old content fades out in place.

```swift
.transition(.asymmetric(
  insertion: .move(edge: .bottom).combined(with: .opacity),
  removal: .opacity
))
```

### 3. Hero / shared element with `matchedGeometryEffect` (iOS 14+)

For a thumbnail that expands into a detail view, sharing the same image source.

```swift
@Namespace private var hero

ZStack {
  if let selected {
    DetailView(item: selected)
      .matchedGeometryEffect(id: selected.id, in: hero)
      .onTapGesture { withAnimation(.smooth(duration: 0.45)) { self.selected = nil } }
  } else {
    LazyVGrid(columns: ...) {
      ForEach(items) { item in
        Thumbnail(item: item)
          .matchedGeometryEffect(id: item.id, in: hero)
          .onTapGesture { withAnimation(.smooth(duration: 0.45)) { selected = item } }
      }
    }
  }
}
```

**Critical:** the `id` must match on both sides, the `in:` namespace must be the same, and only one element with a given id can be visible at a time.

### 4. Navigation hero (iOS 18+)

Apple's first-class hero for `NavigationStack`. Cleaner than manual `matchedGeometryEffect` for push transitions.

```swift
@Namespace private var hero

NavigationStack {
  ScrollView {
    LazyVGrid(...) {
      ForEach(items) { item in
        NavigationLink {
          DetailView(item: item)
            .navigationTransition(.zoom(sourceID: item.id, in: hero))
        } label: {
          Thumbnail(item: item)
            .matchedTransitionSource(id: item.id, in: hero)
        }
      }
    }
  }
}
```

Gate with `#available(iOS 18, *)` and fall back to standard `matchedGeometryEffect` on the source / destination for earlier versions.

### 5. Sheet presentation with internal stagger

Sheets animate in for ~350ms. If you also want internal content to animate, delay it past that window.

```swift
@State private var sheetReady = false

.sheet(isPresented: $isShown) {
  VStack {
    Hero().scaleEffect(sheetReady ? 1 : 0.94).opacity(sheetReady ? 1 : 0)
    Title().opacity(sheetReady ? 1 : 0).offset(y: sheetReady ? 0 : 8)
    Body().opacity(sheetReady ? 1 : 0)
  }
  .onAppear {
    withAnimation(.smooth(duration: 0.4).delay(0.25)) {
      sheetReady = true
    }
  }
  .onDisappear { sheetReady = false }
}
```

### 6. Custom `AnyTransition`

For reusable, domain-specific transitions.

```swift
extension AnyTransition {
  static var revealUp: AnyTransition {
    .asymmetric(
      insertion: .move(edge: .bottom).combined(with: .opacity).combined(with: .scale(scale: 0.98)),
      removal: .opacity
    )
  }
}

myView.transition(.revealUp)
```

### 7. List row insertion / removal

`List` already animates inserts and removals when wrapped in `withAnimation` at the source of truth.

```swift
withAnimation(.snappy) {
  items.insert(newItem, at: 0)
}
```

For SwiftData / Observation, just mutate the model — the list will animate as long as the change happens inside `withAnimation`.

### 8. Staggered children on appear

For a screen that shows several items at once and you want them to materialize in sequence.

```swift
@State private var appeared = false

ForEach(Array(items.enumerated()), id: \.element.id) { index, item in
  Row(item: item)
    .opacity(appeared ? 1 : 0)
    .offset(y: appeared ? 0 : 12)
    .animation(
      .smooth(duration: 0.5).delay(min(Double(index), 2) * 0.07),
      value: appeared
    )
}
.onAppear { appeared = true }
```

**Stagger spacing:** 60–80ms between siblings. Treat 100ms as a hard ceiling; longer gaps read as cascade rather than choreography and break the perceptual link between the elements. Cap stagger at the first 3 elements — clamp `index` (as above) so item 4+ uses the same delay as item 3 and the rest appear together. The total appear sequence (longest delay + duration) should land within ~1 second.

**For onboarding hero compositions** (image + title + subtitle + CTA), use delays like `0.06, 0.13, 0.20, 0.27` (about 70ms apart). Total wall-clock to settle: ~0.8s with a 0.5–0.6s spring duration. Anything longer feels reluctant.

**Do not add ambient continuous motion to once-played sequences.** No `.repeatForever`, no `.symbolEffect(.pulse, options: .repeating)`, no phaseAnimator breathe on the hero icon. Onboarding plays once, settles, and then waits quietly for the user. (See `motion-principles.md` "Once-played sequences stay once-played".)

## Anti-patterns

- Adding `.transition` to a view that doesn't sit inside an `if` / `switch` branch — it'll silently do nothing.
- Wrapping a `NavigationStack` push with `withAnimation` — the stack already manages its own.
- Two `matchedGeometryEffect`s with the same id visible simultaneously — undefined behavior, usually visible glitches.
- Long sheet entry transitions (> 500ms) — fights the system sheet timing.
- Animating `presentationDetents` resize manually — let the system do it.
- Forgetting to put the conditional inside a `Group` (or applying `.transition` to a stack of plain `if`s) — transition modifiers are applied to the resolved view, not the conditional.
