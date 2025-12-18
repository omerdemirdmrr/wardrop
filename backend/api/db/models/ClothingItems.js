const mongoose = require('mongoose');

const schema = mongoose.Schema({
    userId:{
        type: mongoose.SchemaTypes.ObjectId,
        required: true,
        ref: 'Users'
    },
    isActive: { type: Boolean, default: true},
    name: { type: String, required: true},
    description : String,
    size: String,
    color: String,
    category: { type: String, required: true},
    subCategory: { type: String, required: true},
    imageUrl: String,
    material: String,
    brand: String,
    occasionId: {
        type: mongoose.SchemaTypes.ObjectId,
        required: false
    },
    season: String,
    lastWorn: Date,
    tempratureRange: {
        min: Number,
        max: Number
    }
},{
    versionKey: false,
    timestamps:{
        createdAt: 'createdAt',
        updatedAt: 'updatedAt'
    }
}
);

class ClothingItems extends mongoose.Model {


};

schema.loadClass(ClothingItems);

module.exports = mongoose.model('ClothingItems', schema);