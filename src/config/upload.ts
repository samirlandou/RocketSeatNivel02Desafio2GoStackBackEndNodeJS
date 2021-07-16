import multer from 'multer';
import path from 'path';
import crypto from 'crypto';

const tmpFolder = path.resolve(__dirname, '..', '..', 'tmp');

export default {
  directory: tmpFolder,

  storage: multer.diskStorage({
    /* O "__dirname" vai até a pasta "config" então para ir para a pasta temp
      precisamos voltar para duas pastas (src e raiz do projeto) usando os '..'.
      e depois jogar os arquivos na pasta "tmp"
    */
    destination: tmpFolder,

    // função para gerar o arquivo com o nome único
    filename(request, file, callback) {
      const fileHash = crypto.randomBytes(10).toString('hex');
      const fileName = `${fileHash}-${file.originalname}`;

      // Retornar um callback("null" por que não aconteceu erro, "fileName" o retorno)
      return callback(null, fileName);
    },
  }),
};
