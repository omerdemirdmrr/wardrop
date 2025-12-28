var express = require("express");
var router = express.Router();
var response = require("../lib/Response");
var CustomError = require("../lib/CustomError");
var _enum = require("../config/enum");
var User = require("../db/models/Users");
var bcrypt = require("bcrypt");
var jwt = require("jsonwebtoken");
var verifyToken = require("../lib/authToken");
const upload = require("../lib/upload");
const cloudinary = require("../config/cloudinary");
const emailService = require("../services/emailService");

/* 1. SIGNUP (KAYIT OL) */
router.post("/signup", async (req, res) => {
  console.log(req.body);
  try {
    const user = req.body;
    const { username, email, password } = user;

    if (!email || !password || !username) {
      console.log("Missing fields in signup:", { email, password, username });
      return res.status(400).json(
        response.errorResponse(_enum.HTTP_STATUS.BAD_REQUEST, {
          message: "Missing fields",
          description: "Email, password and username are required",
        })
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.log("Invalid email format:", email);
      return res.status(400).json(
        response.errorResponse(_enum.HTTP_STATUS.BAD_REQUEST, {
          message: "Invalid email format",
          description: "Please enter a valid email address",
        })
      );
    }

    if (password.length < 6) {
      console.log("Password too short:", password);
      return res.status(400).json(
        response.errorResponse(_enum.HTTP_STATUS.BAD_REQUEST, {
          message: "Password too short",
          description: "Password must be at least 6 characters long",
        })
      );
    }

    const existUser = await User.findOne({ email: user.email });

    if (existUser) {
      console.log("User already exists with email:", user.email);
      const errorResponse = response.errorResponse(
        _enum.HTTP_STATUS.BAD_REQUEST,
        {
          message: "Error adding user",
          description: "User already exists",
        }
      );
      return res.status(_enum.HTTP_STATUS.BAD_REQUEST).json(errorResponse);
    } else {
      const saltrounds = 10;
      const hashedPassword = await bcrypt.hash(user.password, saltrounds);
      user.password = hashedPassword;

      const userdata = await User.create(user);

      console.log("new user", userdata);

      // Generate verification token and send email
      try {
        const verificationToken = emailService.generateVerificationToken();
        const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        // Save token to user
        userdata.emailVerificationToken = verificationToken;
        userdata.emailVerificationExpires = tokenExpiry;
        await userdata.save();

        // Send verification email
        await emailService.sendVerificationEmail(
          userdata.email,
          verificationToken,
          userdata.username
        );

        console.log("Verification email sent to:", userdata.email);
      } catch (emailError) {
        console.error("Error sending verification email:", emailError);
        // Don't fail registration if email fails - user can resend later
      }

      const successResponse = response.successResponse(
        _enum.HTTP_STATUS.CREATED,
        {
          message: "Registration successful! Please check your email to verify your account.",
          description: {
            userId: userdata._id,
            email: userdata.email,
            username: userdata.username
          },
        }
      );
      return res.status(_enum.HTTP_STATUS.CREATED).json(successResponse);
    }
  } catch (err) {
    console.error("Error: add new user", err);
    const errorResponse = response.errorResponse(
      _enum.HTTP_STATUS.INTERNAL_SERVER_ERROR,
      err
    );
    return res.status(500).json(errorResponse);
  }
});

/* 2. LOGIN (GİRİŞ YAP) */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json(
        response.errorResponse(_enum.HTTP_STATUS.BAD_REQUEST, {
          message: "Email or password missing",
          description: "Both fields are required",
        })
      );
    }

    if (!email.includes("@")) {
      return res.status(400).json(
        response.errorResponse(_enum.HTTP_STATUS.BAD_REQUEST, {
          message: "Invalid email",
          description: "Email must contain '@'",
        })
      );
    }

    const check = await User.findOne({ email });
    if (!check) {
      const errorResponse = response.errorResponse(
        _enum.HTTP_STATUS.UNAUTHORIZED,
        {
          message: "Email or password wrong",
          description: "Email or password is incorrect",
        }
      );
      return res.status(_enum.HTTP_STATUS.UNAUTHORIZED).json(errorResponse);
    }

    const isCorrectPassword = await bcrypt.compare(password, check.password);
    if (!isCorrectPassword) {
      const errorResponse = response.errorResponse(
        _enum.HTTP_STATUS.UNAUTHORIZED,
        {
          message: "Email or password wrong",
          description: "email or password wrong",
        }
      );
      return res.status(_enum.HTTP_STATUS.UNAUTHORIZED).json(errorResponse);
    }

    // Check if email is verified
    if (!check.isEmailVerified) {
      return res.status(403).json(
        response.errorResponse(_enum.HTTP_STATUS.FORBIDDEN, {
          message: "Email not verified",
          description: "Please verify your email before logging in. Check your inbox for the verification link.",
          code: "EMAIL_NOT_VERIFIED"
        })
      );
    }

    const token = jwt.sign(
      {
        id: check._id,
        email: check.email,
        userName: check.userName,
      },
      process.env.JWT_SECRET,
      { expiresIn: "12h" }
    );

    // GÜNCELLEME: Login olduğunda kullanıcının tercihlerini de response'a ekledim.
    res.json({ token });
  } catch (err) {
    console.log("!catch", err);
    const errorResponse = response.errorResponse(
      _enum.HTTP_STATUS.INTERNAL_SERVER_ERROR,
      err.message || "Internal server error"
    );
    return res
      .status(_enum.HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .json(errorResponse);
  }
});

