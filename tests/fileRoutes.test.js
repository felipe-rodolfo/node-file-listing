const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../src/index');
const File = require('../src/models/File');

jest.mock('../src/middleware/authMiddleware', () => (req, res, next) => {
    req.user = 'mockUserId';
    next();
});

let mongoServer;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
});

afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongoServer.stop();
});

beforeEach(async () => {
    await File.deleteMany({});
});

describe('File Routes', () => {
    it('deve listar todos os arquivos', async () => {
        await File.create({
            title: 'Arquivo Teste',
            description: 'Descrição do arquivo',
            filePath: 'uploads/teste.txt',
            publicationDate: new Date(),
            user: 'mockUserId'
        });

        const res = await request(app)
            .get('/api/files')
            .set('Authorization', `Bearer mockToken`);

        expect(res.statusCode).toEqual(200);
        expect(res.body.length).toBe(1);
        expect(res.body[0].title).toBe('Arquivo Teste');
    });

    it('deve criar um novo arquivo', async () => {
        const res = await request(app)
            .post('/api/files')
            .set('Authorization', `Bearer mockToken`)
            .field('title', 'Novo Arquivo')
            .field('description', 'Descrição do arquivo')
            .attach('file', 'tests/uploads/teste.txt');

        expect(res.statusCode).toEqual(200);
        expect(res.body.title).toBe('Novo Arquivo');
        expect(res.body.filePath).toBeTruthy();
    });

    it('deve atualizar um arquivo existente', async () => {
        const file = await File.create({
            title: 'Arquivo Original',
            description: 'Descrição do arquivo',
            filePath: 'uploads/teste.txt',
            publicationDate: new Date(),
            user: 'mockUserId'
        });

        const res = await request(app)
            .put(`/api/files/${file._id}`)
            .set('Authorization', `Bearer mockToken`)
            .send({
                title: 'Arquivo Atualizado',
                description: 'Nova descrição'
            });

        expect(res.statusCode).toEqual(200);
        expect(res.body.title).toBe('Arquivo Atualizado');
        expect(res.body.description).toBe('Nova descrição');
    });

    it('deve excluir um arquivo existente', async () => {
        const file = await File.create({
            title: 'Arquivo para deletar',
            description: 'Descrição do arquivo',
            filePath: 'uploads/teste.txt',
            publicationDate: new Date(),
            user: 'mockUserId'
        });

        const res = await request(app)
            .delete(`/api/files/${file._id}`)
            .set('Authorization', `Bearer mockToken`);

        expect(res.statusCode).toEqual(200);
        expect(res.body.msg).toBe('Arquivo removido');

        const fileInDb = await File.findById(file._id);
        expect(fileInDb).toBeNull();
    });

    it('não deve permitir atualizar um arquivo se não for o proprietário', async () => {
        const file = await File.create({
            title: 'Arquivo de outro usuário',
            description: 'Descrição do arquivo',
            filePath: 'uploads/teste.txt',
            publicationDate: new Date(),
            user: 'outroUsuarioId'
        });

        const res = await request(app)
            .put(`/api/files/${file._id}`)
            .set('Authorization', `Bearer mockToken`)
            .send({
                title: 'Tentativa de alteração'
            });

        expect(res.statusCode).toEqual(401);
        expect(res.body.msg).toBe('Não autorizado');
    });
});
