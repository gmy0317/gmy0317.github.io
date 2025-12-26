# Logan – Spelling Practice (HTML + JavaScript)

This folder is a small offline web app for spelling practice using your word + picture set.

## How to run

1. Open `index.html` in Chrome / Edge / Safari.
2. Choose:
   - Mode A (4 choices)
   - Mode B (phonics tiles + audio)
   - Mode C (type the word)
3. Pick how many words today and start.

## Audio (Mode B)

Click the picture to hear the word (3 times).  
Audio uses the browser’s built-in **Speech Synthesis** voice and may differ by device.

## Progress (familiarity)

Progress is stored in **localStorage** on the device (no account, no backend).

Each word has a **Level 0–5**:
- Correct: level +1 (max 5)
- Wrong: level -1 (min 0)

Use **Reset progress** on the home screen if needed.

## Data files

- `words.json` – mapping of word → image file
- `words.csv`  – mapping of word → image file
- `data.js`    – same list as a JS constant
- `assets/`    – the cropped icons extracted from your photos

