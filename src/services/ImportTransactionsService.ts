import { getCustomRepository, getRepository, In } from 'typeorm';
import csvParse from 'csv-parse';
import fs from 'fs';

import Transaction from '../models/Transaction';
import Category from '../models/Category';

import TransactionsRepository from '../repositories/TransactionsRepository';

interface CSVTransaction {
  title: string;
  type: 'income' | 'outcome';
  value: number;
  category: string;
}

class ImportTransactionsService {
  async execute(filePath: string): Promise<Transaction[]> {
    const transactionsRepository = getCustomRepository(TransactionsRepository);
    const categoriesRepository = getRepository(Category);

    const contactsReadSteam = fs.createReadStream(filePath);

    const parsers = csvParse({
      from_line: 2,
    });

    // o pipe é para separar por coluna.
    const parseCSV = contactsReadSteam.pipe(parsers);

    const transactions: CSVTransaction[] = [];
    const categories: string[] = [];

    parseCSV.on('data', async line => {
      const [title, type, value, category] = line.map((cell: string) =>
        cell.trim(),
      );

      if (!title || !type || !value) return;

      categories.push(category);

      transactions.push({ title, type, value, category });
    });

    await new Promise(resolve => parseCSV.on('end', resolve));

    // procurar no banco as categories existentes
    const existentCategories = await categoriesRepository.find({
      where: {
        title: In(categories),
      },
    });

    // Buscar só o title dos categories nas categories existentes
    const existentCategoriesTitles = existentCategories.map(
      (category: Category) => category.title,
    );

    /**
     * buscar dentro do array das categories, os títulos daquelas que não existem
     * tirar depois os duplicados e salvar as categorias inexistente no banco
     * o segundo filter retorna uma função callback que tem como parâmetros:
     *
     * value = valor filtrado),
     * index = index do filtrado),
     * self = arrays de lista (nesse caso as categories[])
     *
     */

    const addCategoryTitles = categories
      .filter(category => !existentCategoriesTitles.includes(category))
      .filter((value, index, self) => self.indexOf(value) === index);

    const newCategories = categoriesRepository.create(
      addCategoryTitles.map(title => ({
        title,
      })),
    );

    await categoriesRepository.save(newCategories);

    /**
     * usando o spread operator para passar todas novas categories
     * e passar todas as categories que já existem.
     */

    const finalCategories = [...newCategories, ...existentCategories];

    const createdTransactions = transactionsRepository.create(
      transactions.map(transaction => ({
        title: transaction.title,
        type: transaction.type,
        value: transaction.value,
        category: finalCategories.find(
          category => category.title === transaction.category,
        ),
      })),
    );

    // salvar todas as transações com uma conexão sódo banco de dado.
    await transactionsRepository.save(createdTransactions);

    // excluir o arquivo depois da importação.
    await fs.promises.unlink(filePath);

    // Retornar todas as transações que foram criadas.
    return createdTransactions;
  }
}

export default ImportTransactionsService;
