import Contact from "../models/Contact.js";
import { sendMail } from "../Config/Mail.js";

export const sendInquiry = async (req, res) => {
  try {
    const { name, email, projectType, message } = req.body;

    await Contact.create({
      name,
      email,
      projectType,
      message,
    });

 await sendMail({
  name,
  email,
  projectType,
  message,
});

    res.status(200).json({
      success: true,
      message: "Inquiry sent successfully",
    });
  } catch (error) {
    console.error("CONTACT ERROR:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};