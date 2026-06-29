require("dotenv").config();
const app = require("./src/app");
const connectDB = require("./src/config/db");

// Fail fast if critical environment variables are missing or insecure
function validateConfig() {
  const errors = [];

  if (!process.env.MONGO_URI) errors.push("MONGO_URI is required");
  if (!process.env.JWT_SECRET) errors.push("JWT_SECRET is required");
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    errors.push("JWT_SECRET must be at least 32 characters");
  }
  if (process.env.NODE_ENV === "production" && !process.env.CLIENT_URL) {
    errors.push("CLIENT_URL is required in production");
  }

  if (errors.length > 0) {
    console.error("Server configuration errors:\n" + errors.map(e => `  - ${e}`).join("\n"));
    process.exit(1);
  }
}

validateConfig();

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT} [${process.env.NODE_ENV}]`);
  });
});
