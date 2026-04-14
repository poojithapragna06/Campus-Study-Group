import { GroupChat } from "../models/groupChat.js";
import GroupChatRequest from "../models/groupChatRequest.js";
import { sql } from "../dbUtils/sql_utl/sql_connector.js";
export async function join_groupChat(req,res){
    try {
        const user_id = req.user.userID
        const groupChatId = req.body.groupChatId
        if (!groupChatId) {
            return res.status(400).json({
                error: "groupChatId is required",
                status: "errored",
                result: null,
            });
        }
        const groupChat = await GroupChat.findById(groupChatId);
        if(!groupChat){
            return res.status(404).json({
                error: "group chat not found ",
                status : "errored",
                result : null,
            });
        }


        const r = await sql`
        select * from 
        users 
        where userId = ${user_id} `;
        //  should not happen at all since all the jwts are signed only using valid userids ... but in case of theft of secret it is useful and robust
        if(!r || r.length==0){
            return res.status(404).json({
                error: "user not found",
                status : "errored",
                result : null,
            });
        }
        const user = r[0];
        if (!user || !user.email || !user.username) {
            return res.status(500).json({
                error: "user data incomplete",
                status: "errored",
                result: null,
            });
        }
        // if the group chat requires admin validation or not .....
        // table looks like 
        // groupChatId , requester
        if(groupChat.requires_permission===true){
            const requests = await GroupChatRequest.find({
                groupChatId: groupChatId,
                requester_id: user_id
            });
            if(requests && requests.length>0){
                return res.status(409).json({
                    error : "request already exists",
                    status : "errored",
                    result : null
                });
            }
            const newReq = new GroupChatRequest({
                groupChatId: groupChatId,
                requester_id: user_id,
                email: user.email,
                username: user.username
            });
            const insertResult = await newReq.save();
            return res.status(200).json({
                error:null,
                status : "success",
                result : insertResult 
            });
        }else{
            if(!groupChat.group_members || groupChat.group_members.includes(user_id)){
                return res.status(409).json({
                    error : "user already in group",
                    status : "errored",
                    result : null
                });
            }
            groupChat.group_members.push(user_id);
            await groupChat.save();
            return res.status(200).json({
                error:null,
                status : "success",
                result : "joined group successfully"
            });
        }
        
    } catch (e) {
        console.error(e);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}
export async function get_groupChats_where_I_am_admin(req,res){
    try {
        // userId is a string not a mongoose Id object 
    const userId = req.user.userID;
    if (!userId) {
        return res.status(400).json({
            error: "userId is required",
            status: "errored",
            result: null,
        });
    }
    const groups = await GroupChat.find({
        group_admins: userId
    });
    if (!groups) {
        return res.status(500).json({
            error: "failed to fetch groups",
            status: "errored",
            result: null,
        });
    }
    return res.status(200).json(
            {
                status: "ok",
                result : groups,
                error :null,
            }
        )
    } catch (e) {
        console.error(e);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}

export async function get_my_groupChats(req,res){
    try{
        const userId  = req.user.userID;
        if (!userId) {
            return res.status(400).json({
                error: "userId is required",
                status: "errored",
                result: null,
            });
        }
        const groups = await GroupChat.find({
            group_members : userId
        });
        if (!groups) {
            return res.status(500).json({
                error: "failed to fetch groups",
                status: "errored",
                result: null,
            });
        }
        return res.status(200).json(
            {
                status: "ok",
                result : groups,
                error :null,
            }
        )
    }catch(e){
        console.error(e);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}

export async function get_all_groups(req, res) {
    try {
        const groups = await GroupChat.find({});
        return res.status(200).json({
            status: "ok",
            result: groups,
            error: null,
        });
    } catch (e) {
        console.error(e);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}

export async function get_groupChat_chat(req,res) {
    try {
        const userId = req.user.userID;
        const groupId = req.body.group_id;
        if (!userId || !groupId) {
            return res.status(400).json({
                error: "userId and group_id are required",
                status: "errored",
                result: null,
            });
        }
        const group = await GroupChat.findById(groupId);
        if (!group) {
            return res.status(404).json({
                error: "group not found",
                status: "errored",
                result: null,
            });
        }
        if(!group.group_members || !group.group_members.includes(userId)){
            return res.status(403).json({
                status : "errored:data steal detected",
                error : "forbidden access",
                result : null
            })
        }
        const chat = group.messages
        return res.status(200).json({
            result : chat,
            status : "ok",
            error : null
        })
    } catch (e) {
        console.error(e);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}

export async function accept_join_request(req,res){
    try {
        const groupId = req.body.groupId;
        const requesterId = req.body.requesterId;
        const adminId = req.user.userID;
        if (!groupId || !requesterId || !adminId) {
            return res.status(400).json({
                error: "groupId, requesterId, and adminId are required",
                status: "errored",
                result: null,
            });
        }

        // check if request exists in Mongo
        const requests = await GroupChatRequest.find({
            groupChatId: groupId,
            requester_id: requesterId
        });
        if(!requests || requests.length==0){
            return res.status(401).json({
                status : "already accepted by you or some other admin ",
                error : null,
                result : 1
            })
        }
        const group = await GroupChat.findById(groupId);
        if (!group) {
            return res.status(404).json({
                error: "group not found",
                status: "errored",
                result: null,
            });
        }
        if(!group.group_admins || !group.group_admins.includes(adminId)){
            return res.status(403).json({
                status : "errored:data steal detected",
                error : "forbidden access",
                result : null
            })
        }
        if (!group.group_members) {
            group.group_members = [];
        }
        group.group_members.push(requesterId);
        await group.save();

        const deleteRes = await GroupChatRequest.deleteMany({
            groupChatId: groupId,
            requester_id: requesterId
        });
        return res.status(201).json({
            status:"ok",
            result : deleteRes,
            error:null
        });
    } catch (e) {
        console.error(e);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}

export async function get_join_requests_for_my_group(req,res){
    try{
        const groupId = req.body.groupId;
        const userId = req.user.userID;
        if (!groupId || !userId) {
            return res.status(400).json({
                error: "groupId and userId are required",
                status: "errored",
                result: null,
            });
        }
        const group = await GroupChat.findById(groupId);
        if (!group) {
            return res.status(404).json({
                error: "group not found",
                status: "errored",
                result: null,
            });
        }
        if(!group.group_admins || !group.group_admins.includes(userId)){
            return res.status(403).json({
                status : "errored:data steal detected",
                error : "forbidden access",
                result : null
            })
        }
        const requests = await GroupChatRequest.find({
            groupChatId: groupId
        });
        if (!requests) {
            return res.status(500).json({
                error: "failed to fetch requests",
                status: "errored",
                result: null,
            });
        }
        return res.status(200).json({
            result : requests,
            status : "ok",
            error : null
        });
    }catch(e){
        console.error(e);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}

export async function get_groups_by_id_then_semantically(req, res) { 
    try {
        const query = req.body.query;
        if (!query) {
            return res.status(400).json({
                error: "query is required",
                status: "errored",
                result: null,
            });
        }
        // first try to find by id if not then we will find by name using similarity search using regex in mongodb ...
        // const group = await GroupChat.findById(query);
        // if (group) {
        //     return res.status(200).json({
        //         result: group,
        //         status: "ok",
        //         error: null
        //     });
        // }
        const groups = await GroupChat.find({
            group_name: { $regex: query, $options: "i" } // case-insensitive
        });
        if (!groups) {
            return res.status(500).json({
                error: "failed to fetch groups",
                status: "errored",
                result: null,
            });
        }
        return res.status(200).json({
            result: groups,
            status: "ok",
            error: null
        });

    } catch (e) {
        console.error(e);
        return res.status(500).json({ error: 'Internal Server Error' });
    }  
}

export async function create_groupChat(req,res){
    try{
        const userId = req.user.userID;
        const name= req.body.group_name;
        const subject = req.body.subject;
        const description = req.body.description;
        const requires_permission = req.body.requires_permission;

        if(!userId){
            return res.status(403).json({
                error : "no user found",
                status : "errored",
                result : null
            });
        } 
        const newGroup = new GroupChat();
        newGroup.group_admins = [];
        newGroup.group_members = [];
        newGroup.group_admins.push(userId);
        newGroup.group_members.push(userId);
        newGroup.messages = [];
        newGroup.group_name = name;
        newGroup.requires_permission = requires_permission === true; // ensure boolean

        if (subject != null) {
            newGroup.group_subject = subject;
        }

        if (description != null) {
            newGroup.group_description = description; // also fixing gr -> group_description
        }
        await newGroup.save();
        return res.status(201).json({
            error: null,
            name,
            status: "success",
            result: newGroup
        });
    }catch(e){
        console.error(e);
        return res.status(500).json({
            message:"internal server error"
        });
    }
}

export async function  delete_groupChat(req,res) {
    try {
        const userId = String(req.user.userID);
        const groupChatId = req.body.groupChatId;
        const group = await GroupChat.findById(groupChatId);
        if(!group){
            return res.status(404).json({
                error :  " group not found"
            });
        }
        if(!group.group_admins.map(String)?.includes(userId)){
            return res.status(403).json({
                error : "only admins can delete a group"
            })
        }
        const deleteResult = await GroupChat.findByIdAndDelete(groupChatId);
        return res.status(200).json({
            status :  "successful",
            result : deleteResult,
            error : null
        })
    } catch (e) {
        console.error(e);
        return res.status(500).json({
            message:"internal server error"
        });
    }
}
// -> group chat handling 

export async function leave_groupChat(req, res) {
    try {
        const userId = req.user.userID;
        const groupChatId = req.body.groupChatId;
        if (!groupChatId) {
            return res.status(400).json({ error: "groupChatId is required" });
        }
        
        const group = await GroupChat.findById(groupChatId);
        if (!group) {
            return res.status(404).json({ error: "group not found" });
        }

        // Remove user from members
        group.group_members = group.group_members.filter(id => id !== String(userId));
        
        // Remove user from admins if they are an admin
        group.group_admins = group.group_admins.filter(id => id !== String(userId));

        // If no members left, maybe delete group? Or just save it. 
        await group.save();

        return res.status(200).json({
            status: "ok",
            result: "Left group successfully",
            error: null
        });

    } catch (e) {
        console.error(e);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}

// -> event/study session handling .
// -> 

// ── POST /api/groups/message — REST endpoint to send a group message ──────────
export async function send_message(req, res) {
    try {
        const userId = req.user.userID;
        const { group_id, content } = req.body;

        if (!group_id || !content) {
            return res.status(400).json({
                error: "group_id and content are required",
                status: "errored",
                result: null,
            });
        }

        const group = await GroupChat.findById(group_id);
        if (!group) {
            return res.status(404).json({
                error: "group not found",
                status: "errored",
                result: null,
            });
        }

        if (!group.group_members || !group.group_members.includes(String(userId))) {
            return res.status(403).json({
                error: "You are not a member of this group",
                status: "errored",
                result: null,
            });
        }

        // Generate UUID for message
        const message_id = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });

        const message = {
            message_id,
            sender_id: String(userId),
            content,
            fetchables: req.body.fetchables || [],
            timestamp: new Date(),
        };

        group.messages.push(message);
        await group.save();

        return res.status(201).json({
            status: "ok",
            result: message,
            error: null,
        });
    } catch (e) {
        console.error(e);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}