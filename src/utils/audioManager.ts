// Global audio manager for experience-background music
// This allows the music to persist across component unmounts

let experienceBackgroundMusic: HTMLAudioElement | null = null;
let windGrassSound: HTMLAudioElement | null = null;

export const startExperienceBackgroundMusic = () => {
    if (typeof window !== "undefined" && !experienceBackgroundMusic) {
        experienceBackgroundMusic = new Audio('/sounds/SFX/experience-background.mp3');
        experienceBackgroundMusic.loop = true;
        experienceBackgroundMusic.volume = 0.2;
        experienceBackgroundMusic.play().catch(() => { });
    }
};

export const stopExperienceBackgroundMusic = () => {
    if (experienceBackgroundMusic) {
        experienceBackgroundMusic.pause();
        experienceBackgroundMusic.currentTime = 0;
        experienceBackgroundMusic = null;
    }
};

export const startWindGrassSound = () => {
    if (typeof window !== "undefined" && !windGrassSound) {
        windGrassSound = new Audio('/sounds/SFX/wind-n-grass.mp3');
        windGrassSound.loop = true;
        windGrassSound.volume = 0.3;
        windGrassSound.play().catch(() => { });
    }
};

export const stopWindGrassSound = () => {
    if (windGrassSound) {
        windGrassSound.pause();
        windGrassSound.currentTime = 0;
        windGrassSound = null;
    }
};

export const stopAllAudio = () => {
    stopExperienceBackgroundMusic();
    stopWindGrassSound();
};

export const getExperienceBackgroundMusic = () => experienceBackgroundMusic;
export const getWindGrassSound = () => windGrassSound;
