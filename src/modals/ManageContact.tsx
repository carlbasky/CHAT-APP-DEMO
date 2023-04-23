import { FormEvent, useEffect, useState } from "react";
import { db } from '../Firebase';
import { collection, onSnapshot, query, where, updateDoc, doc } from "firebase/firestore";
import Cookies from 'universal-cookie';
import { _ModalHandler } from "../App";


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

const ManageContact = () => {
    const cookies = new Cookies();
    const id = cookies.get("uid");
    const [user, setUser] = useState({} as Users);

    const removeContact = () => {
        let text = "Are you sure you want to remove " + user.displayName + "?";
        if (confirm(text) == true) {
            deleteItem();
            _ModalHandler.setOpen(false);
        }
    }

    const deleteItem = () => {
        const q = query(collection(db, 'users'), where('uid', '==', id)); 
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            querySnapshot.forEach((doc) => {
                let contacts = doc.data().contacts.filter((contact: any) => {
                    return contact.uid !== user.uid;
                });
                updateDoc(doc.ref, { contacts });
            });
            unsubscribe();
        });
    }

    const initData = () => {
        const q = query(collection(db, 'users'), where('uid', "==", _ModalHandler.getModalData.receiverUID)); 
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
            unsubscribe();
            setUser(userData[0]);
        });
    }
    
    initData();

    return (
        <>
        <div className='delete-button' onClick={() => { if (window.confirm('Are you sure you wish to delete this item?')) {} } } />
            <div style={{width: "280px"}}>
                <div className="disp-style-col">
                    {
                    }
                    {
                        (user) ?
                            <div style={{ textAlign: "center" }} >
                                <img className="avatar-lg" src={ user && (user.photoURL ? user.photoURL : "https://cdn3.iconfinder.com/data/icons/avatars-9/145/Avatar_Cat-512.png") } />
                                <h5 style={{ textAlign: "center", width: "100%" }}>{user.displayName}</h5>
                                <p style={{ textAlign: "center", width: "100%" }}>ID: {user.unique_id}</p>
                            </div>
                        :
                        (
                            <div></div>
                        )
                    }
                </div>
                <br/>
                <button style={{width: "100%"}} onClick={removeContact} className="btn btn-danger">Remove User</button>
            </div>
        </>
    );
}

export default ManageContact;