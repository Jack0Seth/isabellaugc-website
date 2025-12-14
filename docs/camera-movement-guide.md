# Camera Movement Developer Guide

This guide explains how to modify the camera movement and scroll animations in the Penthouse 3D experience.

## File Location

**Main file:** `src/components/PentHouseWrapper.tsx`

---

## Architecture Overview

The camera movement is controlled through a combination of:

1. **Static Camera Position** - Set in the `<PerspectiveCamera>` component
2. **Model Animation on Scroll** - The penthouse model moves/scales toward the camera using GSAP ScrollTrigger
3. **Door Animations** - Doors open based on scroll progress

> [!NOTE]
> Instead of moving the camera, we animate the 3D model (scale + position) to create the illusion of camera movement. This approach provides smoother, more controlled animations.

---

## Key Configuration Parameters

### 1. Camera Initial Position

```tsx
// Line ~114 in PenthouseWrapper.tsx
<PerspectiveCamera makeDefault position={[0, 5, 12]} />
```

| Parameter | Description | Default |
|-----------|-------------|---------|
| `position[0]` | X-axis (left/right) | `0` |
| `position[1]` | Y-axis (up/down) | `5` |
| `position[2]` | Z-axis (forward/back) | `12` |

**To modify:** Change the `[x, y, z]` values to reposition the camera.

---

### 2. Penthouse Initial Position & Scale

```tsx
// Line ~117 in PenthouseWrapper.tsx
<AnimatedPenthouse position={[0, 2, -5]} scale={[0.4, 0.4, 0.4]} />
```

| Parameter | Description | Default |
|-----------|-------------|---------|
| `position` | Starting position of the model | `[0, 2, -5]` |
| `scale` | Initial scale of the model | `[0.4, 0.4, 0.4]` |

---

### 3. Scroll Container Height

```tsx
// Line ~109 in PenthouseWrapper.tsx
<div style={{ height: "400vh", position: "relative" }}>
```

- `400vh` = 4x viewport height = 4 "screens" of scrolling
- **Increase** this value for slower, longer animations
- **Decrease** for faster, shorter animations

---

## ScrollTrigger Configuration

Located in the `AnimatedPenthouse` component (lines ~25-42):

```tsx
const tl = gsap.timeline({
    scrollTrigger: {
        trigger: "body",
        start: "top top",
        end: "bottom bottom",
        scrub: 1.5,  // ← Smoothness factor
        onUpdate: (self) => {
            // Redirect logic at 95% scroll
            if (self.progress > 0.95 && !isLoading) {
                // ... redirect to /experience
            }
        },
    },
});
```

| Parameter | Description | How to Modify |
|-----------|-------------|---------------|
| `scrub` | Smoothness of scroll sync (0 = instant, higher = smoother) | Change `1.5` to desired value |
| `self.progress > 0.95` | Redirect trigger threshold | Change `0.95` to earlier/later |

---

## Animation Timeline

The timeline uses a duration of 10 units. Position values indicate when animations start.

### Scale Animation (Zoom Effect)

```tsx
// Lines ~50-56
tl.to(groupRef.current.scale, {
    x: 5,     // Final X scale
    y: 5,     // Final Y scale
    z: 5,     // Final Z scale
    duration: 10,
    ease: "power2.inOut",
}, 0);  // ← Starts at position 0
```

| Parameter | Description | Effect |
|-----------|-------------|--------|
| `x, y, z` | Final scale values | Larger = bigger model at end of scroll |
| `duration` | Animation length | Matches overall timeline |
| `ease` | Easing function | `power2.inOut` for smooth start/end |

---

### Position Animation (Forward Movement)

```tsx
// Lines ~59-64
tl.to(groupRef.current.position, {
    y: -2,    // Final Y position (vertical)
    z: 8,     // Final Z position (depth)
    duration: 10,
    ease: "power2.inOut",
}, 0);  // ← Starts at position 0
```

| Parameter | What it Controls |
|-----------|------------------|
| `y: -2` | Moves model down to center the door |
| `z: 8` | Moves model closer to camera |

---

### Door Animation

```tsx
// Lines ~71-84
if (leftDoor && rightDoor) {
    tl.to(leftDoor.rotation, {
        z: -Math.PI / 2,  // 90 degrees counter-clockwise
        duration: 3,
        ease: "power1.inOut",
    }, 5);  // ← Starts at position 5 (50% scroll)

    tl.to(rightDoor.rotation, {
        z: Math.PI / 2,   // 90 degrees clockwise
        duration: 3,
        ease: "power1.inOut",
    }, 5);  // ← Starts at position 5 (50% scroll)
}
```

| Parameter | Description |
|-----------|-------------|
| `z: ±Math.PI / 2` | Rotation angle (90 degrees) |
| `duration: 3` | How long the door takes to open |
| Position `5` | When doors start opening (50% of timeline) |

---

## Common Modifications

### Make Camera Approach Faster

1. **Reduce scroll height:**
   ```tsx
   <div style={{ height: "300vh", ... }}>
   ```

2. **Increase final z position:**
   ```tsx
   tl.to(groupRef.current.position, {
       z: 12,  // Closer to camera
   });
   ```

### Make Camera Approach Slower

1. **Increase scroll height:**
   ```tsx
   <div style={{ height: "600vh", ... }}>
   ```

2. **Increase scrub value:**
   ```tsx
   scrollTrigger: {
       scrub: 3,  // Slower sync
   }
   ```

### Change Door Opening Timing

Modify the position parameter (second number after the animation object):

```tsx
// Open doors earlier (30% scroll)
}, 3);  // Position 3 out of 10

// Open doors later (80% scroll)
}, 8);  // Position 8 out of 10
```

### Add Camera Rotation Effect

Add a rotation animation to the timeline:

```tsx
tl.to(groupRef.current.rotation, {
    y: Math.PI * 0.1,  // Slight rotation
    duration: 10,
    ease: "power2.inOut",
}, 0);
```

---

## Easing Functions Reference

| Easing | Effect |
|--------|--------|
| `"none"` | Linear, constant speed |
| `"power1.inOut"` | Gentle acceleration/deceleration |
| `"power2.inOut"` | Moderate acceleration/deceleration |
| `"power3.inOut"` | Strong acceleration/deceleration |
| `"elastic.out"` | Bouncy/springy effect |
| `"back.inOut"` | Slight overshoot |

---

## Debugging Tips

1. **Log scroll progress:**
   ```tsx
   onUpdate: (self) => {
       console.log('Scroll progress:', self.progress);
   }
   ```

2. **Check door names:**
   ```tsx
   console.log(groupRef.current.getObjectByName("penthouse_door_left"));
   ```

3. **Visualize timeline:**
   - Use GSAP DevTools browser extension for visual debugging

---

## Related Files

- `src/components/PentHouse.tsx` - 3D model component with mesh definitions
- `src/components/HudOverlay.tsx` - UI overlay that appears during the experience
- `src/app/experience/page.tsx` - The page navigated to after scroll completes
