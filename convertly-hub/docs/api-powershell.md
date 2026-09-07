# Публичный API: PowerShell

Этот документ показывает полный безопасный сценарий работы с API из Windows
PowerShell: отправка файла, ожидание готовности и скачивание сохранённого
результата. API-ключ создаётся в Dashboard и показывается только один раз.
Сохраните его в password manager; не вставляйте ключ в Git, issue, логи или
скриншоты.

## Предварительные условия

- У пользователя активен тариф с API-доступом (`BASIC`, `PRO` или
  `ENTERPRISE`).
- В Dashboard включено **Store conversions**. В этом режиме `POST` вернёт
  `202 Accepted` и `conversionId`; результат остаётся private в S3.
- Используется production origin
  `https://convertly-hub.bon.kharkov.ua`. Для локальной проверки замените его
  на `http://localhost:3001`.

## Полный пример: JPG → PNG

Укажите свой путь к исходному файлу и безопасно вставьте ключ только в текущую
PowerShell-сессию:

```powershell
$apiKey = "ch_live_REPLACE_WITH_YOUR_KEY"
$baseUrl = "https://convertly-hub.bon.kharkov.ua"
$sourceFile = "D:\Temp\image.jpg"
$outputFile = "D:\Temp\image.png"

$createResponse = curl.exe -sS `
  -X POST "$baseUrl/api/v1/convert" `
  -H "Authorization: Bearer $apiKey" `
  -F "file=@$sourceFile;type=image/jpeg" `
  -F "targetFormat=png"

$conversion = $createResponse | ConvertFrom-Json
$conversionId = $conversion.conversionId

if (-not $conversionId) {
  throw "API did not return conversionId: $createResponse"
}

"Created conversion: $conversionId"
```

Нормальный ответ на этом этапе:

```json
{
  "conversionId": "<uuid>",
  "status": "PENDING",
  "createdAt": "2026-09-07T12:00:00.000Z"
}
```

## Ожидание и скачивание

У API нет отдельного публичного endpoint статуса. В режиме сохранения endpoint
скачивания отвечает `409`, пока задача `PENDING`/`PROCESSING`, `422` при
`FAILED`, `404` если результат не существует или уже истёк, и `200`, когда
файл готов. Поэтому скрипт корректно опрашивает download endpoint, не пытаясь
угадать время конвертации.

```powershell
$deadline = (Get-Date).AddMinutes(2)

do {
  curl.exe -sS -D "$env:TEMP\convertly-headers.txt" `
    -H "Authorization: Bearer $apiKey" `
    -o $outputFile `
    "$baseUrl/api/v1/conversions/$conversionId/download"

  $statusLine = Get-Content "$env:TEMP\convertly-headers.txt" |
    Where-Object { $_ -match '^HTTP/' } |
    Select-Object -Last 1
  $statusCode = [int](($statusLine -split ' ')[1])

  if ($statusCode -eq 200) {
    "Downloaded: $outputFile"
    break
  }

  if ($statusCode -eq 409 -and (Get-Date) -lt $deadline) {
    Start-Sleep -Seconds 2
    continue
  }

  Remove-Item -LiteralPath $outputFile -ErrorAction SilentlyContinue
  throw "Conversion $conversionId did not complete successfully (HTTP $statusCode)."
} while ($true)
```

`curl.exe` намеренно используется вместо PowerShell alias `curl`, чтобы
синтаксис `-F` всегда означал multipart upload. При диагностике можно оставить
header-файл и посмотреть `Get-Content "$env:TEMP\convertly-headers.txt"`.

## Режим без хранения

Когда **Store conversions** выключен для тарифа, ответ на `POST` сразу содержит
бинарный файл со статусом `200`; `conversionId` не используется. Скачайте его
напрямую:

```powershell
curl.exe -sS `
  -X POST "$baseUrl/api/v1/convert" `
  -H "Authorization: Bearer $apiKey" `
  -F "file=@$sourceFile;type=image/jpeg" `
  -F "targetFormat=png" `
  -o $outputFile
```

## Ошибки API

| Статус | Значение |
| --- | --- |
| `401` | Нет, неверный, отозванный API-ключ или пользователь неактивен. |
| `403` | Тариф не даёт API-доступ. |
| `413` | Файл превышает лимит активного тарифа. |
| `415` | Неподдерживаемый MIME/исходный файл. |
| `422` | Неподдерживаемый target format либо конвертация завершилась ошибкой. |
| `429` | Исчерпана месячная квота или лимит 30 API-запросов в минуту на ключ. Для rate limit соблюдайте `Retry-After`. |
| `503` | Временно недоступна БД, Storage или service обработки. |

Для готовности инфраструктуры без ключа используйте
`GET /api/health`: ответ `200` содержит состояния `database`, `storage` и
`gotenberg`.
