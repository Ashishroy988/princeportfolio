import express from "express";
import { sendInquiry } from "../Controllers/ContactController.js";

const router = express.Router();

router.post("/", sendInquiry);

export default router;