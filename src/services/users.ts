import pb from '@/lib/pocketbase/client'
import { getDefaultPermissions } from '@/lib/permissions'

export const usersService = {
  create: async (data: any) => {
    return pb.collection('users').create({
      email: data.email,
      password: data.password,
      passwordConfirm: data.passwordConfirm,
      role: data.role,
      plan: data.plan,
      permissions: data.permissions || getDefaultPermissions(),
    })
  },
  update: async (id: string, data: any) => {
    const updateData: any = {
      role: data.role,
      plan: data.plan,
      permissions: data.permissions,
    }
    if (data.password) {
      updateData.password = data.password
      updateData.passwordConfirm = data.passwordConfirm || data.password
    }
    if (data.email) {
      updateData.email = data.email
    }
    return pb.collection('users').update(id, updateData)
  },
  delete: async (id: string) => {
    return pb.collection('users').delete(id)
  },
  updatePassword: async (id: string, password: string, passwordConfirm?: string) => {
    return pb.collection('users').update(id, {
      password: password,
      passwordConfirm: passwordConfirm || password,
    })
  },
}
