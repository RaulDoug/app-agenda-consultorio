import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FinancialCategoryController } from '../financial-category-controller.js';
import type { FinancialCategoryService } from '../../services/financial-category-service.js';

describe('FinancialCategoryController — Respostas HTTP', () => {
  let controller: FinancialCategoryController;
  let mockService: Partial<FinancialCategoryService>;
  let req: any;
  let res: any;

  beforeEach(() => {
    mockService = {
      listCategories: vi.fn(),
      createCategory: vi.fn(),
      updateCategory: vi.fn(),
      deleteCategory: vi.fn(),
    };
    controller = new FinancialCategoryController(mockService as FinancialCategoryService);

    req = {
      tenantId: 'tenant-123',
      params: {},
      query: {},
      body: {},
    };

    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
  });

  it('list deve responder 200 com array de categorias', async () => {
    (mockService.listCategories as any).mockResolvedValue([{ id: 'c1', name: 'Aluguel' }]);

    await controller.list(req, res);
    expect(res.json).toHaveBeenCalledWith([{ id: 'c1', name: 'Aluguel' }]);
  });

  it('create deve responder 201 com a categoria criada', async () => {
    req.body = { name: 'Energia' };
    (mockService.createCategory as any).mockResolvedValue({ id: 'c2', name: 'Energia' });

    await controller.create(req, res);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ id: 'c2', name: 'Energia' });
  });

  it('delete deve responder 200 com mensagem de sucesso', async () => {
    req.params = { id: 'c2' };
    (mockService.deleteCategory as any).mockResolvedValue(undefined);

    await controller.delete(req, res);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Categoria financeira desativada com sucesso (Soft Delete).',
    });
  });
});
