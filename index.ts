import { readdir, mkdir } from "node:fs/promises";
import type { VideoProp, convert } from "./types";
import ffmpeg from "fluent-ffmpeg";
import colors from "colors";
import os from "os";
import { which } from "bun";

const ffpath = which("ffmpeg");
if (!ffpath) {
    console.log("FFMPEG not found");
    process.exit(1);
}
ffmpeg.setFfmpegPath(ffpath);

const currentOS = os.platform();
const path = `${process.cwd()}/test`;

const outputPath = `${path}/output`;

colors.enable();
const bitrates = (dur: string) => {
    const mbs: { [key: string]: number } = {
        "30s": 12000,
        "45s": 8000,
        "59s": 12000,
        "60s": 12000,
    };
    return mbs[dur] || mbs["45s"];
};
const cfg = {
    darwin: {
        encoder: "hevc_videotoolbox",
    },
};
const app = {
    async run() {
        const startTime = new Date().getTime();
        const folder = await this.fetchFolder(path);
        console.log("-------------CONVERTING-----------");
        await this.convertFiles(folder);
        console.log("------------------------------\n\n");
        console.log("-------------APPLOVIN-------------");
        await this.applovinConvert(folder);
        console.log("------------------------------\n\n");
        const duration = new Date().getTime() - startTime;
        console.log(
            `Completed within ${(duration / 1000 / 60).toFixed(1)} minutes`
        );
    },
    async fetchFolder(path: string) {
        const titles: VideoProp = {};
        const folders = await readdir(path);

        const videos = folders.filter((e) =>
            [".mp4", ".avi", ".mov"].some((x) => e.endsWith(x))
        );
        const audios = folders.filter((e) =>
            [".wav", ".mp3"].some((x) => e.endsWith(x))
        );

        for (const video of videos) {
            const name = video.substring(0, video.lastIndexOf(".")) || video;
            const args = name.toLowerCase().split("_");
            const [resize, title, id, btn, loc, duration, size] = args;
            const isBadName = this.nameCheck(args);
            if (isBadName) {
                console.log(isBadName);
                continue;
            }

            if (
                titles[id]?.resize[resize] &&
                titles[id].resize[resize].args[4] === loc
            ) {
                console.log(
                    `WARNING: duplicates found ${video} and ${titles[id].resize[resize].name}`
                        .yellow
                );
                continue;
            }
            if (!titles[id]) {
                titles[id] = { resize: {}, id };
            }

            titles[id].resize[resize] = {
                name: [resize, title, id, btn, loc, duration, size].join("_"),
                args,
                path: `${path}/${video}`,
            };

            console.log(`Added ${name}`);
        }

        console.log("\n\n-----------AUDIO--------------");

        for (const audio of audios) {
            const name = audio.substring(0, audio.lastIndexOf(".")) || audio;
            const [title, id] = name.toLowerCase().split("_");
            if (titles[id]) {
                titles[id].sound = `${path}/${audio}`;
                console.log(`Appended ${audio} to ${title}_${id}`);
            } else {
                console.log(`WARNING: Creative for ${audio} not found`.yellow);
            }
        }
        Object.values(titles).forEach((e) => {
            if (!e.sound)
                console.log(`WARNING: Sound for ${e.id} not found`.yellow);
        });

        console.log("------------------------------\n\n");
        return titles;
    },
    async convertFiles(titles: VideoProp) {
        for (const title of Object.values(titles)) {
            for (const e of Object.values(title.resize)) {
                const [resize, titleName, id, btn, loc, duration, size] =
                    e.args;
                const titleFolder = `${outputPath}/cream/${titleName}_${id}`;
                await this.mkdir(titleFolder);
                const startTime = new Date().getTime();
                await this.convert({
                    videoPath: e.path,
                    audioPath: title.sound,
                    bitrate: bitrates(duration),
                    output: `${titleFolder}/${e.name}.mp4`,
                    duration: parseInt(duration),
                });

                const elapsed = (
                    (new Date().getTime() - startTime) /
                    1000
                ).toFixed();
                console.log(`${e.name} converted within ${elapsed}s.`);
            }
        }
        return titles;
    },
    async applovinConvert(titles: VideoProp) {
        const resizes = ["1920x1080", "1080x1920"];
        for (const title of Object.values(titles)) {
            for (const e of Object.values(title.resize)) {
                const [resize, titleName, id, btn, loc, duration, size] =
                    e.args;
                if (resizes.includes(resize)) {
                    const titleFolder = `${outputPath}/applovin/${titleName}_${id}`;
                    await this.mkdir(titleFolder);
                    const startTime = new Date().getTime();
                    await this.convert({
                        videoPath: e.path,
                        audioPath: title.sound,
                        bitrate: bitrates(duration) - 10,
                        output: `${titleFolder}/${e.name}.mp4`,
                        duration: parseInt(duration),
                    });
                    console.log(
                        `Applovin variant for ${e.name} created within ${(
                            (new Date().getTime() - startTime) /
                            1000
                        ).toFixed()}s.`
                    );
                }
            }
        }
        return true;
    },
    async convert(data: convert) {
        const { videoPath, audioPath, output, bitrate, duration } = data;
        return new Promise((res) => {
            const video = ffmpeg().input(videoPath);
            audioPath && video.input(audioPath);
            video.videoCodec("hevc_videotoolbox");
            video.outputOptions([
                "-c:a aac",

                "-vtag hvc1",

                "-preset medium",
                `-maxrate ${bitrate}k`,
                `-bufsize ${bitrate}k`,
                `-b:v ${bitrate}k`,
                "-y",
                "-map 1:a:0",
                "-map 0:v:0",
            ]);
            video.duration(duration);
            video.on("error", () => res(false));
            video.on("end", () => res(true));
            video.on("progress", function (progress) {
                console.log("Processing: " + progress.percent + "% done");
            });
            video.saveToFile(output);
        });
    },

    nameCheck(args: string[]) {
        const [resize, title, id, btn, loc, duration, size] = args;

        const resizeReg = new RegExp(/\b\d{3,4}x\d{3,4}\b/);
        const durationReg = new RegExp(/^\d+s$/);
        const sizeReg = new RegExp(/^\d+mb$/);
        const idReg = new RegExp(/\bvideo\d+v\d+\b/);
        const nonNum = new RegExp(/^[a-z]+$/);

        const resizeTest = resizeReg.test(resize);
        const titleTest = nonNum.test(title);
        const idTest = idReg.test(id);
        const btnTest = nonNum.test(btn);
        const locTest = nonNum.test(loc);
        const durationTest = durationReg.test(duration);
        const sizeTest = sizeReg.test(size);

        const testArray = [
            resizeTest,
            titleTest,
            idTest,
            btnTest,
            locTest,
            durationTest,
            sizeTest,
        ];

        const nameColored = args
            .map((e, i) => {
                if (!testArray[i]) return e.underline.red;
                else return e;
            })
            .join("_");

        const isBad = testArray.some((e) => !e);

        if (isBad)
            return (
                "WARNING: bad naming ".yellow + nameColored + "  skipping".red
            );
        else return false;
    },

    mkdir(path: string) {
        return mkdir(path, { recursive: true });
    },
};

app.run();
