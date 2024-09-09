const express = require('express');
const multer = require('multer');
const path = require('path');
const File = require('../models/File');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

router.get('/', authMiddleware, async (req, res) => {
    try {
        const files = await File.find().populate('user', 'username');
        res.json(files);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erro no servidor');
    }
});

router.post('/', authMiddleware, upload.single('file'), async (req, res) => {
    const { title, description, publicationDate } = req.body;

    try {
        const newFile = new File({
            title,
            description,
            filePath: req.file.path,
            publicationDate,
            user: req.user
        });

        const file = await newFile.save();
        res.json(file);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erro no servidor');
    }
});

router.put('/:id', authMiddleware, upload.single('file'), async (req, res) => {
    const { title, description, publicationDate } = req.body;

    try {
        let file = await File.findById(req.params.id);
        if (!file) {
            return res.status(404).json({ msg: 'Arquivo não encontrado' });
        }

        if (file.user.toString() !== req.user) {
            return res.status(401).json({ msg: 'Não autorizado' });
        }

        if (req.file) {
            file.filePath = req.file.path;
        }

        if (title) {
            file.title = title;
        }
        if (description) {
            file.description = description;
        }
        if (publicationDate) {
            file.publicationDate = publicationDate;
        }

        file = await file.save();
        res.json(file);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erro no servidor');
    }
});

router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const file = await File.findById(req.params.id);

        if (!file) {
            return res.status(404).json({ msg: 'Arquivo não encontrado' });
        }

        if (file.user.toString() !== req.user) {
            return res.status(401).json({ msg: 'Não autorizado' });
        }

        await file.deleteOne();

        res.json({ msg: 'Arquivo removido' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erro no servidor');
    }
});

module.exports = router;
