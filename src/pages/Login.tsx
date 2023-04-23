import { ChangeEvent, useState } from "react";
import '../css/Login.css';
import avatar_icon from '../assets/avatar.png';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth, db } from "../Firebase";
import { doc, setDoc } from "firebase/firestore";
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";

interface prop {
    onLogin: (uid: string) => void;
}

export const Login = ({ onLogin } : prop) => {
    const [username, setusername] = useState("");
    const [logingIn, showLoading] = useState(false);
    const [signupTab, showSignup] = useState(false);
    const [loginTab, showLogin] = useState(true);
    const [imgAvatar, setAvatar] = useState("");

    const clickSignup = () => {
        showLogin(false);
        showSignup(true);
    }

    const clickLogin = () => {
        showLogin(true);
        showSignup(false);
    }

    const handleImage = (e: ChangeEvent) => {
        const target = e.target as HTMLInputElement;
        const file = target.files && target.files[0];
        if (file)
            setAvatar(URL.createObjectURL(file));
    }

    const registerUser = (e: React.FormEvent) => {
        e.preventDefault();
        const target = e.target as HTMLFormElement;
        const displayName = (target[0] as HTMLInputElement).value;
        const email = (target[1] as HTMLInputElement).value;
        const password = (target[2] as HTMLInputElement).value;
        const fileInput = target[3] as HTMLInputElement;
        const file = fileInput.files ? fileInput.files[0] : null;

        
        try {
            createUserWithEmailAndPassword(auth, email, password)
                .then((res) => {
                    const storage = getStorage();
        
                    // Create the file metadata
                    /** @type {any} */
                    const metadata = {
                    contentType: 'image/jpeg'
                    };
        
                    // Upload file and metadata to the object 'images/mountains.jpg'
                    const storageRef = ref(storage, displayName);
                    const uploadTask = uploadBytesResumable(storageRef, file ?? new Blob([]), metadata);
        
                    // Listen for state changes, errors, and completion of the upload.
                    uploadTask.on('state_changed',
                        (response) => {
                            // Upload completed successfully, now we can get the download URL
                            getDownloadURL(uploadTask.snapshot.ref).then(
                                async (downloadURL) => {
                                    await updateProfile(res.user, {
                                        displayName,
                                        photoURL: downloadURL,
                                    }).then(() => {
                                        const minNumber = 100000000;
                                        const randomNumber = Math.floor(Math.random() * 900000000) + minNumber;
                
                                        setDoc(doc(db, "users", res.user.uid), {
                                            uid: res.user.uid,
                                            displayName,
                                            email,
                                            photoURL: downloadURL,
                                            unique_id: randomNumber.toString(),
                                            contacts: []
                                        }).then(() => {
                                            alert("User is successfully registered!");
                                            location.reload();
                                        });
                                    });

                                }
                            );
                        },
                        (err) => {
                            alert(err);
                        }
                    );
                }
            );

            
        } catch { }
    }

    const loginUser = (e: React.FormEvent) => {
        e.preventDefault();
        showLoading(true);
        const target = e.target as HTMLFormElement;
        const email = (target[0] as HTMLInputElement).value;
        const password = (target[1] as HTMLInputElement).value;

        try {
            signInWithEmailAndPassword(auth, email, password)
                .then((userCredential) => {
                    // Signed in
                    const user = userCredential.user;
                    if (user.displayName)
                        setusername(user.displayName);
                    onLogin(user.uid);
                    location.reload();
                })
                .catch((error) => {
                    const errorCode = error.code;
                    const errorMessage = error.message;
                    showLoading(false);
                });
        } catch { }
    }

    return (
        <>
            {
                !logingIn ?
                <div className="div-login">
                    <ul className="nav nav-tabs" role="tablist">
                        <li className="nav-item">
                            <a className={"nav-link " + (loginTab ? "active" : "")} onClick={ clickLogin } id="login-tab" data-toggle="tab" href="#login" role="tab" aria-controls="login" aria-selected="false">Login</a>
                        </li>
                        <li className="nav-item">
                            <a className={"nav-link " + (signupTab ? "active" : "")} onClick={ clickSignup } data-toggle="tab" href="#signup" role="tab" aria-controls="signup" aria-selected="true">Sign Up</a>
                        </li>
                    </ul>
                    <div className="tab-content">
                        <div className={"tab-pane fade " + (loginTab ? "show active" : "")} role="tabpanel" aria-labelledby="login-tab">
                            <h2>Login</h2>
                            <form onSubmit={(e) => loginUser(e) }>
                                <div className="form-group">
                                    <label htmlFor="email">Email:</label>
                                    <input type="email" className="form-control" name="email" required />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="password">Password:</label>
                                    <input type="password" className="form-control" name="password" required />
                                </div>
                                <button type="submit" className="btn btn-primary">Login</button>
                            </form>
                        </div>
                        <div className={"tab-pane fade " + (signupTab ? "show active" : "")} role="tabpanel" aria-labelledby="signup-tab">
                            <h2>Sign Up</h2>
                            <form onSubmit={(e) => registerUser(e)}>
                                <div className="form-group">
                                    <label htmlFor="username">User Name:</label>
                                    <input type="username" className="form-control" name="username" required />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="email">Email:</label>
                                    <input type="email" className="form-control" name="email" required />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="password">Password:</label>
                                    <input type="password" className="form-control" name="password" required />
                                </div>
                                <div className="form-group" style={{ marginTop: "10px" }}>
                                    <label htmlFor="file" style={{ cursor: "pointer" }}>
                                        <input style={{ display: "none" }} type="file" id="file" onChange={ (e) => handleImage(e) } />
                                        <img className="img-avatar-register" src={ imgAvatar ? imgAvatar : avatar_icon }></img>
                                        <span>&nbsp;Click to add an avatar</span>
                                    </label>
                                </div>
                                <button type="submit" className="btn btn-primary">Sign Up</button>
                            </form>
                        </div>
                    </div>
                </div>
                :
                <h2 style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>Logging in{ username && (" for " + username) }...</h2>
            }
        </>
    )
}