import { UserModal } from "../model/auth_model.js";
import { Bcrypt_Service, parseBody, tokenGenerate } from "../utils/index.js";
import nodemailer from "nodemailer";
import crypto from "crypto";
import { VerificationCodeModal } from "../model/verification_code_model.js";

export const register_User = async (req, res) => {

  try {
    const { email, phone_number, role, password, confirmPassword } = req.body;

    // Check for missing fields
    if (!email || !phone_number || !role || !password || !confirmPassword) {
      return res.status(400).json({ message: "Please fill all the fields properly" });
    }

    // Validate role
    const validRoles = ["doctor", "patient", "admin"];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: "Invalid role provided" });
    }

    // Check if passwords match
    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    // Check if user already exists
    const existingUser = await UserModal.findOne({
      $or: [{ email }, { phone_number }],
    });

    if (existingUser) {
      if (existingUser.email === email) {
        return res.status(400).json({ message: "Email already exists in the database" });
      }
      if (existingUser.phone_number === phone_number) {
        return res.status(400).json({ message: "Phone number already exists in the database" });
      }
    }

    // Hash password
    const hashedPassword = await Bcrypt_Service.bcrypt_hash_password(password);
    const hashedConfirmPassword = await Bcrypt_Service.bcrypt_hash_password(confirmPassword);

    // Create user
    const user = new UserModal({
      email,
      password: hashedPassword,
      confirmPassword: hashedConfirmPassword,
      phone_number,
      role,
    });

    // Generate token
    const token = tokenGenerate(user._id);

    // Save user
    const savedUser = await user.save();

    // Remove password from response
    savedUser.password = undefined;
    savedUser.confirmPassword = undefined;

    // Send response
    return res.status(201).json({
      message: "User registered successfully",
      success: true,
      data: savedUser,
      token,
    });
  } catch (error) {
    console.error("Error occurred during registration:", error);
    return res.status(500).json({ message: "Server error occurred" });
  }
};



export const login_User = async (req, res) => {
  try {
    const { email, phone_number, password, role } = req.body;

    // Early validation for missing fields
    if (!email || !phone_number || !password) {
      return res.status(400).json({ message: "Please fill all the fields properly" });
    }

    // Find user by email
    const user = await UserModal.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "email doesn'nt exist in db" });
    }

    // Compare passwords
    const isPasswordMatch = await Bcrypt_Service.bcrypt_compare_password(password, user.password);

    if (!isPasswordMatch) {
      return res.status(400).json({ message: "Incorrect password" });
    }

    // Generate token
    const token = tokenGenerate(user._id);

    user.password = undefined;

    // Send successful response
    return res.status(200).json({
      message: "User logged in successfully",
      success: true,
      data: user,
      token,
    });

  } catch (error) {
    console.error("Error during login:", error);
    return res.status(500).json({ message: "An error occurred during login" });
  }
};



export const send_verification_code = async (req, res) => {
  try {

    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    };

    const verificationCode = crypto.randomInt(100000, 999999);

    const verification_code = new VerificationCodeModal({
      verification_code: verificationCode
    });

    await verification_code.save();

    // Send the code via email
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL,
        pass: process.env.PASS,
      },
    });

    const mailOptions = {
      from: 'nafeessocial@gmail.com',
      to: email,
      subject: 'Welcome to Doctor Services 🎉',
      text: `Your verification code is ${verification_code.verification_code}.`,
    };

    await transporter.sendMail(mailOptions);

    return res.status(200).json({
      message: "Verification code sent successfully",
      verification_code: verification_code.verification_code,
      success: true,
    });

  } catch (error) {
    console.error("Error sending verification code:", error);
    return res.status(500).json({ message: "Failed to send verification code" });
  }
};




export const verify_Code = async (req, res) => {
  try {
    const { verification_code } = req.body;

    if (!verification_code) {
      return res.status(400).json({ message: "Verification code is required" });
    };

    const code = await VerificationCodeModal.findOne({ verification_code });

 
    if (code) {
      if (code.verification_code === verification_code) {
        return res.status(200).json({ message: "Code verified successfully" })
      } 
    } else {
      return res.status(400).json({ message: "Enter correct code" })
    }

  } catch (error) {
    console.log("🚀 ~ verifyCode ~ error:", error)
    return res.status(400).json({ error: "an error occured" });
  }
};