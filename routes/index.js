const express = require('express');
const { default: mongoose } = require('mongoose');
const router  = express.Router();
var url = require('url');
const {ensureAuthenticated} = require("../config/auth.js")

//login page
router.get('/',ensureAuthenticated, (req,res)=>{
    res.redirect('/dashboard')
})
//register page
router.get('/register', (req,res)=>{
    res.render('register');
})
//dashboard
router.get('/dashboard',ensureAuthenticated,(req,res)=>{

        if(req.user.admin){
            if(req.user.adminConnectedDevices.ChannelID===''){
                res.redirect('/users/settings')}
            else{res.render('adminDashboard',{
                user: req.user,
                });
            }
        }
        else{
            if(req.user.DeviceID.ChannelID===''){
                res.redirect('/users/settings')}    
            else{res.render('dashboard',{
                user: req.user,
                });
            }   
        }
});

router.get('/offline', (req,res)=>{
    res.render('offline');
})


module.exports = router; 