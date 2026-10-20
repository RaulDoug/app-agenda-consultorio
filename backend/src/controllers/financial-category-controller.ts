import type { Request, Response } from 'express';
import { FinancialCategoryService } from '../services/financial-category-service.js';

export class FinancialCategoryController {
  private service: FinancialCategoryService;

  constructor(service?: FinancialCategoryService) {
    this.service = service || new FinancialCategoryService();
  }

  list = async (req: Request, res: Response): Promise<void> => {
    try {
      const tenantId = req.tenantId!;
      const { type } = req.query;
      const categories = await this.service.listCategories(
        tenantId,
        typeof type === 'string' ? type : undefined
      );
      res.json(categories);
    } catch (err: any) {
      res.status(err.statusCode || 500).json({ error: err.message });
    }
  };

  create = async (req: Request, res: Response): Promise<void> => {
    try {
      const tenantId = req.tenantId!;
      const category = await this.service.createCategory(tenantId, req.body);
      res.status(201).json(category);
    } catch (err: any) {
      res.status(err.statusCode || 500).json({ error: err.message });
    }
  };

  update = async (req: Request, res: Response): Promise<void> => {
    try {
      const tenantId = req.tenantId!;
      const category = await this.service.updateCategory(tenantId, req.params.id as string, req.body);
      res.json(category);
    } catch (err: any) {
      res.status(err.statusCode || 500).json({ error: err.message });
    }
  };

  delete = async (req: Request, res: Response): Promise<void> => {
    try {
      const tenantId = req.tenantId!;
      await this.service.deleteCategory(tenantId, req.params.id as string);
      res.json({ message: 'Categoria financeira desativada com sucesso (Soft Delete).' });
    } catch (err: any) {
      res.status(err.statusCode || 500).json({ error: err.message });
    }
  };
}
