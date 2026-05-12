# Gesture-driven animations

Animations that follow the user's finger / cursor in real time, then resolve. The hardest category to get right because the user is in direct control — any mismatch between intent and motion feels broken.

## When to use

- Drag-to-dismiss sheets / cards
- Swipe-to-delete / swipe-to-action rows
- Pinch-to-zoom photos / maps
- Pull-to-refresh
- Card stacks (Tinder-style)
- Scrubbers and sliders with custom feel

## Core principle

**The motion during the gesture is the user's. The motion after release is yours.**

- During gesture: track `value.translation` directly, no animation. Optionally damp / rubber-band beyond bounds.
- On release: spring to the resolved state with `withAnimation(.snappy)` — and *only then* fire any haptic.

## Patterns

### 1. Drag-to-dismiss with rubber-band

```swift
@State private var dragY: CGFloat = 0
private let dismissThreshold: CGFloat = 120

card
  .offset(y: dragY)
  .scaleEffect(1 - min(abs(dragY), 200) / 1500)
  .gesture(
    DragGesture()
      .onChanged { value in
        let raw = value.translation.height
        dragY = raw > 0 ? raw : raw / 4   // rubber-band upward
      }
      .onEnded { value in
        if value.translation.height > dismissThreshold {
          withAnimation(.smooth(duration: 0.35)) { dragY = 800 }
          dismissAction()
        } else {
          withAnimation(.snappy) { dragY = 0 }
        }
      }
  )
```

Note the asymmetric rubber-band: pulling down (toward dismiss) tracks 1:1, pulling up (away from dismiss) divides by 4.

### 2. Swipe-to-action row

Use SwiftUI's built-in `.swipeActions` modifier first — it animates row collapse for free.

```swift
.swipeActions(edge: .trailing) {
  Button(role: .destructive) {
    withAnimation(.snappy) { items.remove(at: index) }
  } label: { Label("Delete", systemImage: "trash") }
}
```

Build a custom swipe-to-action only if `.swipeActions` doesn't fit (e.g., you need a multi-stage reveal with custom thresholds).

### 3. Pull-to-refresh

```swift
.refreshable { await reload() }
.sensoryFeedback(.success, trigger: lastRefreshAt)
```

The default behavior already animates correctly. Add the haptic on completion; don't animate the indicator yourself.

### 4. Pinch-to-zoom with snap-back

```swift
@State private var scale: CGFloat = 1
@State private var lastScale: CGFloat = 1

image
  .scaleEffect(scale)
  .gesture(
    MagnifyGesture()
      .onChanged { value in
        scale = lastScale * value.magnification
      }
      .onEnded { _ in
        if scale < 1 {
          withAnimation(.snappy) { scale = 1 }
        } else if scale > 4 {
          withAnimation(.snappy) { scale = 4 }
        }
        lastScale = scale
      }
  )
```

Bounds: clamp during gesture if you want hard limits, or let it overshoot during gesture and spring back on release (preferred — feels more elastic).

### 5. Threshold haptic during drag

A single haptic at the moment the user crosses the action threshold tells them "if you let go now, this happens".

```swift
@State private var crossedThreshold = false
@State private var offset: CGFloat = 0

card
  .offset(x: offset)
  .gesture(
    DragGesture()
      .onChanged { value in
        offset = value.translation.width
        let crossed = value.translation.width < -dismissThreshold
        if crossed != crossedThreshold {
          crossedThreshold = crossed
        }
      }
      .onEnded { _ in
        withAnimation(.snappy) { offset = crossedThreshold ? -600 : 0 }
        if crossedThreshold { performAction() }
        crossedThreshold = false
      }
  )
  .sensoryFeedback(.impact(weight: .light), trigger: crossedThreshold)
```

### 6. Card stack swipe (Tinder-style)

```swift
@State private var offset: CGSize = .zero

card
  .offset(offset)
  .rotationEffect(.degrees(Double(offset.width / 20)))   // tilt with drag
  .gesture(
    DragGesture()
      .onChanged { offset = $0.translation }
      .onEnded { value in
        if abs(value.translation.width) > 120 {
          let direction: CGFloat = value.translation.width > 0 ? 1 : -1
          withAnimation(.smooth(duration: 0.3)) {
            offset = CGSize(width: direction * 600, height: value.translation.height)
          }
          // Pop the card from the stack after the off-screen animation
        } else {
          withAnimation(.bouncy) { offset = .zero }
        }
      }
  )
```

### 7. Custom slider with momentum

For media scrubbers / volume / value pickers where the user wants tactile control.

- Track position 1:1 during gesture.
- On release without flick: settle with `.snappy`.
- On release with flick (high velocity): use predicted end location to project momentum, then settle.

```swift
.onEnded { value in
  let velocity = value.predictedEndLocation.x - value.location.x
  let projected = currentValue + velocity * 0.0005
  withAnimation(.smooth(duration: 0.4)) {
    currentValue = max(0, min(1, projected))
  }
}
```

### 8. Drag in a `ScrollView` (direction lock)

When you need a horizontal swipe inside a vertical scroll, the parent scroll wins by default. Add direction lock and `.simultaneousGesture`.

```swift
@State private var dragX: CGFloat = 0
@State private var lockedAxis: Axis?

card
  .offset(x: dragX)
  .simultaneousGesture(
    DragGesture(minimumDistance: 8)
      .onChanged { value in
        if lockedAxis == nil {
          lockedAxis = abs(value.translation.width) > abs(value.translation.height) ? .horizontal : .vertical
        }
        guard lockedAxis == .horizontal else { return }
        dragX = value.translation.width
      }
      .onEnded { _ in
        withAnimation(.snappy) { dragX = 0 }
        lockedAxis = nil
      }
  )
```

If the locked axis is vertical, the scroll keeps working untouched.

## Anti-patterns

- Wrapping `onChanged` in `withAnimation` — the value should track the finger directly, not be filtered through animation.
- Springs that overshoot during gesture (looks broken; user moved 10pt and view moved 30pt).
- Haptics every frame during drag — fire on threshold crossings only.
- Combining custom drag with a parent `ScrollView` without direction lock — the scroll wins and you get half-tracked drags.
- Snap-back springs slower than ~400ms after release — feels like the view is reluctant.
- Forgetting `.simultaneousGesture` when nesting drag inside a tap-able view.
- Using `DragGesture(minimumDistance: 0)` on something inside a `ScrollView` — fights scroll, makes the whole list feel sluggish.
