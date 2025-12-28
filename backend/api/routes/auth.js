var express = require("express");
var router = express.Router();
var bcrypt = require("bcrypt"); // Or 'bcrypt' depending on installation, checking package.json is safer but usually bcryptjs is used or aliased.
// Looking at users.js snippet, it uses `bcrypt.hash`. I need to check if it is `bcrypt` or `bcryptjs`.
// I'll check package.json first. 
var response = require("../lib/Response");
var User = require("../db/models/Users");
var emailService = require("../services/emailService");
var _enum = require("../config/enum");

/* 1. FORGOT PASSWORD - SEND CODE */
router.post("/forgot-password", async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json(
                response.errorResponse(_enum.HTTP_STATUS.BAD_REQUEST, {
                    message: "Email is required"
                })
            );
        }

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json(
                response.errorResponse(_enum.HTTP_STATUS.NOT_FOUND, {
                    message: "User not found"
                })
            );
        }

        // Generate 6 digit code
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        
        // Set expiry to 15 minutes
        const expiry = new Date(Date.now() + 15 * 60 * 1000);

        user.resetPasswordToken = code;
        user.resetPasswordExpires = expiry;
        await user.save();

        // Send email
        await emailService.sendPasswordResetCode(email, code);

        return res.json(
            response.successResponse(_enum.HTTP_STATUS.OK, {
                message: "Verification code sent to email"
            })
        );

    } catch (err) {
        console.error("Forgot password error:", err);
        return res.status(500).json(
            response.errorResponse(_enum.HTTP_STATUS.INTERNAL_SERVER_ERROR, err.message)
        );
    }
});

/* 2. VERIFY CODE */
router.post("/verify-code", async (req, res) => {
    try {
        const { email, code } = req.body;

        if (!email || !code) {
            return res.status(400).json(
                response.errorResponse(_enum.HTTP_STATUS.BAD_REQUEST, {
                    message: "Email and code are required"
                })
            );
        }

        const user = await User.findOne({ 
            email,
            resetPasswordToken: code,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json(
                response.errorResponse(_enum.HTTP_STATUS.BAD_REQUEST, {
                    message: "Invalid or expired code"
                })
            );
        }

        return res.json(
            response.successResponse(_enum.HTTP_STATUS.OK, {
                message: "Code verified successfully"
            })
        );

    } catch (err) {
        console.error("Verify code error:", err);
        return res.status(500).json(
            response.errorResponse(_enum.HTTP_STATUS.INTERNAL_SERVER_ERROR, err.message)
        );
    }
});

/* 3. RESET PASSWORD */
router.post("/reset-password", async (req, res) => {
    try {
        const { email, code, newPassword } = req.body;

        if (!email || !code || !newPassword) {
            return res.status(400).json(
                response.errorResponse(_enum.HTTP_STATUS.BAD_REQUEST, {
                    message: "All fields are required"
                })
            );
        }

        const user = await User.findOne({ 
            email,
            resetPasswordToken: code,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json(
                response.errorResponse(_enum.HTTP_STATUS.BAD_REQUEST, {
                    message: "Invalid or expired code"
                })
            );
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        user.password = hashedPassword;
        user.resetPasswordToken = null;
        user.resetPasswordExpires = null;
        await user.save();

        return res.json(
            response.successResponse(_enum.HTTP_STATUS.OK, {
                message: "Password reset successfully"
            })
        );

    } catch (err) {
        console.error("Reset password error:", err);
        return res.status(500).json(
            response.errorResponse(_enum.HTTP_STATUS.INTERNAL_SERVER_ERROR, err.message)
        );
    }
});

module.exports = router;
