import { useState, useEffect } from "react";
import { useInView } from "./hooks/useInView";
import { API_BASE_URL } from "./config/api";
import { formatTime } from "./utils/formatTime";



export default function VideoListItem({ v, isActive, onClick, onContextMenu, isEditingName, tempName, setTempName, confirmRename, cancelRename }) {
    const [ref, isInView] = useInView();
    const [showContent, setShowContent] = useState(false);

    useEffect(() => {
        if (isInView) {
            // Khi đã lọt vào màn hình, delay 400ms rồi mới hiện tên video
            const timer = setTimeout(() => {
                setShowContent(true);
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [isInView]);


    return (
        <li
            ref={ref}
            onClick={onClick}
            onContextMenu={onContextMenu}
            className={`video-item ${isActive ? 'active' : ''}`}
            >
            { showContent ? (
                <>
                    <div style={{
                        position: "relative",
                        width: 120, height: 68, borderRadius: 4,
                        margin: 'auto',
                        overflow: "hidden",
                    }}>
                        {showContent ? (
                            <img
                                src={`${API_BASE_URL}${v.thumb}`}
                                alt=""
                                loading="lazy"
                                style={{ width: "100%", height: "100%", objectFit: 'cover'}}
                            />
                        ) : (
                            <div style={{
                                width: "100%", height: "100%", background: '#333', fontSize: 24,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                                {v.filename.endsWith('.mp3') ? '🎵' : '🎬'}  
                            </div>
                        )}
                        <div style={{
                            position: "absolute", right: 0, bottom: 0, 
                            margin: 5, borderRadius: 2,
                            background: "rgba(0.1,0.1,0.1,0.2)",
                            lineHeight: 1, fontSize: "10", color: '#ccc',
                        }}>
                            {formatTime(v.duration)} 
                        </div>
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                        {isEditingName ? (
                        <>
                            <input
                                value={tempName}
                                onChange={(e) => setTempName(e.target.value)}
                                autoFocus
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') confirmRename(v.filename);
                                    if (e.key === 'Escape') cancelRename();
                                }}
                            />
                            <button style={{color:'green'}} onClick={() => confirmRename(v.filename)}>✓</button>
                            <button style={{color:'red'}} onClick={cancelRename}>✕</button>
                        </>
                        ) : (
                        <>
                            <span>
                                {v.filename}
                            </span>
                        </>
                        )}
                        
                        
                    </div>
                </>
            ) : (
                // Skeleton placeholder
                <div style={{
                    width: '80%',
                    height: '16px',
                    background: 'linear-gradient(90deg, #333 25%, #444 50%, #333 75%)',
                    backgroundSize: '200% 100%',
                    animation: 'shimmer 1.5s infinite',
                    borderRadius: '4px',
                }} />
            )}
        </li>
    );
}

