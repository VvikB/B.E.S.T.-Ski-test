# FastAPI + PostgreSQL: конкретный план первого постоянного хранения

Статус: план реализации P0.2, не работающий backend. Сохраняет docs/v2/BEST_ARCHITECTURE_v2.md и BEST_DATA_MODEL_v2.md; не заменяет их. React/TypeScript единое приложение Kids/Ski/Pro; Telegram — будущий отдельный адаптер. Сначала взрослый закрытый пилот; детские профили заблокированы до принятия политики представителей/данных. Нет массовой миграции старого бота.

## Срез реализации

`backend/app/{main,config,db,auth,permissions,profiles,lessons,progress,observations,audit}.py`; Pydantic-схемы запросов/ответов, SQLAlchemy 2 синхронно в threadpool, psycopg, Alembic. Версии зависимостей фиксируются при реализации. Один FastAPI-монолит, PostgreSQL в отдельном сервисе, reverse proxy HTTPS same-origin `/api/v1`; frontend хранится отдельно, не отдавать корень репозитория. Docker Compose для локальной БД; production-провайдер/регион и стоимость выбираются до развёртывания, бесплатные 24/7 не обещаются. SQLite не считается интеграционной проверкой.

## Минимальная схема миграций

| Таблица | Состав и инварианты |
|---|---|
| account / auth_identity | UUID, status; normalized_login UNIQUE, Argon2id hash, provider/subject UNIQUE; отдельный account от learner profile |
| session | hashed random token UNIQUE, account FK, expiry/revoked, csrf_hash; токен ≥256 случайных бит; plaintext не сохраняется |
| role_grant | account FK, role, scope, valid_from/to, revoked_at; роли не приходят из клиентского payload |
| learner_profile / profile_access | UUID, display_name, locale, adult age_band; связь владельца/прав; минимум данных, не DOB по умолчанию |
| teaching_group / group_membership / instructor_assignment | сроки членства и назначения; FK на группу/профиль/инструктора, отзыв мгновенно ограничивает новые запросы |
| content_entity / content_version / review_decision | stable_key UNIQUE, version UNIQUE(entity,version), payload JSONB по схеме; draft/review/approved/published/withdrawn; публикация только с нужными согласованиями; опубликованная версия неизменяема |
| lesson_assignment | profile FK + immutable lesson_version FK, assigned_by, status; нельзя назначить неподтверждённый черновик |
| lesson_progress | UNIQUE(profile_id, lesson_version_id), checkpoint, revision≥0, theory_state, updated_at; понимание и практика отдельно |
| activity_response / progress_event | append-only ответ/изменение, client_event_id UNIQUE в области actor+operation; версия задания; нельзя напрямую записать результат/балл клиента |
| instructor_observation / observation_revision | profile, author, assignment scope, criterion, observed_at, conditions, visibility, safe_text; история правок, лимит текста, не диагноз/не сертификат |
| audit_event | actor, action, resource ID, time, reason; без пароля, cookie, текста приватных заметок |
| recovery_token / idempotency_record | только hash одноразового токена, expiry/used_at; ключ идемпотентности, request hash, ссылка на ответ |

FK RESTRICT для используемых content versions, без каскадного удаления истории при удалении урока. Чекпойнт валиден для версии урока; восстановление не перескакивает на новую версию без принятой политики. Времена timestamptz UTC; UI показывает часовой пояс пользователя.

## API и проверки доступа

| Метод/маршрут | Действие и доступ |
|---|---|
| POST /auth/login; GET /auth/me | Вход по приглашённой учётке; одинаковая ошибка для неизвестного логина/пароля; rate limit, журнал безопасных событий |
| POST /auth/logout; GET /auth/sessions; DELETE /auth/sessions/{id} | Отзыв одной/всех собственных сессий; DELETE тоже CSRF-защищён |
| POST /auth/recovery/request; POST /auth/recovery/confirm | Нейтральный ответ без раскрытия существования аккаунта; одноразовое восстановление; после смены пароля отзыв старых сессий |
| GET /profiles; GET/PATCH /profiles/{id} | Только собственные/явно разрешённые профили; инструктор не меняет личные поля ученика |
| GET /profiles/{id}/assignments; GET /lessons/{version} | Владелец или действующее назначение; только published, отозванный урок блокируется с понятным статусом |
| GET /profiles/{id}/progress/{version}; PUT тот же путь | Owner read/write; инструктор read по назначению; expected_revision + Idempotency-Key; конфликт 409 с текущей revision |
| POST /profiles/{id}/activities/{version}/responses | Владелец; server-side проверка ответа, возвращает feedback; дубль не создаёт новое событие |
| GET/POST /profiles/{id}/observations; PATCH /observations/{id} | Инструктор только в назначенном scope; ученик видит только learner-visible; правка создаёт revision; revoked instructor больше не видит заметки |
| GET /studio/groups; GET /studio/groups/{id}/learners | Только действующие назначения, не глобальный список учеников |
| POST /admin/invitations; POST /admin/assignments | Отдельные права администратора/уполномоченного инструктора; без публичной саморегистрации |

