import { Canvas } from '@react-three/fiber'
import { ambientLightProps, backgroundColor, cameraProps, modelScaleValue, orbitControlProps, spotLightProps, spotLightProps2 } from '../../constants/scene'
import useStore from '../../store'
import { Environment, OrbitControls } from '@react-three/drei'
import { Suspense, useEffect, useRef, useState } from 'react'
import Model from './model'
import ChainModel from './chain'
import { Loader } from './Loader'
import { chainModelProps, pendantsModelProps } from '../../constants'
import { ZoomControl } from './CameraControl/ZoomControl'
import { ang2Rad } from '../../helper/math'
import { useUpdateMyPresence, useOthers } from '../../liveblocks.config'
import { ResizeObserver } from '@juggle/resize-observer';



export const Scene = ({ pagechange }: any) => {
    const dragInfo = useStore((state: any) => state.dragInfo)
    const focusInfo = useStore((state: any) => state.focusInfo)
    const scaleValue = modelScaleValue
    const pointerRef = useRef() as any
    const updateMyPresence = useUpdateMyPresence()
    const [updatePosition, setUpdatePosition] = useState({})
    const [updateModelId, setUpdateModelId] = useState(null)
    const [modelPosition, setModelPosition] = useState({ id: '123', position: { x: 0, y: 0, z: 0 } })
    const currentPage = useStore((state: any) => state.currentPage)
    const setCurrentPage = useStore((state: any) => state.setCurrentPage)
    const [otherFirst, setOtherFirst] = useState(true)

    useEffect(() => {
        onPointerMove()
        setModelPosition({ id: '123', position: { x: 0, y: 0, z: 0 } })
    }, [pagechange])

    useEffect(() => {
        if (dragInfo.isDragging === false) {
            setTimeout(() => {
                onPointerMove()
            }, 1000);
        }
    }, [dragInfo])

    const onPointerMove = () => {
        let x;
        let y;

        x = Number(pointerRef?.current?.getAzimuthalAngle())
        y = Number(pointerRef?.current?.getPolarAngle())

        updateMyPresence({
            cursor: {
                x: x,
                y: y
            },
            model: {
                id: modelPosition.id,
                positon: {
                    x: modelPosition.position.x,
                    y: modelPosition.position.y,
                    z: modelPosition.position.z
                }
            },
            currentPage: pagechange,
            pageNumber: currentPage,
        })
    }


    const onPointerLeave = () => {
        updateMyPresence({
            cursor: null,
        })
    }

    const others = useOthers()
    const showOther = ({ connectionId, presence, info }: any) => {
        if (!presence?.cursor) {
            return null
        }
        
        const x = presence.cursor.x;
        const y = presence.cursor.y;

        const newpage = presence.currentPage;

        const page = presence.pageNumber

        if (newpage === 'prev' && currentPage !== page) {
            setCurrentPage({
                page
            })
        }
        else if (newpage === 'next' && currentPage !== page) {
            setCurrentPage({
                page
            })
        } else if (otherFirst === true && currentPage !== page) {
            setCurrentPage({
                page
            })
            setOtherFirst(false)
        }

        if (presence?.model?.id !== "123" && currentPage === page) {
            setTimeout(() => {
                setUpdateModelId(presence.model.id)
                setUpdatePosition(presence.model.positon)
            }, 500);
        }

        pointerRef?.current?.setAzimuthalAngle(x)

        pointerRef?.current?.setPolarAngle(y)

    }

    return (
        <div onPointerMove={onPointerMove} onPointerLeave={onPointerLeave}
            id='canvasview'
            style={{
                position: 'relative',
                width: '100%',
                height: '100%',
                overflow: 'hidden',
                touchAction: 'none'
            }}>

            {others.map(showOther)}

            <Canvas
                gl={{ antialias: true, alpha: true, }}
                camera={{ fov: cameraProps.fov, position: [cameraProps.position.x, cameraProps.position.y, cameraProps.position.z] }}
                shadows
                resize={{ polyfill: ResizeObserver }}
            >
                <Environment files={'/assets/hdr/evening_road_01_2k.hdr'} ></Environment>

                <color attach="background" args={[backgroundColor]} />

                <ambientLight
                    color={ambientLightProps.color}
                    intensity={0.5}
                />

                <OrbitControls
                    ref={pointerRef}
                    minPolarAngle={focusInfo.isFocus ? ang2Rad(0) : orbitControlProps.minPolarAngle}
                    maxPolarAngle={focusInfo.isFocus ? ang2Rad(360) : orbitControlProps.maxPolarAngle}
                    minAzimuthAngle={focusInfo.isFocus ? -Infinity : orbitControlProps.minAzimuthAngle}
                    maxAzimuthAngle={focusInfo.isFocus ? Infinity : orbitControlProps.maxAzimuthAngle}
                    maxDistance={orbitControlProps.maxDistance}
                    minDistance={orbitControlProps.minDistance}
                    target={focusInfo.isFocus ? focusInfo.position : orbitControlProps.target}
                    enabled={!dragInfo.isDragging}
                    enablePan={false}
                />

                <Suspense fallback={<Loader />}>
                    {!focusInfo.isFocus ? (
                        <ChainModel
                            url={chainModelProps.src}
                            position={chainModelProps.position}
                            scale={[scaleValue, scaleValue, scaleValue]}
                        />
                    ) : null}

                    {pendantsModelProps.map((item: any, index: number) => (
                        <Model
                            key={`pendantsmodel${index}`}
                            url={item.src}
                            scale={item.small ? [scaleValue, scaleValue, scaleValue] : [scaleValue / 1.5, scaleValue / 1.5, scaleValue / 1.5]}
                            drawable={item.drawable}
                            page={item.page}
                            index={item.pageIndex}
                            small={item.small}
                            meshPosition={item.meshPosition}
                            meshSize={item.meshSize}
                            id={item.id}
                            modelInfo={item}
                            handleChange={setModelPosition}
                            getPosition={updateModelId === item.id ? updatePosition : {}}
                            getUpdateId={updateModelId}
                        />
                    ))}

                    {/* <mesh position={[0, 0.138, 0]}>
                        <boxGeometry args={[0.075, 0.075, 0.001]} />
                        <meshBasicMaterial color={'red'} />
                    </mesh> */}
                </Suspense>

                <ZoomControl />
            </Canvas>


        </div>
    )
}

export default Scene