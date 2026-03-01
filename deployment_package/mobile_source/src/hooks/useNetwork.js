import { useState, useEffect, useCallback } from 'react';
import NetInfo from '@react-native-community/netinfo';
import offlineService from '../services/offlineService';

/**
 * Hook to monitor network connectivity status
 * @returns {{ isOnline: boolean, isInternetReachable: boolean, refresh: Function }}
 */
export function useNetwork() {
    const [isOnline, setIsOnline] = useState(true);
    const [isInternetReachable, setIsInternetReachable] = useState(true);

    useEffect(() => {
        // Subscribe to network state updates
        const unsubscribe = NetInfo.addEventListener(state => {
            const online = state.isConnected ?? true;
            const reachable = state.isInternetReachable ?? true;

            setIsOnline(online);
            setIsInternetReachable(reachable);

            // Update offline service status
            offlineService.setOnlineStatus(online && reachable);
        });

        // Check initial state
        NetInfo.fetch().then(state => {
            setIsOnline(state.isConnected ?? true);
            setIsInternetReachable(state.isInternetReachable ?? true);
        });

        return () => {
            unsubscribe();
        };
    }, []);

    const refresh = useCallback(async () => {
        const state = await NetInfo.fetch();
        setIsOnline(state.isConnected ?? true);
        setIsInternetReachable(state.isInternetReachable ?? true);
        return state.isConnected && state.isInternetReachable;
    }, []);

    return {
        isOnline,
        isInternetReachable,
        isConnected: isOnline && isInternetReachable,
        refresh,
    };
}

export default useNetwork;
