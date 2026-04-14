import express from "express";

import { identify } from "../middleware/identify.js";

import {
    join_groupChat,
    get_groupChats_where_I_am_admin,
    get_my_groupChats,
    get_groupChat_chat,
    accept_join_request,
    get_join_requests_for_my_group,
    create_groupChat,
    delete_groupChat,
    send_message,
    leave_groupChat,
    get_all_groups,
    get_groups_by_id_then_semantically
} from "../controller/groupChatController.js";

const router = express.Router();

router.use(identify);

router.post("/create-group",create_groupChat);

// router.post("delete-post")

router.post("/delete-group",delete_groupChat);

router.post("/join", join_groupChat);

router.post("/leave", leave_groupChat);

router.get("/all", get_all_groups);

router.get("/admin", get_groupChats_where_I_am_admin);

router.get("/my", get_my_groupChats);

router.post("/chat", get_groupChat_chat);

router.post("/accept-request", accept_join_request);

router.post("/requests", get_join_requests_for_my_group);

router.post("/search", get_groups_by_id_then_semantically);

router.post("/message", send_message);

export default router;
