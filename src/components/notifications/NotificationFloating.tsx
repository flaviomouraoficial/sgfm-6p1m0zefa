import { useState, useEffect } from 'react'
import pb from '@/lib/pocketbase/client'
import { useAuth } from '@/hooks/use-auth'
import { useRealtime } from '@/hooks/use-realtime'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Bell, CheckCircle2 } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export function NotificationFloating() {
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

  if (!user) return null

  const unreadCount = notifications.filter((n) => !n.is_read).length

  return (
    <div className="fixed bottom-6 right-6 z-[99]">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            size="icon"
            className="h-14 w-14 rounded-full shadow-2xl relative bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            <Bell className="h-6 w-6" />
            {unreadCount > 0 && (
              <span className="absolute top-0 right-0 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white border-2 border-primary">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="end"
          sideOffset={16}
          className="w-80 p-0 shadow-2xl border-border/50"
        >
          <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30 rounded-t-md">
            <h4 className="text-sm font-semibold">Central de Notificações</h4>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 text-xs text-primary hover:bg-transparent"
                onClick={markAllAsRead}
              >
                Marcar lidas
              </Button>
            )}
          </div>
          <div className="max-h-[350px] overflow-y-auto bg-background rounded-b-md">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground flex flex-col items-center">
                <Bell className="h-8 w-8 text-muted-foreground/20 mb-3" />
                Nenhuma notificação no momento.
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
                    <p
                      className={`text-sm ${!n.is_read ? 'font-semibold text-foreground' : 'text-foreground/80'}`}
                    >
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
    </div>
  )
}
