import express from "express";
import body from "body-parser";
import multer from "multer";
import ejs, { name } from "ejs";
import moz from "imagemin-mozjpeg";
import { fileURLToPath } from "url";
import { dirname } from "path";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
import imagemin from "imagemin";
import imageminJpegtran from "imagemin-jpegtran";
import imageminPngquant from "imagemin-pngquant";
import path from "path";
const app = express();
import dotenv from "dotenv";
const PORT = process.env.PORT || 8000;
import mongoose from "mongoose";
import bcrypt from "bcrypt";
dotenv.config();

app.use(body.json());
app.use(body.urlencoded({ extended: true }));
// ejs initialize
app.set("view engine", "ejs");
// yaha peh thoda doubt hai /uploads kyun use kiya
app.use("/upload", express.static(path.join(__dirname, "upload")));
app.use(express.static(__dirname + "/public"));

const uri =  "mongodb+srv://goley:nike@cluster0.mnkbakr.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

mongoose
  .connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Database is connected");
  })
  .catch((err) => {
    console.log("Database is not connected", err);
  });

// shcema for db

const schema = mongoose.Schema({
  name: {
    type: String,
  },
  email: {
    type: String,
  },
  password: {
    type: String,
  },
});

const modelDB = mongoose.model("User-Data", schema);

// for register user

const saltRounds = 10;

app.post('/signup', async (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    try {
        
        const existingUser = await modelDB.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }

    
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        const newUser = new modelDB({
            name,
            email,
            password: hashedPassword
        });

        await newUser.save();
             console.log(newUser);
        res.status(201).render('index');
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});


// for login  


app.post('/login' , async(req , res)=>{
const{email , password} = req.body;
    try {
        const user = await modelDB.findOne({email});
        if(!user){
        return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isMatch =  await bcrypt.compare(password , user.password);
      if(!isMatch){
        return res.status(401).json({ error: 'Invalid password' });
      }
        res.status(200).render('index')
     
    } catch (error) {
     console.log(error);    
    }
})










const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "upload");
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });
app.get("/", (req, res) => {
  res.render("index");
});

app.post("/", upload.single("image"), (req, res, next) => {
  const file = req.file;
  var ext;
  if (file == null) {
    res.render("nofile");
  }
  if (file.mimetype == "image/jpeg") {
    ext = "jpg";
  } else if (file.mimetype == "image/png") {
    ext = "png";
  } else if (file.mimetype != "image/jpeg") {
    res.render("not_correct_file");
  }

  var a = file.path;
  var fina = file.path;
  var url = fina.replace(/\\/g, "/");
  res.render("image", { url: url, name: file.filename, ext: ext });
});

app.post("/compress/:name/:ext", async (req, res) => {
  console.log(req.params.name);
  const files = await imagemin(["upload/" + req.params.name], {
    destination: "output",
    plugins: [
      moz({
        quality: 30,
      }),
      imageminPngquant({
        quality: [0.1, 0.1],
      }),
    ],
  });
  res.download(files[0].destinationPath);
});

app.get("/blog", (req, res) => {
  res.render("aboutus");
});

app.get("/SignUp", (req, res) => {
  res.render("SignUp");
});
app.get("/login", (req, res) => {
  res.render("login");
});

app.listen(PORT, () => {
  console.log(`The server running on the ${PORT}`);
});
