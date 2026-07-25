import {Router} from "express"
import {completeMultipartUpload,
     createMultipartUpload,
     signSingleUploadPart,
    abortMultipartUpload
    } from "../controllers/multiPartUpload"
const router = Router();

router.post("/create",createMultipartUpload);
router.post("/sign-part",signSingleUploadPart);
router.post("/complete",completeMultipartUpload);
router.post("/abort", abortMultipartUpload);

export default router