/* UPDATE PROFILE (USERNAME + PHOTO) */
router.put(
  "/profile",
  verifyToken,
  upload.single("image"),
  async (req, res) => {
    try {
      const userId = req.user.id;
      const { username } = req.body;

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json(
          response.errorResponse(_enum.HTTP_STATUS.NOT_FOUND, {
            message: "User not found",
          })
        );
      }

      /* 1️⃣ Username güncelle */
      if (username) {
        user.username = username;
      }

      /* 2️⃣ Fotoğraf varsa Cloudinary upload */
      if (req.file) {
        // Eski foto varsa sil
        if (user.imagePublicId) {
          await cloudinary.uploader.destroy(user.imagePublicId);
        }

        const uploadResult = await cloudinary.uploader.upload_stream(
          {
            folder: "CombineApp/profiles",
            resource_type: "image",
          },
          async (error, result) => {
            if (error) {
              return res
                .status(500)
                .json(
                  response.errorResponse(
                    _enum.HTTP_STATUS.INTERNAL_SERVER_ERROR,
                    error.message
                  )
                );
            }

            user.imageUrl = result.secure_url;
            user.imagePublicId = result.public_id;

            await user.save();

            return res.json(
              response.successResponse(_enum.HTTP_STATUS.OK, {
                message: "Profile updated successfully",
                user: {
                  username: user.username,
                  imageUrl: user.imageUrl,
                },
              })
            );
          }
        );

        uploadResult.end(req.file.buffer);
        return;
      }

      /* Foto yoksa sadece username güncelle */
      await user.save();

      return res.json(
        response.successResponse(_enum.HTTP_STATUS.OK, {
          message: "Profile updated successfully",
          user: {
            username: user.username,
            imageUrl: user.imageUrl,
          },
        })
      );
    } catch (err) {
      console.error("Profile update error:", err);
      return res
        .status(500)
        .json(
          response.errorResponse(
            _enum.HTTP_STATUS.INTERNAL_SERVER_ERROR,
            err.message
          )
        );
    }
  }
);

router.get("/getprofile", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).select(
      "username email imageUrl favoriteColors stylePreferences"
    );

    return res.json({ message: "Profile fetched successfully", user });
  } catch (err) {
    console.error("Profile fetch error:", err);
    return res
      .status(500)
      .json(
        response.errorResponse(
          _enum.HTTP_STATUS.INTERNAL_SERVER_ERROR,
          err.message
        )
      );
  }
});

/* 4. SİLME İŞLEMİ */
router.delete("/delete/:id", verifyToken, async (req, res) => {
  try {
    const deletedUser = await User.findByIdAndDelete(req.params.id);

    if (!deletedUser) {
      return res.status(_enum.HTTP_STATUS.NOT_FOUND).json(
        response.errorResponse(_enum.HTTP_STATUS.NOT_FOUND, {
          message: "Error: delete user",
          description: "User not found",
        })
      );
    }

    return res
      .status(_enum.HTTP_STATUS.OK)
      .json(
        response.successResponse(
          _enum.HTTP_STATUS.OK,
          "User deleted successfully"
        )
      );
  } catch (err) {
    console.error("Delete error:", err);
    return res
      .status(_enum.HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .json(
        response.errorResponse(
          _enum.HTTP_STATUS.INTERNAL_SERVER_ERROR,
          err.message
        )
      );
  }
});

/* CHANGE PREFERENCES (favoriteColors + stylePreferences) */
router.put("/changepreferences", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { favoriteColors, stylePreferences } = req.body;

    // En az bir alan gelmeli
    if (!favoriteColors && !stylePreferences) {
      return res.status(400).json(
        response.errorResponse(_enum.HTTP_STATUS.BAD_REQUEST, {
          message: "No data provided",
          description: "favoriteColors or stylePreferences required",
        })
      );
    }

    const updateData = {};

    if (Array.isArray(favoriteColors)) {
      updateData.favoriteColors = favoriteColors;
    }

    if (Array.isArray(stylePreferences)) {
      updateData.stylePreferences = stylePreferences;
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select("-password");

    if (!updatedUser) {
      return res.status(404).json(
        response.errorResponse(_enum.HTTP_STATUS.NOT_FOUND, {
          message: "User not found",
        })
      );
    }

    return res.json(
      response.successResponse(_enum.HTTP_STATUS.OK, {
        message: "Preferences updated successfully",
        preferences: {
          favoriteColors: updatedUser.favoriteColors,
          stylePreferences: updatedUser.stylePreferences,
        },
      })
    );
  } catch (err) {
    console.error("Change preferences error:", err);
    return res
      .status(500)
      .json(
        response.errorResponse(
          _enum.HTTP_STATUS.INTERNAL_SERVER_ERROR,
          err.message
        )
      );
  }
});

