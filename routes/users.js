const User = require("../models/user.js");
const mongoose = require('mongoose');
const express = require('express');
const router = express.Router();
const bcrypt=require('bcrypt');
const passport = require('passport');
var url=require('url');
const { ensureAuthenticated } = require("../config/auth.js");
const { ensureUnAuthenticated } = require("../config/unauth.js");

//login handle
router.get('/login',ensureUnAuthenticated,(req,res)=>{
    const q= url.parse(req.url, true);
    errors=[]
    if(q.query.res){
        errors.push({msg:q.query.res})
    }
    res.render('login',{errors:errors});
})

router.get('/register',ensureUnAuthenticated,(req,res)=>{
    res.render('register')
    })

//settings page
router.get('/settings',ensureAuthenticated,(req,res)=>{
    if(req.user.admin){
        var dict={
            successmessage:"",
            name: req.user.name,
            ChannelID:req.user.adminConnectedDevices.ChannelID,
            readAPIKey:req.user.adminConnectedDevices.readAPIKey,
        }
        res.render('adminSettings',dict)    
    }
    else{
        res.render('settings',{
            successmessage:"",
            name: req.user.name,
            ChannelID:req.user.DeviceID.ChannelID,
            writeAPIKey:req.user.DeviceID.writeAPIKey,
            readAPIKey:req.user.DeviceID.readAPIKey,
        })
    }
})


router.post('/adminSettings',ensureAuthenticated,(req,res)=>{
    const {ChannelID, readAPIKey} = req.body;
    filter={email:req.user.email}
    data={adminConnectedDevices:{ChannelID:ChannelID,readAPIKey:readAPIKey}}
    console.log("req.body");
    User.findOneAndUpdate(filter,data,{new:true}).exec((err,user)=>{
        console.log(user);

        if (err){
            console.log("failed");
            res.render('adminSettings',{
                successmessage:"failed",
                name: req.user.name,
                ChannelID:user.adminConnectedDevices.ChannelID,
                readAPIKey:user.adminConnectedDevices.readAPIKey,
            })
        }
        else{
            console.log("updated");
            req.user.adminConnectedDevices.ChannelID=ChannelID;
            req.user.adminConnectedDevices.readAPIKey=readAPIKey;
            res.render('adminSettings',{
                successmessage:"updated",
                name: user.name,
                ChannelID:user.adminConnectedDevices.ChannelID,
                readAPIKey:user.adminConnectedDevices.readAPIKey,
            })
        }
    })
})

router.post('/settings',ensureAuthenticated,(req,res)=>{
    const {ChannelID,writeAPIKey, readAPIKey} = req.body;
    filter={email:req.user.email}
    data={DeviceID:{ChannelID:ChannelID,writeAPIKey:writeAPIKey,readAPIKey:readAPIKey}}
    console.log("req.body");
    User.findOneAndUpdate(filter,data,{new:true}).exec((err,user)=>{
        console.log(user);

        if (err){
            console.log("failed");
            res.render('settings',{
                successmessage:"failed",
                name: req.user.name,
                ChannelID:req.user.DeviceID.ChannelID,
                writeAPIKey:req.user.DeviceID.writeAPIKey,
                readAPIKey:req.user.DeviceID.readAPIKey,
            })
        }
        else{
            console.log("updated");
            req.user.DeviceID.ChannelID=ChannelID;
            req.user.DeviceID.writeAPIKey=writeAPIKey ;
            req.user.DeviceID.readAPIKey=readAPIKey;
            res.render('settings',{
                successmessage:"updated",
                name: user.name,
                ChannelID:user.DeviceID.ChannelID,
                writeAPIKey:user.DeviceID.writeAPIKey,
                readAPIKey:user.DeviceID.readAPIKey,
            })
        }
    })
})
//Register handle
router.post('/register',ensureUnAuthenticated,(req,res)=>{
    const {admin,name, email, password, password2} = req.body;
let errors = [];
var isAdmin=false;
if(admin==1){
    isAdmin=true;
}
console.log(' Name ' + name+ ' email :' + email+ ' pass:' + password);
if(!name ||  !email || !password || !password2) {
    errors.push({msg : "Please fill in all fields"})
}
//check if match
if(password !== password2) {
    errors.push({msg : "passwords dont match"});
}

//check if password is more than 6 characters
if(password.length < 6 ) {
    errors.push({msg : 'password atleast 6 characters'})
}
if(errors.length > 0 ) {
res.render('register', {
    errors : errors,
    name : name,
    email : email,
    password : password,
    password2 : password2})
} else {
    //validation passed
   User.findOne({email : email}).exec((err,user)=>{
    console.log(user);   
    if(user) {
        errors.push({msg: 'email already registered'});
        res.render('register',{errors,name,email,password,password2});
        
       } 
    else {
        User.count({},(err,res)=>{
            var userID=res+1;
        
            const newUser = new User({
                userID : userID,
                admin : isAdmin,
                name : name,
                email : email,
                password : password,
                DeviceID:{ChannelID:"",writeAPIKey:"",readAPIKey:""},
                adminConnectedDevices:{ChannelID:"",readAPIKey:""}
            });
    

            bcrypt.genSalt(10,(err,salt)=> 
                bcrypt.hash(newUser.password,salt,
                    (err,hash)=> {
                        if(err) throw err;
                            //save pass to hash
                        newUser.password = hash;
                        //save user
                        newUser.save()
                        .then((value)=>{
                            console.log(value)
                        })
                        .catch(value=> console.log(value));
                    }
                )
            );
        })
        res.redirect('/users/login');
    }

})}})
router.post('/login',ensureUnAuthenticated,(req,res,next)=>{
    
    passport.authenticate('local',{
        successRedirect : '/dashboard',
        failureRedirect : '/users/login?res=error',
        failureFlash : true,
        })(req,res,next);

  })

//logout
router.get('/logout',(req,res)=>{
    req.logout();
    req.flash('success_msg','Now logged out');
    res.redirect('/users/login');

 })

router.post('/name',ensureAuthenticated, (req,res)=>{
    const {userID}=req.body;
    User.findOne({userID:userID}).exec((err,result)=>{
        if(result){
            console.log(result)
            res.send(result.name)
            res.end()
        }
    })
})

module.exports  = router;