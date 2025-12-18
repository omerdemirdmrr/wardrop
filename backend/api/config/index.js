module.exports = {
    "PORT": process.env.PORT || 4000,
    "LOG_LEVEL" : process.env.LOG_LEVEL || "debug",
        "CONNECTION_STRING": process.env.CONNECTION_STRING || "mongodb://localhost:27017/WardropDB",
        "REMOVE_BG_API_KEY": process.env.REMOVE_BG_API_KEY || "YOUR_API_KEY_HERE"   
    };