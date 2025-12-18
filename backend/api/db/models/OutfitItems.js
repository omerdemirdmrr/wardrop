const mongoose = require('mongoose');

const schema = mongoose.Schema({
    itemId:{
        type: mongoose.SchemaTypes.ObjectId,
        required: true
    },
    userId:{
        type: mongoose.SchemaTypes.ObjectId,
        required: true
    },
    rating : Number,
    description : String,
    liked : Boolean
},{
    versionKey: false,
    timestamps:{
        createdAt: 'createdAt',
        updatedAt: 'updatedAt'
    }
}
);

class OutfitItems extends mongoose.Model {


};

schema.loadClass(OutfitItems);

module.exports = mongoose.model('OutfitItems', schema);