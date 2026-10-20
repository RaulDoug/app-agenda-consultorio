import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FinancialCategoryService } from '../financial-category-service.js';
import type { FinancialCategoryRepository } from '../../repositories/financial-category-repository.js';

describe('FinancialCategoryService — Regras de Negócio e Validações', () => {
  let service: FinancialCategoryService;
  let mockRepo: Partial<FinancialCategoryRepository>;

  beforeEach(() => {
    mockRepo = {
      findAll: vi.fn(),
      findById: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      softDelete: vi.fn(),
    };
    service = new FinancialCategoryService(mockRepo as FinancialCategoryRepository);
  });

  it('deve listar categorias delegando para o repositório', async () => {
    (mockRepo.findAll as any).mockResolvedValue([{ id: 'cat-1', name: 'Aluguel' }]);

    const res = await service.listCategories('tenant-1', 'EXPENSE');
    expect(res).toHaveLength(1);
    expect(mockRepo.findAll).toHaveBeenCalledWith('tenant-1', 'EXPENSE');
  });

  it('deve rejeitar criação com nome vazio', async () => {
    await expect(
      service.createCategory('tenant-1', { name: '   ', type: 'EXPENSE' })
    ).rejects.toThrow('O nome da categoria é obrigatório.');
  });

  it('deve criar categoria com sucesso com nome sem espaços extras', async () => {
    (mockRepo.create as any).mockResolvedValue({ id: 'cat-2', name: 'Marketing' });

    const res = await service.createCategory('tenant-1', { name: '  Marketing  ', type: 'EXPENSE' });
    expect(res.name).toBe('Marketing');
    expect(mockRepo.create).toHaveBeenCalledWith('tenant-1', { name: 'Marketing', type: 'EXPENSE' });
  });

  it('deve rejeitar atualização com nome vazio', async () => {
    await expect(
      service.updateCategory('tenant-1', 'cat-1', { name: '' })
    ).rejects.toThrow('O nome da categoria não pode ser vazio.');
  });

  it('deve disparar 404 ao atualizar categoria inexistente', async () => {
    (mockRepo.update as any).mockResolvedValue(null);

    await expect(
      service.updateCategory('tenant-1', 'cat-inexistente', { name: 'Nova' })
    ).rejects.toThrow('Categoria financeira não encontrada.');
  });

  it('deve disparar 404 ao deletar categoria inexistente', async () => {
    (mockRepo.softDelete as any).mockResolvedValue(false);

    await expect(
      service.deleteCategory('tenant-1', 'cat-inexistente')
    ).rejects.toThrow('Categoria financeira não encontrada.');
  });
});
