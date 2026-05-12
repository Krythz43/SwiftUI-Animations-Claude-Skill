# API matrix

Truth table for which SwiftUI animation APIs are available at which deployment target. Use it to gate code with `#available`. The skill should never silently raise the project's deployment target — if a desired API requires a higher target, either gate it or pick a fallback pattern.

## Core animation APIs

| API | iOS | macOS | watchOS | visionOS |
|---|---|---|---|---|
| `withAnimation`, `.animation(_:value:)` | 13 | 10.15 | 6 | 1 |
| `Animatable`, `AnimatableModifier` | 13 | 10.15 | 6 | 1 |
| `GeometryEffect` | 13 | 10.15 | 6 | 1 |
| `.transition(_:)` | 13 | 10.15 | 6 | 1 |
| `matchedGeometryEffect(id:in:)` | 14 | 11 | 7 | 1 |
| Spring (iOS 13 API: `response`/`dampingFraction`) | 13 | 10.15 | 6 | 1 |
| Spring (iOS 17 API: `duration`/`bounce`) | 17 | 14 | 10 | 1 |
| `.snappy`, `.bouncy`, `.smooth` presets | 17 | 14 | 10 | 1 |
| `phaseAnimator(_:content:)` | 17 | 14 | 10 | 1 |
| `keyframeAnimator(initialValue:repeating:content:keyframes:)` | 17 | 14 | 10 | 1 |
| `Animation.interpolatingSpring(...)` | 14 | 11 | 7 | 1 |

## Symbol & haptics

| API | iOS | macOS | watchOS | visionOS |
|---|---|---|---|---|
| `.symbolEffect(_:options:value:)` | 17 | 14 | 10 | 1 |
| `.symbolEffect(.bounce / .pulse / .variableColor / .scale / .appear / .disappear)` | 17 | 14 | 10 | 1 |
| `.symbolEffect(.replace(...))` | 17 | 14 | 10 | 1 |
| `.contentTransition(.symbolEffect(.replace))` | 17 | 14 | 10 | 1 |
| `.symbolEffect(.wiggle / .breathe / .rotate)` (extended set) | 18 | 15 | 11 | 2 |
| `.sensoryFeedback(_:trigger:)` | 17 | 14 (limited on macOS) | 10 | 1 |

## Content & numeric transitions

| API | iOS | macOS | watchOS | visionOS |
|---|---|---|---|---|
| `.contentTransition(.identity)` | 16 | 13 | 9 | 1 |
| `.contentTransition(.opacity)` | 16 | 13 | 9 | 1 |
| `.contentTransition(.numericText(...))` | 16 | 13 | 9 | 1 |
| `.contentTransition(.interpolate)` | 17 | 14 | 10 | 1 |

## Navigation & presentation

| API | iOS | macOS | watchOS | visionOS |
|---|---|---|---|---|
| `.navigationTransition(.zoom(sourceID:in:))` | 18 | 15 | 11 | 2 |
| `.matchedTransitionSource(id:in:)` | 18 | 15 | 11 | 2 |
| `.presentationDetents([.medium, .large, ...])` | 16 | 13 | 9 | 1 |
| `.presentationBackgroundInteraction` | 16.4 | 13.3 | 9.4 | 1 |

## Visual / metal

| API | iOS | macOS | watchOS | visionOS |
|---|---|---|---|---|
| `.colorEffect(_:)`, `.distortionEffect(_:)`, `.layerEffect(_:)` (Metal shaders) | 17 | 14 | — | 1 |
| `MeshGradient` | 18 | 15 | 11 | 2 |
| `TimelineView` | 15 | 12 | 8 | 1 |
| `Canvas` | 15 | 12 | 8 | 1 |

## Gating patterns

### Single-API gate

```swift
if #available(iOS 17, *) {
  view.symbolEffect(.bounce, value: trigger)
} else {
  view.scaleEffect(trigger ? 1.1 : 1.0)
    .animation(.interpolatingSpring(stiffness: 300, damping: 12), value: trigger)
}
```

### Modifier-style gate (preferred when reusable)

```swift
extension View {
  @ViewBuilder
  func bounceOnChange<V: Equatable>(of value: V) -> some View {
    if #available(iOS 17, *) {
      self.symbolEffect(.bounce, value: value)
    } else {
      self.modifier(LegacyBounceModifier(value: value))
    }
  }
}
```

### Container-level gate (for hero transitions)

```swift
NavigationLink {
  if #available(iOS 18, *) {
    DetailView(item: item)
      .navigationTransition(.zoom(sourceID: item.id, in: hero))
  } else {
    DetailView(item: item)
  }
} label: {
  Thumbnail(item: item)
    .modifier(MatchedTransitionSourceIfAvailable(id: item.id, namespace: hero))
}
```

## Fallback table

| Modern API | Pre-17 fallback |
|---|---|
| `phaseAnimator` | `@State` + chained `withAnimation` + `Task.sleep` |
| `keyframeAnimator` | Cascading `.animation(...delay:)` per property |
| `.symbolEffect(.bounce)` | `scaleEffect` + interpolating spring |
| `.symbolEffect(.replace)` | Cross-fade two `Image` siblings via opacity |
| `.sensoryFeedback` | `UIImpactFeedbackGenerator` (UIKit interop) |
| `.snappy / .bouncy / .smooth` | `.interpolatingSpring(stiffness:damping:)` tuned to taste |
| `.contentTransition(.numericText())` | `Text.transition(.opacity)` + `.id(value)` |
| `MeshGradient` | `LinearGradient` / `RadialGradient` composited in `ZStack` |
