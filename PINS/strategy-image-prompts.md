# Промпты для картинок Different markets

## Направление серии

Использовать приложенную картинку с футболистом как стилевой референс для всех четырёх изображений: динамичная кинематографичная цифровая сцена, глубокий тёмно-синий фон, электрические синие и фиолетовые лучи, яркие розово-малиновые акценты в цвет сайта. Светящиеся линии и геометрические элементы создают ощущение цифрового рынка, но не должны забирать внимание у основного сюжета.

Картинки должны выглядеть как четыре кадра одной серии: одинаковые контраст, глубина, характер свечения и уровень детализации. Это не предметная съёмка на студийном фоне и не плоская иллюстрация. Сцена выразительная и энергичная, но с одним ясным главным объектом. Основной объект держать около центра кадра; не помещать важные детали у краёв, чтобы изображение выдерживало кадрирование в карточке. Нижнюю часть затемнить мягким градиентом для названия поверх изображения.

Для каждого запроса приложить исходную картинку как style reference. Если генератор поддерживает image strength, использовать её только для переноса палитры, света и атмосферы, а не сюжета.

## 1. Sports — футболист и мяч

```text
Create a cinematic digital sports scene using the attached image as a visual style reference. Keep its deep navy and near-black background, vivid electric-blue and violet light, magenta-pink accents, glowing geometric lines, dramatic contrast and energetic atmosphere.

Show a close, dynamic crop of an athlete's lower legs in motion, wearing modern dark football boots, controlling a luminous soccer ball just above a dark playing surface. The ball is the brightest focal point, with crisp realistic panel detail and a restrained violet-magenta glow. Add a subtle burst of blue and pink light at the point of contact, like a stylized energy trail, not fire or smoke. No face; keep the action and ball clearly recognizable at thumbnail size.

Surround the scene with a few elegant digital field lines and abstract probability-like marks, softly out of focus and secondary to the athlete. Use a coherent palette of midnight navy, electric blue, violet and controlled magenta-pink highlights. Keep the lower 25% relatively dark and calm for a title overlay. Central composition with safe space around the subject for flexible card cropping.

Premium cinematic 3D render, realistic materials, crisp focal subject, atmospheric depth, polished editorial art direction. No words, numbers, logos, team crests, flags, watermark, extra balls, crowd, stadium signage or visual clutter.
```

## 2. Crypto — цифровой рынок

```text
Create a cinematic digital-asset market scene using the attached image as a visual style reference. Match its deep navy and near-black environment, vivid electric-blue and violet illumination, restrained magenta-pink accents, glowing geometric lines, dramatic contrast and energetic atmosphere.

Show one strong central composition of three-dimensional market candlesticks rising and falling across a dark reflective surface. The candlesticks should feel like luminous glass and dark polished metal, with clear silhouettes and subtle blue-violet cores edged by controlled magenta light. Add a few thin, elegant data paths and abstract grid lines receding into depth to suggest a live digital market. Keep them sparse and subordinate to the candlesticks; no readable charts or interface panels.

The image should feel sophisticated and technology-driven, not like a generic crypto advertisement. Central focal composition, clean silhouette at small size, dark calm lower 25% for a title overlay, and safe space around important elements for flexible card cropping.

Premium cinematic 3D render, realistic glass and metal, atmospheric depth, polished editorial art direction. No coins, currency symbols, cryptocurrency logos, text, numbers, dashboards, screens, watermark, excessive particles or clutter.
```

## 3. Politics — голосование и общественный выбор

```text
Create a cinematic civic decision scene using the attached image as a visual style reference. Match its deep navy and near-black background, vivid electric-blue and violet illumination, controlled magenta-pink accents, glowing geometric lines and dramatic yet refined atmosphere.

Show a single ballot being placed into a sleek, dark ballot box. The ballot and slot are the clear focal point, illuminated by a focused cool-blue light with a subtle magenta edge. In the distant background, suggest a grand civic hall with abstract architectural forms and a few soft vertical light columns, without depicting a specific country, party or recognizable government building. Add a small number of delicate digital lines to imply changing public sentiment and probabilities, but keep the scene grounded and uncluttered.

Neutral, nonpartisan visual language. No people in focus, no political personalities, no flags or national symbols. Keep the main action centered, legible at thumbnail size, and leave the lower 25% relatively dark for a title overlay. Preserve safe space around the subject for flexible card cropping.

Premium cinematic 3D render, realistic materials, atmospheric depth, polished editorial art direction. No readable text, letters, numbers, slogans, campaign signs, party colors, logos, watermark or visual clutter.
```

## 4. World Events — взаимосвязанный мир

```text
Create a cinematic global-events scene using the attached image as a visual style reference. Match its deep navy and near-black atmosphere, vivid electric-blue and violet illumination, controlled magenta-pink accents, glowing geometric lines, dramatic contrast and sense of scale.

Show one large, beautifully detailed globe as the central focal point, made of dark glass and subtly illuminated continents. A few fine luminous arcs sweep around the globe to suggest connections between regions and the movement of global events. In the far background, use only faint atmospheric silhouettes hinting at a city skyline and distant transport routes; the globe must remain dominant. Blue and violet should carry most of the light, with magenta-pink used sparingly at key intersections and along the globe's rim.

Sophisticated and editorial rather than a busy sci-fi interface. Keep the globe centered, recognizable at thumbnail size, and the lower 25% relatively dark for a title overlay. Leave safe space around the globe for flexible card cropping.

Premium cinematic 3D render, realistic glass and lighting, atmospheric depth, polished editorial art direction. No labels, flags, borders, text, numbers, map UI, logos, watermark, satellite swarm, excessive nodes, particles or clutter.
```

## Общий negative prompt

```text
flat vector illustration, icon, clipart, cartoon, low-poly, cheap stock art, bright white background, warm orange or yellow color cast, oversaturated red wash, excessive neon, excessive bloom, lens flare, fire, smoke, sparks, dense particles, busy composition, tiny illegible details, cluttered interface, readable text, letters, numbers, watermark, logo, blurry focal subject, distorted anatomy, malformed hands or feet, duplicate objects
```

## Как получить единую серию

- Использовать одну модель, один aspect ratio и приложенную картинку как стилевой референс для всех четырёх генераций.
- Генерировать по одному изображению за раз, не просить модель собрать четыре сюжета в один коллаж.
- Сначала получить Sports и проверить баланс холодного синего/фиолетового с розовыми акцентами. Затем использовать удачный результат как дополнительный style reference для остальных изображений.
- Не просить генератор добавлять название рынка: текст будет наложен средствами сайта.
- Проверить картинки в реальных карточках и при кадрировании на мобильном; при необходимости скорректировать safe space и положение объекта.
- Сохранить оригиналы в `PINS/strategy-originals/`, затем оптимизировать финальные версии в WebP или подходящий формат перед заменой файлов в `public/`.
