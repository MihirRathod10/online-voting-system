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


app.get("/", (req,res)=>{
    res.sendFile(__dirname + "/public/login.html");
});


// DATABASE

mongoose.connect(process.env.MONGODB_URI)
.then(()=>{
    console.log("MongoDB Atlas Connected");
})
.catch(err=>{
    console.log("MongoDB Error:",err);
});



// REGISTER

app.post("/register", async(req,res)=>{

    try{

        let {username,password,aadhaar}=req.body;


        username=username.trim();
        aadhaar=aadhaar.trim();


        const existing = await User.findOne({
            aadhaar:aadhaar
        });


        if(existing){

            return res.send("User already registered");

        }


        const hashedPassword = await bcrypt.hash(
            password,
            10
        );


        const user = new User({

            username,
            password:hashedPassword,
            aadhaar

        });


        await user.save();


        res.send("Registered successfully");


    }
    catch(err){

        console.log(err);

        res.status(500)
        .send("Registration failed");

    }

});




// LOGIN

app.post("/login", async(req,res)=>{


    try{


        let {username,password}=req.body;


        username=username.trim();



        const user = await User.findOne({
            username
        });



        console.log("Login Username:",username);



        if(!user){

            return res.json({
                message:"User not found"
            });

        }



        const checkPassword =
        await bcrypt.compare(
            password,
            user.password
        );



        if(!checkPassword){

            return res.json({
                message:"Wrong password"
            });

        }



        res.json({
            message:"Login successful"
        });



    }
    catch(err){

        console.log(err);

        res.status(500).json({
            message:"Server error"
        });

    }


});




// ADD CANDIDATE

app.post("/add-candidate",async(req,res)=>{

    try{

        const {name,party,symbol}=req.body;


        const candidate=new Candidate({

            name,
            party,
            symbol

        });


        await candidate.save();


        res.send("Candidate Added");


    }
    catch(err){

        res.status(500)
        .send("Error adding candidate");

    }

});




// GET CANDIDATES

app.get("/candidates",async(req,res)=>{

    const data=await Candidate.find();

    res.json(data);

});




// VOTE

app.post("/vote",async(req,res)=>{

    const {username,candidateId}=req.body;


    const user=await User.findOne({
        username
    });



    if(!user)
        return res.send("User not found");


    if(user.hasVoted)
        return res.send("Already voted");



    const candidate=
    await Candidate.findById(candidateId);



    if(!candidate)
        return res.send("Candidate not found");



    candidate.votes += 1;

    await candidate.save();



    user.hasVoted=true;

    await user.save();



    res.send("Vote successful");


});




// DASHBOARD

let resultApproved=false;


app.post("/approve-result",(req,res)=>{

    resultApproved=true;

    res.send("Result Approved");

});


app.post("/close-result",(req,res)=>{

    resultApproved=false;

    res.send("Result Closed");

});


app.get("/result-status",(req,res)=>{

    res.json({
        approved:resultApproved
    });

});



app.get("/admin-stats",async(req,res)=>{

    const totalUsers =
    await User.countDocuments();


    const totalCandidates =
    await Candidate.countDocuments();


    const candidates =
    await Candidate.find();


    let totalVotes=0;


    candidates.forEach(c=>{
        totalVotes += c.votes;
    });


    res.json({

        totalUsers,
        totalCandidates,
        totalVotes,
        resultApproved

    });


});




// SERVER

const PORT=process.env.PORT || 5000;


app.listen(PORT,()=>{

    console.log(
        `🚀 Server running on port ${PORT}`
    );

});