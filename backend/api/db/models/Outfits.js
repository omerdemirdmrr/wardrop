const mongoose = require('mongoose');

const schema = mongoose.Schema({
    userId: {
        type: mongoose.SchemaTypes.ObjectId,
        required: true,
        ref: 'Users'
    },
    name: { 
        type: String, 
        required: true // Kombinin adı olsun (Örn: "Yaz akşamı kombini")
    },
    items: [{ 
        type: mongoose.SchemaTypes.ObjectId, 
        ref: 'ClothingItems', // ClothingItems tablosuna referans
        required: true
    }],
    description: String,
    isFavorite: { type: Boolean, default: false },
    status: {
        type: String,
        enum: ['suggested', 'worn', 'disliked', 'custom', 'created'],
        default: 'suggested'
    }
}, {
    versionKey: false,
    timestamps: {
        createdAt: 'createdAt',
        updatedAt: 'updatedAt'
    }
});

class Outfits extends mongoose.Model {}

schema.loadClass(Outfits);

module.exports = mongoose.model('Outfits', schema);