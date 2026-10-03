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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      barbeiros: {
        Row: {
          ativo: boolean
          comissao: number
          criado_em: string
          id: string
          nome: string
          user_id: string
        }
        Insert: {
          ativo?: boolean
          comissao?: number
          criado_em?: string
          id?: string
          nome: string
          user_id?: string
        }
        Update: {
          ativo?: boolean
          comissao?: number
          criado_em?: string
          id?: string
          nome?: string
          user_id?: string
        }
        Relationships: []
      }
      categorias: {
        Row: {
          criado_em: string
          id: string
          nome: string
          preco: number | null
          tipo: Database["public"]["Enums"]["tipo_movimentacao"]
          user_id: string
        }
        Insert: {
          criado_em?: string
          id?: string
          nome: string
          preco?: number | null
          tipo: Database["public"]["Enums"]["tipo_movimentacao"]
          user_id?: string
        }
        Update: {
          criado_em?: string
          id?: string
          nome?: string
          preco?: number | null
          tipo?: Database["public"]["Enums"]["tipo_movimentacao"]
          user_id?: string
        }
        Relationships: []
      }
      configuracoes: {
        Row: {
          atualizado_em: string
          meta_mensal: number
          user_id: string
        }
        Insert: {
          atualizado_em?: string
          meta_mensal?: number
          user_id?: string
        }
        Update: {
          atualizado_em?: string
          meta_mensal?: number
          user_id?: string
        }
        Relationships: []
      }
      movimentacoes: {
        Row: {
          barbeiro_id: string | null
          categoria: string
          criado_em: string
          data: string
          descricao: string | null
          despesa_tipo: Database["public"]["Enums"]["tipo_despesa"] | null
          dia_vencimento: number | null
          forma_pagamento: string
          hora_informada: boolean
          id: string
          recorrente: boolean
          tipo: Database["public"]["Enums"]["tipo_movimentacao"]
          user_id: string
          valor: number
        }
        Insert: {
          barbeiro_id?: string | null
          categoria: string
          criado_em?: string
          data: string
          descricao?: string | null
          despesa_tipo?: Database["public"]["Enums"]["tipo_despesa"] | null
          dia_vencimento?: number | null
          forma_pagamento: string
          hora_informada?: boolean
          id?: string
          recorrente?: boolean
          tipo: Database["public"]["Enums"]["tipo_movimentacao"]
          user_id?: string
          valor: number
        }
        Update: {
          barbeiro_id?: string | null
          categoria?: string
          criado_em?: string
          data?: string
          descricao?: string | null
          despesa_tipo?: Database["public"]["Enums"]["tipo_despesa"] | null
          dia_vencimento?: number | null
          forma_pagamento?: string
          hora_informada?: boolean
          id?: string
          recorrente?: boolean
          tipo?: Database["public"]["Enums"]["tipo_movimentacao"]
          user_id?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "movimentacoes_barbeiro_id_fkey"
            columns: ["barbeiro_id"]
            isOneToOne: false
            referencedRelation: "barbeiros"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      semear_dados_iniciais: { Args: never; Returns: undefined }
    }
    Enums: {
      tipo_despesa: "fixa" | "variavel"
      tipo_movimentacao: "entrada" | "saida"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      tipo_despesa: ["fixa", "variavel"],
      tipo_movimentacao: ["entrada", "saida"],
    },
  },
} as const
