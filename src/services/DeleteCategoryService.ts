import { getRepository } from 'typeorm';
import AppError from '../errors/AppError';
import Category from '../models/Category';

class DeleteCategoryService {
  public async execute(id: string): Promise<void> {
    // Buscar no banco de dados para deletar
    const categoryRepository = getRepository(Category);

    // Check if category already exists
    const checkCategoryExists = await categoryRepository.findOne(id);

    // Caso a categoria não existe
    if (!checkCategoryExists) {
      throw new AppError('Category does not exist');
    }

    await categoryRepository.remove(checkCategoryExists);
  }
}

export default DeleteCategoryService;
