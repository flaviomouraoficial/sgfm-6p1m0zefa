import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PERMISSION_GROUPS } from '@/lib/permissions'
import { cn } from '@/lib/utils'

interface Props {
  permissions: Record<string, any>
  onChange: (perms: Record<string, any>) => void
  isAdmin?: boolean
}

export function PermissionsEditor({ permissions, onChange, isAdmin }: Props) {
  if (isAdmin) {
    return (
      <div className="p-4 bg-muted/20 rounded-lg border text-sm text-muted-foreground text-center">
        Administradores têm acesso total ao sistema.
      </div>
    )
  }

  const updatePerm = (group: string, key: string, value: boolean | string) => {
    onChange({
      ...permissions,
      [group]: { ...permissions[group], [key]: value },
    })
  }

  return (
    <div className="space-y-4">
      {PERMISSION_GROUPS.map((group) => (
        <div key={group.key} className="space-y-2">
          <h4 className="text-sm font-semibold text-foreground border-b pb-1">{group.label}</h4>
          <div className="grid gap-2">
            {group.permissions.map((perm) => (
              <div
                key={perm.key}
                className={cn(
                  'flex items-center justify-between p-2.5 rounded-lg border bg-muted/10',
                )}
              >
                <Label className="text-xs font-normal cursor-pointer flex-1">{perm.label}</Label>
                {perm.type === 'select' ? (
                  <Select
                    value={permissions[group.key]?.[perm.key] || perm.default}
                    onValueChange={(v) => updatePerm(group.key, perm.key, v)}
                  >
                    <SelectTrigger className="h-7 w-[140px] text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {perm.options?.map((opt) => (
                        <SelectItem key={opt} value={opt} className="text-xs capitalize">
                          {opt}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Switch
                    checked={permissions[group.key]?.[perm.key] ?? perm.default}
                    onCheckedChange={(c) => updatePerm(group.key, perm.key, c)}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
