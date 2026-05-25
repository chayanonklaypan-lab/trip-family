self.addEventListener('push', event => {
  const data = event.data?.json() || {}
  event.waitUntil(
    self.registration.showNotification(data.title || 'ทริปครอบครัว', {
      body: data.body || '',
      icon: '/icon.svg',
      badge: '/icon.svg',
    })
  )
})

self.addEventListener('notificationclick', event => {
  event.notification.close()
  event.waitUntil(clients.openWindow('/'))
})
