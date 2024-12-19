import express from "express";
import auth_routes from "../../routes/auth/auth_routes.js";


const router = express.Router();

router.use("/auth",auth_routes);

export default router;  