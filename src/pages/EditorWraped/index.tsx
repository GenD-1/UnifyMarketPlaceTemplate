import { Suspense, useCallback, useEffect, useState } from "react";

import Avatar from '../../components/Avatar/Avatar';
import { COLORS_PRESENCE } from '../../constants';
import { RoomProvider, useMap, useMyPresence, useOthers } from "../../liveblocks.config";
import Editor from '../Editor';
import { LiveMap } from "@liveblocks/client";
import { v1 as uuidv1 } from 'uuid';
import Video from "twilio-video";
// import {
//     selectIsConnectedToRoom,
//     useHMSActions,
//     useHMSStore,
//     useAVToggle
// } from "@100mslive/react-sdk";
import MicroPhone from "../../components/Testing/MicroPhone";


function Room({ url }: any) {

    return (
        <div
            className="container mx-auto h-[100%] justify-center items-center flex"
        >
            <PageShow shareUrl={url} />
        </div>
    );
}

function PageShow({ shareUrl }: any) {
    const shapes = useMap("shapes");

    if (shapes === null || shapes === undefined) {
        return (
            <div className="loading">
                <img src="https://liveblocks.io/loading.svg" alt="Loading" />
            </div>
        );
    } else {
        return <Editor shapes={shapes} shareUrl={shareUrl} />;
    }
}

function EditorWraped({ roomName }: any) {

    // const isConnected = useHMSStore(selectIsConnectedToRoom);
    // const hmsActions = useHMSActions();

    const [shareUrl, setShareUrl] = useState('');

    const [room, setRoom] = useState(null);
    const [connecting, setConnecting] = useState(false);



    useEffect(() => {
        window.onunload = () => {
            if (room) {
                handleLogout();
            }
        };
    }, []);


    const handleSubmit = useCallback(
        async (event: any) => {
            event.preventDefault();
            setConnecting(true);
            const data = await fetch("https://backend-unify.herokuapp.com/join-room", {
                method: "POST",
                body: JSON.stringify({

                    roomName: roomName,
                }),
                headers: {
                    "Content-Type": "application/json",
                },
            }).then((res) => {
                return res.json()
            });


            Video.connect(data.token, {
                name: roomName,
                video: false,
                audio: true
            })
                .then((room: any) => {
                    setConnecting(false);
                    setRoom(room);
                    let newUrl = window.location.protocol + "//" + window.location.host + "/" + room.sid + "/" + roomName
                    setShareUrl(newUrl)

                })
                .catch((err) => {
                    console.error(err);
                    setConnecting(false);
                });
        },
        [roomName]
    );


    const handleLogout = useCallback(() => {
        setRoom((prevRoom: any) => {
            if (prevRoom) {
                prevRoom.localParticipant.tracks.forEach((trackPub: any) => {
                    trackPub.track.stop();
                });
                prevRoom.disconnect();
            }
            return null;
        });
    }, []);

    // useEffect(() => {
    //     let currentUrl = (window.location.href).split('/')

    //     if (currentUrl[3] === '') {
    //         fetchRoomId();
    //     } else {
    //         setRoomId(currentUrl[3]);
    //     }

    // }, [])

    useEffect(() => {
        if (room) {
            const tidyUp = (event: any) => {
                if (event.persisted) {
                    return;
                }
                if (room) {
                    handleLogout();
                }
            };
            window.addEventListener("pagehide", tidyUp);
            window.addEventListener("beforeunload", tidyUp);
            return () => {
                window.removeEventListener("pagehide", tidyUp);
                window.removeEventListener("beforeunload", tidyUp);
            };
        }
    }, [room, handleLogout]);



    const handleOkk = () => {
        let newUrl = window.location.protocol + "//" + window.location.host + "/" + roomName
        setShareUrl(newUrl)
    }




    return (
        <div className='h-[97%]'>
            {roomName &&

                <RoomProvider id={roomName} initialPresence={{ cursor: null, model: null, currentPage: null, pageNumber: null }} initialStorage={{ shapes: new LiveMap(), }}>

                    <Room url={shareUrl} />

                </RoomProvider>

            }

            {
                room ?
                    <MicroPhone roomName={roomName} room={room} handleLogout={handleLogout} /> :
                    <div className="control-bar container mx-auto fixed bottom-[1%] w-fit right-[50%]  sm:bottom-[11%] md:bottom-[1%]  text-sm">
                        <button className="btn-control" onClick={handleSubmit}>
                            {connecting === true ? 'Loading' : 'Start'}
                        </button>
                    </div>
            }
        </div >
    );
}


export default EditorWraped

// right: 50%;
// width: fit-content;
// background-color: red;