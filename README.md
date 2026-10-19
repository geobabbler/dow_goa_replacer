# DoW → DoD Text Replacer

A Chrome extension that replaces, on every page you view:

| Find | Replace with |
|---|---|
| `Department of War` | `Department of Defense` |
| `War Department` | `Defense Department` |
| `Gulf of America` | `Gulf of Mexico` |
| `Lake America` | `Lake Ontario` |
| `DoW` | `DoD` |

The phrase replacements are case-insensitive and preserve the original capitalization style (e.g. `WAR DEPARTMENT` → `DEFENSE DEPARTMENT`, `war department` → `defense department`; anything else keeps the replacement's normal casing, like `Gulf of Mexico`). The `DoW` → `DoD` swap only matches that exact capitalization as a whole word, so it won't touch unrelated text like "Dow Jones."

It works on the live DOM, so it also catches text that loads in dynamically (infinite-scroll feeds, SPA navigation, etc.), and it leaves script/style/code/input content alone.

## Install (unpacked, for personal use)

1. Unzip this folder somewhere permanent (don't delete it after installing — Chrome loads the extension from this folder).
2. Open `chrome://extensions` in Chrome.
3. Turn on **Developer mode** (top-right toggle).
4. Click **Load unpacked** and select the `dow-to-dod-extension` folder.
5. The extension is now active on every page. Click its toolbar icon to pause/resume it.

## Notes

- Pausing the extension stops *new* replacements but doesn't undo text already changed on open tabs — reload a tab to fully restore the original wording.
- It only rewrites what's displayed in your own browser; it doesn't modify or transmit anything.
