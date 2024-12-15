import express from "express";
import { login_User, register_User } from "../../controller/authController.js";

const router = express.Router();

router.route("/register").post(register_User)
router.route("/login").post(login_User)

export default router;