const mongoose = require('mongoose');
const { image } = require('../../config/cloudinary');
const { Schema } = mongoose;

const schema = mongoose.Schema({
    username: { type: String, required: true},
    email: { type: String, required: true},
    imageUrl: String,
    imagePublicId: String,
    password: { type: String, required: true},
    isActive: { type: Boolean, default: true},
    favoriteColors: {
        type: [String], 
        default: []   
    },


    stylePreferences: {
        type: [String], 
        default: []
    }

},{
    versionKey: false, 
    timestamps:{
        createdAt: 'createdAt',
        updatedAt: 'updatedAt'
    }
});

class Users extends mongoose.Model {

};

schema.loadClass(Users);

module.exports = mongoose.model('Users', schema);