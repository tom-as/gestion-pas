// Tipos de respuesta de la API compartidos entre frontend y backend

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface ApiError {
  statusCode: number;
  message: string;
  error?: string;
}

/**
 * PaginatedResponse — reservado para v2.
 * Actualmente ningún endpoint usa paginación; se define aquí para cuando se implemente.
 */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}
