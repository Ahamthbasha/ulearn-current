import multer from "multer"

const storage = multer.memoryStorage()

//store file temporarily in ram.useFull to upload the file directly to s3

const upload = multer({
    storage,
    limits:{
        fileSize : 200 * 1024 * 1024
    }
})

export default upload