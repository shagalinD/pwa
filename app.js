// DOM Elements
const newTaskInput = document.getElementById('new-task')
const addTaskBtn = document.getElementById('add-task-btn')
const taskList = document.getElementById('task-list')
const filterBtns = document.querySelectorAll('.filter-btn')
const tasksCount = document.getElementById('tasks-count')
const connectionStatus = document.getElementById('connection-status')
const notificationBtn = document.getElementById('notification-btn')
const installBtn = document.getElementById('install-btn')
const installPrompt = document.getElementById('install-prompt')
const closePromptBtn = document.getElementById('close-prompt')
const confirmInstallBtn = document.getElementById('confirm-install')

// App state
let tasks = []
let currentFilter = 'all'
let deferredPrompt
let notificationInterval

// Initialize app
function init() {
  loadTasksFromStorage()
  renderTasks()
  updateTasksCount()
  setupEventListeners()
  checkConnectionStatus()
  setupNotificationButton()
  setupInstallPrompt()

  // Запускаем планирование уведомлений только если они включены
  if (
    localStorage.getItem('notificationsEnabled') === 'true' &&
    Notification.permission === 'granted'
  ) {
    scheduleNotifications()
  }
}

// Load tasks from localStorage
function loadTasksFromStorage() {
  const storedTasks = localStorage.getItem('tasks')
  if (storedTasks) {
    tasks = JSON.parse(storedTasks)
  }
}

// Save tasks to localStorage
function saveTasksToStorage() {
  localStorage.setItem('tasks', JSON.stringify(tasks))
}

// Render tasks based on current filter
function renderTasks() {
  taskList.innerHTML = ''

  const filteredTasks = tasks.filter((task) => {
    if (currentFilter === 'active') return !task.completed
    if (currentFilter === 'completed') return task.completed
    return true // 'all' filter
  })

  filteredTasks.forEach((task) => {
    const li = document.createElement('li')
    li.className = `task-item ${task.completed ? 'completed' : ''}`
    li.innerHTML = `
            <input type="checkbox" data-id="${task.id}" ${
      task.completed ? 'checked' : ''
    }>
            <span class="task-text">${task.text}</span>
            <button class="delete-btn" data-id="${task.id}">×</button>
        `
    taskList.appendChild(li)
  })
}

// Update tasks count
function updateTasksCount() {
  const activeTasks = tasks.filter((task) => !task.completed).length
  tasksCount.textContent = `${activeTasks} task${
    activeTasks !== 1 ? 's' : ''
  } left`
}

// Add a new task
function addTask() {
  const text = newTaskInput.value.trim()
  if (text === '') return

  const newTask = {
    id: Date.now().toString(),
    text,
    completed: false,
    createdAt: new Date().toISOString(),
  }

  tasks.push(newTask)
  saveTasksToStorage()
  renderTasks()
  updateTasksCount()
  newTaskInput.value = ''

  // Send notification for new task
  if (Notification.permission === 'granted') {
    sendNotification(
      'Новая задача добавлена',
      `"${text}" была добавлена в список.`
    )
  }
}

// Toggle task completion
function toggleTask(id) {
  tasks = tasks.map((task) => {
    if (task.id === id) {
      return { ...task, completed: !task.completed }
    }
    return task
  })

  saveTasksToStorage()
  renderTasks()
  updateTasksCount()
}

// Delete a task
function deleteTask(id) {
  tasks = tasks.filter((task) => task.id !== id)
  saveTasksToStorage()
  renderTasks()
  updateTasksCount()
}

// Set up event listeners
function setupEventListeners() {
  // Add task
  addTaskBtn.addEventListener('click', addTask)
  newTaskInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addTask()
  })

  // Task list events (delegation)
  taskList.addEventListener('click', (e) => {
    const id = e.target.dataset.id
    if (!id) return

    if (e.target.classList.contains('delete-btn')) {
      deleteTask(id)
    }
  })

  taskList.addEventListener('change', (e) => {
    if (e.target.type === 'checkbox') {
      toggleTask(e.target.dataset.id)
    }
  })

  // Filter buttons
  filterBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      filterBtns.forEach((b) => b.classList.remove('active'))
      btn.classList.add('active')
      currentFilter = btn.dataset.filter
      renderTasks()
    })
  })

  // Online/offline events
  window.addEventListener('online', checkConnectionStatus)
  window.addEventListener('offline', checkConnectionStatus)
}

