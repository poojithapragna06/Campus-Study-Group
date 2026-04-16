import mongoose from "mongoose";
// functionality of group chat is mostly same as private chat but just the room size is different and chat_id will be group_id instead of person_ids....
const groupChatSchema = new mongoose.Schema({
    group_id : {type:String,required:true,unique:true},
    group_admins : [{type:String,required:true}],
    group_members : [{type:String,required:true}],
    group_name : {type:String,required:true},
    group_contents: [{type:String}],
    group_description : {type:String,required:false},
    group_subject : {type:String,required:false},
    requires_permission: {type:Boolean, default:false},
    createdBy: {type:String, required:false},
    messages: [
            {
                sender_id : {type:String,required:false},
                message_id : {type:String,required:false},
                content : {type:String},
                fetchables : [{type:String}],
                timestamp : {type:Date,default:Date.now}
            }
    ]
});

export const GroupChat = mongoose.model('GroupChat',groupChatSchema);