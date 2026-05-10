<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Use Untitled UI components first

Before building UI from scratch:

1. Check `components/base/` for an existing component (buttons, input, tags, toast, tooltip, …). Reuse it.
2. If none exists, look up the matching component on Untitled UI (https://www.untitledui.com/react/components) and port it into `components/base/<name>/<name>.tsx` following the conventions of the existing ones — `react-aria-components` primitives, `cx`/`sortCx` from `@/utils/cx`, `"use client"` when interactive.
3. Use `@untitledui/icons` for icons — do not hand-roll SVGs or pull in a second icon library.
4. Only build a custom component when nothing in Untitled UI fits. When you do, match the file/style conventions in `components/base/` so it slots in.