// Check and update connection status
function checkConnectionStatus() {
  if (navigator.onLine) {
    connectionStatus.textContent = 'Online'
    connectionStatus.classList.remove('offline')
  } else {
    connectionStatus.textContent = 'Offline'
    connectionStatus.classList.add('offline')
  }
}

// Setup notification button
function setupNotificationButton() {
  if (!('Notification' in window)) {
    notificationBtn.textContent = 'Уведомления не поддерживаются'
    notificationBtn.disabled = true
    return
  }

  // Функция для обновления текста кнопки
  function updateButtonState() {
    if (Notification.permission === 'granted') {
      // Проверяем, подписаны ли мы на уведомления
      const isSubscribed =
        localStorage.getItem('notificationsEnabled') === 'true'

      if (isSubscribed) {
        notificationBtn.textContent = 'Отключить уведомления'
        notificationBtn.classList.add('active')
      } else {
        notificationBtn.textContent = 'Включить уведомления'
        notificationBtn.classList.remove('active')
      }
    } else if (Notification.permission === 'denied') {
      notificationBtn.textContent = 'Уведомления заблокированы'
      notificationBtn.disabled = true
    } else {
      notificationBtn.textContent = 'Разрешить уведомления'
    }
  }

  // Инициализация состояния кнопки
  updateButtonState()

  // Обработчик нажатия на кнопку
  notificationBtn.addEventListener('click', async () => {
    // Если разрешения еще нет, запрашиваем его
    if (Notification.permission === 'default') {
      const permission = await Notification.requestPermission()

      if (permission === 'granted') {
        // Если разрешение получено, подписываемся на уведомления
        localStorage.setItem('notificationsEnabled', 'true')
        registerPushSubscription()
        updateButtonState()

        // Отправляем тестовое уведомление
        sendNotification(
          'Уведомления включены',
          'Вы будете получать уведомления о задачах'
        )
      } else {
        updateButtonState()
      }
    }
    // Если разрешение уже есть, переключаем состояние подписки
    else if (Notification.permission === 'granted') {
      const isCurrentlySubscribed =
        localStorage.getItem('notificationsEnabled') === 'true'

      // Переключаем состояние
      if (isCurrentlySubscribed) {
        // Отписываемся от уведомлений
        localStorage.setItem('notificationsEnabled', 'false')

        // Если есть интервал уведомлений, очищаем его
        if (notificationInterval) {
          clearInterval(notificationInterval)
          notificationInterval = null
        }

        // Отправляем уведомление о выключении
        sendNotification(
          'Уведомления отключены',
          'Вы больше не будете получать уведомления о задачах'
        )
      } else {
        // Подписываемся на уведомления
        localStorage.setItem('notificationsEnabled', 'true')
        registerPushSubscription()
        scheduleNotifications()

        // Отправляем уведомление о включении
        sendNotification(
          'Уведомления включены',
          'Вы будете получать уведомления о задачах'
        )
      }

      // Обновляем состояние кнопки
      updateButtonState()
    }
  })
}

// Глобальная переменная для хранения интервала

function scheduleNotifications() {
  // Очищаем предыдущий интервал, если он существует
  if (notificationInterval) {
    clearInterval(notificationInterval)
    console.log('Предыдущий интервал уведомлений очищен')
  }

  // Проверяем, включены ли уведомления
  if (localStorage.getItem('notificationsEnabled') !== 'true') {
    console.log('Уведомления отключены пользователем')
    return
  }

  console.log('Настройка интервала уведомлений - проверка каждые 2 часа')

  // Устанавливаем новый интервал
  notificationInterval = setInterval(() => {
    console.log(
      'Проверка незавершенных задач:',
      new Date().toLocaleTimeString()
    )

    // Проверяем, включены ли еще уведомления
    if (localStorage.getItem('notificationsEnabled') !== 'true') {
      clearInterval(notificationInterval)
      console.log('Интервал уведомлений остановлен - уведомления отключены')
      return
    }

    const incompleteTasks = tasks.filter((task) => !task.completed)

    if (incompleteTasks.length > 0 && Notification.permission === 'granted') {
      console.log(
        'Отправка уведомления о',
        incompleteTasks.length,
        'незавершенных задачах'
      )
      sendNotification(
        'Напоминание: Незавершенные задачи',
        `У вас ${incompleteTasks.length} незавершенных задач(и).`
      )
    }
  }, 2 * 60 * 60 * 1000) // 2 часа
}

