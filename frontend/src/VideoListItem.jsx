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
                    {v.thumb ? (
                        <img
                            src={`${API_BASE_URL}${v.thumb}`}
                            alt=""
                            style={{ width: 120, height: 68, objectFit: 'cover', borderRadius: 4 }}
                        />
                    ) : (
                        <div style={{
                            width: 120, height: 68, background: '#333', borderRadius: 4,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            margin: 'auto',
                            fontSize: 24,
                            }}>
                            {v.filename.endsWith('.mp3') ? '🎵' : '🎬'}
                            </div>
                    )}

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
                            <button style={{color:'green'}} onClick={() => confirmRename(v)}>✓</button>
                            <button style={{color:'red'}} onClick={cancelRename}>✕</button>
                        </>
                        ) : (
                        <>
                            <span>
                                {v.filename}
                            </span>
                        </>
                        )}

                        <div style={{ fontSize: 11, color: '#aaa', marginTop: 4 }}>
                            {formatTime(v.duration)}         
                            {v.custom.artist && (
                                <span style={{ fontSize: 11, color: '#4ade80'}}>
                                &nbsp;•🎤 {v.custom.artist}
                                </span>
                            )}
                            {v.custom.genre && (
                                <span style={{ fontSize: 11, color: '#fbbf24' }}>
                                &nbsp;• 🎵 {v.custom.genre}
                                </span>
                            )}

                        </div>
                        
                        
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

