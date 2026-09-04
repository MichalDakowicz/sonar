import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../auth/AuthContext";
import { useUserProfile } from "../../hooks/useUserProfile";
import { db } from "../../lib/firebase";
import { ref, get, set, remove, update } from "firebase/database";
import { Loader2, X, Upload, Image as ImageIcon, Trash2, Check } from "lucide-react";
import Cropper from 'react-easy-crop';
import getCroppedImg from '../../lib/cropImage';

export default function EditProfileModal({ isOpen, onClose }) {
    const { user } = useAuth();
    const { profile } = useUserProfile(user?.uid);
    
    const [username, setUsername] = useState("");
    const [displayName, setDisplayName] = useState("");
    const [pfp, setPfp] = useState("");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    
    // Cropper State
    const [imageSrc, setImageSrc] = useState(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
    const [isCropping, setIsCropping] = useState(false);

    useEffect(() => {
        if (profile) {
            setUsername(profile.username || "");
            setDisplayName(profile.displayName || "");
            setPfp(profile.pfp || "");
        }
    }, [profile]);

    const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const showCroppedImage = async () => {
        try {
            const croppedImage = await getCroppedImg(
                imageSrc,
                croppedAreaPixels
            );
            setPfp(croppedImage);
            setImageSrc(null);
            setIsCropping(false);
        } catch (e) {
            console.error(e);
            setError("Failed to crop image");
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Check file size (max 2MB for upload, we optimize later)
        if (file.size > 2 * 1024 * 1024) {
             setError("Image size too large. Please pick a smaller image.");
             return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            setImageSrc(reader.result);
            setIsCropping(true);
            setError("");
            setZoom(1);
            setCrop({ x: 0, y: 0 });
        };
        reader.readAsDataURL(file);
    };

    const handleClose = () => {
        if (isCropping) {
            setIsCropping(false);
            setImageSrc(null);
        } else {
            onClose();
        }
    };

    if (!isOpen) return null;

    const handleSave = async () => {
        if (!user) return;
        setError("");
        setSaving(true);

        try {
            const newUsername = username.trim();
            const oldUsername = profile?.username;

            if (!newUsername) {
                 throw new Error("Username is required.");
            }

            const updates = {};
            const newProfileData = {
                username: newUsername,
                displayName: displayName.trim(),
                pfp: pfp.trim(),
            };

            // Update Username if changed
            if (newUsername !== oldUsername) {
                const usernameRef = ref(db, `usernames/${newUsername}`);
                const snapshot = await get(usernameRef);
                if (snapshot.exists()) {
                    throw new Error("Username already taken.");
                }

                updates[`usernames/${newUsername}`] = user.uid;

                // Release old username
                if (oldUsername) {
                    updates[`usernames/${oldUsername}`] = null;
                }
            }

            // Update Profile and Search Index
            updates[`users/${user.uid}/profile`] = newProfileData;
            updates[`userSearchIndex/${user.uid}`] = newProfileData;

            await update(ref(db), updates);

            onClose();
        } catch (err) {
            console.error(err);
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleUsernameChange = (e) => {
        const val = e.target.value;
        // Enforce lowercase and alphanumeric only
        const cleanVal = val.toLowerCase().replace(/[^a-z0-9]/g, '');
        setUsername(cleanVal);
    };

    return (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div 
                className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-xl shadow-xl flex flex-col max-h-[90vh]"
                onTouchStart={(e) => e.stopPropagation()}
                onTouchMove={(e) => e.stopPropagation()}
                onTouchEnd={(e) => e.stopPropagation()}
            >
                <div className="border-b border-neutral-800 p-4 flex items-center justify-between">
                     <h2 className="text-xl font-bold text-white">{isCropping ? "Crop Image" : "Edit Profile"}</h2>
                     <button onClick={handleClose} className="text-neutral-400 hover:text-white">
                         <X size={24} />
                     </button>
                </div>

                
                <div className="p-6 space-y-4 overflow-y-auto flex-1 relative min-h-75">
                    {isCropping ? (
                        <div className="flex flex-col h-full gap-4">
                            <div className="relative w-full h-64 bg-neutral-950 rounded-lg overflow-hidden border border-neutral-800">
                                <Cropper
                                    image={imageSrc}
                                    crop={crop}
                                    zoom={zoom}
                                    aspect={1}
                                    onCropChange={setCrop}
                                    onCropComplete={onCropComplete}
                                    onZoomChange={setZoom}
                                    cropShape="round"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm text-neutral-400">Zoom</label>
                                <input
                                    type="range"
                                    value={zoom}
                                    min={1}
                                    max={3}
                                    step={0.1}
                                    aria-labelledby="Zoom"
                                    onChange={(e) => setZoom(Number(e.target.value))}
                                    className="w-full h-2 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                                />
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    onClick={() => {
                                        setIsCropping(false);
                                        setImageSrc(null);
                                    }}
                                    className="px-4 py-2 rounded-md hover:bg-neutral-800 text-neutral-300"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={showCroppedImage}
                                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md font-medium flex items-center gap-2"
                                >
                                    <Check size={16} />
                                    Confirm Crop
                                </button>
                            </div>
                        </div>
                    ) : (
                        <>
                            {error && (
                                <div className="p-3 bg-red-900/20 border border-red-900/50 text-red-500 rounded-md text-sm">
                                    {error}
                                </div>
                            )}

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-neutral-300">Display Name</label>
                                <input 
                                    type="text" 
                                    value={displayName}
                                    onChange={(e) => setDisplayName(e.target.value)}
                                    className="w-full bg-neutral-950 border border-neutral-800 rounded-md p-2 text-white focus:outline-none focus:border-emerald-500"
                                    placeholder="Your Display Name"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-neutral-300">Username</label>
                                <input 
                                    type="text" 
                                    value={username}
                                    onChange={handleUsernameChange}
                                    className="w-full bg-neutral-950 border border-neutral-800 rounded-md p-2 text-white focus:outline-none focus:border-emerald-500"
                                    placeholder="uniqueusername"
                                />
                                <p className="text-xs text-neutral-500">Lowercase letters and numbers only.</p>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-neutral-300">Profile Picture</label>
                                
                                <div className="flex items-start gap-4">
                                    <div className="relative group shrink-0">
                                        {pfp ? (
                                            <img 
                                                src={pfp} 
                                                alt="Preview" 
                                                className="w-24 h-24 rounded-full object-cover border-2 border-neutral-700 bg-neutral-800"
                                            />
                                        ) : (
                                            <div className="w-24 h-24 rounded-full border-2 border-neutral-800 bg-neutral-900 flex items-center justify-center text-neutral-600">
                                                <ImageIcon size={32} />
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex-1 space-y-2">
                                        <div className="flex items-center gap-2">
                                            <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-md text-sm font-medium transition-colors border border-neutral-700">
                                                <Upload size={16} />
                                                Upload Image
                                                <input 
                                                    type="file" 
                                                    accept="image/jpeg, image/png, image/webp" 
                                                    onChange={handleFileChange}
                                                    className="hidden" 
                                                />
                                            </label>
                                            
                                            {pfp && (
                                                <button 
                                                    onClick={() => setPfp("")}
                                                    className="p-2 text-neutral-400 hover:text-red-400 hover:bg-red-900/10 rounded-md transition-colors"
                                                    title="Remove image"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            )}
                                        </div>
                                        <p className="text-xs text-neutral-500">
                                            Max size: 500KB. Formats: JPG, PNG, WebP.
                                            <br/>
                                            Stored directly in database.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {!isCropping && (
                    <div className="border-t border-neutral-800 p-4 flex justify-end gap-2">
                        <button onClick={onClose} className="px-4 py-2 rounded-md hover:bg-neutral-800 text-neutral-300">
                            Cancel
                        </button>
                        <button 
                            onClick={handleSave} 
                            disabled={saving}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md font-medium flex items-center gap-2"
                        >
                            {saving && <Loader2 size={16} className="animate-spin" />}
                            Save Changes
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
