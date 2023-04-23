import React, { useState, useRef, useEffect } from 'react';
import { auth, db } from '../Firebase';
import { query, collection, orderBy, onSnapshot, Timestamp, addDoc, serverTimestamp, where, or, and, updateDoc } from 'firebase/firestore';
import '../css/Chat.css';
import Message from '../components/Message';
import Cookies from 'universal-cookie';
import { LogoutUser, _ModalHandler } from '../App';
import AddContact from '../modals/AddConact';
import ManageContact from '../modals/ManageContact';

interface Message {
    id: string;
    text: string;
    timestamp: Timestamp;
    sender_uid: string;
    receiver_uid: string;
    isRead: boolean;
}

interface Contacts {
    uid: string;
    unread: number;
}

interface Users {
    uid: string;
    unique_id: number;
    displayName: string;
    email: string;
    photoURL: string;
    contacts: Contacts[];
}

const Chat = () => {
    const cookies = new Cookies();
    const [index, setI] = useState(0);
    const [checkedContact, setChkContact] = useState(true);
    const [conactsLoaded, setContactsLoaded] = useState(false);
    const [msgLoaded, setMsgLoaded] = useState(false);
    const [receiverUid, setReceiverUID] = useState("");
    const [receiverName, setReceiverName] = useState("");
    const [messages, setMessages] = useState<Message[]>([]);
    const [users, setUsers] = useState<Users[]>([]);
    const [myData, setMyData] = useState<Users>();
    const [receiverPic, setReceiverPic] = useState("");
    const [chat, setChat] = useState("");
    const id = cookies.get("uid");
    const srcroll = useRef();
    const chatAreaRef = useRef<HTMLDivElement>(null);
    const chatBox = useRef<HTMLInputElement>(null);

    const clickContact = (uid: any, name: string, photoURL: string) => {
        if (receiverUid !== uid) {
            setMessages([]);
            setReceiverUID(uid);
            setReceiverPic(photoURL)
            setReceiverName(name);
        }
    };  

    const clickLogout = () => {
        let text = "Are you sure you want to Logout?";
        if (confirm(text) == true) {
            LogoutUser();
        }
    }

    const submitChat = (e: React.FormEvent) => {
        e.preventDefault();

        const {uid, displayName} = auth.currentUser;
        addDoc(collection(db, 'messages'), {
            isRead: false,
            text: chat,
            sender_uid: id,
            receiver_uid: receiverUid,
            timestamp: serverTimestamp()
        })
        .then(() => {
            const q = query(collection(db, 'users'), where('uid', '==', receiverUid)); 
            const unsubscribe = onSnapshot(q, (querySnapshot) => {
                querySnapshot.forEach((doc) => {
                    let hasmatch = false;
                    let contacts = doc.data().contacts.map((contact: any) => {
                        if (contact.uid === id) {
                            hasmatch = true;
                            return {
                                ...contact,
                                unread: contact.unread + 1,
                            };
                        } else {
                            return contact;
                        }
                    });
                    if (!hasmatch)
                        contacts.push({ uid: id, unread: 1 });
                    updateDoc(doc.ref, { contacts });
                });
                unsubscribe();
            });
        });
        
        setChat("");
    };  
    

    //FETCH MESSAGE
    useEffect(() => {
        const q = query(collection(db, 'messages'),
            and(
                or(
                    where("sender_uid", "==", id),
                    where("receiver_uid", "==", id)
                ),
                or(
                    where("sender_uid", "==", receiverUid),
                    where("receiver_uid", "==", receiverUid)
                )
            ),
            orderBy('timestamp', 'desc')
        );
        
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            let tmpMsgs: Message[] = [];
            querySnapshot.forEach((doc) => {
                tmpMsgs.push({
                    id: doc.id,
                    text: doc.data().text,
                    timestamp: doc.data().timestamp,
                    sender_uid: doc.data().sender_uid, 
                    receiver_uid: doc.data().receiver_uid, 
                    isRead: doc.data().isRead
                });
            });
            setMsgLoaded(true);
            setMessages(tmpMsgs);


            let done = false;
            const q2 = query(collection(db, 'messages'), 
                and(
                    where("sender_uid", "==", receiverUid),
                    and(
                        where("receiver_uid", "==", id),
                        and(
                            where("isRead", "==", false)
                        )
                    )
                )
            ); 
            const unsubscribe2 = onSnapshot(q2, (querySnapshot) => {
                querySnapshot.forEach((doc) => {
                    if (!done) {
                        updateDoc(doc.ref, { isRead: true });
                        done = true;
                    }
                });
                unsubscribe2();
            });

            const q3 = query(collection(db, 'users'), where('uid', '==', id)); 
            const unsubscribe3 = onSnapshot(q3, (querySnapshot) => {
                querySnapshot.forEach((doc) => {
                    let contacts = doc.data().contacts.map((contact: any) => {
                        if (contact.uid === receiverUid) {
                            return {
                                ...contact,
                                unread: 0,
                            };
                        } else {
                            return contact;
                        }
                    });
                    updateDoc(doc.ref, { contacts });
                });
                unsubscribe3();
            });
        });
        return () => unsubscribe();
    }, [receiverUid]);

    //FETCH CONTACTS
    useEffect(() => {
        if (checkedContact) {
            const q = query(collection(db, 'users'), where('uid', "==", id)); 
            const unsubscribe = onSnapshot(q, (querySnapshot) => {
                let userData: Users[] = [];
                querySnapshot.forEach((doc) => {
                    const data = doc.data();
                    userData.push({
                        uid: data.uid,
                        unique_id: data.unique_id,
                        displayName: data.displayName,
                        email: data.email,
                        photoURL: data.photoURL,
                        contacts: data.contacts,
                    });
                });

                setMyData(userData[0]);
                const q2 = query(collection(db, 'users'), where("uid", "!=", id)); 
                onSnapshot(q2, (querySnapshot2) => {
                    let tmpMsgs: Users[] = [];
                    querySnapshot2.forEach((doc2) => {
                        const data2 = doc2.data();
                        if (userData[0].contacts.filter(x => x.uid === data2.uid).length > 0) {
                            tmpMsgs.push({
                                uid: data2.uid,
                                unique_id: data2.unique_id,
                                displayName: data2.displayName,
                                email: data2.email,
                                photoURL: data2.photoURL,
                                contacts: data2.contacts,
                            });
                        }
                    });
                    setUsers(tmpMsgs);
                    setChkContact(false);
                    setContactsLoaded(true);
                });
                // setUsers(data); 
            });
            return () => unsubscribe();
        }
    }, [checkedContact]);

    useEffect(() => {
        const docRef = query(collection(db, "users"), where("uid", "==", id));
        onSnapshot(docRef, (querySnapshot) => {
            querySnapshot.forEach((doc) => {
                setChkContact(true);
            });
        });
    }, []);

    return (
        <>
            <div className="row" style={{ height: "100%" }}>
                <div className="col-sm-2" style={{ padding: "6px 2px 2px 20px" }}>
                    <div className="disp-style-col" style={{ alignItems: "center" }}>
                        <img style={{ cursor: "pointer" }} className="avatar-lg" src={myData !== undefined ? (myData.photoURL !== '' ? myData.photoURL : "https://cdn3.iconfinder.com/data/icons/avatars-9/145/Avatar_Cat-512.png") : "https://cdn3.iconfinder.com/data/icons/avatars-9/145/Avatar_Cat-512.png"} />
                        <h5 style={{margin: "2px 0px"}}>{ myData?.displayName }</h5>
                        <p style={{margin: "2px 0px 8px 0px"}}>{ myData && myData.unique_id.toString().replace(/(\d{3})(\d{3})(\d{3})/, "$1-$2-$3") }</p>
                        <h4 style={{margin: "2px 0px 8px 0px"}}>Your Contacts</h4>
                        <button onClick={() => {
                            _ModalHandler.setModal(<AddContact />);
                            _ModalHandler.setOpen(true);
                            _ModalHandler.setModalTitle("Add contact");
                            _ModalHandler.setCallback(() => {});
                        }} className="btn btn-primary" style={{ width: "100%" }}>Add Contact with I.D.</button>
                    </div>
                    <hr />
                    {
                        users.length > 0 && users ?
                            <div className="list-group" style={{ overflow: "auto", height: "100%" }}>
                                {
                                    users && users.map((item, index) => (
                                        <div className={"contact-item list-group-item list-group-item-action" + (receiverUid === item.uid ? " active" : "")} onClick={ () => { clickContact(item.uid, item.displayName, item.photoURL) } } key={ index }>
                                            <div style={{ display: "flex", flexDirection: "row", alignItems: "center" }}>
                                                <img style={{ cursor: "pointer" }} onClick={() => {
                                                    _ModalHandler.setModal(<ManageContact />);
                                                    _ModalHandler.setModalData({
                                                        receiverUID: item.uid,
                                                    });
                                                    _ModalHandler.setOpen(true);
                                                    _ModalHandler.setModalTitle("Manage contact");
                                                }} className="avatar" src={(item.photoURL ? item.photoURL : "https://cdn3.iconfinder.com/data/icons/avatars-9/145/Avatar_Cat-512.png")} />&nbsp;
                                                <span>{item.displayName}</span>
                                                {
                                                    myData?.contacts.find(x => x.uid === item.uid)?.unread !== undefined &&
                                                        myData.contacts.find(x => x.uid === item.uid)?.unread > 0 &&
                                                        <div className="chat-count-indicator">
                                                            { myData.contacts.find(x => x.uid === item.uid)?.unread }
                                                        </div>
                                                }
                                            </div>
                                            <div style={{ fontSize: "9px", marginTop: "2px" }}>ID: { item.unique_id.toString().replace(/(\d{3})(\d{3})(\d{3})/, "$1-$2-$3") }</div>
                                        </div>
                                    ))
                                }
                            </div>
                            :
                            (
                                conactsLoaded && users.length === 0 ?
                                    <div><h5>Add contacts now 🤝</h5></div>
                                    :
                                    <div><h5>Loading Contacts ⌛</h5></div>
                            )
                    }
                </div>
                <div className="col" style={{ height: "100%", display: "grid", gridTemplateRows: "52px auto 44px" }}>
                    <div className="disp-style-row">
                        <h4 style={{ width: "100%", alignSelf: "center" }}>{ receiverName && ("Chatting with: " + receiverName) }</h4>
                        <button className="btn btn-danger" onClick={clickLogout} style={{ margin: "0 8px 0 auto", height: "40px", alignSelf: "center" }}>Logout</button>
                    </div>
                    <div className="col" style={{ overflow: "hidden", display: "grid", gridRow: "2" }}>
                        <div className="row-sm chat-area" style={{ height: "100%", padding: "10px 4px" }} ref={chatAreaRef}>
                            {
                                messages.length > 0 ?
                                    messages.map((message) => {
                                        return (
                                            <Message key={message.id} avatar={receiverPic} strId={id} message={message.text} sender_uid={message.sender_uid} isRead={message.isRead} timestamp={message.timestamp} />
                                        );
                                }) : 
                                (
                                    (receiverName !== "" && msgLoaded) ?
                                        <h4 className="absolute-center">Say Hi to {receiverName}!</h4>
                                        :
                                    (
                                        receiverName !== "" &&
                                        <h4 className="absolute-center">Loading Messages ⌛</h4>
                                    )
                                )
                            }
                        </div>
                    </div>
                    {
                        (messages && receiverUid) &&
                        <form onSubmit={
                            (e) => submitChat(e)
                            }
                            className="col" style={{ display: "flex", alignItems: "center" }}>
                            <label>CHAT: </label>
                            <input onChange={(e) => setChat(e.target.value)} value={chat} className="borderless-textbox" type="text" style={{ flex: "1", padding: "2px 8px" }} ref={chatBox} />
                            { chat.trim() !== "" && <button className="btn btn-primary" style={{ width: "200px", marginLeft: "10px" }}>Send</button> }
                        </form>
                    }
                </div>
            </div>
        </>
    );
};

export default Chat;
