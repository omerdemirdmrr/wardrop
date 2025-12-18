const mongoose = require('mongoose');

const schema = mongoose.Schema({
    name: { type: String, required: true },
    
},{
    versionKey: false,
    timestamps:{
        createdAt: 'createdAt',
        updatedAt: 'updatedAt'
    }
}
);

class Occasions extends mongoose.Model {


};

schema.loadClass(Occasions);

module.exports = mongoose.model('Occasions', schema);