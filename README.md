# Nishikigoi · ASCII pond

Three ASCII koi on a light field, with quiet schooling fish and gentle swimming motion. No audio or external runtime dependencies.

## Run

Serve this folder using a static HTTP server, then open index.html. The animation uses a same-origin JavaScript module worker; opening the HTML directly with file:// is not supported. Relative paths support both a website root and a project subdirectory. For GitHub Pages, publish this folder as the site root.

## Credits and source

Based on the actual [stackedlol/ascii-sharks](https://github.com/stackedlol/ascii-sharks) implementation. The original derivation used commit c521e24a787e6d4cc460d4cf2b9815f25e4fe453. The author subsequently added the MIT license in release [a0074c16](https://github.com/stackedlol/ascii-sharks/commit/a0074c16a106f0abc665fe9712ca445f8f98ad8e). That later release adds license metadata; its only implementation difference from the original source is a renderer resize allocation guard. This scene retains its reviewed resize behavior and records the later license without claiming that the earlier commit contained it.

The full upstream notice, Copyright (c) 2026 drewdi, is preserved in LICENSE.upstream.txt. Retain this notice with copies or substantial portions of the upstream-derived software. This notice identifies the upstream license, not a blanket license for unrelated work.

This adaptation changes the fish anatomy and color treatment to koi, introduces calm tempo and water light, retains the original small-fish schooling, and adds predictive torso-aware yielding through a worker. Occasional overlap or faint fin-tip edge contact remains possible. It is an adaptation, not the original author's artwork or an exact reproduction of the reference motion.

The app and worker are readable JavaScript bundles. This source-only package intentionally contains no prior repository history, development logs, or rollback versions.
