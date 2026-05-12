# Loading & state animations

Animations that communicate "something is happening" or "something just changed". The job is to make waiting feel intentional and state changes feel earned.

## When to use

- Async data fetches (network, disk, model inference)
- Empty / loaded / error states
- Progress indication (determinate or indeterminate)
- Success / error confirmations
- Counter changes, balance updates, score increments

## Patterns

### 1. Skeleton placeholder

For inline content while data loads. The skeleton replaces the content shape.

```swift
struct SkeletonRow: View {
  @State private var phase: CGFloat = 0

  var body: some View {
    HStack {
      Circle().frame(width: 40, height: 40)
      VStack(alignment: .leading, spacing: 6) {
        RoundedRectangle(cornerRadius: 4).frame(height: 10).frame(maxWidth: .infinity)
        RoundedRectangle(cornerRadius: 4).frame(height: 10).frame(maxWidth: 180)
      }
    }
    .foregroundStyle(.tertiary)
    .opacity(0.6 + 0.4 * sin(phase))
    .onAppear {
      withAnimation(.linear(duration: 1.4).repeatForever(autoreverses: true)) {
        phase = .pi
      }
    }
    .accessibilityHidden(true)
  }
}
```

For richer skeletons, replace the opacity pulse with shimmer (pattern 2).

### 2. Shimmer (gradient mask + phase)

```swift
struct Shimmer: ViewModifier {
  @State private var phase: CGFloat = -1

  func body(content: Content) -> some View {
    content.overlay(
      LinearGradient(
        stops: [
          .init(color: .white.opacity(0), location: 0),
          .init(color: .white.opacity(0.4), location: 0.5),
          .init(color: .white.opacity(0), location: 1),
        ],
        startPoint: .leading, endPoint: .trailing
      )
      .rotationEffect(.degrees(20))
      .offset(x: phase * 300)
      .blendMode(.plusLighter)
    )
    .mask(content)
    .onAppear {
      withAnimation(.linear(duration: 1.6).repeatForever(autoreverses: false)) {
        phase = 1
      }
    }
  }
}

extension View { func shimmer() -> some View { modifier(Shimmer()) } }
```

iOS 17+ alternative: drive `phase` via `phaseAnimator([CGFloat(-1), 1])` for a cleaner lifecycle.

### 3. Progress with animated number

```swift
ProgressView(value: progress)
  .animation(.smooth, value: progress)

Text(progress, format: .percent.precision(.fractionLength(0)))
  .contentTransition(.numericText(value: progress))
  .animation(.snappy, value: progress)
```

For determinate uploads where the number is part of the UX.

### 4. State morph (loading → success / error)

```swift
enum FetchState: Hashable { case idle, loading, success, error(String) }

@State private var state: FetchState = .idle

Group {
  switch state {
  case .idle:
    Color.clear
  case .loading:
    ProgressView()
  case .success:
    Image(systemName: "checkmark.circle.fill")
      .font(.largeTitle).foregroundStyle(.green)
      .symbolEffect(.bounce, value: state)
  case .error(let message):
    VStack {
      Image(systemName: "exclamationmark.triangle.fill")
        .font(.largeTitle).foregroundStyle(.red)
        .symbolEffect(.pulse)
      Text(message).font(.footnote)
    }
  }
}
.transition(.opacity.combined(with: .scale(scale: 0.96)))
.animation(.smooth(duration: 0.35), value: state)
.sensoryFeedback(.success, trigger: state == .success)
.sensoryFeedback(.error, trigger: { if case .error = state { return true }; return false }())
```

### 5. Pulsing attention dot

For "new content available" / "unread".

```swift
ZStack {
  Circle().fill(.blue).frame(width: 8, height: 8)
  Circle()
    .fill(.blue)
    .frame(width: 8, height: 8)
    .scaleEffect(pulsing ? 2.2 : 1.0)
    .opacity(pulsing ? 0 : 0.6)
}
.onAppear {
  withAnimation(.easeOut(duration: 1.2).repeatForever(autoreverses: false)) {
    pulsing = true
  }
}
```

The trick: a static dot underneath, an animated dot on top expanding and fading.

### 6. Multi-phase loader (iOS 17+)

For hero loaders (full-screen, while waiting on inference, etc.).

```swift
PhaseAnimator([0, 1, 2, 3]) { phase in
  Image(systemName: "sparkle")
    .font(.system(size: 48))
    .symbolRenderingMode(.hierarchical)
    .scaleEffect(phase == 1 || phase == 3 ? 1.15 : 1.0)
    .rotationEffect(.degrees(Double(phase) * 90))
} animation: { _ in
  .smooth(duration: 0.6)
}
```

Cap to 3–4 phases; longer cycles read as "stuck".

### 7. Keyframe loader (iOS 17+)

When you want a precise, choreographed loader.

```swift
struct LoaderState { var scale: Double = 1; var rotation: Double = 0; var opacity: Double = 1 }

KeyframeAnimator(initialValue: LoaderState(), repeating: true) { state in
  Image(systemName: "circle.dotted")
    .scaleEffect(state.scale)
    .rotationEffect(.degrees(state.rotation))
    .opacity(state.opacity)
} keyframes: { _ in
  KeyframeTrack(\.scale) {
    LinearKeyframe(0.9, duration: 0.3)
    SpringKeyframe(1.1, duration: 0.4, spring: .bouncy)
    LinearKeyframe(1.0, duration: 0.3)
  }
  KeyframeTrack(\.rotation) {
    LinearKeyframe(360, duration: 1.0)
  }
}
```

### 8. Async-state animator on a single view

When the user hits a button and the same view morphs through phases.

```swift
@State private var phase: SubmitPhase = .idle

Button {
  Task {
    withAnimation(.snappy) { phase = .loading }
    let success = await submit()
    withAnimation(.bouncy) { phase = success ? .done : .idle }
    if success {
      try? await Task.sleep(for: .seconds(1.2))
      withAnimation(.smooth) { phase = .idle }
    }
  }
} label: {
  HStack {
    switch phase {
    case .idle:    Text("Submit")
    case .loading: ProgressView().tint(.white)
    case .done:    Image(systemName: "checkmark").symbolEffect(.bounce, value: phase)
    }
  }
  .frame(width: phase == .loading ? 44 : 120)
  .frame(height: 44)
  .background(phase == .done ? .green : .accentColor, in: .capsule)
  .foregroundStyle(.white)
}
.sensoryFeedback(.success, trigger: phase == .done)
```

This is the "morphing submit button" — width morphs to a circle for loading, expands back with a check on success. Heavily worth it for paid actions, sign-in flows, primary CTAs.

## Anti-patterns

- Animating skeletons that are visible for < 200ms — flashes worse than no skeleton. Gate with a brief delay before showing.
- Mixing skeleton and real content in the same row — pick one per row.
- Spinners that loop forever without a "still trying" message; after ~3s, change copy.
- Success animations longer than 1.5s — users want to move on.
- Repeating ambient animations (pulses) on every list row simultaneously — visual noise. Pulse the most recent one only.
