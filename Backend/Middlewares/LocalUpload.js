import multer from "multer";
import path from "path";

const storage = multer.diskStorage({

    destination: function (req, file, cb) {

        cb(null, 'uploads/'); // Save inside /uploads folder
        
    },
    filename: function (req, file, cb) {

        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);

        cb(null, uniqueSuffix + path.extname(file.originalname)); // Unique file names

    }
});

const localUpload = multer({ storage });

export default localUpload;
