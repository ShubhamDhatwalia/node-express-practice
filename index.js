const express = require("express");

const app = express();
const users = require("./MOCK_DATA.json");
const status = require("express-status-monitor");

const fs = require("fs");
const { escape } = require("querystring");
const path = require("path");
const multer = require("multer");

app.set("view engine", "ejs");
app.set("views", path.resolve("./views"));

app.get("/", (req, res) => {
  return res.render("homepage");
});

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./uploads");
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const maxSize = 1 * 1000 * 1000; // 1 MB

const upload = multer({
  storage: storage,
  limits: { fileSize: maxSize },
  fileFilter: function (req, file, cb) {
    // Allowed file types
    let filetypes = /jpeg|jpg|png/;
    // Check MIME type
    let mimetype = filetypes.test(file.mimetype);
    // Check file extension
    let extname = filetypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
      cb(null, true);
    } else {
      cb(
        new Error(
          "Error: File upload only supports the following filetypes: jpeg, jpg, png"
        )
      );
    }
  },
}).single("profileImage");

app.post("/upload", (req, res) => {
  upload(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).send("File size limit exceeded (1MB max)");
      }
      return res.status(500).send(err.message);
    } else if (err) {
      // Handle file type error
      if (err.message.startsWith("Error: File upload only supports")) {
        return res.status(400).send(err.message);
      }
      console.error(err);
      return res.status(500).send("Internal Server Error");
    }

    // File upload was successful
    if (!req.file) {
      console.log("No file uploaded");
      return res.status(400).send("Error: No file uploaded");
    }

    console.log("Uploaded file details:", req.file);

    // Redirect to the root route after sending the success response
    return res.redirect("/");
  });
});




// ---------------- Middleware --------------
app.use(express.urlencoded({ extended: false }));

app.use(status());

app.use((req, res, next) => {
  console.log("Middleware 1");
  req.userName = "shubhamdhatwalia";

  fs.appendFile(
    "./log.txt",
    `\n${Date.now()}    ${req.ip}    ${req.method}    ${req.path}`,
    (err, data) => {
      next();
    }
  );
});

app.use((req, res, next) => {
  console.log("Middleware 2 " + req.userName);
  next();
});

// ------------- Routes ---------------------
const sendMail = require("./sendMail");
app.get("/mail", sendMail);

app.get("/api/log", (req, res) => {
  // const stream = fs.createReadStream("./task2.txt", "utf-8",);
  // stream.on("data", (chunks) => res.write(chunks));
  // stream.on("end", () => res.end());

  const stream = fs.createReadStream("./task2.txt", "utf-8");
  stream.pipe(res);

  // fs.readFile("./task2.txt", "UTF-8",(err, data) => {
  //   res.json({ data });
  // })
});

app.get("/api/users", (req, res) => {
  console.log(req.url);

  res.setHeader("X-MyName", "Shubham");
  console.log(req.userName);
  return res.status(200).json(users);
});

app.get("/users", (req, res) => {
  const html = `
    <ul>
    ${users.map((user) => `<li>${user.first_name}</li>`).join("")}</ul>`;

  res.send(html);
});

app.route("/api/users/:id").get((req, res) => {
  const id = Number(req.params.id);

  const user = users.find((user) => user.id === id);

  if (!user) {
    console.log(`No user Exists with ID: ${id}`);
    return res
      .status(400)
      .json({ status: "error", message: `No user exists with ID : ${id}` });
  }
  return res.json(user);
});

app.patch("/api/users/:id", (req, res) => {
  const id = Number(req.params.id); // Extract id from URL parameter

  // Find the user in the array by id
  const user = users.find((user) => user.id === id);

  if (!user) {
    console.log(`No user Exists with ID: ${id}`);
    return res
      .status(400)
      .json({ status: "error", message: `No user exists with ID : ${id}` });
  }

  // If user with given id exists
  if (user) {
    const body = req.body; // Extract the request body

    // Update user properties based on request body fields
    if (body.first_name) {
      user.first_name = body.first_name;
    }
    if (body.email) {
      user.email = body.email;
    }
    if (body.last_name) {
      user.last_name = body.last_name;
    }
    if (body.gender) {
      user.gender = body.gender;
    }
    if (body.job_title) {
      user.job_title = body.job_title;
    }
    if (!body || Object.keys(body).length === 0) {
      console.log("no data provided for edit");
      return res
        .status(400)
        .json({ status: "error", message: "No data provided for edit" });
    }

    // Write updated users array to file synchronously

    fs.writeFile("./MOCK_DATA.json", JSON.stringify(users), (err) => {
      if (err) {
        console.error(err);
        return res.json({
          status: "error",
          message: "Failed to update user data",
        });
      }
      return res.status(201).json({ status: "success", data: user });
    });
  } else {
    // If user with given id does not exist
    return res.json({
      status: "error",
      message: `User with id ${id} not found`,
    });
  }
});

app.delete("/api/users/:id", (req, res) => {
  const id = Number(req.params.id);

  const index = users.findIndex((user) => user.id === id);
  console.log(index);

  if (index !== -1) {
    users.splice(index, 1);

    fs.writeFile("./MOCK_DATA.json", JSON.stringify(users), (err) => {
      if (err) {
        console.log(err);
        return res.json({ status: "error", message: "Failed to delete data" });
      }
      console.log(`Deleted user successfully with id ${id}`);
      return res.json({ status: "success", message: "deleted succcessfully" });
    });
  } else {
    console.log(`No user avilable with id ${id}`);
    return res
      .status(400)
      .json({ status: "error", message: `no user exists with id ${id}` });
  }
});

app.post("/api/users", (req, res) => {
  const body = req.body;

  const user = users.find((user) => user.email === body.email);

  if (user) {
    console.log(`${user.email} already exixts`);
    return res
      .status(208)
      .json({ status: "error", message: "Email already exists" });
  } else if (!body || Object.keys(body).length === 0) {
    console.log("no data provided for append");
    return res
      .status(400)
      .json({ status: "error", message: "No data provided for append" });
  } else {
    users.push({ id: users.length + 1, ...body });
    fs.writeFile("./MOCK_DATA.json", JSON.stringify(users), (err) => {
      if (err) {
        console.error(err);
        return res.json({
          status: "error",
          message: "Failed to save user data",
        });
      }
      return res.status(201).json({ status: "success", id: users.length });
    });
  }
});

app.listen(8080, () => {
  console.log("Server started");
});
