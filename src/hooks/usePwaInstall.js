import { useCallback, useEffect, useState } from 'react';
/** يتيح زر «تثبيت التطبيق» على المتصفّحات التي تدعم PWA. */
export const usePwaInstall = () => {
    const [deferred, setDeferred] = useState(null);
    const [installed, setInstalled] = useState(() => typeof window !== 'undefined' &&
        window.matchMedia('(display-mode: standalone)').matches);
    useEffect(() => {
        const onPrompt = (event) => {
            event.preventDefault();
            setDeferred(event);
        };
        const onInstalled = () => {
            setInstalled(true);
            setDeferred(null);
        };
        window.addEventListener('beforeinstallprompt', onPrompt);
        window.addEventListener('appinstalled', onInstalled);
        return () => {
            window.removeEventListener('beforeinstallprompt', onPrompt);
            window.removeEventListener('appinstalled', onInstalled);
        };
    }, []);
    const install = useCallback(async () => {
        if (!deferred)
            return false;
        await deferred.prompt();
        const choice = await deferred.userChoice;
        setDeferred(null);
        return choice.outcome === 'accepted';
    }, [deferred]);
    return { canInstall: Boolean(deferred) && !installed, installed, install };
};
