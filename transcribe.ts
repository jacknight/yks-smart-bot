import { https } from 'follow-redirects';
import fs from 'fs';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';
// @ts-ignore
import whisper from 'whisper-node';

export const downloadFile = (url: string): Promise<string | null> => {
  return new Promise((resolve, reject) => {
    try {
      const urlObj = new URL(url);
      const fileName = `${__dirname}/${urlObj.pathname.split('/').pop()}`;
      const file = fs.createWriteStream(fileName);
      https.get(urlObj.toString(), (response) => {
        response.pipe(file);

        // after download completed close filestream
        file.on('finish', () => {
          file.close();
          console.info('Download of clip completed');
          return resolve(fileName);
        });
        file.on('error', () => {
          reject();
        });
      });
    } catch (e: any) {
      console.error(`Failed to download clip: ${JSON.stringify(e)}`);
      reject();
    }
  });
};

export const convertTo16KhzWav = (fileName: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!ffmpegStatic) return reject();
    ffmpeg.setFfmpegPath(ffmpegStatic);
    ffmpeg()
      .input(fileName)
      .outputOptions('-acodec', 'pcm_s16le', '-ac', '1', '-ar', '16000')
      .saveToFile(`${fileName}.wav`)
      .on('error', (e: any) => {
        console.error(`Failed to convert [${fileName}] to 16Khz WAV: ${JSON.stringify(e)}`);
        return reject();
      })
      .on('progress', (progress: any) => {
        if (progress.percent) {
          console.info(`Conversion of [${fileName}] at ${progress.percent}%`);
        }
      })
      .on('end', () => {
        console.info(`Successfully converted [${fileName}] to 16Khz WAV at [${fileName}.wav]`);
        return resolve(`${fileName}.wav`);
      });
  });
};

export const transcribeFile = async (fileName: string): Promise<string> => {
  return whisper(fileName, {
    modelPath: `${__dirname}/ggml-base.en.bin`,
    whisperOptions: { word_timestamps: false, gen_file_txt: true },
  });
};

export const transcribeClip = async (url: string): Promise<string | null> => {
  if (!fs.existsSync(`${__dirname}/ggml-base.en.bin`)) {
    try {
      console.info('Downloading');
      await downloadFile(
        `https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base.en.bin`,
      );
    } catch {
      return null;
    }
  }

  console.info(`Starting transcription process of [${url}].`);
  console.info(`Downloading clip from [${url}]`);
  let fileName: string | null = await downloadFile(url);
  if (fileName) {
    console.info(`Successfully downloaded clip, saved to: [${fileName}]`);
    console.info(`Converting [${fileName}] to 16KHz WAV...`);
    try {
      fileName = await convertTo16KhzWav(fileName);
      if (fileName) {
        console.info(`Successfully converted to 16KHz WAV. Attempting to transcribe...`);
        try {
          await transcribeFile(fileName);
          return fs
            .readFileSync(`${fileName}.txt`, 'utf8')
            .replace(/(?:\r\n|\r|\n)/g, ' ')
            .replace(/\s\s+/g, ' ')
            .trim();
        } catch {}
      }
    } catch {}
  } else {
    console.error(`Failed to download and transcribe clip at url [${url}]`);
  }
  return null;
};
