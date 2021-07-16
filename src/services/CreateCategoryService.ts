// import AppError from '../errors/AppError';
import { getRepository } from 'typeorm';
import Category from '../models/Category';

interface Request {
  title: string;
}

class CreateCategoryService {
  public async execute({ title }: Request): Promise<Category> {
    const categoryRepository = getRepository(Category);

    // verificar se a Categoria existe buscando no banco banco
    let category = await categoryRepository.findOne({
      where: {
        title,
      },
    });

    // Caso não existe? crio ela
    if (!category) {
      category = categoryRepository.create({
        title,
      });

      await categoryRepository.save(category);
    }

    return category;
  }
}

export default CreateCategoryService;
