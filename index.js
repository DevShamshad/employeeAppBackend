const express = require("express");
const mongoose = require("mongoose");
require('dotenv').config();
const cors = require("cors");
const bcrypt = require("bcrypt");
const PORT=process.env.PORT || 8000;

const app = express();
app.use(express.json());
app.use(cors({
    origin: ['https://thriving-youtiao-553909.netlify.app/'], // allow requests from this origin
    credentials: true, // allow credentials (e.g. cookies) to be sent
    methods: ['GET', 'POST', 'PUT', 'DELETE'], // allow these methods
    headers: ['Content-Type', 'Authorization'] // allow these headers
}));


mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        console.log("Connected to MongoDB");
    })
    .catch((err) => {
        console.log(err);
    });
const employeeSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    designation: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    contact: {
        type: Number,
        required: true
    },
    password: {
        type: String,
        required: true
    }
});

const Employee = mongoose.model("Employee", employeeSchema);

app.post("/registration/add", (req, res) => {
    const { name, designation, email, contact, password, confirmPassword } = req.body;

    if (password !== confirmPassword) {
        return res.status(400).json({ message: "Passwords do not match" });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);

    const employee = new Employee({ name, designation, email, contact, password: hashedPassword });
    employee.save()
        .then((data) => {
            res.status(200).json({ message: "Employee registered successfully" });
        })
        .catch((err) => {
            if (err.code === 11000 && err.keyPattern.email === 1) {
                console.error("Error: Email already exists");
                res.status(400).json({ message: "Email already exists" });
            } else {
                console.error(err);
                res.status(500).json({ message: "Error registering employee" });
            }
        });
});

app.get("/employee", (req, res) => {
    Employee.find().then((data) => {
        res.json(data)
    }).catch((err) => {
        console.error(err)
        res.status(500).json({ message: "Error fetching employee data" })
    })
});

app.post("/search", (req, res) => {
    const { email } = req.body;
    Employee.findOne({ email: new RegExp(email, 'i') })
        .then((employee) => {
            if (employee) {
                res.json(employee);
            } else {
                res.status(200).json({ message: "Employee not found" });
            }
        })
        .catch((err) => {
            console.error(err);
            res.status(500).json({ message: "Error searching for employee" });
        });
});

app.post("/login", (req, res) => {
    const { email, password } = req.body;
  
    Employee.findOne({ email: email })
      .then((employee) => {
        if (!employee) {
          return res.status(401).json({ message: "Employee not found" });
        }
  
        const isValidPassword = bcrypt.compareSync(password, employee.password);
  
        if (!isValidPassword) {
          return res.status(401).json({ message: "Invalid password" });
        }
  
        // If email and password match, send the entire employee data as response
        res.json(employee);
      })
      .catch((err) => {
        console.error(err);
        res.status(500).json({ message: "Error logging in" });
      });
  });

app.listen(PORT, () => {
    console.log("server is running on port 8000")
});