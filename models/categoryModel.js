const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    title: { type: String, required: true },
    slug: { type: String, required: true },
    description: { type: String },
    status: { type: String },
});

module.exports = mongoose.model('Category', categorySchema);
