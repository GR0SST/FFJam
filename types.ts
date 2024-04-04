interface VideoProp {
    [key: string]: {
        resize: { [key: string]: VideoResizeOpts };
        id: string;
        sound?: string;
    };
}

interface VideoResizeOpts {
    name: string;
    args: string[];
    path: string;
}

type convert = {
    videoPath: string;
    audioPath?: string;
    output: string;
    bitrate: number;
    duration: number;
    update: Function;
};

export type { VideoResizeOpts, VideoProp, convert };
