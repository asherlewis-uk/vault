# FluidGlass 3D Assets

This directory is required by the `<FluidGlass />` component (`components/FluidGlass.tsx`).

## Required Files

| File       | Description                        |
| ---------- | ---------------------------------- |
| `lens.glb` | Glass lens / refractive disc model |
| `bar.glb`  | Glass bar / beam model             |
| `cube.glb` | Glass cube model                   |

## Notes

- Place your `.glb` files directly in this directory.
- The component will gracefully fall back to procedural geometry if any file is missing.
- Models should be optimized (< 500KB each) for web performance.
- Recommended: export from Blender with Draco compression enabled.
