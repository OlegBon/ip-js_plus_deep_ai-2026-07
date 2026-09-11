# Публічний API: PowerShell

Цей документ показує повний безпечний сценарій роботи з API з Windows
PowerShell: надсилання файлу, очікування готовності та завантаження збереженого
результату. API-ключ створюється в Dashboard і показується лише один раз.
Збережіть його в password manager; не вставляйте ключ у Git, issue, логи або
скриншоти.

## Попередні умови

- У користувача активний тариф із API-доступом (`BASIC`, `PRO` або
  `ENTERPRISE`).
- У Dashboard увімкнено **Store conversions**. У цьому режимі `POST` поверне
  `202 Accepted` і `conversionId`; результат залишається private у S3.
- Використовується production origin
  `https://convertly-hub.bon.kharkov.ua`. Для локальної перевірки замініть його
  на `http://localhost:3001`.

## Повний приклад: JPG → PNG

Укажіть свій шлях до вихідного файлу та безпечно вставте ключ лише в поточну
PowerShell-сесію:

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

Нормальна відповідь на цьому етапі:

```json
{
  "conversionId": "<uuid>",
  "status": "PENDING",
  "createdAt": "2026-09-07T12:00:00.000Z"
}
```

## Очікування та завантаження

API не має окремого публічного endpoint статусу. У режимі зберігання endpoint
завантаження відповідає `409`, доки задача `PENDING`/`PROCESSING`, `422` у разі
`FAILED`, `404`, якщо результат не існує або вже сплив, і `200`, коли
файл готовий. Тому скрипт коректно опитує download endpoint, не намагаючись
вгадати час конвертації.

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

`curl.exe` навмисно використовується замість PowerShell alias `curl`, щоб
синтаксис `-F` завжди означав multipart upload. Під час діагностики можна залишити
header-файл і переглянути `Get-Content "$env:TEMP\convertly-headers.txt"`.

## Режим без зберігання

Коли **Store conversions** вимкнено для тарифу, відповідь на `POST` одразу містить
бінарний файл зі статусом `200`; `conversionId` не використовується. Завантажте його
напряму:

```powershell
curl.exe -sS `
  -X POST "$baseUrl/api/v1/convert" `
  -H "Authorization: Bearer $apiKey" `
  -F "file=@$sourceFile;type=image/jpeg" `
  -F "targetFormat=png" `
  -o $outputFile
```

## Помилки API

| Статус | Значення |
| --- | --- |
| `401` | Відсутній, неправильний, відкликаний API-ключ або користувач неактивний. |
| `403` | Тариф не надає API-доступ. |
| `413` | Файл перевищує ліміт активного тарифу. |
| `415` | Непідтримуваний MIME/вихідний файл. |
| `422` | Непідтримуваний target format або конвертація завершилася помилкою. |
| `429` | Вичерпано місячну квоту або ліміт 30 API-запитів за хвилину на ключ. Для rate limit дотримуйтеся `Retry-After`. |
| `503` | Тимчасово недоступні БД, Storage або service обробки. |

Для перевірки готовності інфраструктури без ключа використовуйте
`GET /api/health`: відповідь `200` містить стани `database`, `storage` і
`gotenberg`.