Общий порядок: session → role → object ownership/assignment/expiry → validate → transaction → audit. Не полагаться на скрытые кнопки, UUID или CORS как авторизацию. Чужой ресурс возвращает одинаковый 404 по принятой политике; истёкшая сессия 401; конфликт revision 409; запрет операции на доступном ресурсе 403. Тесты IDOR обязательны для каждого списка и object endpoint.

## Сессия и сохранение

Opaque cookie `__Host-best_session`, Secure + HttpOnly + SameSite=Lax + Path=/, без Domain; session token не в localStorage/URL. State-changing запросы требуют Origin allowlist и CSRF token, привязанный к сессии; CORS same-origin по умолчанию, не `*` с credentials. Предлагаемые TTL: idle 24ч, absolute 7д; после смены роли/пароля — ротация/отзыв. Утвердить TTL и процедуру восстановления до пилота. Для пилота без почтового сервиса восстановление через проверенное обращение администратору и одноразовый 15-минутный токен; никогда общая ссылка/код роли. Доставка и проверка личности должны быть согласованы, до этого recovery не считать готовым.

PUT прогресса в транзакции делает UPDATE WHERE revision=expected_revision, пишет event и новую revision. Точный дубль возвращает сохранённый ответ; тот же ключ с иным payload →409. После рестарта API/БД GET возвращает тот же подтверждённый checkpoint; незаписанное состояние показывается «не сохранено», а не зелёной галочкой. Offline-очередь не входит в первый срез. При 401 интерфейс просит войти и не переносит данные одного аккаунта в другой; сессионная память очищается на logout.

## Персональные данные и эксплуатация

Минимум: псевдоним, учётные реквизиты, язык, учебный прогресс, назначенные наблюдения. Нет публичного рейтинга, точной геолокации, медицинских текстов, фото детей, рекламы и сторонней аналитики. Инструкторская заметка ограничена учебным наблюдением; предупреждение не собирать здоровье и контакты. Секреты — в окружении/менеджере секретов, не в git/frontend/логах. DB user без superuser; TLS до БД при внешнем соединении; сеть БД закрыта от интернета. Резервные копии зашифрованы, ключи отдельно, доступ ограничен. Метрики без тела ответов/наблюдений и session ID.

До набора людей утвердить оператора данных, юрисдикцию/регион хранения, основания обработки, уведомление/согласия, сроки и права доступа. Проектные сроки: неактивная session metadata 30д, operational logs 14д, backup rolling 30д; прогресс и наблюдения — срок пилота + согласованный период, не бессрочно. Это не юридическое заключение и не утверждённая политика. Нужны процедуры экспорта, удаления/обезличивания и удаления из backup по сроку; после restore повторно применять журнал удалений. Предлагаемые RPO≤24ч/RTO≤4ч подтвердить реальным restore, иначе пересогласовать. Проверка отзыва старого Google-ключа блокирует внешнее развёртывание; старый ключ нигде не используется.

## Порядок реализации и доказательства

1. Skeleton API/config + PostgreSQL/Alembic + health/readiness; миграции с нуля и с предыдущей схемы в CI.
2. Identity/session/roles и изоляция профилей; негативные IDOR/CSRF/replay/rate-limit проверки до реальных данных.
3. Published lesson versions + assignments; тест: draft/withdrawn недоступны обычному ученику.
4. Progress + ответы + revision/idempotency; интеграционные тесты двух параллельных записей, повтора и рестарта Postgres/API.
5. Ограниченные instructor observations + журнал изменений/отзыв доступа; отсутствие чужого содержимого в ответах/логах.
6. React API adapter вместо in-memory storage для принятых функций; состояния saving/saved/error/conflict; никакой массовой замены всех страниц.
7. Restore в чистую БД, подсчёт записей/связей и вход заново; небольшой взрослый пилот только после политики и разрешения владельца.

Критерий P0.2: два разных взрослых аккаунта + один инструктор; каждый видит только свои назначения; чтение/прогресс переживают новый браузерный вход и restart; инструктор видит назначенного, не чужого ученика; отзыв назначения работает; конфликт не теряет данные; черновик нельзя выдать через API; recovery и logout отзывают сессию; реальный restore успешен. Экзамены, сертификаты и Telegram linking — вне этого среза.
