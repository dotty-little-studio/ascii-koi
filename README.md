# Nishikigoi · ASCII pond

Three ASCII koi on a light field, with quiet schooling fish and gentle swimming motion. No audio or external runtime dependencies.

## Light and quiet hours

Automatic mode follows the viewer device’s local clock, not geolocation: day 06:00–17:00, evening 17:00–20:00, night 20:00–06:00. The clock, sun, sunset and moon buttons at bottom right select automatic/day/evening/night. Manual selection is remembered on this browser when local storage is available; choose the clock to restore automatic switching. The page refreshes the clock on tab return and at 30-second intervals.

Water and fish pigments transition gently between light, warm dusk and dark blue night palettes. Evening slows swimming to 88%. At night, koi gently settle in place while their tails and fins keep a very small, slow movement; the tiny schooling fish continue drifting. An existing close overlap is allowed to separate before settling. Day or evening restores swimming smoothly without repositioning the fish. The koi physics and avoidance planner share the same slowed clock; no new plans are requested while the koi are resting. Reduced-motion preferences keep a still scene while allowing immediate theme changes.

## Run

Serve this folder using a static HTTP server, then open index.html. The animation uses a same-origin JavaScript module worker; opening the HTML directly with file:// is not supported. Relative paths support both a website root and a project subdirectory. For GitHub Pages, publish this folder as the site root.

## Credits and source

Based on the actual [stackedlol/ascii-sharks](https://github.com/stackedlol/ascii-sharks) implementation. The original derivation used commit c521e24a787e6d4cc460d4cf2b9815f25e4fe453. The author subsequently added the MIT license in release [a0074c16](https://github.com/stackedlol/ascii-sharks/commit/a0074c16a106f0abc665fe9712ca445f8f98ad8e). That later release adds license metadata; its only implementation difference from the original source is a renderer resize allocation guard. This scene retains its reviewed resize behavior and records the later license without claiming that the earlier commit contained it.

The full upstream notice, Copyright (c) 2026 drewdi, is preserved in LICENSE.upstream.txt. Retain this notice with copies or substantial portions of the upstream-derived software. This notice identifies the upstream license, not a blanket license for unrelated work.

This adaptation changes the fish anatomy and color treatment to koi, introduces calm tempo and water light, retains the original small-fish schooling, and adds predictive torso-aware yielding through a worker. Occasional overlap or faint fin-tip edge contact remains possible. It is an adaptation, not the original author's artwork or an exact reproduction of the reference motion.

The app and worker are readable JavaScript bundles. This source-only package intentionally contains no prior repository history, development logs, or rollback versions.

Night resting also includes a very small, bounded whole-body sway around each rest anchor (under 2 pixels at normal canvas scale), with independent slow phases. It does not accumulate into swimming drift.

At night, small tail flicks have fish-specific varied pauses, durations and strengths, with smooth starts and finishes. This is a quiet artistic resting expression, not a biological simulation.
