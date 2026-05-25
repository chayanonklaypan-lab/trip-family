importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js')

if (!firebase.apps.length) {
  firebase.initializeApp({
    apiKey: 'AIzaSyD7g_7u7i2iF68DSy8EyH8fHlDDmFfI_KI',
    authDomain: 'my-finance-app-bc424.firebaseapp.com',
    projectId: 'my-finance-app-bc424',
    storageBucket: 'my-finance-app-bc424.firebasestorage.app',
    messagingSenderId: '59908518783',
    appId: '1:59908518783:web:30a0e1118ea3ee766c604a',
  })
}

const messaging = firebase.messaging()

messaging.onBackgroundMessage(({ notification }) => {
  self.registration.showNotification(notification?.title || 'ทริปครอบครัว', {
    body: notification?.body || '',
    icon: '/icon.svg',
    badge: '/icon.svg',
  })
})
