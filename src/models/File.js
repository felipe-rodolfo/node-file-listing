const mongoose = require('mongoose');

const FileSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    filePath: {
        type: String,
        required: true
    },
    publicationDate: {
        type: Date,
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
});

const File = mongoose.model('File', FileSchema);

module.exports = File;