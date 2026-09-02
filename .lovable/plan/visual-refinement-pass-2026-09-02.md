# Visual refinement pass

A styling pass over the academic theme, plus two small changes you asked for: remove the playback control and make each chapter show its idea visually rather than as a block of text.

## 0. Remove the play option
- Remove the play/pause playback button and the 7-second auto-advance from the chapter player; navigation stays via previous/next and the step dots.
- Delete the leftover unused voice/narration backend file so nothing audio-related remains.


## 1. Typography hierarchy
- Chapter/step titles: serif display, bolder and noticeably larger; body/narration stays sans-serif, regular weight, smaller, with softer color.
- Page titles, section headings and tab headings get the same serif treatment; small labels, tags, captions and step counters switch to sans-serif at a small size.

## 2. Progress indicator
Rework the step dots in the player:
- Completed steps: solid filled amber dots.
- Current step: larger filled amber dot with a subtle amber ring.
- Upcoming steps: hollow outline circles in muted grey.
Connecting line stays; step numbers remain only as accessible labels.

## 3. Section boundaries
- 1px hairline top border plus a slightly different background shade between the animation canvas and the narration section below it.
- Same divider treatment above heading-led sections (e.g. "Preventing Deadlock" style step titles) and above the Knowledge DNA / Practice panels, so sections read as structured rather than floating.

## 4. Tags / pills
Entity tags ("Producer", "Consumer", "Mutex Semaphore", "Deadlock") lose the hard rectangular outline: borderless pills with a very light paper/amber tint, sans-serif small text.

## 5. Diagram area — show, don't tell
Make the canvas render a real, step-reactive visual instead of only grid paper, so the explanation is carried by the diagram and the text becomes a short caption.
- Draw the actual moving parts for flow topics: buffer slots that fill and empty, producer/consumer nodes, and semaphore/counter values, derived from each step's entities and updating as the step advances (active node amber, completed path sage, upcoming muted).
- Animate the change between steps: flowing connector, token moving along the path, counters ticking.
- Other template types (states, grid, tree) get the same treatment in their own idiom — highlighted active state, arrows showing direction of change, values shown on the diagram.
- The narration text shrinks to a supporting caption beneath the diagram rather than the main content.


## 6. Consistency check
Apply serif headings, paper surfaces, navy/amber palette, new tags and new dots across every screen still in the app: home, library, upload, auth, chapter player, Knowledge DNA and Practice tabs. Any leftover dark-teal-era styling gets replaced.

Note: the concept map and ask-the-doc/chat views were removed at your earlier request, so there is nothing to restyle there. Say the word if you want them back.

## Technical notes
- Tokens, fonts and utility classes in `src/styles.css` (Tailwind v4 `@theme`), fonts loaded in `src/routes/__root.tsx`.
- Component edits: `StepPlayer.tsx` (hierarchy, dots, dividers, tags), `TopicVisual.tsx` (step-reactive diagram), `PracticeSet.tsx`, `AppShell.tsx`, and the routes `index`, `library`, `upload`, `auth`, `explainer.$id`.
- Verified visually in the preview after the edits.
