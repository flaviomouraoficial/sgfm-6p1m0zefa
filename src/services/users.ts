import pb from '@/lib/pocketbase/client'

export const usersService = {
  create: async (data: any) => {
    return pb.collection('users').create({
      email: data.email,
      password: data.password,
      passwordConfirm: data.passwordConfirm,
      role: data.role,
      plan: data.plan,
    })
  },
  update: async (id: string, data: any) => {
    return pb.collection('users').update(id, data)
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
