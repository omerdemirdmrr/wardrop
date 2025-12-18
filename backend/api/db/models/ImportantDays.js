const mongoose = require('mongoose');

const schema = mongoose.Schema({
    userId:{
        type: mongoose.SchemaTypes.ObjectId,
        required: true
    },
    date: {type: Date, required: true},
    name : String,
    occasionId: {
        type: mongoose.SchemaTypes.ObjectId,
        required: true
    },
    notes : String
},{
    versionKey: false,
    timestamps:{
        createdAt: 'createdAt',
        updatedAt: 'updatedAt'
    }
}
);

class ImportantDays extends mongoose.Model {


};

schema.loadClass(ImportantDays);

module.exports = mongoose.model('ImportantDays', schema);