// Register for push notifications
async function registerPushSubscription() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.log('Push notifications not supported')
    return
  }

  try {
    const registration = await navigator.serviceWorker.ready
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(
        'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U'
      ),
    })

    console.log('Push subscription successful:', subscription)

    // In a real app, you would send this subscription to your server
    // saveSubscriptionToServer(subscription);
  } catch (error) {
    console.error('Failed to subscribe to push notifications:', error)
  }
}

// Convert base64 to Uint8Array for applicationServerKey
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')

  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

// Send notification
function sendNotification(title, body) {
  if (
    Notification.permission === 'granted' &&
    localStorage.getItem('notificationsEnabled') === 'true'
  ) {
    navigator.serviceWorker.ready.then((registration) => {
      registration.showNotification(title, {
        body,
        vibrate: [100, 50, 100],
        data: {
          dateOfArrival: Date.now(),
          primaryKey: 1,
        },
        actions: [
          {
            action: 'explore',
            title: 'View Tasks',
          },
          {
            action: 'close',
            title: 'Close',
          },
        ],
      })
    })
  }
}

// Global variable to track the interval

function scheduleNotifications() {
  // Clear any existing interval first
  if (notificationInterval) {
    clearInterval(notificationInterval)
    console.log('Cleared previous notification interval')
  }

  console.log('Setting up notifications interval - will check every 2 hours')

  // Set new interval with proper timing
  notificationInterval = setInterval(() => {
    console.log(
      'Checking for incomplete tasks at:',
      new Date().toLocaleTimeString()
    )
    const incompleteTasks = tasks.filter((task) => !task.completed)

    if (incompleteTasks.length > 0 && Notification.permission === 'granted') {
      console.log(
        'Sending notification for',
        incompleteTasks.length,
        'incomplete tasks'
      )
      sendNotification(
        'Reminder: Incomplete Tasks',
        `You have ${incompleteTasks.length} task(s) to complete.`
      )
    }
  }, 2 * 60 * 60 * 1000) // 2 hours in milliseconds
}

// Setup install prompt
function setupInstallPrompt() {
  // Listen for the beforeinstallprompt event
  window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent Chrome 67 and earlier from automatically showing the prompt
    e.preventDefault()
    // Stash the event so it can be triggered later
    deferredPrompt = e
    // Show the install button
    installBtn.classList.remove('hidden')

    // Show custom install prompt for iOS
    if (
      navigator.userAgent.match(/iPhone|iPad|iPod/) &&
      !navigator.standalone
    ) {
      installPrompt.classList.remove('hidden')
    }
  })

  // Handle install button click
  installBtn.addEventListener('click', async () => {
    if (!deferredPrompt) return

    // Show the install prompt
    deferredPrompt.prompt()

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice
    console.log(`User response to the install prompt: ${outcome}`)

    // We've used the prompt, and can't use it again, throw it away
    deferredPrompt = null

    // Hide the install button
    installBtn.classList.add('hidden')
  })

  // Handle custom prompt buttons
  closePromptBtn.addEventListener('click', () => {
    installPrompt.classList.add('hidden')
  })

  confirmInstallBtn.addEventListener('click', () => {
    installPrompt.classList.add('hidden')
    // Show instructions for iOS
    alert(
      'To install this app on your device: tap the share button and then "Add to Home Screen"'
    )
  })

  // Listen for the appinstalled event
  window.addEventListener('appinstalled', (evt) => {
    console.log('App was installed')
    installBtn.classList.add('hidden')
    installPrompt.classList.add('hidden')
  })
}

function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker
      .register('/notes/sw.js')
      .then((registration) => {
        console.log('Service Worker registered with scope:', registration.scope)
      })
      .catch((error) => {
        console.error('Service Worker registration failed:', error)
      })
  }
}

// Initialize the app
document.addEventListener('DOMContentLoaded', init)
