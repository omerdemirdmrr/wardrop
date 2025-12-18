const mongoose = require('mongoose');

const schema = mongoose.Schema({
    userId:{
        type: mongoose.SchemaTypes.ObjectId,
        required: true
    },
    outfitId:{
        type: mongoose.SchemaTypes.ObjectId,
        required: true
    },
    rating : {type : Number, min: 1, max :5},
    comments : String,
    liked : Boolean
},{
    versionKey: false,
    timestamps:{
        createdAt: 'createdAt',
        updatedAt: 'updatedAt'
    }
}
);

class Feedback extends mongoose.Model {


};

schema.loadClass(Feedback);

module.exports = mongoose.model('Feedback', schema);