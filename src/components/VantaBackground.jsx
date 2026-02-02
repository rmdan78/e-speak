
import { useEffect, useRef } from 'react';

const VantaBackground = () => {
    const vantaRef = useRef(null);

    useEffect(() => {
        let vantaEffect = null;

        const initVanta = () => {
            if (window.VANTA) {
                try {
                    vantaEffect = window.VANTA.BIRDS({
                        el: vantaRef.current,
                        mouseControls: true,
                        touchControls: true,
                        gyroControls: false,
                        minHeight: 200.00,
                        minWidth: 200.00,
                        scale: 1.00,
                        scaleMobile: 1.00,
                        backgroundColor: 0x0d1117, // Base Dark Theme
                        color1: 0x1251c5, // Requested Blue
                        color2: 0x1f6feb, // Lighter Blue Accent
                        backgroundAlpha: 1,
                        quantity: 3.5,     // Optimal amount
                    });
                } catch (e) {
                    console.error("Vanta Init Error:", e);
                }
            }
        };

        // Retry logic in case scripts load slowly
        if (window.VANTA) {
            initVanta();
        } else {
            const interval = setInterval(() => {
                if (window.VANTA) {
                    initVanta();
                    clearInterval(interval);
                }
            }, 200);
            return () => clearInterval(interval);
        }

        return () => {
            if (vantaEffect) vantaEffect.destroy();
        };
    }, []);

    return <div ref={vantaRef} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: -1 }} />;
};

export default VantaBackground;
