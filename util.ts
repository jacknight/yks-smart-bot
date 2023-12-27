import { createApi } from 'unsplash-js';
import fetch from 'node-fetch';
import { MessageEmbed } from 'discord.js';
import axios from 'axios';

export const unsplash = createApi({
  accessKey: process.env.UNSPLASH_ACCESS_KEY!,
  fetch,
});

export const shuffle = (array: string[]) => {
  var currentIndex = array.length,
    temporaryValue,
    randomIndex;

  while (0 !== currentIndex) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
};

export const getRealKickstarters = async () => {
  const fs = require('fs');
  const readline = require('readline');
  const { once } = require('events');
  const responses: any = [];
  // Grab from file of real kickstarters
  const rl = readline.createInterface({
    input: fs.createReadStream('assets/kickstarters-prepared-long-prompt-style.jsonl'),
    crlfDelay: Infinity,
  });

  rl.on('error', (err: any) => console.error(err));

  rl.on('line', (line: any) => {
    if (!line) return;

    // Add completion to responses array.
    let temp = { data: { choices: [{ text: JSON.parse(line).completion }] } };
    responses.push(temp);
  });

  await once(rl, 'close');

  return responses;
};

export const sleep = (ms: number) => {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
};

export const sendRequest = async (url: string, method: string, opts: any = {}) => {
  let camelToUnderscore = (key: string) => {
    let result = key.replace(/([A-Z])/g, ' $1');
    return result.split(' ').join('_').toLowerCase();
  };

  const data: any = {};
  for (const key in opts) {
    data[camelToUnderscore(key)] = opts[key];
  }

  return axios({
    url,
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_KEY}`,
      'Content-Type': 'application/json',
    },
    data: Object.keys(data).length ? data : '',
    method,
  });
};

export const getAIResponse = async (name: string, userID: string) => {
  try {
    const response = await exports.sendRequest('https://api.openai.com/v1/completions', 'post', {
      prompt: `**Name**: ${name}`,
      model: 'curie:ft-yks-smart-bot-2021-08-07-18-00-06',
      maxTokens: 350,
      temperature: 0.8,
      topP: 1,
      presencePenalty: 0,
      frequencyPenalty: 0,
      bestOf: 1,
      n: 1,
      stream: false,
      stop: ['###'],
      echo: true,
      user: userID,
    });
    return response;
  } catch (e: any) {
    if (e.response) {
      return `(OpenAI Error) ${e.response.statusText}`;
    }
    console.error(e);
  }
};

export const getKickstarterEmbed = async (
  completion: string,
  realOrFake: boolean,
): Promise<{ embed: MessageEmbed | null; rawImage: string | null }> => {
  const title = completion.match(/\*\*Name\*\*: (.*)/);
  const category = completion.match(/\*\*Category\*\*: (.*)/);
  const status = completion.match(/\*\*Status\*\*: (.*)/);
  const backers = completion.match(/\*\*Backers\*\*: (.*)/);
  const pledged = completion.match(/\*\*Pledged\*\*: (.*)/);
  const goal = completion.match(/\*\*Goal\*\*: (.*)/);
  const author = completion.match(/\*\*Creator\*\*: (.*)/);
  const description = completion.match(/\*\*Description\*\*: (.*)/);
  if (title && category && status && backers && pledged && goal && author && description) {
    const embed = new MessageEmbed()
      .setColor(
        status[1] === 'successful'
          ? 0x83c133
          : status[1] === 'failed' || status[1] === 'canceled'
          ? 0xff0000
          : 0x0000ff,
      )
      .setTitle(title[1])
      .setDescription(description[1])
      .addFields([
        {
          name: 'Creator',
          value: author[1],
          inline: false,
        },
        {
          name: 'Category',
          value: category[1],
          inline: false,
        },
        {
          name: 'Backers',
          value: backers[1],
          inline: true,
        },
        {
          name: 'Pledged',
          value: pledged[1],
          inline: true,
        },
        {
          name: 'Goal',
          value: goal[1],
          inline: true,
        },
        {
          name: 'Status',
          value: status[1],
        },
      ])
      .setFooter({
        text: `Output generated by GPT-3${realOrFake ? ' (maybe)' : ''}`,
      });

    // Generate a product image
    const rawImage = await ksProductImage(title[1], description[1]).catch((e: any) => {
      console.error(e);
      return null;
    });

    return { embed, rawImage };
  } else {
    return { embed: null, rawImage: null };
  }
};

export const undoRateLimit = (client: any, userID: string, commandID: string) => {
  const userCooldown = client.commandHandler.cooldowns.get(userID);
  if (userCooldown) {
    const userCommandCooldown = userCooldown[commandID];
    if (userCommandCooldown) {
      userCommandCooldown.uses--;
      client.commandHandler.cooldowns.get(userID)[commandID] = userCommandCooldown;
    }
  }
};

export const ksProductImage = async (title: string, desc: string): Promise<string | null> => {
  const url = 'https://api.stability.ai/v1/generation/stable-diffusion-v1-6/text-to-image';

  const headers = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    Authorization: `Bearer ${process.env.STABLE_DIFFUSION_API_KEY}`,
  };

  const styles = [
    '3d-model',
    'analog-film',
    'cinematic',
    'digital-art',
    'photographic',
  ];

  const body = {
    steps: 40,
    width: 512,
    height: 512,
    seed: 0,
    cfg_scale: 5,
    samples: 1,
    style_preset: styles[Math.random() * styles.length],
    text_prompts: [
      {
        text: `Clear, Exact, Marketable, Professjonal. A product image for a kickstarter campaign with the title "${title}" and summary "${desc}"`,
        weight: 1,
      },
      {
        text: 'blurry, bad, unclear, approximate, low light, busy',
        weight: -1,
      },
    ],
  };

  const response = await axios.post(url, JSON.stringify(body), {
    headers,
    timeout: 20000,
    signal: AbortSignal.timeout(20000),
  });

  if (response.status < 200 || response.status >= 300) {
    throw new Error(`Non-200 response: ${response.statusText}`);
  }

  const responseJSON = await response.data;

  if (responseJSON.artifacts.length > 0) {
    const image = responseJSON.artifacts[0];
    return image.base64;
  }
  return null;
};
