const mongoose = require('mongoose');

let instance = null;
class Database{
    constructor(){
        if(!instance){
            this.mongoConnection = null;
            instance = this;            
        }

        return instance;
    }

    async connect(options){
       
        try{
            console.log("Database connecting....");
            console.log("Connection string:", options.CONNECTION_STRING);
            let db = await mongoose.connect(options.CONNECTION_STRING);
            this.mongoConnection = db; 
            console.log("Database connected successfully");
        } 
        catch (error) {
            console.error("Database connection error:", error.message);
            console.error("Full error:", error);
            if (error.name === 'MongoServerSelectionError') {
                console.error("MongoDB sunucusuna bağlanılamıyor. MongoDB servisinin çalıştığından emin olun.");
            }
            process.exit(1);
        }
        
    }

}

module.exports = Database;