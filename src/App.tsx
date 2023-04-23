import { useState } from 'react';
import { Login } from './pages/Login';
import Chat from './pages/Chat';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { auth } from './Firebase';
import Cookies from 'universal-cookie';
import './App.css';
import 'Bootstrap/dist/css/bootstrap.min.css';
import { Modal } from 'react-responsive-modal';
import 'react-responsive-modal/styles.css';

const cookies = new Cookies();

export const LogoutUser = () => {
    auth.signOut().then(() => {
        cookies.remove("logged");
        location.reload();
    })
    .catch((err) => {
        alert(err);
    });
}

class ModalHandler {
    public setOpen: React.Dispatch<React.SetStateAction<any>> = () => {};
    public setModal: React.Dispatch<React.SetStateAction<any>> = () => {};
    public _setCallback: React.Dispatch<React.SetStateAction<any>> = () => {};
    public setCallback = (callback: () => void) => {
        this._setCallback(callback);
    }
    public setModalData: React.Dispatch<React.SetStateAction<any>> = () => {};
    public getModalData: any = null;
    public setModalTitle: React.Dispatch<React.SetStateAction<any>> = () => {};
    public setModalMsg: React.Dispatch<React.SetStateAction<any>> = () => {};
}

export const _ModalHandler = new ModalHandler();

function App() {
    const [open, setOpen] = useState(false);
    const [modalTitle, setModalTitle] = useState("");
    const [modalMsg, setModalMsg] = useState("");
    const [modal, setModal] = useState(null);
    const [modalData, setModalData] = useState({});
    const [callback, setCallback] = useState<(() => void) | undefined>(undefined);

    const modalClose = () => {
        if (callback)
            callback();
        setOpen(false);
    }

    _ModalHandler.setOpen = setOpen;
    _ModalHandler.setModal = setModal;
    _ModalHandler._setCallback = setCallback;
    _ModalHandler.setModalTitle = setModalTitle;
    _ModalHandler.setModalMsg = setModalMsg;
    _ModalHandler.setModalData = setModalData;
    _ModalHandler.getModalData = modalData;

    if (!cookies.get("logged")) {
        cookies.set("logged", false);
    }
    return (
        <div className="App">
            { 
                <Modal
                    open={open}
                    key={open ? "modal-open" : "modal-closed"}
                    onClose={modalClose}
                    center>
                    <h4 style={{ height: "22px", textAlign: "center" }}>{modalTitle}</h4>
                    <hr style={{ margin: "12px 0px" }}/>
                    { modal ? modal : <p style={{ textAlign: "center" }}>{ modalMsg }</p> }
                </Modal>
            }
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={
                        (/true/).test(cookies.get("logged"))?
                            <Chat />
                            :
                            <Login onLogin={(uid) => { cookies.set("logged", true); cookies.set("uid", uid); }} />
                    } />
                </Routes>
            </BrowserRouter>
            <></>
        </div>
    )
}

export default App
