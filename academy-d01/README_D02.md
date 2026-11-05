# B.E.S.T. Academy D0.2 — закрытая техническая демонстрация

Продолжение D0.1, не законченная Academy. Историческое имя каталога `academy-d01` сохранено. Основной отчёт: [docs/d02/REPORT_RU.md](docs/d02/REPORT_RU.md).

## Запуск на Mac без Node.js

Распакуйте BEST_ACADEMY_D02_RUNNABLE.zip. В Terminal перейдите в распакованную папку B.E.S.T.-Academy-D0.2:

```sh
python3 tools/serve_demo.py
```

Откройте http://127.0.0.1:5173/ski . Остановить: Ctrl+C. На macOS используется `python3`, а не `python`. Если Python отсутствует, установите Python 3 с python.org. Не переходите в tools перед этой командой. Если уже находитесь в tools: `python3 serve_demo.py`.

## Разработка и воспроизводимая сборка

Node.js >=22.12, npm; зависимости зафиксированы package-lock.json.

```sh
npm ci
npm run typecheck
npm run format:check
npm test
npm run build
npm run dev
```

Для браузерных проверок: `npx playwright install chromium`, затем `npm run test:e2e`. На Linux можно указать `CHROMIUM_PATH=/usr/bin/chromium`. Запись видео требует Playwright ffmpeg. Проверки работают на production-сборке, а не dev-сервере. Результаты — docs/d02/test-results.json.

## Проверка с iPhone в доверенной локальной сети

```sh
python3 tools/serve_demo.py --host 0.0.0.0
```

На iPhone откройте `http://<локальный-IP-Mac>:5173/lab` при подключении к той же Wi-Fi сети. Проверьте touch-вращение, каждый ракурс, timeline, шаги, скорость, маркеры, SVG, A/B и возврат из фона. Это инструкция владельцу: физический iPhone нами не проверен. Сервер без авторизации; не открывайте его в интернете. Внешнее развёртывание блокируется до подтверждения отзыва ранее обнаруженного Google-ключа в старом репозитории.

Kids/Ski/Pro используют только синтетические данные в памяти страницы. Перезагрузка сбрасывает изменения. Backend, PostgreSQL, аккаунты, постоянный прогресс, реальные группы и сертификаты не реализованы.

Проверка целостности распакованной поставки: `python3 tools/verify_files.py`. Внешняя SHA256 всего ZIP опубликована отдельно в D02_SHA256SUMS.txt в корне ветки. Скрипт упаковки: `python3 tools/package_d02.py`; содержимое dist воспроизводится через `npm ci && npm run build`.
