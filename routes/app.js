const express = require("express");
const{uploadSingle, getFileByName}= require("../controller/app");
const authGuard = require("../middleware/authGuard");
const {requireRoles} = require("../middleware/roleGuard");
const router = express.Router();
router.route("/upload").post(authGuard, requireRoles(10),uploadSingle);
router.route("/file/:filename").get(getFileByName);
module.exports = router;