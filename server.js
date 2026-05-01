const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");

const User = require("./models/User");
const Candidate = require("./models/Candidate");

const app = express();

app.use(express.json());
app.use(cors());
app.use(express.static("public"));

// DB Connect
mongoose.connect("mongodb://127.0.0.1:27017/votingDB")
.then(() => console.log("MongoDB Connected"))
.catch(err => console.log(err));

/* ================= OTP SYSTEM ================= */

let otpStore = {};

app.post("/send-otp", (req, res) => {
    const { mobile } = req.body;

    const otp = Math.floor(1000 + Math.random() * 9000);
    otpStore[mobile] = otp;

    console.log("OTP for", mobile, ":", otp);

    res.send("OTP Sent");
});

app.post("/verify-otp", (req, res) => {
    const { mobile, otp } = req.body;

    if (otpStore[mobile] == otp) {
        res.send("Verified");
    } else {
        res.send("Invalid OTP");
    }
});

/* ================= REGISTER ================= */

app.post("/register", async (req, res) => {
    const { username, password, aadhaar } = req.body;

    const existing = await User.findOne({ aadhaar });
    if (existing) return res.send("User already registered");

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
        username,
        password: hashedPassword,
        aadhaar
    });

    await user.save();

    res.send("Registered successfully");
});

/* ================= LOGIN ================= */

app.post("/login", async (req, res) => {
    const { username, password } = req.body;

    const user = await User.findOne({ username });

    if (!user) return res.json({ message: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) return res.json({ message: "Wrong password" });

    res.json({ message: "Login successful" });
});

/* ================= ADD CANDIDATE ================= */

app.post("/add-candidate", async (req, res) => {
    const { name, party, symbol } = req.body;

    try {
        const candidate = new Candidate({ name, party, symbol });
        await candidate.save();
        res.send("Candidate Added");
    } catch (err) {
        res.status(500).send("Error adding candidate");
    }
});

/* ================= GET CANDIDATES (IMPORTANT) ================= */

app.get("/candidates", async (req, res) => {
    try {
        const data = await Candidate.find();
        res.json(data);
    } catch (err) {
        res.status(500).send("Error fetching candidates");
    }
});

/* ================= VOTE ================= */

app.post("/vote", async (req, res) => {
    const { username, candidateId } = req.body;

    const user = await User.findOne({ username });

    if (!user) return res.send("User not found");
    if (user.hasVoted) return res.send("Already voted");

    const candidate = await Candidate.findById(candidateId);

    if (!candidate) return res.send("Candidate not found");

    candidate.votes += 1;
    await candidate.save();

    user.hasVoted = true;
    await user.save();

    res.send("Vote successful");
});

/* ================= RESULT CONTROL ================= */

let resultApproved = false;

// APPROVE RESULT
app.post("/approve-result", (req, res) => {
    resultApproved = true;
    res.send("Result Approved");
});

// CLOSE RESULT
app.post("/close-result", (req, res) => {
    resultApproved = false;
    res.send("Result Closed");
});

// CHECK STATUS
app.get("/result-status", (req, res) => {
    res.json({ approved: resultApproved });
});

/* ================= SERVER ================= */

app.listen(5000, () => {
    console.log("🚀 Server running on port 5000");
});

/* ================= DASHBOARD ================= */

app.get("/admin-stats", async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalCandidates = await Candidate.countDocuments();

        const candidates = await Candidate.find();
        let totalVotes = 0;

        candidates.forEach(c => {
            totalVotes += c.votes;
        });

        res.json({
            totalUsers,
            totalCandidates,
            totalVotes,
            resultApproved
        });

    } catch (err) {
        res.status(500).send("Error fetching stats");
    }
});