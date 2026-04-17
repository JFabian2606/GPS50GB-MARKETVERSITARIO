// Tipos compartidos de la aplicación

export type Rol = 'estudiante' | 'tutor' | 'admin' | 'superadmin'

export interface RegisterPayload {
  email: string
  password: string
  nombres: string
  apellidos: string
  tipo_documento: string
  documento_identidad: string
  genero?: string
  telefono?: string
  programa_academico?: string
  rol?: Rol
}

export interface Profile {
  id: string
  tipo_documento: string
  documento_identidad: string
  nombres: string
  apellidos: string
  genero: string | null
  telefono: string | null
  programa_academico: string | null
  rol: Rol
  created_at: string
  updated_at: string
}
