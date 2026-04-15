import { loginHandler, registerHandler, getAllUsers, deleteUser } from '../controller/authController.js';
import { identify } from '../middleware/identify.js';
import express from 'express';
const router = express.Router();

router.post('/login',loginHandler );
router.post('/register',registerHandler );

// Admin routes
router.get('/users', identify, getAllUsers);
router.delete('/users/:id', identify, deleteUser);

// you may use `identify` middleware to protect any route you want ... thats a util . 
router.get('/me',identify,(req,res)=>{
    res.status(200).json({
        status: 'success',
        message: 'user authenticated',
        Uid: req.user.userID
    })
})
router.get('/online',(req,res)=>{
    res.status(200).json({
        status: 'success',
        message: 'user authenticated',
       
    })
})
export default router;