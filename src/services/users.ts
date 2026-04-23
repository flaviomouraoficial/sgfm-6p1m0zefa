import { supabase } from '@/lib/supabase/client'

export const usersService = {
  create: async (payload: any) => {
    const { data, error } = await supabase.functions.invoke('manage-users', {
      body: { action: 'create', payload },
    })
    if (error) throw error
    return data
  },
  delete: async (id: string) => {
    const { data, error } = await supabase.functions.invoke('manage-users', {
      body: { action: 'delete', payload: { id } },
    })
    if (error) throw error
    return data
  },
  updatePassword: async (id: string, password: string) => {
    const { data, error } = await supabase.functions.invoke('manage-users', {
      body: { action: 'update', payload: { id, password } },
    })
    if (error) throw error
    return data
  },
}
