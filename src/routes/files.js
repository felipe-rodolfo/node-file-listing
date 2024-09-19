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
    const { search, startDate, endDate, last7Days, last30Days, lastYear, page = 1, limit = 10 } = req.query;
    const filters = {};

    if (search) {
        filters.$or = [
            { title: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } }
        ];
    }

    if (last7Days) {
        filters.publicationDate = { $gte: new Date(new Date().setDate(new Date().getDate() - 7)) };
    } else if (last30Days) {
        filters.publicationDate = { $gte: new Date(new Date().setDate(new Date().getDate() - 30)) };
    } else if (lastYear) {
        filters.publicationDate = { $gte: new Date(new Date().setFullYear(new Date().getFullYear() - 1)) };
    } else if (startDate || endDate) {
        if (startDate && endDate) {
            if (new Date(startDate) > new Date(endDate)) {
                return res.status(400).json({ message: 'A data inicial não pode ser maior que a data final.' });
            }
            filters.publicationDate = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        } else if (startDate) {
            filters.publicationDate = { $gte: new Date(startDate) };
        } else if (endDate) {
            filters.publicationDate = { $lte: new Date(endDate) };
        }
    }

    try {
        const files = await File.find(filters)
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .sort({ publicationDate: -1 });

        const total = await File.countDocuments(filters);
        res.json({
            files,
            total,
            page: parseInt(page),
            totalPages: Math.ceil(total / limit)
        });
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