router.get("/getpreferences", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).select(
      "favoriteColors stylePreferences"
    );

    return res.json({ message: "Preferences fetched successfully", user });
  } catch (err) {
    console.error("Preferences fetch error:", err);
    return res
      .status(500)
      .json(
        response.errorResponse(
          _enum.HTTP_STATUS.INTERNAL_SERVER_ERROR,
          err.message
        )
      );
  }
});

router.put("/changepassword", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json(
        response.errorResponse(_enum.HTTP_STATUS.BAD_REQUEST, {
          message: "Both old and new passwords are required",
        })
      );
    }

    const user = await User.findById(userId);

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(401).json(
        response.errorResponse(_enum.HTTP_STATUS.UNAUTHORIZED, {
          message: "Old password is incorrect",
        })
      );
    }

    const saltrounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltrounds);
    user.password = hashedPassword;
    await user.save();

    return res.json(
      response.successResponse(_enum.HTTP_STATUS.OK, {
        message: "Password changed successfully",
      })
    );
  } catch (err) {
    console.error("Change password error:", err);
    return res
      .status(500)
      .json(
        response.errorResponse(
          _enum.HTTP_STATUS.INTERNAL_SERVER_ERROR,
          err.message
        )
      );
  }
});

/* EMAIL VERIFICATION ENDPOINTS */

// Verify email with token
router.get("/verify-email/:token", async (req, res) => {
  try {
    const { token } = req.params;

    // Find user with this verification token
    const user = await User.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: Date.now() } // Token not expired
    });

    if (!user) {
      return res.status(400).send(`
        <html>
          <body style="font-family: Arial; text-align: center; padding: 50px;">
            <h1>Invalid or Expired Link</h1>
            <p>This verification link is invalid or has expired.</p>
            <p>Please request a new verification email from the app.</p>
          </body>
        </html>
      `);
    }

    // Check if already verified
    if (user.isEmailVerified) {
      return res.status(200).send(`
        <html>
          <body style="font-family: Arial; text-align: center; padding: 50px;">
            <h1>✅ Email Already Verified</h1>
            <p>Your email has already been verified.</p>
            <p>You can now login to your account.</p>
          </body>
        </html>
      `);
    }

    // Verify the email
    user.isEmailVerified = true;
    user.emailVerificationToken = null;
    user.emailVerificationExpires = null;
    await user.save();

    return res.status(200).send(`
      <html>
        <body style="font-family: Arial; text-align: center; padding: 50px;">
          <h1>✅ Email Verified Successfully!</h1>
          <p>Your email has been verified.</p>
          <p>You can now login to your account.</p>
        </body>
      </html>
    `);

  } catch (err) {
    console.error("Email verification error:", err);
    return res.status(500).send(`
      <html>
        <body style="font-family: Arial; text-align: center; padding: 50px;">
          <h1>Error</h1>
          <p>Something went wrong during verification.</p>
          <p>Please try again or contact support.</p>
        </body>
      </html>
    `);
  }
});

// Resend verification email
router.post("/resend-verification", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json(
        response.errorResponse(_enum.HTTP_STATUS.BAD_REQUEST, {
          message: "Email required",
          description: "Please provide your email address"
        })
      );
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json(
        response.errorResponse(_enum.HTTP_STATUS.NOT_FOUND, {
          message: "User not found",
          description: "No account found with this email"
        })
      );
    }

    if (user.isEmailVerified) {
      return res.status(400).json(
        response.errorResponse(_enum.HTTP_STATUS.BAD_REQUEST, {
          message: "Email already verified",
          description: "You can login to your account"
        })
      );
    }

    // Generate new verification token
    const verificationToken = emailService.generateVerificationToken();
    const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    user.emailVerificationToken = verificationToken;
    user.emailVerificationExpires = tokenExpiry;
    await user.save();

    // Send verification email
    await emailService.sendVerificationEmail(
      user.email,
      verificationToken,
      user.username
    );

    return res.status(200).json(
      response.successResponse(_enum.HTTP_STATUS.OK, {
        message: "Verification email sent",
        description: "Please check your email inbox"
      })
    );

  } catch (err) {
    console.error("Resend verification error:", err);
    return res.status(500).json(
      response.errorResponse(
        _enum.HTTP_STATUS.INTERNAL_SERVER_ERROR,
        err.message
      )
    );
  }
});

module.exports = router;
