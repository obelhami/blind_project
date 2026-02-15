# Banana Agent – app icon prompt

Use one of the prompts below in Banana Agent. If the first result is off, try the next.

---

## Prompt 1 (short, best for most models)

```
Flat design app icon, white background. Teal caduceus (staff with two coiled snakes and small wings at top) in the center. Dark gray stethoscope: two tubes in a V shape around it, one tube going down into a curved loop with a circular chest piece on the right. Minimalist medical logo, vector style, no text, no shadows, square.
```

**Negative prompt (use if the tool has a “negative” or “avoid” field):**  
`watermark, text, letters, 3D, realistic, photo, blurry, complex background`

---

## Prompt 2 (more detail)

```
Medical app icon. White square background. Central symbol: classic caduceus in bright teal – vertical staff, ring at top, two snakes wrapped around staff facing each other, two flat wings below the ring. Wrapped around it: dark gray stethoscope with V-shaped earpieces and a single tube looping down to a round chest piece on the right. Flat vector logo, clean lines, professional, no gradients, no text.
```

**Negative:** `copyright, watermark, signature, 3D, glossy, photograph`

---

## Prompt 3 (style-first)

```
iOS style app icon, flat vector logo, white background. One symbol: caduceus merged with stethoscope. Teal: staff, snakes, wings. Gray: stethoscope tubes and round diaphragm. Simple, recognizable at 64px, medical or health app, no words.
```

**Negative:** `text, watermark, realistic, dark background, crowded`

---

## After you get a good image

1. Save as PNG (512×512 or 1024×1024).
2. Save to: `public/favicon.png`
3. In `index.html` switch to PNG:

```html
<link rel="icon" href="/favicon.png" type="image/png" />
<link rel="apple-touch-icon" href="/favicon.png" />
```

If results are still not good, say what’s wrong (e.g. “snakes look wrong”, “too detailed”, “wrong colors”) and we can refine the prompt or try a different approach.
