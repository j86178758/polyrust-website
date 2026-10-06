# CCIP Payments — задача, реализация и использование

## 1. Что требовалось

Принимать оплату из 10+ EVM-сетей, агрегируя деньги и статусы заказов на одном Hub.
На сетях отправки не разворачивать магазин: кошелёк вызывает официальный CCIP Router.
Приёмочный маршрут: Base Sepolia → Arbitrum Sepolia, 10 тестовых USDC, `isOrderPaid=true`.
Дополнительный сценарий: пользователь вносит 100 токенов и через 7 дней получает 110.
Лендинг не меняется; этот модуль имеет собственные зависимости и lock-файл.

## 2. Что реализовано

- `contracts/PaymentHub.sol`: единственный разворачиваемый прикладной контракт.
- Наследует официальный `CCIPReceiver` из `@chainlink/contracts-ccip@2.0.0`.
- `ccipReceive` допускает только заданный Router; `_ccipReceive` проверяет источник,
  сообщение, зарегистрированный заказ, ровно один токен и точную сумму.
- Цена и токен заказа неизменяемы; сообщение и заказ нельзя оплатить повторно.
- `isOrderPaid[orderId]` обновляется только после успешной доставки на Hub.
- `Ownable2Step` защищает админ-функции; `SafeERC20` и `ReentrancyGuard` — операции с деньгами.
- `src/payment.ts`: quote, approve, повторный quote, simulate, `ccipSend`, статус, вывод.
- `src/browser.ts`: подключение EIP-1193-кошелька без передачи приватного ключа сайту.
- `config/networks.json`: проверенный снимок официального CCIP Directory, не выдуманные адреса.
- `scripts/`: CLI для деплоя, создания заказов, оплаты, финансирования наград и вывода.
- `contracts/test/Mocks.sol`, `test/`: локальные тесты; mocks НЕ деплоятся в публичные сети.

```text
Spoke: кошелёк → approve(Router) → Router.ccipSend
             ↓ токены + abi.encode(orderId), асинхронно через CCIP
Hub: официальный Router → PaymentHub → валидация → учёт оплаты / активация стейка
```

Комиссия CCIP оплачивается нативной монетой через `getFee` / `msg.value`.
Gas транзакций approve/send оплачивается отдельно. Комиссия не является суммой заказа.
Здесь нет своего relayer, Web2 API или механизма генерации доходности.

## 3. USDC или несколько токенов?

Тестнет настроен на **USDC**. Mainnet-каталог содержит **USDC и GHO**.
В текущем снимке: 13 сетей отправки → Arbitrum One; не каждая поддерживает оба токена.
USDC доступен из 9 источников, GHO добавляет Gnosis, Mantle, Plasma и X Layer.
Base, Polygon, OP, Ethereum, Avalanche, Monad, Unichain, Ink, HyperEVM имеют маршрут USDC.
Hub принимает только явно разрешённые токены (`setTokenAllowed`).
Заказ фиксирует **один Hub-токен и сумму**, например 10 USDC или 10 GHO.
Адрес исходного токена отличается от Hub-адреса: клиент использует `hubToken` из конфига.
Нет автоматического swap, конвертации USDC↔GHO или суммирования разных валют.
Награда возвращается в том же токене, что и депозит.
Добавление токена требует проверенного маршрута, пула и адресов в Directory, разрешения
на Hub и проверки одинакового количества decimals. Fee-on-transfer/rebasing-токены не поддерживаются.

Список маршрутов — снимок, не гарантия доступности навсегда. Перед mainnet снова проверить
Directory, направление передачи, token pool, ограничения/allowlist и комиссию `getFee`.
Числа `chainSelector` хранятся строками и преобразуются в `bigint`, а не JS `number`.

## 4. Установка и локальная проверка

Требуется Node.js 22+ и npm. Все команды ниже выполняются **из `ccip-payments`**.

```sh
npm ci --ignore-scripts --legacy-peer-deps
npm run compile
npm run typecheck
npm test
cp .env.example .env
```

`--ignore-scripts` не запускает install-скрипты транзитивных зависимостей.
Ganache может сообщить об отсутствии native bindings на macOS/Node 22 и использовать JS fallback.
Локальные тесты проверяют Hub, клиент и стейкинг; они НЕ заменяют настоящий CCIP transfer.
В тесте «неделя» ускоряется через EVM time travel; в testnet/mainnet этого нет.

