import {Router} from "express"
import {completeMultipartUpload, createMultipartUpload,signSingleUploadPart} from "../controllers/multiPartUpload"
const router = Router();

router.post("/create",createMultipartUpload);
router.post("/sign-part",signSingleUploadPart);
router.post("/complete",completeMultipartUpload);

export default router