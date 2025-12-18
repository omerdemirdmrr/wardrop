const multer = require("multer");


const storage = multer.memoryStorage();
const fileFilter= (req,file,cb)=>{
    const allowedType=["image/jpeg", "image/jpg", "image/png", "image/webp"]

    if(allowedType.includes(file.mimetype)){
        cb(null,true);
    }else{
        cb({ 
            message: "Only image files are allowed!",
            code: "LIMIT_FILE_TYPE"
        }, false)
    }
}

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 10 * 1024 * 1024 } 
});

module.exports = upload;