import { useEffect, useRef } from "react";
import { useFriends } from "../../hooks/useFriends";
import { useToast } from "../../components/ui/Toast";
import { get, ref } from "firebase/database";
import { db } from "../../lib/firebase";

export default function FriendRequestListener() {
    const { requests, loading } = useFriends();
    const { toast } = useToast();
    const prevRequestsRef = useRef([]);
    const isFirstLoad = useRef(true);

    useEffect(() => {
        if (loading) return;

        // On first load, just memorize current state
        if (isFirstLoad.current) {
            prevRequestsRef.current = requests;
            isFirstLoad.current = false;
            return;
        }

        // Find new requests
        const prevIds = new Set(prevRequestsRef.current.map(r => r.uid));
        const newReqs = requests.filter(r => !prevIds.has(r.uid));

        const notify = async (req) => {
            let name = "Someone";
            try {
                const snapshot = await get(ref(db, `users/${req.uid}/profile`));
                if (snapshot.exists()) {
                     const val = snapshot.val();
                     name = val.displayName || val.username || "Someone";
                }
            } catch (e) {
                console.error("Failed to fetch profile for toast", e);
            }

            toast({
                title: "New Friend Request",
                description: `${name} sent you a friend request.`,
                variant: "default",
                duration: 5000
            });
        };

        newReqs.forEach(req => {
            notify(req);
        });

        prevRequestsRef.current = requests;
    }, [requests, loading, toast]);

    return null;
}
