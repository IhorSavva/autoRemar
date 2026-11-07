# AUTO-REMAR — autoremar.pl

Статический сайт автосервиса AUTO-REMAR: HTML + CSS + JS (ES-модули), без сборки. Работает на GitHub Pages как есть.
Польский — в корне, английский — в `/en/`. Заявки и прайс — Firebase (тариф Spark, бесплатный).

Пока `assets/js/firebase-config.js` пустой, сайт в **демо-режиме**: форма показывает «wysłano» и пишет заявку в консоль, прайс берётся из статического HTML, `admin.html` показывает подсказку.

## Локально

```bash
python3 -m http.server 8000
```

Открыть http://localhost:8000 (ES-модули не работают через `file://`).

## Подключение Firebase

1. https://console.firebase.google.com → **Add project** (Google Analytics не нужен). Тариф Spark.
2. **Build → Firestore Database → Create database**, регион `eur3` или `europe-central2` (Варшава), режим production.
3. **Build → Authentication → Get started → Email/Password → Enable**.
   - **Users → Add user**: `autoremar@autoremar.pl` + надёжный пароль (передать владельцам).
   - **Settings → User actions**: снять «Enable create (sign-up)», чтобы никто не мог сам завести аккаунт.
4. **Project settings → Your apps → Web (</>)** → зарегистрировать приложение, скопировать `firebaseConfig` в `assets/js/firebase-config.js`.
5. **Authentication → Settings → Authorized domains**: добавить `<user>.github.io` и `autoremar.pl`.
6. Задеплоить правила (нужен `npm i -g firebase-tools` и `firebase login`):
   ```bash
   firebase deploy --only firestore:rules --project <project-id>
   ```
   Админы перечислены в `firestore.rules`, функция `isAdmin()`. Новый админ = добавить e-mail туда и в Authentication.
7. Зайти в `/admin.html` → вкладка **Cennik** → «Wypełnij z obecnego cennika» → «Zapisz cennik». С этого момента цены на сайте берутся из Firestore.

### App Check (опционально, защита от спама)

1. https://www.google.com/recaptcha/admin → reCAPTCHA **v3**, домены `autoremar.pl` и `<user>.github.io`.
2. Firebase → **App Check** → Web app → reCAPTCHA v3 → вставить secret key.
3. Site key вписать в `appCheckSiteKey` в `firebase-config.js`.
4. Понаблюдать неделю в App Check → Firestore → **Enforce**.

## Письмо о новой заявке (EmailJS, опционально)

1. https://www.emailjs.com → **Email Services** → подключить почту, с которой будут уходить письма.
2. **Email Templates** → новый шаблон, To: `autoremar@autoremar.pl`, Subject: `Nowa rezerwacja: {{name}} {{phone}}`. В теле доступны переменные `{{service}} {{car}} {{year}} {{date}} {{name}} {{phone}} {{email}} {{comment}} {{lang}}`.
3. **Account → Security**: добавить разрешённые домены.
4. Service ID, Template ID и Public Key вписать в `emailjs` в `firebase-config.js`.

Заявка сохраняется в Firestore в любом случае; письмо — только уведомление.

## GitHub Pages

```bash
git init && git add . && git commit -m "AUTO-REMAR site"
gh repo create <user>/<repo> --public --source . --push
gh api -X POST repos/<user>/<repo>/pages -f "source[branch]=main" -f "source[path]=/"
```

Сайт будет на `https://<user>.github.io/<repo>/` — все ссылки относительные.

## Свой домен autoremar.pl

**Не добавлять `CNAME` раньше времени** — сломается превью на github.io.

1. В репо создать файл `CNAME` с одной строкой `autoremar.pl`.
2. У регистратора домена DNS:
   - A `@` → `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
   - AAAA `@` → `2606:50c0:8000::153`, `2606:50c0:8001::153`, `2606:50c0:8002::153`, `2606:50c0:8003::153`
   - CNAME `www` → `<user>.github.io`
   - MX-записи почты **не трогать** (почта autoremar@autoremar.pl должна работать дальше).
3. GitHub → Settings → Pages → Custom domain `autoremar.pl` → дождаться проверки → **Enforce HTTPS**.
4. Добавить `autoremar.pl` в Authorized domains Firebase и в EmailJS / reCAPTCHA.
5. Google Search Console: добавить домен, отправить `sitemap.xml`.

Старые адреса Joomla (`/index.php/...`) перенаправляет `404.html`.

## Что подтвердить с клиентом

- **Цены** взяты со старого сайта — владельцы должны подтвердить актуальность (меняются в админке).
- **Район**: в ТЗ «Ochota», но по OpenStreetMap дом 65 относится к Włochy. На сайте район не указан.
- Подписи к фото: кто из владельцев на каком фото (сейчас подписи нейтральные).
- Политика конфиденциальности: дописать NIP/форму деятельности (s.c.?), срок хранения данных.
- WhatsApp для 604 91 21 21 — добавлять кнопку только после подтверждения.
- Рейтинг Google (4,6 / 129 отзывов) — обновлять вручную в `index.html` и `en/index.html`.

## Структура

| Файл | Что |
| --- | --- |
| `index.html`, `uslugi.html`, `cennik.html`, `o-nas.html`, `kontakt.html`, `polityka-prywatnosci.html` | Страницы PL; копии на EN в `en/` |
| `admin.html` | Панель: заявки + редактирование прайса (noindex) |
| `404.html` | 404 + редиректы старых адресов Joomla |
| `assets/js/firebase-config.js` | Ключи Firebase / App Check / EmailJS |
| `assets/js/booking.js` | Форма «Umów wizytę» |
| `assets/js/prices.js` | Подмена прайса данными из `prices/current` |
| `assets/js/admin.js` | Логика админки |
| `assets/js/nav.js` | Бургер-меню |
| `firestore.rules`, `firebase.json` | Правила Firestore и их деплой |
