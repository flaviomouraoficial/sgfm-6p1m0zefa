import { useState, useEffect } from 'react'
import pb from '@/lib/pocketbase/client'
import { useAuth } from '@/hooks/use-auth'
import { useRealtime } from '@/hooks/use-realtime'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Bell, CheckCircle2 } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export function NotificationBell() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<any[]>([])
  const [open, setOpen] = useState(false)

  const fetchNotifications = async () => {
    if (!user) return
    try {
      const records = await pb.collection('v1_notifications').getFullList({
        filter: `user_id = '${user.id}'`,
        sort: '-created',
      })
      setNotifications(records)
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    fetchNotifications()
  }, [user])

  useRealtime('v1_notifications', () => {
    fetchNotifications()
  })

  const markAsRead = async (id: string) => {
    try {
      await pb.collection('v1_notifications').update(id, { is_read: true })
    } catch (e) {
      console.error(e)
    }
  }

  const markAllAsRead = async () => {
    const unread = notifications.filter((n) => !n.is_read)
    for (const n of unread) {
      await pb
        .collection('v1_notifications')
        .update(n.id, { is_read: true })
        .catch(() => {})
    }
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative text-white hover:bg-white/10 rounded-full transition-colors"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0 shadow-lg border-border/50">
        <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
          <h4 className="text-sm font-semibold">Notificações</h4>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-0 text-xs text-primary"
              onClick={markAllAsRead}
            >
              Marcar lidas
            </Button>
          )}
        </div>
        <div className="max-h-[300px] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground flex flex-col items-center">
              <Bell className="h-6 w-6 text-muted-foreground/30 mb-2" />
              Você não possui novas notificações.
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                className={`flex gap-3 p-4 border-b last:border-0 hover:bg-muted/50 transition-colors ${
                  !n.is_read ? 'bg-primary/5' : ''
                }`}
                onClick={() => {
                  if (!n.is_read) markAsRead(n.id)
                }}
              >
                <div className="flex-1 space-y-1 cursor-pointer">
                  <p className={`text-sm ${!n.is_read ? 'font-semibold' : 'text-foreground/80'}`}>
                    {n.title}
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{n.message}</p>
                  <p className="text-[10px] text-muted-foreground/70 font-medium mt-1">
                    {formatDistanceToNow(new Date(n.created), { addSuffix: true, locale: ptBR })}
                  </p>
                </div>
                {!n.is_read && (
                  <div className="flex shrink-0 items-center justify-center">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-primary hover:text-primary/80"
                      onClick={(e) => {
                        e.stopPropagation()
                        markAsRead(n.id)
                      }}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
