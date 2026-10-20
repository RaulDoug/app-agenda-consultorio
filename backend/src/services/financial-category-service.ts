import { FinancialCategoryRepository } from '../repositories/financial-category-repository.js';
import type { FinancialCategory, CreateFinancialCategoryDTO } from '@cliniassist/shared';

export class FinancialCategoryService {
  private repo: FinancialCategoryRepository;

  constructor(repo?: FinancialCategoryRepository) {
    this.repo = repo || new FinancialCategoryRepository();
  }

  async listCategories(tenantId: string, type?: string): Promise<FinancialCategory[]> {
    return this.repo.findAll(tenantId, type);
  }

  async getCategoryById(tenantId: string, id: string): Promise<FinancialCategory> {
    const category = await this.repo.findById(tenantId, id);
    if (!category) {
      const error: any = new Error('Categoria financeira não encontrada.');
      error.statusCode = 404;
      throw error;
    }
    return category;
  }

  async createCategory(tenantId: string, data: CreateFinancialCategoryDTO): Promise<FinancialCategory> {
    if (!data.name || data.name.trim() === '') {
      const error: any = new Error('O nome da categoria é obrigatório.');
      error.statusCode = 400;
      throw error;
    }
    return this.repo.create(tenantId, {
      name: data.name.trim(),
      type: data.type,
    });
  }

  async updateCategory(
    tenantId: string,
    id: string,
    data: Partial<CreateFinancialCategoryDTO>
  ): Promise<FinancialCategory> {
    if (data.name !== undefined && data.name.trim() === '') {
      const error: any = new Error('O nome da categoria não pode ser vazio.');
      error.statusCode = 400;
      throw error;
    }

    const updated = await this.repo.update(tenantId, id, {
      name: data.name ? data.name.trim() : undefined,
      type: data.type,
    });

    if (!updated) {
      const error: any = new Error('Categoria financeira não encontrada.');
      error.statusCode = 404;
      throw error;
    }

    return updated;
  }

  async deleteCategory(tenantId: string, id: string): Promise<void> {
    const deleted = await this.repo.softDelete(tenantId, id);
    if (!deleted) {
      const error: any = new Error('Categoria financeira não encontrada.');
      error.statusCode = 404;
      throw error;
    }
  }
}