`.gitignore` внутри модуля исключает вложенные `node_modules`, `.env*`, `artifacts`,
`deployments.local.json`, логи и coverage. `.env.example` и `package-lock.json` сохраняются в Git.
Приватные ключи не коммитить, не показывать в браузере и не использовать реальные ключи в тестах.

## 5. Приёмочный тест: 10 USDC из Base Sepolia

1. Создать отдельные тестовые кошельки администратора и пользователя.
2. Получить тестовый ETH: admin на Arbitrum Sepolia, payer на Base Sepolia.
3. Получить **официальный тестовый USDC** Base Sepolia, не произвольный mock-токен.
   Ссылка на faucet: https://faucet.circle.com/ ; сети и адреса сверить с Directory.
4. В `.env` установить `OWNER_PRIVATE_KEY`, `PAYER_PRIVATE_KEY`, RPC и
   `ALLOW_TESTNET_TRANSACTIONS=true`. Остальные testnet-параметры уже в примере.
5. Деплой **одного** Hub на Arbitrum Sepolia и разрешение источника:

```sh
npm run deploy:testnet
```

Адрес сохранится в игнорируемый `deployments.local.json`. Можно вместо этого задать `HUB_ADDRESS`.
Если настройка источников после деплоя прервалась, НЕ деплоить повторно:
доделать `setSourceChainAllowed(selector, true)` через owner-кошелёк.

6. `.env`: `ORDER_ID=1001`, `ORDER_TOKEN=USDC`, `ORDER_AMOUNT=10`.

```sh
npm run order:create
npm run pay:testnet -- --quote
npm run pay:testnet -- --wait
npm run status
```

Отправка выполняет approve к официальному Base Router и ccipSend напрямую из кошелька.
Полученный tx hash обязательно сохранить. Скрипт печатает CCIP Explorer URL по messageId
для CCIP 2.0; для legacy lane искать source tx hash вручную на https://ccip.chain.link/ .
Успешная source-транзакция НЕ означает оплату заказа. Критерий: успешное выполнение
на Arbitrum Sepolia и `paid: true` в status / `isOrderPaid(1001)` в контракте.
Доставка асинхронная. По timeout НЕ отправлять заново — проверить Explorer и статус.

## 6. Стейкинг: внести 100, через неделю вывести 110

**CCIP — транспорт, а не источник прибыли.** Здесь фиксированная награда 10 финансируется
администратором заранее; это демонстрационный prefunded staking, не инвестиционная стратегия.
Для реального yield нужны отдельная экономическая модель, интеграция протокола и аудит.

1. Admin получает минимум 10 USDC **на Arbitrum Sepolia**.
2. `.env`: `ORDER_TOKEN=USDC`, `ORDER_AMOUNT=10`.

```sh
npm run rewards:fund
```

Токены реально переводятся на Hub, `rewardPool` и `reservedBalances` увеличиваются.
3. `.env`: новый `ORDER_ID=2001`, `ORDER_AMOUNT=100`, `REWARD_AMOUNT=10`,
   `LOCK_SECONDS=604800`, `BENEFICIARY_ADDRESS` = адрес payer-кошелька.

```sh
npm run stake:create
npm run pay:testnet -- --wait
npm run status
```

Контракт резервирует 10 награды при создании заказа, принимает 100 только от beneficiary
и начинает 7-дневную блокировку **после доставки** на Hub. Admin не может вывести эти 110.
До оплаты награда уже зарезервирована; автоматической отмены неоплаченных заказов здесь нет.
Чтобы не блокировать бюджет навсегда, не создавать стейк-заказы массово без контроля оплаты.
4. Через 7 настоящих дней payer должен иметь ETH **на Hub** для транзакции вывода.

```sh
npm run stake:claim
```

Пользователь получает 110 USDC на Arbitrum Sepolia. Либо возврат в исходную сеть:

```sh
npm run stake:claim -- --cross-chain
```

Транзакцию всё равно подписывают **на Hub**. Дополнительно платится комиссия CCIP в ETH Hub.
Receiver — тот же beneficiary, сеть — исходная сеть депозита, source-контракт не нужен.
Возврат тоже асинхронный: `claimed=true` означает списание позиции/отправку, НЕ факт доставки.
Сохранять возвратный messageId и отслеживать Explorer. Нельзя повторно claim-ить после отправки.
Ошибка source send откатывает состояние; ошибка destination delivery требует разбора в Explorer.
Газ и комиссии оплачиваются сверх 100/110; чистый экономический результат зависит от них.

## 7. Использование с сайтом

