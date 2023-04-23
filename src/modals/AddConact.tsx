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

const AddContact = () => {
    const cookies = new Cookies();
    const id = cookies.get("uid");
    const [idNumber, setIDNumber] = useState('');
    const [user, setUser] = useState({} as Users);
    const [myData, setMyData] = useState({} as Users);

    const initMyData = () => {
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
            unsubscribe();
        });
    }
    
    initMyData();

    useEffect(() => {
        if (idNumber.length == 11) {
            const q = query(collection(db, 'users'), 
                where('unique_id', "==", idNumber.replace(/-/g, '')),
                where('uid', "!=", id)
            ); 
            setUser({} as Users);
            const unsubscribe = onSnapshot(q, (querySnapshot) => {
                querySnapshot.forEach((doc) => {
                    const data = doc.data();
                    setUser({
                        uid: data.uid,
                        unique_id: data.unique_id,
                        displayName: data.displayName,
                        email: data.email,
                        photoURL: data.photoURL,
                        contacts: data.contacts,
                    });
                });
                unsubscribe();
            });
        }
    }, [idNumber]);
    
    const addUser = (e: React.FormEvent) => {
        e.preventDefault();
    }

    function formatPhoneNumber(value: string) {
        let formattedPhoneNumber = "";
        let phoneNumberRegex = null;

        if (value.length > 6 && value.length < 12) {
            phoneNumberRegex = /^(\d{0,3})(\d{0,3})(\d{0,4})$/;
            formattedPhoneNumber = value.replace(phoneNumberRegex, '$1-$2-$3');
            setIDNumber(formattedPhoneNumber);
        }
        else if (value.length > 3 && value.length < 8) {
            phoneNumberRegex = /^(\d{0,3})(\d{0,3})$/;
            formattedPhoneNumber = value.replace(phoneNumberRegex, '$1-$2');
            setIDNumber(formattedPhoneNumber);
        }
        else if (value.length < 7) {
            setIDNumber(value);
        }
    }

    const addContact = () => {
        const q = query(collection(db, 'users'), where('uid', '==', user.uid)); 
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            querySnapshot.forEach((doc) => {
                let contacts = doc.data().contacts;
                contacts.push({
                    uid: id,
                    unread: 0
                })
                updateDoc(doc.ref, { contacts });
            });
            unsubscribe();
        });

        const q2 = query(collection(db, 'users'), where('uid', '==', id)); 
        const unsubscribe2 = onSnapshot(q2, (querySnapshot) => {
            querySnapshot.forEach((doc) => {
                let contacts = doc.data().contacts;
                contacts.push({
                    uid: user.uid,
                    unread: 0
                })
                updateDoc(doc.ref, { contacts });
            });
            unsubscribe2();
        });
        _ModalHandler.setOpen(false);
    }

    function handleInputChange(e: any) {
        const inputIdNumber = e.target.value.replace(/\D/g, '');
        formatPhoneNumber(inputIdNumber);
    }
    return (
        <>
            <form onSubmit={(e) => addUser(e)} className="disp-style-col">
                <label htmlFor="txtID">
                    USER ID:&nbsp;
                    <input maxLength={11} type="text" id="txtID" value={idNumber} onChange={handleInputChange} />
                </label>
                <br/>
                <div className="disp-style-col">
                    {
                        (user && (!myData.contacts || myData.contacts.length === 0 || myData.contacts.find(x => x.uid === user.uid)?.uid === undefined)) ?
                            (
                                (!user.displayName ?
                                    <p style={{ textAlign: "center", width: "100%" }}>{idNumber.length === 11 && "User not found!"}</p>
                                :
                                <div style={{ textAlign: "center" }} >
                                    <img className="avatar" src={ user && (user.photoURL ? user.photoURL : "https://cdn3.iconfinder.com/data/icons/avatars-9/145/Avatar_Cat-512.png") } />
                                    <p style={{ textAlign: "center", width: "100%" }}>{user.displayName}</p>
                                </div>
                                )
                                
                            )
                            :
                            (
                                <p style={{ textAlign: "center", width: "100%" }}>You already added this contact</p>
                            )
                    }
                </div>
                <br/>
                {
                    (user.displayName && (!myData.contacts || myData.contacts.length === 0 || myData.contacts.find(x => x.uid === user.uid)?.uid === undefined)) &&
                    <button onClick={addContact} className="btn btn-success">Add User</button>
                }
            </form>
        </>
    );
}

export default AddContact;