# Промпты для картинок Different markets

Общий стиль: качественный предметный 3D-рендер, тёмный фон, мягкий свет и минимум лишних деталей. Не иконки, но и не перегруженные сцены. Снизу оставляем спокойную область для текста карточек.

## 1. Sports — один мяч

Формат: **4:5**.

```text
Premium photorealistic 3D product render of a single football, floating against a near-black studio background. A sophisticated editorial image for a prediction-market website, not a sports advertisement.

The ball has matte charcoal panels, subtle realistic texture and restrained metallic details. Soft ivory key light reveals its shape, with a muted dusty-rose rim light and a faint burgundy reflection. Natural shading, convincing material depth, elegant silhouette.

One main object, centered slightly above the middle, with generous negative space around it. Keep the bottom 30% dark and visually quiet for a text overlay. The subject should remain recognizable when cropped to a wider card.

Minimal composition, premium product-photography quality. No additional balls, stadium, particles, smoke, text or logos.
```

## 2. Crypto — стеклянные свечи

Формат: **16:11**.

```text
Premium photorealistic 3D product render of three sculptural trading candlesticks arranged as a compact financial-chart composition against a near-black studio background.

The candlesticks are physical objects made of smoked glass and brushed dark metal, with different heights and thin, clearly visible wicks. Subtle dusty-rose and muted mauve reflections, soft ivory highlights, realistic glass thickness and controlled reflections. An understated financial editorial image, not a futuristic dashboard.

Place the composition in the central area, slightly above the middle. Use generous negative space and keep the bottom 30% dark and quiet for a text overlay. Clear silhouette and strong readability at small sizes.

Elegant, restrained, high-end studio photography. No coins, currency symbols, screens, numbers, labels, glowing networks or extra objects.
```

## 3. Politics — бюллетень и урна

Формат: **4:3**.

```text
Premium photorealistic 3D product render of a minimal ballot box with a single paper ballot partially inserted into its narrow slot. Neutral, nonpartisan imagery for a political prediction-market website.

The box is made of matte graphite metal with softly rounded edges. The ballot is warm ivory paper with a small embossed checkmark and no writing. A subtle three-quarter camera angle reveals the top and front of the box. Soft studio lighting, muted burgundy reflections and a restrained dusty-rose rim light against a near-black background.

Keep the object centered slightly above the middle, with ample negative space. The bottom 30% should remain dark and visually quiet for a text overlay.

Sophisticated editorial product photography, realistic materials, simple composition. No flags, politicians, national emblems, slogans, crowds or decorative objects.
```

## 4. World events — объёмный глобус

Формат: **5:6**.

```text
Premium photorealistic 3D product render of a single sculptural globe floating against a near-black studio background.

The globe is made of smoked glass and dark graphite metal, with simplified continent shapes subtly etched into its surface. One thin brushed-metal orbital ring surrounds it at a gentle angle. Soft ivory key light, muted dusty-rose edge lighting and subtle mauve reflections. Realistic depth, refined materials, clear silhouette.

Place the globe in the central area, slightly above the middle. Leave generous breathing room around the orbital ring. Keep the bottom 30% dark and uncluttered for a text overlay. The composition must also work when cropped to a wider card.

Minimal, elegant, premium editorial photography. No star field, satellite swarm, network lines, labels, glowing cities, particles or additional planets.
```

## Общий negative prompt

Если генератор поддерживает отдельное поле:

```text
flat vector illustration, icon, clipart, cartoon, low-poly, cheap stock illustration, busy composition, excessive detail, intense neon glow, oversaturated colors, lens flare, particles, smoke, sparks, cosmic background, circuit patterns, tangled network lines, text, typography, watermark, logo, blurry subject, distorted geometry
```

## Как получить единый результат

- Использовать одну модель и одинаковый стилевой референс для всех четырёх изображений.
- Генерировать без текста: названия и описания накладываются на сайте.
- Начать со Sports. Если материалы и свет понравятся, использовать результат как референс для остальных.
- Сохранить готовые изображения в PINS. Перед подключением оптимизировать в WebP.
