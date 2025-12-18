var express = require('express');
var router = express.Router();
var response = require("../lib/Response")
var CustomError = require("../lib/CustomError")
var _enum = require("../config/enum")
var User = require("../db/models/Users")
var bcrypt = require("bcrypt")
var jwt = require("jsonwebtoken");
var verifyToken = require("../lib/authToken");

/* 1. SIGNUP (KAYIT OL) */
router.post("/signup", async (req, res) => {
  console.log(req.body)
  try {
    const user = req.body;
    const { username, email, password} = user;

    if (!email || !password || !username) {
      return res.status(400).json(response.errorResponse(_enum.HTTP_STATUS.BAD_REQUEST, {
        message: "Missing fields",
        description: "Email, password and username are required"
      }));
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json(response.errorResponse(_enum.HTTP_STATUS.BAD_REQUEST, {
            message: "Invalid email format",
            description: "Please enter a valid email address"
        }));
    }

    if (password.length < 6) {
        return res.status(400).json(response.errorResponse(_enum.HTTP_STATUS.BAD_REQUEST, {
            message: "Password too short",
            description: "Password must be at least 6 characters long"
        }));
    }

    const existUser = await User.findOne({ email: user.email });

    if (existUser) {
      const errorResponse = response.errorResponse(_enum.HTTP_STATUS.BAD_REQUEST, {
        message: "Error adding user",
        description: "User already exists"
      });
      return res.status(_enum.HTTP_STATUS.BAD_REQUEST).json(errorResponse);
    } else {
      const saltrounds = 10;
      const hashedPassword = await bcrypt.hash(user.password, saltrounds);
      user.password = hashedPassword;
      
      const userdata = await User.create(user);
      
      console.log("yeni kullanıcı", userdata);
      const successResponse = response.successResponse(_enum.HTTP_STATUS.CREATED, {
        message: "user added succesfully",
        description: userdata
      })
      return res.status(_enum.HTTP_STATUS.CREATED).json(successResponse);
    }
  } catch (err) {
    console.error("Error: add new user", err);
    const errorResponse = response.errorResponse(_enum.HTTP_STATUS.INTERNAL_SERVER_ERROR, err);
    return res.status(500).json(errorResponse);
  }
});

/* 2. LOGIN (GİRİŞ YAP) */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json(response.errorResponse(_enum.HTTP_STATUS.BAD_REQUEST, {
        message: "Email or password missing",
        description: "Both fields are required"
      }));
    }

    if (!email.includes("@")) {
      return res.status(400).json(response.errorResponse(_enum.HTTP_STATUS.BAD_REQUEST, {
        message: "Invalid email",
        description: "Email must contain '@'"
      }));
    }

    const check = await User.findOne({ email });
    if (!check) {
      const errorResponse = response.errorResponse(
        _enum.HTTP_STATUS.NOT_FOUND, {
        message: "user not found",
        description: "email or password wrong"
      });
      return res.status(_enum.HTTP_STATUS.NOT_FOUND).json(errorResponse);
    }

    const isCorrectPassword = await bcrypt.compare(password, check.password);
    if (!isCorrectPassword) {
      const errorResponse = response.errorResponse(
        _enum.HTTP_STATUS.UNAUTHORIZED, {
        message: "Error: email or password wrong",
        description: "email or password wrong"
      });
      return res.status(_enum.HTTP_STATUS.UNAUTHORIZED).json(errorResponse);
    }

    const token = jwt.sign(
      {
        id: check._id,
        email: check.email,
        userName: check.userName,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    // GÜNCELLEME: Login olduğunda kullanıcının tercihlerini de response'a ekledim.
    res.json({ token }) ;
  } catch (err) {
    console.log("!catch", err);
    const errorResponse = response.errorResponse(
      _enum.HTTP_STATUS.INTERNAL_SERVER_ERROR,
      err.message || "Internal server error"
    );
    return res.status(_enum.HTTP_STATUS.INTERNAL_SERVER_ERROR).json(errorResponse);
  }
});

router.get("/profile", verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select("-password");
        if (!user) return res.status(404).json({ message: "Kullanıcı bulunamadı" });
        res.json({ message: `Hoşgeldin ${user.username}`, user });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});





/* 4. SİLME İŞLEMİ */
router.delete("/delete/:id", verifyToken, async (req, res) => {
  try {
    const deletedUser = await User.findByIdAndDelete(req.params.id);

    if (!deletedUser) {
      return res
        .status(_enum.HTTP_STATUS.NOT_FOUND)
        .json(response.errorResponse(_enum.HTTP_STATUS.NOT_FOUND, {
          message: "Error: delete user",
          description: "User not found"
        }
        ));
    }

    return res
      .status(_enum.HTTP_STATUS.OK)
      .json(response.successResponse(_enum.HTTP_STATUS.OK, "User deleted successfully"));
  } catch (err) {
    console.error("Delete error:", err);
    return res
      .status(_enum.HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .json(response.errorResponse(_enum.HTTP_STATUS.INTERNAL_SERVER_ERROR, err.message));
  }
});


module.exports = router;