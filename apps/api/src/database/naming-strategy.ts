import { DefaultNamingStrategy, NamingStrategyInterface } from 'typeorm';

/**
 * Convierte camelCase → snake_case para nombres de columnas y JoinColumns.
 * Aplicado tanto en AppModule (runtime) como en AppDataSource (CLI de migraciones).
 */
export class SnakeCaseNamingStrategy
  extends DefaultNamingStrategy
  implements NamingStrategyInterface
{
  override columnName(propertyName: string, customName: string | undefined): string {
    return customName ?? propertyName.replace(/([A-Z])/g, '_$1').toLowerCase();
  }

  override joinColumnName(relationName: string, referencedColumnName: string): string {
    return `${relationName.replace(/([A-Z])/g, '_$1').toLowerCase()}_${referencedColumnName}`;
  }
}
