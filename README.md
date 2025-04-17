
---

# 📝 To-Do App (JavaScript + PWA + Notifications)

Интерактивное To-Do приложение с поддержкой офлайн-режима, push-уведомлений, PWA установки и фильтрацией задач. Работает на чистом JavaScript, без использования фреймворков.

---

## 🚀 Возможности

- ✅ Добавление, удаление и завершение задач
- 🔍 Фильтрация задач: все / активные / завершённые
- 💾 Хранение задач в `localStorage`
- 📡 Отображение статуса подключения (Online / Offline)
- 🔔 Push-уведомления о незавершённых задачах
- 🕐 Автоматические напоминания каждые 2 часа
- 📲 Поддержка установки как PWA
- 📦 Регистрация Service Worker
- 📱 Адаптирован под мобильные устройства

---

## 🛠️ Установка и запуск

1. Склонируй репозиторий:

```bash
git clone https://github.com/yourusername/todo-js-app.git
cd todo-js-app
```

2. Открой `index.html` в браузере или подними локальный сервер:

```bash
npx serve .
```

---

## 🧩 Структура проекта

```bash
📦 todo-js-app/
├── index.html            # Основная HTML-страница
├── style.css             # Стили приложения
├── app.js                # Главная логика приложения
├── sw.js                 # Service Worker для PWA
└── icons/                # Иконки и manifest файлы
```

---

## 🔔 Уведомления

- Уведомления запрашиваются при первом запуске.
- Пользователь может включить/отключить их вручную.
- Каждые 2 часа приходит напоминание, если есть незавершённые задачи.
- Используются встроенные браузерные API (`Notification`, `PushManager`).

---

## 📦 PWA

- Приложение можно установить на Android и iOS.
- Используется событие `beforeinstallprompt`.
- Поддерживается кастомный UI для установки.

---

## 🧪 Будущие улучшения

- ✏️ Редактирование задач
- 📅 Добавление дедлайнов
- 🧠 Интеграция с календарём
- 🔐 Авторизация и синхронизация задач

---
