import { UserModal } from "../model/auth_model.js";
import { Bcrypt_Service, parseBody, tokenGenerate } from "../utils/index.js";


export const register_User = async (req, res) => {
  try {
    const body = parseBody(req.body);
    const { email, phone_number, role, password } = req.body;

    const existingUser = await UserModal.findOne({ $or: [{ email }, { phone_number }] });

    if (existingUser) {
      if (existingUser.email === email) {
        return res.json({ message: "email already exist in database" });
      } else if (existingUser.phone_number === phone_number) {
        return res.status(400).json({ message: "Phone number already exists in database" });
      }
      else if (!email || !password || !phone_number || !role) {
        return res
          .status(400)
          .json({ message: "Please fill all the fields properly" });
      } else if (!["doctor", "patient", "admin"].includes(role)) {
        return res.status(400).json({ message: "Invalid role provided" });
      }
    };

    const hashedPassword = await Bcrypt_Service.bcrypt_hash_password(password);
    const user = new UserModal({
      email,
      password: hashedPassword,
      phone_number,
      role,
    });

    const generate_token = tokenGenerate(user?._id);

    const savedUser = await user.save();
    savedUser.password = undefined;

    return res.status(201).json({
      message: "User Registered SuccessFully",
      success: true,
      data: savedUser,
      token: generate_token,
    });

  } catch (error) {
    console.log("Error occurred during registration:", error);
  }
};



export const login_User = async (req, res) => {
  try {
    const { email, phone_number, role, password } = req.body;
    console.log("req", req.body);
    const find_user = await UserModal.findOne({ email });

    if (!email, !phone_number, !password) {
      return res
        .status(400)
        .json({ message: "Please fill all the fields properly" });
    };

    console.log("find_user :",find_user)
    const isMatch = await Bcrypt_Service.bcrypt_compare_password(password, find_user?.password);

    if (find_user.email === email && isMatch) {
      const generate_token = tokenGenerate(find_user?._id);
      find_user.password = undefined;
      return res.status(200).json({
        message: "user Login SuccessFully",
        success: true,
        data: find_user,
        token: generate_token,
      })
    }
    else {
      return res.status(400).json({ message: "incorrect email or phonenumber or password" });
    }
  } catch (error) {
    return res.status(400).json({ message: "an error accured" });
  }
};