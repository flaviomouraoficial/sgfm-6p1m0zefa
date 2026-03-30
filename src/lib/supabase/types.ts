// AVOID UPDATING THIS FILE DIRECTLY. It is automatically generated.
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      agendamentos: {
        Row: {
          cliente_email: string | null
          cliente_nome: string
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
          cliente_nome: string
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
          cliente_nome?: string
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
      blog_posts: {
        Row: {
          category: string | null
          excerpt: string | null
          id: string
          image_url: string | null
          published_at: string | null
          slug: string | null
          title: string | null
        }
        Insert: {
          category?: string | null
          excerpt?: string | null
          id?: string
          image_url?: string | null
          published_at?: string | null
          slug?: string | null
          title?: string | null
        }
        Update: {
          category?: string | null
          excerpt?: string | null
          id?: string
          image_url?: string | null
          published_at?: string | null
          slug?: string | null
          title?: string | null
        }
        Relationships: []
      }
      clients: {
        Row: {
          company_name: string
          created_at: string | null
          email: string | null
          id: string
          name: string
          phone: string | null
          user_id: string | null
        }
        Insert: {
          company_name: string
          created_at?: string | null
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          user_id?: string | null
        }
        Update: {
          company_name?: string
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      deals: {
        Row: {
          clientName: string
          createdAt: string | null
          email: string | null
          id: string
          notes: string | null
          phone: string | null
          stage: string
          title: string
          value: number
        }
        Insert: {
          clientName: string
          createdAt?: string | null
          email?: string | null
          id: string
          notes?: string | null
          phone?: string | null
          stage: string
          title: string
          value?: number
        }
        Update: {
          clientName?: string
          createdAt?: string | null
          email?: string | null
          id?: string
          notes?: string | null
          phone?: string | null
          stage?: string
          title?: string
          value?: number
        }
        Relationships: []
      }
      evaluations: {
        Row: {
          checklist: Json | null
          created_at: string
          date: string
          diagnosis: string
          evaluator_id: string | null
          evaluator_name: string
          id: string
          observations: Json | null
          professional_name: string
          role: string
          scores: Json
          tenure: string | null
        }
        Insert: {
          checklist?: Json | null
          created_at?: string
          date: string
          diagnosis: string
          evaluator_id?: string | null
          evaluator_name: string
          id?: string
          observations?: Json | null
          professional_name: string
          role: string
          scores?: Json
          tenure?: string | null
        }
        Update: {
          checklist?: Json | null
          created_at?: string
          date?: string
          diagnosis?: string
          evaluator_id?: string | null
          evaluator_name?: string
          id?: string
          observations?: Json | null
          professional_name?: string
          role?: string
          scores?: Json
          tenure?: string | null
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
      gestao_templates: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          sections: Json
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          sections?: Json
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          sections?: Json
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      hero_section: {
        Row: {
          background_image_url: string | null
          badge: string | null
          cta_text: string | null
          id: string
          image_url: string | null
          secondary_cta_text: string | null
          subtitle: string | null
          title: string | null
          title_end: string | null
          title_highlight: string | null
        }
        Insert: {
          background_image_url?: string | null
          badge?: string | null
          cta_text?: string | null
          id?: string
          image_url?: string | null
          secondary_cta_text?: string | null
          subtitle?: string | null
          title?: string | null
          title_end?: string | null
          title_highlight?: string | null
        }
        Update: {
          background_image_url?: string | null
          badge?: string | null
          cta_text?: string | null
          id?: string
          image_url?: string | null
          secondary_cta_text?: string | null
          subtitle?: string | null
          title?: string | null
          title_end?: string | null
          title_highlight?: string | null
        }
        Relationships: []
      }
      historico_compras: {
        Row: {
          creditos_adquiridos: number
          data_compra: string | null
          id: string
          pacote_nome: string
          status: string | null
          transacao_id: string | null
          usuario_id: string | null
          valor_compra: number
        }
        Insert: {
          creditos_adquiridos: number
          data_compra?: string | null
          id?: string
          pacote_nome: string
          status?: string | null
          transacao_id?: string | null
          usuario_id?: string | null
          valor_compra: number
        }
        Update: {
          creditos_adquiridos?: number
          data_compra?: string | null
          id?: string
          pacote_nome?: string
          status?: string | null
          transacao_id?: string | null
          usuario_id?: string | null
          valor_compra?: number
        }
        Relationships: [
          {
            foreignKeyName: "historico_compras_transacao_id_fkey"
            columns: ["transacao_id"]
            isOneToOne: false
            referencedRelation: "transacoes_pagamento"
            referencedColumns: ["id"]
          },
        ]
      }
      historico_diagnosticos: {
        Row: {
          creditos_consumidos: number | null
          data_diagnostico: string | null
          id: string
          relatorio_url: string | null
          tipo_diagnostico: string | null
          usuario_id: string | null
        }
        Insert: {
          creditos_consumidos?: number | null
          data_diagnostico?: string | null
          id?: string
          relatorio_url?: string | null
          tipo_diagnostico?: string | null
          usuario_id?: string | null
        }
        Update: {
          creditos_consumidos?: number | null
          data_diagnostico?: string | null
          id?: string
          relatorio_url?: string | null
          tipo_diagnostico?: string | null
          usuario_id?: string | null
        }
        Relationships: []
      }
      leads: {
        Row: {
          created_at: string | null
          email: string | null
          empresa: string | null
          full_name: string | null
          id: string
          interesse: string | null
          message: string | null
          name: string | null
          status: string | null
          telefone: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          empresa?: string | null
          full_name?: string | null
          id?: string
          interesse?: string | null
          message?: string | null
          name?: string | null
          status?: string | null
          telefone?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          empresa?: string | null
          full_name?: string | null
          id?: string
          interesse?: string | null
          message?: string | null
          name?: string | null
          status?: string | null
          telefone?: string | null
        }
        Relationships: []
      }
      management_diagnostics: {
        Row: {
          client_id: string | null
          created_at: string | null
          diagnostic_results: Json | null
          extra_comments: string | null
          id: string
          template_id: string | null
          user_id: string | null
        }
        Insert: {
          client_id?: string | null
          created_at?: string | null
          diagnostic_results?: Json | null
          extra_comments?: string | null
          id?: string
          template_id?: string | null
          user_id?: string | null
        }
        Update: {
          client_id?: string | null
          created_at?: string | null
          diagnostic_results?: Json | null
          extra_comments?: string | null
          id?: string
          template_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "management_diagnostics_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "management_diagnostics_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "gestao_templates"
            referencedColumns: ["id"]
          },
        ]
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
          name: string
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
          name: string
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
          name?: string
          phone?: string | null
          sessions?: Json | null
          status?: string | null
          totalSessions?: number | null
        }
        Relationships: []
      }
      pacotes_creditos: {
        Row: {
          ativo: boolean | null
          created_at: string | null
          descricao: string | null
          destaque: boolean | null
          id: string
          nome: string
          quantidade_creditos: number
          updated_at: string | null
          valor: number
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string | null
          descricao?: string | null
          destaque?: boolean | null
          id?: string
          nome: string
          quantidade_creditos: number
          updated_at?: string | null
          valor: number
        }
        Update: {
          ativo?: boolean | null
          created_at?: string | null
          descricao?: string | null
          destaque?: boolean | null
          id?: string
          nome?: string
          quantidade_creditos?: number
          updated_at?: string | null
          valor?: number
        }
        Relationships: []
      }
      pillars: {
        Row: {
          description: string | null
          icon_name: string | null
          icon_url: string | null
          id: string
          image_url: string | null
          is_external: boolean | null
          link: string | null
          order_index: number | null
          title: string | null
        }
        Insert: {
          description?: string | null
          icon_name?: string | null
          icon_url?: string | null
          id?: string
          image_url?: string | null
          is_external?: boolean | null
          link?: string | null
          order_index?: number | null
          title?: string | null
        }
        Update: {
          description?: string | null
          icon_name?: string | null
          icon_url?: string | null
          id?: string
          image_url?: string | null
          is_external?: boolean | null
          link?: string | null
          order_index?: number | null
          title?: string | null
        }
        Relationships: []
      }
      profile_settings: {
        Row: {
          consultant_name: string | null
          contact_email: string | null
          id: string
          logo_url: string | null
          signature_url: string | null
          updated_at: string | null
          user_id: string | null
          website: string | null
        }
        Insert: {
          consultant_name?: string | null
          contact_email?: string | null
          id?: string
          logo_url?: string | null
          signature_url?: string | null
          updated_at?: string | null
          user_id?: string | null
          website?: string | null
        }
        Update: {
          consultant_name?: string | null
          contact_email?: string | null
          id?: string
          logo_url?: string | null
          signature_url?: string | null
          updated_at?: string | null
          user_id?: string | null
          website?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          company: string | null
          credits: number | null
          email: string | null
          id: string
          name: string | null
          role: string | null
          total_evals: number | null
        }
        Insert: {
          company?: string | null
          credits?: number | null
          email?: string | null
          id: string
          name?: string | null
          role?: string | null
          total_evals?: number | null
        }
        Update: {
          company?: string | null
          credits?: number | null
          email?: string | null
          id?: string
          name?: string | null
          role?: string | null
          total_evals?: number | null
        }
        Relationships: []
      }
      profissionais: {
        Row: {
          created_at: string | null
          especialidade: string | null
          id: string
          nome: string
        }
        Insert: {
          created_at?: string | null
          especialidade?: string | null
          id: string
          nome: string
        }
        Update: {
          created_at?: string | null
          especialidade?: string | null
          id?: string
          nome?: string
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
          title: string
          value: number | null
        }
        Insert: {
          createdAt?: string | null
          description?: string | null
          expirationDate?: string | null
          id: string
          leadId?: string | null
          status?: string | null
          title: string
          value?: number | null
        }
        Update: {
          createdAt?: string | null
          description?: string | null
          expirationDate?: string | null
          id?: string
          leadId?: string | null
          status?: string | null
          title?: string
          value?: number | null
        }
        Relationships: []
      }
      saldo_usuario: {
        Row: {
          creditos_disponiveis: number | null
          creditos_usados: number | null
          id: string
          updated_at: string | null
          usuario_id: string | null
        }
        Insert: {
          creditos_disponiveis?: number | null
          creditos_usados?: number | null
          id?: string
          updated_at?: string | null
          usuario_id?: string | null
        }
        Update: {
          creditos_disponiveis?: number | null
          creditos_usados?: number | null
          id?: string
          updated_at?: string | null
          usuario_id?: string | null
        }
        Relationships: []
      }
      servicos: {
        Row: {
          created_at: string | null
          duracao_minutos: number | null
          id: string
          nome: string
          preco: number | null
        }
        Insert: {
          created_at?: string | null
          duracao_minutos?: number | null
          id: string
          nome: string
          preco?: number | null
        }
        Update: {
          created_at?: string | null
          duracao_minutos?: number | null
          id?: string
          nome?: string
          preco?: number | null
        }
        Relationships: []
      }
      sessions: {
        Row: {
          clientId: string | null
          createdAt: string | null
          date: string
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
          date: string
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
          date?: string
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
      SGFM: {
        Row: {
          created_at: string
          id: number
        }
        Insert: {
          created_at?: string
          id?: number
        }
        Update: {
          created_at?: string
          id?: number
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          id: string
          report_disclaimer: string | null
          tenure_label: string | null
          welcome_video_url: string | null
          whatsapp_number: string | null
        }
        Insert: {
          id?: string
          report_disclaimer?: string | null
          tenure_label?: string | null
          welcome_video_url?: string | null
          whatsapp_number?: string | null
        }
        Update: {
          id?: string
          report_disclaimer?: string | null
          tenure_label?: string | null
          welcome_video_url?: string | null
          whatsapp_number?: string | null
        }
        Relationships: []
      }
      strategic_configs: {
        Row: {
          config_data: Json | null
          id: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          config_data?: Json | null
          id?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          config_data?: Json | null
          id?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      strategic_panels: {
        Row: {
          client_id: string | null
          created_at: string | null
          id: string
          panel_data: Json | null
          status: string | null
          user_id: string | null
        }
        Insert: {
          client_id?: string | null
          created_at?: string | null
          id?: string
          panel_data?: Json | null
          status?: string | null
          user_id?: string | null
        }
        Update: {
          client_id?: string | null
          created_at?: string | null
          id?: string
          panel_data?: Json | null
          status?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "strategic_panels_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          bio: string | null
          id: string
          image_url: string | null
          name: string | null
          order_index: number | null
          photo_url: string | null
          role: string | null
        }
        Insert: {
          bio?: string | null
          id?: string
          image_url?: string | null
          name?: string | null
          order_index?: number | null
          photo_url?: string | null
          role?: string | null
        }
        Update: {
          bio?: string | null
          id?: string
          image_url?: string | null
          name?: string | null
          order_index?: number | null
          photo_url?: string | null
          role?: string | null
        }
        Relationships: []
      }
      timeSlots: {
        Row: {
          createdAt: string | null
          date: string
          description: string | null
          id: string
          isBooked: boolean | null
          menteeCompany: string | null
          menteeEmail: string | null
          menteeName: string | null
          menteePhone: string | null
          professional: string | null
          service: string | null
          time: string
        }
        Insert: {
          createdAt?: string | null
          date: string
          description?: string | null
          id: string
          isBooked?: boolean | null
          menteeCompany?: string | null
          menteeEmail?: string | null
          menteeName?: string | null
          menteePhone?: string | null
          professional?: string | null
          service?: string | null
          time: string
        }
        Update: {
          createdAt?: string | null
          date?: string
          description?: string | null
          id?: string
          isBooked?: boolean | null
          menteeCompany?: string | null
          menteeEmail?: string | null
          menteeName?: string | null
          menteePhone?: string | null
          professional?: string | null
          service?: string | null
          time?: string
        }
        Relationships: []
      }
      transacoes_pagamento: {
        Row: {
          created_at: string | null
          id: string
          id_mercado_pago: string | null
          metodo_pagamento: string | null
          pacote_id: string | null
          status_pagamento: string | null
          updated_at: string | null
          usuario_id: string | null
          valor_pago: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          id_mercado_pago?: string | null
          metodo_pagamento?: string | null
          pacote_id?: string | null
          status_pagamento?: string | null
          updated_at?: string | null
          usuario_id?: string | null
          valor_pago: number
        }
        Update: {
          created_at?: string | null
          id?: string
          id_mercado_pago?: string | null
          metodo_pagamento?: string | null
          pacote_id?: string | null
          status_pagamento?: string | null
          updated_at?: string | null
          usuario_id?: string | null
          valor_pago?: number
        }
        Relationships: [
          {
            foreignKeyName: "transacoes_pagamento_pacote_id_fkey"
            columns: ["pacote_id"]
            isOneToOne: false
            referencedRelation: "pacotes_creditos"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount: number
          attachments: Json | null
          bank: string | null
          category: string | null
          classification: string | null
          client: string | null
          company: string | null
          date: string
          description: string
          entryDate: string | null
          id: string
          paymentLink: string | null
          paymentMethod: string | null
          performer: string | null
          recurrence: Json | null
          recurringGroupId: string | null
          service: string | null
          status: string
          supplier: string | null
          type: string
          updatedAt: string | null
        }
        Insert: {
          amount?: number
          attachments?: Json | null
          bank?: string | null
          category?: string | null
          classification?: string | null
          client?: string | null
          company?: string | null
          date: string
          description: string
          entryDate?: string | null
          id: string
          paymentLink?: string | null
          paymentMethod?: string | null
          performer?: string | null
          recurrence?: Json | null
          recurringGroupId?: string | null
          service?: string | null
          status: string
          supplier?: string | null
          type: string
          updatedAt?: string | null
        }
        Update: {
          amount?: number
          attachments?: Json | null
          bank?: string | null
          category?: string | null
          classification?: string | null
          client?: string | null
          company?: string | null
          date?: string
          description?: string
          entryDate?: string | null
          id?: string
          paymentLink?: string | null
          paymentMethod?: string | null
          performer?: string | null
          recurrence?: Json | null
          recurringGroupId?: string | null
          service?: string | null
          status?: string
          supplier?: string | null
          type?: string
          updatedAt?: string | null
        }
        Relationships: []
      }
      webhook_logs: {
        Row: {
          dados_recebidos: Json | null
          data_recebimento: string | null
          erro: string | null
          id: string
          id_mercado_pago: string | null
          status_pagamento: string | null
        }
        Insert: {
          dados_recebidos?: Json | null
          data_recebimento?: string | null
          erro?: string | null
          id?: string
          id_mercado_pago?: string | null
          status_pagamento?: string | null
        }
        Update: {
          dados_recebidos?: Json | null
          data_recebimento?: string | null
          erro?: string | null
          id?: string
          id_mercado_pago?: string | null
          status_pagamento?: string | null
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

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
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
// Table: SGFM
//   id: bigint (not null)
//   created_at: timestamp with time zone (not null, default: now())
// Table: agendamentos
//   id: text (not null)
//   profissional_id: text (nullable)
//   servico_id: text (nullable)
//   data_horario: timestamp with time zone (nullable)
//   cliente_nome: text (not null)
//   cliente_email: text (nullable)
//   cliente_telefone: text (nullable)
//   status: text (nullable, default: 'pendente'::text)
//   created_at: timestamp with time zone (nullable, default: now())
// Table: blog_posts
//   id: uuid (not null, default: gen_random_uuid())
//   title: text (nullable)
//   slug: text (nullable)
//   excerpt: text (nullable)
//   category: text (nullable)
//   image_url: text (nullable)
//   published_at: timestamp with time zone (nullable, default: now())
// Table: clients
//   id: uuid (not null, default: gen_random_uuid())
//   user_id: uuid (nullable)
//   name: text (not null)
//   company_name: text (not null)
//   email: text (nullable)
//   phone: text (nullable)
//   created_at: timestamp with time zone (nullable, default: now())
// Table: deals
//   id: text (not null)
//   title: text (not null)
//   clientName: text (not null)
//   value: numeric (not null, default: 0)
//   stage: text (not null)
//   phone: text (nullable)
//   email: text (nullable)
//   notes: text (nullable)
//   createdAt: timestamp with time zone (nullable, default: now())
// Table: evaluations
//   id: uuid (not null, default: gen_random_uuid())
//   professional_name: text (not null)
//   role: text (not null)
//   tenure: text (nullable)
//   date: timestamp with time zone (not null)
//   scores: jsonb (not null, default: '{}'::jsonb)
//   diagnosis: text (not null)
//   evaluator_id: uuid (nullable)
//   evaluator_name: text (not null)
//   observations: jsonb (nullable)
//   checklist: jsonb (nullable)
//   created_at: timestamp with time zone (not null, default: now())
// Table: forecasts_store
//   id: text (not null)
//   data: jsonb (nullable, default: '[]'::jsonb)
// Table: gestao_templates
//   id: uuid (not null, default: gen_random_uuid())
//   name: text (not null)
//   description: text (nullable)
//   status: text (nullable, default: 'Ativo'::text)
//   sections: jsonb (not null, default: '[]'::jsonb)
//   created_at: timestamp with time zone (nullable, default: now())
//   updated_at: timestamp with time zone (nullable, default: now())
// Table: hero_section
//   id: uuid (not null, default: gen_random_uuid())
//   badge: text (nullable)
//   title: text (nullable)
//   title_highlight: text (nullable)
//   title_end: text (nullable)
//   subtitle: text (nullable)
//   image_url: text (nullable)
//   background_image_url: text (nullable)
//   cta_text: text (nullable)
//   secondary_cta_text: text (nullable)
// Table: historico_compras
//   id: uuid (not null, default: gen_random_uuid())
//   usuario_id: uuid (nullable)
//   transacao_id: uuid (nullable)
//   pacote_nome: text (not null)
//   valor_compra: numeric (not null)
//   creditos_adquiridos: integer (not null)
//   data_compra: timestamp with time zone (nullable, default: now())
//   status: text (nullable, default: 'concluido'::text)
// Table: historico_diagnosticos
//   id: uuid (not null, default: gen_random_uuid())
//   usuario_id: uuid (nullable)
//   data_diagnostico: timestamp with time zone (nullable, default: now())
//   tipo_diagnostico: text (nullable)
//   creditos_consumidos: integer (nullable, default: 1)
//   relatorio_url: text (nullable)
// Table: leads
//   id: uuid (not null, default: gen_random_uuid())
//   name: text (nullable)
//   full_name: text (nullable)
//   empresa: text (nullable)
//   email: text (nullable)
//   telefone: text (nullable)
//   interesse: text (nullable)
//   message: text (nullable)
//   status: text (nullable)
//   created_at: timestamp with time zone (nullable, default: now())
// Table: management_diagnostics
//   id: uuid (not null, default: gen_random_uuid())
//   client_id: uuid (nullable)
//   user_id: uuid (nullable)
//   diagnostic_results: jsonb (nullable)
//   extra_comments: text (nullable)
//   created_at: timestamp with time zone (nullable, default: now())
//   template_id: uuid (nullable)
// Table: mentees
//   id: text (not null)
//   name: text (not null)
//   company: text (nullable)
//   contractValue: numeric (nullable, default: 0)
//   totalSessions: integer (nullable, default: 0)
//   status: text (nullable)
//   phone: text (nullable)
//   email: text (nullable)
//   sessions: jsonb (nullable, default: '[]'::jsonb)
//   emailLogs: jsonb (nullable, default: '[]'::jsonb)
//   attachments: jsonb (nullable, default: '[]'::jsonb)
//   createdAt: timestamp with time zone (nullable, default: now())
// Table: pacotes_creditos
//   id: uuid (not null, default: gen_random_uuid())
//   nome: text (not null)
//   descricao: text (nullable)
//   valor: numeric (not null)
//   quantidade_creditos: integer (not null)
//   ativo: boolean (nullable, default: true)
//   created_at: timestamp with time zone (nullable, default: now())
//   destaque: boolean (nullable, default: false)
//   updated_at: timestamp with time zone (nullable, default: now())
// Table: pillars
//   id: uuid (not null, default: gen_random_uuid())
//   title: text (nullable)
//   description: text (nullable)
//   icon_name: text (nullable)
//   icon_url: text (nullable)
//   image_url: text (nullable)
//   link: text (nullable)
//   is_external: boolean (nullable)
//   order_index: integer (nullable)
// Table: profile_settings
//   id: uuid (not null, default: gen_random_uuid())
//   user_id: uuid (nullable)
//   consultant_name: text (nullable)
//   logo_url: text (nullable)
//   signature_url: text (nullable)
//   website: text (nullable)
//   contact_email: text (nullable)
//   updated_at: timestamp with time zone (nullable, default: now())
// Table: profiles
//   id: uuid (not null)
//   email: text (nullable)
//   role: text (nullable, default: 'manager'::text)
//   name: text (nullable)
//   company: text (nullable)
//   credits: integer (nullable, default: 0)
//   total_evals: integer (nullable, default: 0)
// Table: profissionais
//   id: text (not null)
//   nome: text (not null)
//   especialidade: text (nullable)
//   created_at: timestamp with time zone (nullable, default: now())
// Table: proposals
//   id: text (not null)
//   title: text (not null)
//   leadId: text (nullable)
//   value: numeric (nullable, default: 0)
//   expirationDate: text (nullable)
//   description: text (nullable)
//   status: text (nullable)
//   createdAt: timestamp with time zone (nullable, default: now())
// Table: saldo_usuario
//   id: uuid (not null, default: gen_random_uuid())
//   usuario_id: uuid (nullable)
//   creditos_disponiveis: integer (nullable, default: 0)
//   creditos_usados: integer (nullable, default: 0)
//   updated_at: timestamp with time zone (nullable, default: now())
// Table: servicos
//   id: text (not null)
//   nome: text (not null)
//   duracao_minutos: integer (nullable, default: 60)
//   preco: numeric (nullable, default: 0)
//   created_at: timestamp with time zone (nullable, default: now())
// Table: sessions
//   id: text (not null)
//   clientId: text (nullable)
//   date: text (not null)
//   notes: text (nullable)
//   type: text (nullable)
//   duration: integer (nullable, default: 60)
//   discussion: text (nullable)
//   tasks: text (nullable)
//   status: text (nullable, default: 'Pendente'::text)
//   createdAt: timestamp with time zone (nullable, default: now())
// Table: settings_store
//   id: text (not null)
//   data: jsonb (nullable, default: '{}'::jsonb)
// Table: site_settings
//   id: text (not null, default: 'default'::text)
//   welcome_video_url: text (nullable)
//   whatsapp_number: text (nullable)
//   report_disclaimer: text (nullable)
//   tenure_label: text (nullable)
// Table: strategic_configs
//   id: uuid (not null, default: gen_random_uuid())
//   user_id: uuid (nullable)
//   config_data: jsonb (nullable)
//   updated_at: timestamp with time zone (nullable, default: now())
// Table: strategic_panels
//   id: uuid (not null, default: gen_random_uuid())
//   client_id: uuid (nullable)
//   user_id: uuid (nullable)
//   panel_data: jsonb (nullable)
//   status: text (nullable, default: 'Pendente'::text)
//   created_at: timestamp with time zone (nullable, default: now())
// Table: team_members
//   id: uuid (not null, default: gen_random_uuid())
//   name: text (nullable)
//   role: text (nullable)
//   bio: text (nullable)
//   image_url: text (nullable)
//   photo_url: text (nullable)
//   order_index: integer (nullable)
// Table: timeSlots
//   id: text (not null)
//   date: text (not null)
//   time: text (not null)
//   description: text (nullable)
//   isBooked: boolean (nullable, default: false)
//   menteeName: text (nullable)
//   menteeEmail: text (nullable)
//   menteePhone: text (nullable)
//   menteeCompany: text (nullable)
//   service: text (nullable)
//   professional: text (nullable)
//   createdAt: timestamp with time zone (nullable, default: now())
// Table: transacoes_pagamento
//   id: uuid (not null, default: gen_random_uuid())
//   usuario_id: uuid (nullable)
//   pacote_id: uuid (nullable)
//   valor_pago: numeric (not null)
//   status_pagamento: text (nullable, default: 'pendente'::text)
//   id_mercado_pago: text (nullable)
//   created_at: timestamp with time zone (nullable, default: now())
//   metodo_pagamento: text (nullable)
//   updated_at: timestamp with time zone (nullable, default: now())
// Table: transactions
//   id: text (not null)
//   description: text (not null)
//   amount: numeric (not null, default: 0)
//   type: text (not null)
//   date: text (not null)
//   entryDate: text (nullable)
//   classification: text (nullable)
//   category: text (nullable)
//   status: text (not null)
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
//   updatedAt: timestamp with time zone (nullable, default: now())
// Table: webhook_logs
//   id: uuid (not null, default: gen_random_uuid())
//   id_mercado_pago: text (nullable)
//   status_pagamento: text (nullable)
//   dados_recebidos: jsonb (nullable)
//   data_recebimento: timestamp with time zone (nullable, default: now())
//   erro: text (nullable)

// --- CONSTRAINTS ---
// Table: SGFM
//   PRIMARY KEY SGFM_pkey: PRIMARY KEY (id)
// Table: agendamentos
//   PRIMARY KEY agendamentos_pkey: PRIMARY KEY (id)
// Table: blog_posts
//   PRIMARY KEY blog_posts_pkey: PRIMARY KEY (id)
// Table: clients
//   PRIMARY KEY clients_pkey: PRIMARY KEY (id)
//   FOREIGN KEY clients_user_id_fkey: FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
// Table: deals
//   PRIMARY KEY deals_pkey: PRIMARY KEY (id)
// Table: evaluations
//   FOREIGN KEY evaluations_evaluator_id_fkey: FOREIGN KEY (evaluator_id) REFERENCES auth.users(id) ON DELETE CASCADE
//   PRIMARY KEY evaluations_pkey: PRIMARY KEY (id)
// Table: forecasts_store
//   PRIMARY KEY forecasts_store_pkey: PRIMARY KEY (id)
// Table: gestao_templates
//   PRIMARY KEY gestao_templates_pkey: PRIMARY KEY (id)
// Table: hero_section
//   PRIMARY KEY hero_section_pkey: PRIMARY KEY (id)
// Table: historico_compras
//   PRIMARY KEY historico_compras_pkey: PRIMARY KEY (id)
//   FOREIGN KEY historico_compras_transacao_id_fkey: FOREIGN KEY (transacao_id) REFERENCES transacoes_pagamento(id) ON DELETE SET NULL
//   FOREIGN KEY historico_compras_usuario_id_fkey: FOREIGN KEY (usuario_id) REFERENCES auth.users(id) ON DELETE CASCADE
// Table: historico_diagnosticos
//   PRIMARY KEY historico_diagnosticos_pkey: PRIMARY KEY (id)
//   FOREIGN KEY historico_diagnosticos_usuario_id_fkey: FOREIGN KEY (usuario_id) REFERENCES auth.users(id) ON DELETE CASCADE
// Table: leads
//   PRIMARY KEY leads_pkey: PRIMARY KEY (id)
// Table: management_diagnostics
//   FOREIGN KEY management_diagnostics_client_id_fkey: FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
//   PRIMARY KEY management_diagnostics_pkey: PRIMARY KEY (id)
//   FOREIGN KEY management_diagnostics_template_id_fkey: FOREIGN KEY (template_id) REFERENCES gestao_templates(id) ON DELETE SET NULL
//   FOREIGN KEY management_diagnostics_user_id_fkey: FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
// Table: mentees
//   PRIMARY KEY mentees_pkey: PRIMARY KEY (id)
// Table: pacotes_creditos
//   PRIMARY KEY pacotes_creditos_pkey: PRIMARY KEY (id)
// Table: pillars
//   PRIMARY KEY pillars_pkey: PRIMARY KEY (id)
// Table: profile_settings
//   PRIMARY KEY profile_settings_pkey: PRIMARY KEY (id)
//   FOREIGN KEY profile_settings_user_id_fkey: FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
// Table: profiles
//   FOREIGN KEY profiles_id_fkey: FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE
//   PRIMARY KEY profiles_pkey: PRIMARY KEY (id)
// Table: profissionais
//   PRIMARY KEY profissionais_pkey: PRIMARY KEY (id)
// Table: proposals
//   PRIMARY KEY proposals_pkey: PRIMARY KEY (id)
// Table: saldo_usuario
//   PRIMARY KEY saldo_usuario_pkey: PRIMARY KEY (id)
//   FOREIGN KEY saldo_usuario_usuario_id_fkey: FOREIGN KEY (usuario_id) REFERENCES auth.users(id) ON DELETE CASCADE
//   UNIQUE saldo_usuario_usuario_id_key: UNIQUE (usuario_id)
// Table: servicos
//   PRIMARY KEY servicos_pkey: PRIMARY KEY (id)
// Table: sessions
//   PRIMARY KEY sessions_pkey: PRIMARY KEY (id)
// Table: settings_store
//   PRIMARY KEY settings_store_pkey: PRIMARY KEY (id)
// Table: site_settings
//   PRIMARY KEY site_settings_pkey: PRIMARY KEY (id)
// Table: strategic_configs
//   PRIMARY KEY strategic_configs_pkey: PRIMARY KEY (id)
//   FOREIGN KEY strategic_configs_user_id_fkey: FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
// Table: strategic_panels
//   FOREIGN KEY strategic_panels_client_id_fkey: FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
//   PRIMARY KEY strategic_panels_pkey: PRIMARY KEY (id)
//   FOREIGN KEY strategic_panels_user_id_fkey: FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
// Table: team_members
//   PRIMARY KEY team_members_pkey: PRIMARY KEY (id)
// Table: timeSlots
//   PRIMARY KEY timeSlots_pkey: PRIMARY KEY (id)
// Table: transacoes_pagamento
//   FOREIGN KEY transacoes_pagamento_pacote_id_fkey: FOREIGN KEY (pacote_id) REFERENCES pacotes_creditos(id) ON DELETE CASCADE
//   PRIMARY KEY transacoes_pagamento_pkey: PRIMARY KEY (id)
//   FOREIGN KEY transacoes_pagamento_usuario_id_fkey: FOREIGN KEY (usuario_id) REFERENCES auth.users(id) ON DELETE CASCADE
// Table: transactions
//   PRIMARY KEY transactions_pkey: PRIMARY KEY (id)
// Table: webhook_logs
//   PRIMARY KEY webhook_logs_pkey: PRIMARY KEY (id)

// --- ROW LEVEL SECURITY POLICIES ---
// Table: SGFM
//   Policy "allow_all_authenticated" (ALL, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
// Table: agendamentos
//   Policy "allow_public_insert" (INSERT, PERMISSIVE) roles={public}
//     WITH CHECK: true
//   Policy "allow_public_select" (SELECT, PERMISSIVE) roles={public}
//     USING: true
//   Policy "allow_public_update" (UPDATE, PERMISSIVE) roles={public}
//     USING: true
//     WITH CHECK: true
// Table: blog_posts
//   Policy "admin_all_blog_posts" (ALL, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
//   Policy "public_read_blog_posts" (SELECT, PERMISSIVE) roles={public}
//     USING: true
// Table: clients
//   Policy "Anon can insert clients" (INSERT, PERMISSIVE) roles={anon}
//     WITH CHECK: true
//   Policy "Anon can update clients" (UPDATE, PERMISSIVE) roles={anon}
//     USING: true
//     WITH CHECK: true
//   Policy "Users can manage their own clients" (ALL, PERMISSIVE) roles={authenticated}
//     USING: (user_id = auth.uid())
//     WITH CHECK: (user_id = auth.uid())
//   Policy "admin_all_clients" (ALL, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
//   Policy "public_read_clients" (SELECT, PERMISSIVE) roles={public}
//     USING: true
// Table: deals
//   Policy "allow_all_authenticated" (ALL, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
// Table: evaluations
//   Policy "evaluations_insert" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: ((evaluator_id = auth.uid()) OR (EXISTS ( SELECT 1    FROM profiles   WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text)))))
//   Policy "evaluations_select" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: ((evaluator_id = auth.uid()) OR (EXISTS ( SELECT 1    FROM profiles   WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text)))))
// Table: forecasts_store
//   Policy "allow_all_authenticated" (ALL, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
// Table: gestao_templates
//   Policy "allow_all_authenticated_gestao_templates" (ALL, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
//   Policy "allow_anon_read_gestao_templates" (SELECT, PERMISSIVE) roles={anon}
//     USING: true
// Table: hero_section
//   Policy "admin_all_hero_section" (ALL, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
//   Policy "public_read_hero_section" (SELECT, PERMISSIVE) roles={public}
//     USING: true
// Table: historico_compras
//   Policy "admin_all_historico_compras" (ALL, PERMISSIVE) roles={authenticated}
//     USING: (EXISTS ( SELECT 1    FROM profiles   WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text))))
//     WITH CHECK: (EXISTS ( SELECT 1    FROM profiles   WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text))))
//   Policy "user_read_historico_compras" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: (usuario_id = auth.uid())
// Table: historico_diagnosticos
//   Policy "user_read_historico_diagnosticos" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: (usuario_id = auth.uid())
// Table: leads
//   Policy "admin_all_leads" (ALL, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
//   Policy "anon_insert_leads" (INSERT, PERMISSIVE) roles={public}
//     WITH CHECK: true
// Table: management_diagnostics
//   Policy "Anon can read management_diagnostics" (SELECT, PERMISSIVE) roles={anon}
//     USING: true
//   Policy "Anon can update management_diagnostics" (UPDATE, PERMISSIVE) roles={anon}
//     USING: true
//     WITH CHECK: true
//   Policy "Users can manage their own management_diagnostics" (ALL, PERMISSIVE) roles={authenticated}
//     USING: (user_id = auth.uid())
//     WITH CHECK: (user_id = auth.uid())
// Table: mentees
//   Policy "allow_all_authenticated" (ALL, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
// Table: pacotes_creditos
//   Policy "admin_all_pacotes" (ALL, PERMISSIVE) roles={authenticated}
//     USING: (EXISTS ( SELECT 1    FROM profiles   WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text))))
//   Policy "public_read_pacotes" (SELECT, PERMISSIVE) roles={public}
//     USING: true
// Table: pillars
//   Policy "admin_all_pillars" (ALL, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
//   Policy "public_read_pillars" (SELECT, PERMISSIVE) roles={public}
//     USING: true
// Table: profile_settings
//   Policy "Anon can read profile_settings" (SELECT, PERMISSIVE) roles={anon}
//     USING: true
//   Policy "Users can manage their own profile settings" (ALL, PERMISSIVE) roles={authenticated}
//     USING: (user_id = auth.uid())
//     WITH CHECK: (user_id = auth.uid())
// Table: profiles
//   Policy "Admins can update all profiles" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: (EXISTS ( SELECT 1    FROM profiles p   WHERE ((p.id = auth.uid()) AND (p.role = 'admin'::text))))
//   Policy "Users can view profiles" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: true
// Table: profissionais
//   Policy "allow_all_authenticated" (ALL, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
//   Policy "allow_anon_select" (SELECT, PERMISSIVE) roles={anon}
//     USING: true
// Table: proposals
//   Policy "allow_all_authenticated" (ALL, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
// Table: saldo_usuario
//   Policy "admin_all_saldo_usuario" (ALL, PERMISSIVE) roles={authenticated}
//     USING: (EXISTS ( SELECT 1    FROM profiles   WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text))))
//     WITH CHECK: (EXISTS ( SELECT 1    FROM profiles   WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text))))
//   Policy "user_read_saldo" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: (usuario_id = auth.uid())
// Table: servicos
//   Policy "allow_all_authenticated" (ALL, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
//   Policy "allow_anon_select" (SELECT, PERMISSIVE) roles={anon}
//     USING: true
// Table: sessions
//   Policy "allow_all_authenticated" (ALL, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
// Table: settings_store
//   Policy "allow_admin_update" (ALL, PERMISSIVE) roles={authenticated}
//     USING: (EXISTS ( SELECT 1    FROM profiles   WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text))))
//   Policy "allow_all_authenticated" (ALL, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
//   Policy "allow_all_authenticated_select" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: true
//   Policy "allow_anon_select" (SELECT, PERMISSIVE) roles={anon}
//     USING: true
// Table: site_settings
//   Policy "admin_all_site_settings" (ALL, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
//   Policy "allow_admin_update_site_settings" (UPDATE, PERMISSIVE) roles={public}
//     USING: (EXISTS ( SELECT 1    FROM profiles   WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text))))
//   Policy "allow_all_read_site_settings" (SELECT, PERMISSIVE) roles={public}
//     USING: true
//   Policy "public_read_site_settings" (SELECT, PERMISSIVE) roles={public}
//     USING: true
// Table: strategic_configs
//   Policy "Anon can read strategic_configs" (SELECT, PERMISSIVE) roles={anon}
//     USING: true
//   Policy "Users can manage their own strategic_configs" (ALL, PERMISSIVE) roles={authenticated}
//     USING: (user_id = auth.uid())
//     WITH CHECK: (user_id = auth.uid())
// Table: strategic_panels
//   Policy "Anon can insert strategic_panels" (INSERT, PERMISSIVE) roles={anon}
//     WITH CHECK: true
//   Policy "Anon can read strategic_panels" (SELECT, PERMISSIVE) roles={anon}
//     USING: true
//   Policy "Anon can update strategic_panels" (UPDATE, PERMISSIVE) roles={anon}
//     USING: true
//     WITH CHECK: true
//   Policy "Users can manage their own strategic_panels" (ALL, PERMISSIVE) roles={authenticated}
//     USING: (user_id = auth.uid())
//     WITH CHECK: (user_id = auth.uid())
// Table: team_members
//   Policy "admin_all_team_members" (ALL, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
//   Policy "public_read_team_members" (SELECT, PERMISSIVE) roles={public}
//     USING: true
// Table: timeSlots
//   Policy "allow_all_authenticated" (ALL, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
//   Policy "allow_public_select_timeslots" (SELECT, PERMISSIVE) roles={public}
//     USING: true
//   Policy "allow_public_update_timeslots" (UPDATE, PERMISSIVE) roles={public}
//     USING: true
//     WITH CHECK: true
// Table: transacoes_pagamento
//   Policy "admin_all_transacoes" (ALL, PERMISSIVE) roles={authenticated}
//     USING: (EXISTS ( SELECT 1    FROM profiles   WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text))))
//     WITH CHECK: (EXISTS ( SELECT 1    FROM profiles   WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text))))
//   Policy "user_read_transacoes" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: (usuario_id = auth.uid())
// Table: transactions
//   Policy "allow_all_authenticated" (ALL, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
// Table: webhook_logs
//   Policy "admin_all_webhook_logs" (ALL, PERMISSIVE) roles={authenticated}
//     USING: (EXISTS ( SELECT 1    FROM profiles   WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text))))

// --- DATABASE FUNCTIONS ---
// FUNCTION handle_updated_at()
//   CREATE OR REPLACE FUNCTION public.handle_updated_at()
//    RETURNS trigger
//    LANGUAGE plpgsql
//   AS $function$
//   BEGIN
//     NEW.updated_at = NOW();
//     RETURN NEW;
//   END;
//   $function$
//   
// FUNCTION set_user_id()
//   CREATE OR REPLACE FUNCTION public.set_user_id()
//    RETURNS trigger
//    LANGUAGE plpgsql
//    SECURITY DEFINER
//   AS $function$
//   BEGIN
//     IF NEW.user_id IS NULL THEN
//       IF auth.uid() IS NOT NULL THEN
//         NEW.user_id := auth.uid();
//       ELSE
//         NEW.user_id := (SELECT id FROM auth.users ORDER BY created_at ASC LIMIT 1);
//       END IF;
//     END IF;
//     RETURN NEW;
//   END;
//   $function$
//   
// FUNCTION sync_tabela_planos_quantidade()
//   CREATE OR REPLACE FUNCTION public.sync_tabela_planos_quantidade()
//    RETURNS trigger
//    LANGUAGE plpgsql
//   AS $function$
//   BEGIN
//     IF NEW.quantidade IS DISTINCT FROM OLD.quantidade THEN
//       NEW.quantidade_creditos := NEW.quantidade;
//     END IF;
//     RETURN NEW;
//   END;
//   $function$
//   

// --- TRIGGERS ---
// Table: clients
//   set_user_id_clients: CREATE TRIGGER set_user_id_clients BEFORE INSERT ON public.clients FOR EACH ROW EXECUTE FUNCTION set_user_id()
// Table: management_diagnostics
//   set_user_id_management_diagnostics: CREATE TRIGGER set_user_id_management_diagnostics BEFORE INSERT ON public.management_diagnostics FOR EACH ROW EXECUTE FUNCTION set_user_id()
// Table: profile_settings
//   set_user_id_profile_settings: CREATE TRIGGER set_user_id_profile_settings BEFORE INSERT ON public.profile_settings FOR EACH ROW EXECUTE FUNCTION set_user_id()
// Table: strategic_configs
//   set_user_id_strategic_configs: CREATE TRIGGER set_user_id_strategic_configs BEFORE INSERT ON public.strategic_configs FOR EACH ROW EXECUTE FUNCTION set_user_id()
// Table: strategic_panels
//   set_user_id_strategic_panels: CREATE TRIGGER set_user_id_strategic_panels BEFORE INSERT ON public.strategic_panels FOR EACH ROW EXECUTE FUNCTION set_user_id()

// --- INDEXES ---
// Table: saldo_usuario
//   CREATE UNIQUE INDEX saldo_usuario_usuario_id_key ON public.saldo_usuario USING btree (usuario_id)
// Table: transacoes_pagamento
//   CREATE INDEX idx_transacoes_id_mp ON public.transacoes_pagamento USING btree (id_mercado_pago)
// Table: webhook_logs
//   CREATE INDEX idx_webhook_logs_id_mp ON public.webhook_logs USING btree (id_mercado_pago)

