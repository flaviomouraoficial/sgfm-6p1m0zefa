// AVOID UPDATING THIS FILE DIRECTLY. It is automatically generated.
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '14.5'
  }
  public: {
    Tables: {
      agendamentos: {
        Row: {
          cliente_email: string | null
          cliente_nome: string | null
          cliente_telefone: string | null
          created_at: string | null
          data_horario: string | null
          id: string
          profissional_id: string | null
          servico_id: string | null
          status: string | null
        }
        Insert: {
          cliente_email?: string | null
          cliente_nome?: string | null
          cliente_telefone?: string | null
          created_at?: string | null
          data_horario?: string | null
          id: string
          profissional_id?: string | null
          servico_id?: string | null
          status?: string | null
        }
        Update: {
          cliente_email?: string | null
          cliente_nome?: string | null
          cliente_telefone?: string | null
          created_at?: string | null
          data_horario?: string | null
          id?: string
          profissional_id?: string | null
          servico_id?: string | null
          status?: string | null
        }
        Relationships: []
      }
      clients: {
        Row: {
          createdAt: string | null
          email: string | null
          id: string
          name: string | null
          phone: string | null
          status: string | null
        }
        Insert: {
          createdAt?: string | null
          email?: string | null
          id: string
          name?: string | null
          phone?: string | null
          status?: string | null
        }
        Update: {
          createdAt?: string | null
          email?: string | null
          id?: string
          name?: string | null
          phone?: string | null
          status?: string | null
        }
        Relationships: []
      }
      deals: {
        Row: {
          clientName: string | null
          createdAt: string | null
          email: string | null
          id: string
          notes: string | null
          phone: string | null
          stage: string | null
          title: string | null
          value: number | null
        }
        Insert: {
          clientName?: string | null
          createdAt?: string | null
          email?: string | null
          id: string
          notes?: string | null
          phone?: string | null
          stage?: string | null
          title?: string | null
          value?: number | null
        }
        Update: {
          clientName?: string | null
          createdAt?: string | null
          email?: string | null
          id?: string
          notes?: string | null
          phone?: string | null
          stage?: string | null
          title?: string | null
          value?: number | null
        }
        Relationships: []
      }
      forecasts_store: {
        Row: {
          data: Json | null
          id: string
        }
        Insert: {
          data?: Json | null
          id: string
        }
        Update: {
          data?: Json | null
          id?: string
        }
        Relationships: []
      }
      mentees: {
        Row: {
          attachments: Json | null
          company: string | null
          contractValue: number | null
          createdAt: string | null
          email: string | null
          emailLogs: Json | null
          id: string
          name: string | null
          phone: string | null
          sessions: Json | null
          status: string | null
          totalSessions: number | null
        }
        Insert: {
          attachments?: Json | null
          company?: string | null
          contractValue?: number | null
          createdAt?: string | null
          email?: string | null
          emailLogs?: Json | null
          id: string
          name?: string | null
          phone?: string | null
          sessions?: Json | null
          status?: string | null
          totalSessions?: number | null
        }
        Update: {
          attachments?: Json | null
          company?: string | null
          contractValue?: number | null
          createdAt?: string | null
          email?: string | null
          emailLogs?: Json | null
          id?: string
          name?: string | null
          phone?: string | null
          sessions?: Json | null
          status?: string | null
          totalSessions?: number | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          id: string
          role: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id: string
          role?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
      profissionais: {
        Row: {
          created_at: string | null
          especialidade: string | null
          id: string
          nome: string | null
        }
        Insert: {
          created_at?: string | null
          especialidade?: string | null
          id: string
          nome?: string | null
        }
        Update: {
          created_at?: string | null
          especialidade?: string | null
          id?: string
          nome?: string | null
        }
        Relationships: []
      }
      proposals: {
        Row: {
          createdAt: string | null
          description: string | null
          expirationDate: string | null
          id: string
          leadId: string | null
          status: string | null
          title: string | null
          value: number | null
        }
        Insert: {
          createdAt?: string | null
          description?: string | null
          expirationDate?: string | null
          id: string
          leadId?: string | null
          status?: string | null
          title?: string | null
          value?: number | null
        }
        Update: {
          createdAt?: string | null
          description?: string | null
          expirationDate?: string | null
          id?: string
          leadId?: string | null
          status?: string | null
          title?: string | null
          value?: number | null
        }
        Relationships: []
      }
      servicos: {
        Row: {
          created_at: string | null
          duracao_minutos: number | null
          id: string
          nome: string | null
          preco: number | null
        }
        Insert: {
          created_at?: string | null
          duracao_minutos?: number | null
          id: string
          nome?: string | null
          preco?: number | null
        }
        Update: {
          created_at?: string | null
          duracao_minutos?: number | null
          id?: string
          nome?: string | null
          preco?: number | null
        }
        Relationships: []
      }
      sessions: {
        Row: {
          clientId: string | null
          createdAt: string | null
          date: string | null
          discussion: string | null
          duration: number | null
          id: string
          notes: string | null
          status: string | null
          tasks: string | null
          type: string | null
        }
        Insert: {
          clientId?: string | null
          createdAt?: string | null
          date?: string | null
          discussion?: string | null
          duration?: number | null
          id: string
          notes?: string | null
          status?: string | null
          tasks?: string | null
          type?: string | null
        }
        Update: {
          clientId?: string | null
          createdAt?: string | null
          date?: string | null
          discussion?: string | null
          duration?: number | null
          id?: string
          notes?: string | null
          status?: string | null
          tasks?: string | null
          type?: string | null
        }
        Relationships: []
      }
      settings_store: {
        Row: {
          data: Json | null
          id: string
        }
        Insert: {
          data?: Json | null
          id: string
        }
        Update: {
          data?: Json | null
          id?: string
        }
        Relationships: []
      }
      timeSlots: {
        Row: {
          cliente_email: string | null
          cliente_nome: string | null
          cliente_telefone: string | null
          createdAt: string | null
          date: string | null
          description: string | null
          id: string
          isBooked: boolean | null
          menteeCompany: string | null
          menteeEmail: string | null
          menteeName: string | null
          menteePhone: string | null
          professional: string | null
          service: string | null
          status: string | null
          time: string | null
        }
        Insert: {
          cliente_email?: string | null
          cliente_nome?: string | null
          cliente_telefone?: string | null
          createdAt?: string | null
          date?: string | null
          description?: string | null
          id: string
          isBooked?: boolean | null
          menteeCompany?: string | null
          menteeEmail?: string | null
          menteeName?: string | null
          menteePhone?: string | null
          professional?: string | null
          service?: string | null
          status?: string | null
          time?: string | null
        }
        Update: {
          cliente_email?: string | null
          cliente_nome?: string | null
          cliente_telefone?: string | null
          createdAt?: string | null
          date?: string | null
          description?: string | null
          id?: string
          isBooked?: boolean | null
          menteeCompany?: string | null
          menteeEmail?: string | null
          menteeName?: string | null
          menteePhone?: string | null
          professional?: string | null
          service?: string | null
          status?: string | null
          time?: string | null
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number | null
          attachments: Json | null
          bank: string | null
          category: string | null
          classification: string | null
          client: string | null
          company: string | null
          createdAt: string | null
          date: string | null
          description: string | null
          entryDate: string | null
          id: string
          paymentLink: string | null
          paymentMethod: string | null
          performer: string | null
          recurrence: Json | null
          recurringGroupId: string | null
          service: string | null
          status: string | null
          supplier: string | null
          type: string | null
          updatedAt: string | null
        }
        Insert: {
          amount?: number | null
          attachments?: Json | null
          bank?: string | null
          category?: string | null
          classification?: string | null
          client?: string | null
          company?: string | null
          createdAt?: string | null
          date?: string | null
          description?: string | null
          entryDate?: string | null
          id: string
          paymentLink?: string | null
          paymentMethod?: string | null
          performer?: string | null
          recurrence?: Json | null
          recurringGroupId?: string | null
          service?: string | null
          status?: string | null
          supplier?: string | null
          type?: string | null
          updatedAt?: string | null
        }
        Update: {
          amount?: number | null
          attachments?: Json | null
          bank?: string | null
          category?: string | null
          classification?: string | null
          client?: string | null
          company?: string | null
          createdAt?: string | null
          date?: string | null
          description?: string | null
          entryDate?: string | null
          id?: string
          paymentLink?: string | null
          paymentMethod?: string | null
          performer?: string | null
          recurrence?: Json | null
          recurringGroupId?: string | null
          service?: string | null
          status?: string | null
          supplier?: string | null
          type?: string | null
          updatedAt?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const

// ====== DATABASE EXTENDED CONTEXT (auto-generated) ======
// This section contains actual PostgreSQL column types, constraints, RLS policies,
// functions, triggers, indexes and materialized views not present in the type definitions above.
// IMPORTANT: The TypeScript types above map UUID, TEXT, VARCHAR all to "string".
// Use the COLUMN TYPES section below to know the real PostgreSQL type for each column.
// Always use the correct PostgreSQL type when writing SQL migrations.

// --- COLUMN TYPES (actual PostgreSQL types) ---
// Use this to know the real database type when writing migrations.
// "string" in TypeScript types above may be uuid, text, varchar, timestamptz, etc.
// Table: agendamentos
//   id: text (not null)
//   profissional_id: text (nullable)
//   servico_id: text (nullable)
//   data_horario: text (nullable)
//   cliente_nome: text (nullable)
//   cliente_email: text (nullable)
//   cliente_telefone: text (nullable)
//   status: text (nullable)
//   created_at: text (nullable)
// Table: clients
//   id: text (not null)
//   name: text (nullable)
//   email: text (nullable)
//   phone: text (nullable)
//   status: text (nullable)
//   createdAt: text (nullable)
// Table: deals
//   id: text (not null)
//   title: text (nullable)
//   clientName: text (nullable)
//   value: numeric (nullable)
//   stage: text (nullable)
//   phone: text (nullable)
//   email: text (nullable)
//   notes: text (nullable)
//   createdAt: text (nullable)
// Table: forecasts_store
//   id: text (not null)
//   data: jsonb (nullable, default: '[]'::jsonb)
// Table: mentees
//   id: text (not null)
//   name: text (nullable)
//   company: text (nullable)
//   contractValue: numeric (nullable)
//   totalSessions: integer (nullable)
//   status: text (nullable)
//   phone: text (nullable)
//   email: text (nullable)
//   sessions: jsonb (nullable, default: '[]'::jsonb)
//   emailLogs: jsonb (nullable, default: '[]'::jsonb)
//   attachments: jsonb (nullable, default: '[]'::jsonb)
//   createdAt: text (nullable)
// Table: profiles
//   id: uuid (not null)
//   email: text (not null)
//   role: text (not null, default: 'mentee'::text)
//   created_at: timestamp with time zone (not null, default: now())
//   updated_at: timestamp with time zone (not null, default: now())
// Table: profissionais
//   id: text (not null)
//   nome: text (nullable)
//   especialidade: text (nullable)
//   created_at: text (nullable)
// Table: proposals
//   id: text (not null)
//   title: text (nullable)
//   leadId: text (nullable)
//   value: numeric (nullable)
//   expirationDate: text (nullable)
//   description: text (nullable)
//   status: text (nullable)
//   createdAt: text (nullable)
// Table: servicos
//   id: text (not null)
//   nome: text (nullable)
//   duracao_minutos: numeric (nullable)
//   preco: numeric (nullable)
//   created_at: text (nullable)
// Table: sessions
//   id: text (not null)
//   clientId: text (nullable)
//   date: text (nullable)
//   notes: text (nullable)
//   type: text (nullable)
//   duration: numeric (nullable)
//   discussion: text (nullable)
//   tasks: text (nullable)
//   status: text (nullable)
//   createdAt: text (nullable)
// Table: settings_store
//   id: text (not null)
//   data: jsonb (nullable, default: '{}'::jsonb)
// Table: timeSlots
//   id: text (not null)
//   date: text (nullable)
//   time: text (nullable)
//   description: text (nullable)
//   isBooked: boolean (nullable, default: false)
//   menteeName: text (nullable)
//   menteeEmail: text (nullable)
//   menteePhone: text (nullable)
//   menteeCompany: text (nullable)
//   service: text (nullable)
//   professional: text (nullable)
//   cliente_email: text (nullable)
//   cliente_nome: text (nullable)
//   cliente_telefone: text (nullable)
//   status: text (nullable)
//   createdAt: text (nullable)
// Table: transactions
//   id: text (not null)
//   description: text (nullable)
//   amount: numeric (nullable)
//   type: text (nullable)
//   date: text (nullable)
//   entryDate: text (nullable)
//   classification: text (nullable)
//   category: text (nullable)
//   status: text (nullable)
//   company: text (nullable)
//   bank: text (nullable)
//   service: text (nullable)
//   paymentMethod: text (nullable)
//   performer: text (nullable)
//   client: text (nullable)
//   supplier: text (nullable)
//   paymentLink: text (nullable)
//   attachments: jsonb (nullable, default: '[]'::jsonb)
//   recurringGroupId: text (nullable)
//   recurrence: jsonb (nullable)
//   createdAt: text (nullable)
//   updatedAt: text (nullable)

// --- CONSTRAINTS ---
// Table: agendamentos
//   PRIMARY KEY agendamentos_pkey: PRIMARY KEY (id)
// Table: clients
//   PRIMARY KEY clients_pkey: PRIMARY KEY (id)
// Table: deals
//   PRIMARY KEY deals_pkey: PRIMARY KEY (id)
// Table: forecasts_store
//   PRIMARY KEY forecasts_store_pkey: PRIMARY KEY (id)
// Table: mentees
//   PRIMARY KEY mentees_pkey: PRIMARY KEY (id)
// Table: profiles
//   FOREIGN KEY profiles_id_fkey: FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE
//   PRIMARY KEY profiles_pkey: PRIMARY KEY (id)
// Table: profissionais
//   PRIMARY KEY profissionais_pkey: PRIMARY KEY (id)
// Table: proposals
//   PRIMARY KEY proposals_pkey: PRIMARY KEY (id)
// Table: servicos
//   PRIMARY KEY servicos_pkey: PRIMARY KEY (id)
// Table: sessions
//   PRIMARY KEY sessions_pkey: PRIMARY KEY (id)
// Table: settings_store
//   PRIMARY KEY settings_store_pkey: PRIMARY KEY (id)
// Table: timeSlots
//   PRIMARY KEY timeSlots_pkey: PRIMARY KEY (id)
// Table: transactions
//   PRIMARY KEY transactions_pkey: PRIMARY KEY (id)

// --- ROW LEVEL SECURITY POLICIES ---
// Table: agendamentos
//   Policy "Allow all authenticated users" (ALL, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
//   Policy "Allow anon insert agendamentos" (INSERT, PERMISSIVE) roles={anon}
//     WITH CHECK: true
// Table: clients
//   Policy "Allow all authenticated users" (ALL, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
// Table: deals
//   Policy "Allow all authenticated users" (ALL, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
// Table: forecasts_store
//   Policy "Allow all authenticated users" (ALL, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
// Table: mentees
//   Policy "Allow all authenticated users" (ALL, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
// Table: profiles
//   Policy "profiles_read_self" (SELECT, PERMISSIVE) roles={public}
//     USING: (auth.uid() = id)
//   Policy "profiles_update_self" (UPDATE, PERMISSIVE) roles={public}
//     USING: (auth.uid() = id)
// Table: profissionais
//   Policy "Allow all authenticated users" (ALL, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
//   Policy "Allow anon read profissionais" (SELECT, PERMISSIVE) roles={anon}
//     USING: true
// Table: proposals
//   Policy "Allow all authenticated users" (ALL, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
// Table: servicos
//   Policy "Allow all authenticated users" (ALL, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
//   Policy "Allow anon read servicos" (SELECT, PERMISSIVE) roles={anon}
//     USING: true
// Table: sessions
//   Policy "Allow all authenticated users" (ALL, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
// Table: settings_store
//   Policy "Allow all authenticated users" (ALL, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
//   Policy "Allow anon read settings_store" (SELECT, PERMISSIVE) roles={anon}
//     USING: true
// Table: timeSlots
//   Policy "Allow all authenticated users" (ALL, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
//   Policy "Allow anon read timeSlots" (SELECT, PERMISSIVE) roles={anon}
//     USING: true
//   Policy "Allow anon update timeSlots" (UPDATE, PERMISSIVE) roles={anon}
//     USING: true
//     WITH CHECK: true
// Table: transactions
//   Policy "Allow all authenticated users" (ALL, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true

// --- DATABASE FUNCTIONS ---
// FUNCTION handle_new_user()
//   CREATE OR REPLACE FUNCTION public.handle_new_user()
//    RETURNS trigger
//    LANGUAGE plpgsql
//    SECURITY DEFINER
//   AS $function$
//   BEGIN
//     INSERT INTO public.profiles (id, email, role)
//     VALUES (
//       NEW.id,
//       NEW.email,
//       CASE WHEN NEW.email = 'flavio@trendconsultoria.com.br' THEN 'admin' ELSE 'mentee' END
//     );
//     RETURN NEW;
//   END;
//   $function$
//
