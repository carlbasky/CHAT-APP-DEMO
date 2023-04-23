import { Timestamp } from 'firebase/firestore';
import { format } from 'date-fns';

interface Props {
    message: string;
    timestamp: Timestamp;
    sender_uid: string;
    strId: string;
    isRead: boolean;
    avatar: string;
}

const style = {
    width: "100%"
}

const Message = ({message, timestamp, sender_uid, strId, isRead, avatar} : Props) => {
    const formattedTimestamp = timestamp ? format(timestamp.toDate(), 'MMM d, yyyy h:mm a') : '';
    
    return (
        <>
            <div className="chat-bubble-container">
                { (strId !== sender_uid) && <img className="avatar-sm" src={avatar ? avatar : "https://cdn3.iconfinder.com/data/icons/avatars-9/145/Avatar_Cat-512.png"} style={{ marginRight: "10px" }}></img> }
                <div className={"chat-bubble-" + (strId === sender_uid ? "sender" : "receiver")}>
                    <p className={"chat-bubble-time-" + (strId === sender_uid ? "sender" : "receiver")}>{ formattedTimestamp }</p>
                    <p>{ message }</p>
                    <p className={"chat-bubble-time-" + (strId === sender_uid ? "sender" : "receiver")}>{ strId === sender_uid && (!formattedTimestamp ? "Sending 📨" : (isRead ? "Read ✔️" : "Sent ✉️")) }</p>
                </div>
            </div>
        </>
    );
};

export default Message;