Подключить модуль через собственный checkout/bundler. Лендинг автоматически его не вызывает.
Frontend получает orderId из Web2; backend-администратор сначала создаёт заказ на Hub.
На странице отобразить сумму, валюту, сеть и комиссию, затем запросить подтверждение пользователя.
Пример с EIP-1193 provider из выбранного кошелька:

```ts
import { connectPaymentWallet } from './src/browser'
import { payOrder, waitForPayment } from './src/payment'

const context = await connectPaymentWallet(provider, {
  sourceKey: 'ethereum-testnet-sepolia-base-1',
  hubAddress: deployedHubAddress,
  sourceRpcUrl: baseSepoliaRpc,
  hubRpcUrl: arbitrumSepoliaRpc,
})
const payment = await payOrder(context, 1001n, (step, hash) => {
  // Показывать шаг пользователю; сразу сохранять tx hash при submitted.
})
// Сохранить payment.hash до ожидания доставки. Блокировать повторную оплату этого заказа.
await waitForPayment(context.hubClient, context.hubAddress, 1001n)
```

RPC в браузере должен разрешать CORS. Не публиковать секретные RPC API keys.
При выводе пользователь переключает кошелёк на Hub; использовать `claimStake` из SDK.
В Web2 базе хранить orderId, Hub, токен, сумму, tx/messageId, beneficiary и delivery status.
Выдавать товар/активировать услугу только по подтверждённому `OrderPaid` или Hub read,
а не по callback браузера, скриншоту, approve или успешному source receipt.

## 8. Боевой режим

Это проверенный локально прототип, **не готовый к хранению реальных средств без аудита**.
До mainnet: выполнить настоящий testnet-маршрут туда/обратно, аудит, мониторинг и recovery-план.
Проверить свежий `config/networks.json` по ссылкам `sources`, Router, token pools и обе стороны lane.
Для обновления снимка: скачать HTML официальных страниц USDC testnet, USDC/GHO mainnet;
`python3 scripts/import-directory.py usdc-test.html usdc-main.html gho-main.html`, проверить diff.
Адреса проверены по Directory 2026-10-06; доступность RPC и реальная доставка отдельно не проверены.

В `.env` указать `CHAIN_ENV=mainnet`, Arbitrum One RPC, source mainnet RPC/key,
`ALLOW_MAINNET_TRANSACTIONS=yes-i-understand`, отдельные mainnet-ключи и новые orderId.
Удалить старый `HUB_ADDRESS` или указать корректный mainnet Hub: адрес тестнета не подходит.

```sh
npm run deploy:hub
npm run order:create
npm run pay:testnet -- --quote
npm run pay:testnet -- --wait
```

Имя `pay:testnet` — совместимый CLI alias; сеть реально определяется `CHAIN_ENV`.
Рекомендуется начать с минимальной суммы USDC на одном проверенном маршруте.
Owner лучше передать multisig через `transferOwnership` + `acceptOwnership`.
Приватные ключи CLI — только локальные операции/тесты; production checkout использует кошелёк.
Не принимать произвольный токен от пользователя: backend выбирает разрешённый токен и цену.
Mainnet GHO разрешается при настройке Hub, но оплачивать GHO можно только GHO-заказ.
Нужно учитывать риск де-пега, управление бюджетом наград и налоговые/правовые требования.

## 9. Ошибки и ограничения

- Реверты unknown order / wrong token / wrong amount / wrong payer не меняют paid.
- На настоящем CCIP отклонённая доставка может потребовать manual execution.
  Это НЕ автоматический возврат средств. Не отправлять ошибочный/дублирующий платёж повторно.
- Нельзя менять цену, валюту или условия стейка уже созданного заказа.
- Отключение source chain при переводах в пути может заблокировать доставку.
- Unallocated rewards и награды неоплаченных стейков зарезервированы; нет функции их отмены/возврата.
- Нет интеграции Web2-базы, webhook-сервера, полного checkout UI или production yield-протокола.
- Legacy OnRamp events могут не декодироваться SDK; tx hash всё равно пригоден для Explorer.
- npm audit сообщает уязвимости в upstream/build/test dependency tree. Они не устраняются
  автоматически обновлением Solidity: review зависимостей — обязательный production gate.
- Здесь не выполнялся реальный деплой/перевод: нужны кошельки, ETH, тестовые USDC и RPC.
  Локальная симуляция не является приёмкой маршрута Base Sepolia → Arbitrum Sepolia.
