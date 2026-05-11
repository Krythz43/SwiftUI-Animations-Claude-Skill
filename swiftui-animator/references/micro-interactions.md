# Micro-interactions

Small motions in response to user input. Should feel instant (≤ 250ms) and never get in the way.

## When to use

- Buttons and toggle states
- SF Symbol state changes (heart fill / unfill, bookmark, save)
- Selection indicators
- Hover and focus states (macOS / iPadOS pointer)
- Confirmation feedback (tick, success)

## Patterns

### 1. Press feedback (the "alive button")

The cheapest possible upgrade. Apply when a button feels dead on tap.

```swift
struct PressableButtonStyle: ButtonStyle {
  func makeBody(configuration: Configuration) -> some View {
    configuration.label
      .scaleEffect(configuration.isPressed ? 0.96 : 1.0)
      .animation(.snappy(duration: 0.18), value: configuration.isPressed)
  }
}

Button("Save") { ... }
  .buttonStyle(PressableButtonStyle())
```

When to use: any tappable surface bigger than a list row chevron.
When to skip: inside a `List` row (the row's own selection feedback covers it), inside a `Menu` item.

### 2. SF Symbol state change

Use `.symbolEffect` — never `withAnimation` — for SF Symbol transitions.

```swift
Image(systemName: isFavorite ? "heart.fill" : "heart")
  .foregroundStyle(isFavorite ? .pink : .secondary)
  .symbolEffect(.bounce.up, value: isFavorite)
  .contentTransition(.symbolEffect(.replace.downUp))
  .sensoryFeedback(.impact(weight: .light), trigger: isFavorite)
```

When to use: any SF Symbol with two or more semantic states.
When to skip: chevrons, decorative glyphs, status dots.

### 3. Toggle / switch with morph

For toggles where the state change is meaningful (mute / unmute, dark / light, online / offline). For SF Symbols specifically, prefer `.contentTransition(.symbolEffect(.replace))` on a single `Image` over the `if/else` switch.

```swift
Image(systemName: isOn ? "speaker.wave.2.fill" : "speaker.slash.fill")
  .contentTransition(.symbolEffect(.replace.upUp))
  .animation(.bouncy(duration: 0.4, extraBounce: 0.15), value: isOn)
```

### 4. Selection ring / underline (matched indicator)

When the user picks one of N siblings, animate a single shared shape under the selection rather than animating each sibling.

```swift
@Namespace private var selection

HStack {
  ForEach(tabs, id: \.self) { tab in
    Button(tab) { selected = tab }
      .background {
        if selected == tab {
          RoundedRectangle(cornerRadius: 8)
            .fill(.tint.opacity(0.15))
            .matchedGeometryEffect(id: "indicator", in: selection)
        }
      }
  }
}
.animation(.snappy, value: selected)
```

This is one of the highest-impact-per-line patterns in SwiftUI. Use it for tabs, segmented controls, filter chips.

### 5. Stateful icon (loading → success → idle)

For a button that performs async work and shows a result.

```swift
enum LoadState { case idle, loading, success }

@State private var state: LoadState = .idle

Group {
  switch state {
  case .idle:    Image(systemName: "arrow.up.circle.fill")
  case .loading: ProgressView()
  case .success:
    Image(systemName: "checkmark.circle.fill")
      .foregroundStyle(.green)
      .symbolEffect(.bounce, value: state)
  }
}
.contentTransition(.symbolEffect(.replace))
.animation(.smooth(duration: 0.3), value: state)
.sensoryFeedback(.success, trigger: state == .success)
```

### 6. Number ticker

For counters, balances, scores.

```swift
Text(count, format: .number)
  .contentTransition(.numericText(value: Double(count)))
  .animation(.snappy, value: count)
```

iOS 16+ for `.numericText`. Fallback: `.transition(.opacity)` with `.id(count)`.

### 7. Hover (macOS / iPadOS pointer)

```swift
@State private var isHovering = false

card
  .scaleEffect(isHovering ? 1.02 : 1.0)
  .shadow(radius: isHovering ? 12 : 6)
  .onHover { isHovering = $0 }
  .animation(.smooth(duration: 0.2), value: isHovering)
```

Skip the shadow animation if you're animating many cards at once — shadows are expensive.

### 8. Focus ring (visionOS / tvOS / keyboard nav)

```swift
@FocusState private var isFocused: Bool

button
  .focused($isFocused)
  .overlay(
    RoundedRectangle(cornerRadius: 12)
      .stroke(.tint, lineWidth: isFocused ? 2 : 0)
  )
  .scaleEffect(isFocused ? 1.04 : 1.0)
  .animation(.snappy, value: isFocused)
```

## Haptics map

| Moment | Feedback |
|---|---|
| Toggle state change | `.impact(weight: .light)` |
| Confirmed action (favorite, save) | `.impact(weight: .medium)` |
| Success result | `.success` |
| Error / invalid input | `.error` |
| Selection from a list / picker | `.selection` |
| Threshold crossing during drag | `.impact(weight: .light)` (one-shot at the boundary) |

Never fire haptics on every gesture-update tick. Fire on commits and threshold crossings only.

## Anti-patterns

- Animating `.foregroundStyle` color changes with springs — color crossfades, it doesn't bounce.
- Bouncy press states on long-press primary CTAs — undermines weight.
- Symbol effects on every icon in a navigation bar — the toolbar should be calm.
- Combining `.symbolEffect` and a manual `scaleEffect` on the same icon — they fight.
- Wrapping `Button` actions in `withAnimation` — implicit animations on state inside the button view are usually enough; explicit `withAnimation` belongs around state owned outside the button.
