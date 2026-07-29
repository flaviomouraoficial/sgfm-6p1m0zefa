import { checkIsAdmin } from '@/hooks/use-auth'

export type PermissionValueType = 'boolean' | 'select'

export interface PermissionDef {
  key: string
  label: string
  type: PermissionValueType
  options?: string[]
  default: boolean | string
}

export interface PermissionGroup {
  key: string
  label: string
  permissions: PermissionDef[]
}

export const PERMISSION_GROUPS: PermissionGroup[] = [
  {
    key: 'financeiro',
    label: 'Financeiro',
    permissions: [
      { key: 'ver_transacoes', label: 'Ver Transações', type: 'boolean', default: true },
      { key: 'criar_editar', label: 'Criar/Editar', type: 'boolean', default: true },
      { key: 'importar', label: 'Importar', type: 'boolean', default: true },
      { key: 'recibos', label: 'Recibos', type: 'boolean', default: true },
      {
        key: 'relatorios_financeiros',
        label: 'Relatórios Financeiros',
        type: 'boolean',
        default: true,
      },
    ],
  },
  {
    key: 'crm',
    label: 'CRM',
    permissions: [
      { key: 'ver_funil', label: 'Ver Funil', type: 'boolean', default: true },
      { key: 'criar_editar_deals', label: 'Criar/Editar Negócios', type: 'boolean', default: true },
      { key: 'propostas', label: 'Propostas', type: 'boolean', default: true },
      { key: 'clientes', label: 'Clientes', type: 'boolean', default: true },
    ],
  },
  {
    key: 'mentoria',
    label: 'Mentoria',
    permissions: [
      { key: 'ver_mentorados', label: 'Ver Mentorados', type: 'boolean', default: true },
      { key: 'sessoes', label: 'Sessões', type: 'boolean', default: true },
      { key: 'agenda', label: 'Agenda', type: 'boolean', default: true },
    ],
  },
  {
    key: 'saas',
    label: 'SaaS',
    permissions: [
      { key: 'disc', label: 'DISC', type: 'boolean', default: true },
      { key: 'assessment', label: 'Assessment', type: 'boolean', default: true },
      { key: '360', label: '360°', type: 'boolean', default: true },
      { key: 'creditos', label: 'Créditos', type: 'boolean', default: true },
      {
        key: 'nivel_relatorio',
        label: 'Nível de Relatório',
        type: 'select',
        options: ['essencial', 'intermediario', 'completo'],
        default: 'essencial',
      },
    ],
  },
  {
    key: 'protensora',
    label: 'Protensora',
    permissions: [
      { key: 'ver_trilhas', label: 'Ver Trilhas', type: 'boolean', default: true },
      { key: 'certificados', label: 'Certificados', type: 'boolean', default: true },
    ],
  },
  {
    key: 'rh',
    label: 'RH',
    permissions: [
      { key: 'registro_ponto', label: 'Registro de Ponto', type: 'boolean', default: true },
    ],
  },
  {
    key: 'biblioteca',
    label: 'Biblioteca',
    permissions: [
      { key: 'ver', label: 'Ver', type: 'boolean', default: true },
      { key: 'editar', label: 'Editar', type: 'boolean', default: false },
    ],
  },
  {
    key: 'admin',
    label: 'Administração',
    permissions: [
      { key: 'gerenciar_usuarios', label: 'Gerenciar Usuários', type: 'boolean', default: false },
      { key: 'configuracoes', label: 'Configurações', type: 'boolean', default: false },
      { key: 'perfis_acesso', label: 'Perfis de Acesso', type: 'boolean', default: false },
    ],
  },
]

export function getDefaultPermissions(): Record<string, any> {
  const perms: Record<string, any> = {}
  for (const group of PERMISSION_GROUPS) {
    perms[group.key] = {}
    for (const perm of group.permissions) {
      perms[group.key][perm.key] = perm.default
    }
  }
  return perms
}

const LEGACY_MAP: Record<string, string[]> = {
  links: ['saas.disc', 'saas.assessment'],
  agenda: ['mentoria.agenda'],
  buy_credits: ['saas.creditos'],
  credits: ['saas.creditos'],
  reports: ['saas.disc', 'saas.assessment'],
}

export function hasPermission(user: any, path: string): boolean {
  if (!user) return false
  if (checkIsAdmin(user)) return true
  const perms = user.permissions
  if (!perms || typeof perms !== 'object') return true

  const parts = path.split('.')
  if (parts.length >= 2) {
    let current: any = perms
    for (const part of parts) {
      if (current && typeof current === 'object' && part in current) {
        current = current[part]
      } else {
        return true
      }
    }
    return current !== false
  }

  if (LEGACY_MAP[path]) {
    return LEGACY_MAP[path].some((p) => hasPermission(user, p))
  }
  return perms[path] !== false
}

export function getNivelRelatorio(user: any): string {
  if (!user?.permissions) return 'essencial'
  const saas = user.permissions.saas
  if (saas && typeof saas.nivel_relatorio === 'string') return saas.nivel_relatorio
  return 'essencial'
}

export const NIVEL_CREDITS: Record<string, number> = {
  essencial: 10,
  intermediario: 20,
  completo: 30,
}
