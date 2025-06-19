TITLE: Defining Video Composition in Remotion Root File (TSX)
DESCRIPTION: This code defines the main `Root` component in a Remotion project, typically `src/Root.tsx`. It uses the `<Composition>` component to specify a video to be rendered, linking it to a React component (`MyComp`), setting its unique `id`, `durationInFrames`, `width`, `height`, and `fps`. The `defaultProps` object allows passing initial properties to the component.
SOURCE: https://github.com/remotion-dev/remotion/blob/main/packages/docs/static/llms.txt#_snippet_1

LANGUAGE: TSX
CODE:
```
import {Composition} from 'remotion';
import {MyComp} from './MyComp';

export const Root: React.FC = () => {
	return (
		<>
			<Composition
				id="MyComp"
				component={MyComp}
				durationInFrames={120}
				width={1920}
				height={1080}
				fps={30}
				defaultProps={{}}
			/>
		</>
	);
};
```

----------------------------------------

TITLE: Normalizing Audio Levels with FFmpeg and Bun (TypeScript)
DESCRIPTION: This TypeScript script uses Bun and FFmpeg to analyze and normalize audio levels across a set of webcam recordings. It calculates the average input loudness (integrated loudness) of all specified files and then re-encodes each file to match that average, ensuring consistent audio levels. This is a destructive operation that overwrites original files.
SOURCE: https://github.com/remotion-dev/remotion/blob/main/packages/docs/docs/recorder/editing/normalizing-audio.mdx#_snippet_0

LANGUAGE: TypeScript
CODE:
```
import { $ } from "bun";
import { renameSync } from "fs";
import { WEBCAM_PREFIX } from "./config/cameras";

type FfmpegVolumeOutput = {
  input_i: string;
  input_tp: string;
  input_lra: string;
  input_thresh: string;
  output_i: string;
  output_tp: string;
  output_lra: string;
  output_thresh: string;
  normalization_type: string;
  target_offset: string;
};

// Set your composition ID here
const id = "euro";

const files = await $`ls public/${id}`.quiet();
const webcamFiles = files.stdout
  .toString("utf8")
  .split("\n")
  .filter((f) => f.startsWith(WEBCAM_PREFIX));

const decibelValues: number[] = [];

for (const file of webcamFiles) {
  const path = `public/${id}/${file}`;
  const cmd =
    await $`ffmpeg -hide_banner -i ${path} -af loudnorm=I=-23:LRA=7:print_format=json -f null -`.quiet();
  const output = cmd.stderr.toString("utf8");
  const lines = output.split("\n");
  const indexOfLineBeforeStart = lines.findIndex((line) =>
    line.includes("[Parsed_loudnorm_0 @"),
  );
  const remaining = lines.slice(indexOfLineBeforeStart + 1);
  const indexOfOut = remaining.findIndex((i) => i.startsWith("[out#0"));
  const actual = indexOfOut === -1 ? remaining : remaining.slice(0, indexOfOut);
  const json = JSON.parse(actual.join("\n")) as FfmpegVolumeOutput;
  console.log(path, `${json.input_i}dB`);
  decibelValues.push(parseFloat(json.input_i));
}

const average = decibelValues.reduce((a, b) => a + b, 0) / decibelValues.length;
console.log("Average", `${average}dB`);
const toApply = Math.max(average, -20);
console.log("Applying", `${toApply}dB`);

for (const file of webcamFiles) {
  const path = `public/${id}/${file}`;
  const copiedPath = `public/${id}/normalized-${file}`;
  await $`ffmpeg -hide_banner -i ${path} -af loudnorm=I=${toApply}:LRA=7:TP=-2.0 -c:v copy ${copiedPath} -y`;
  renameSync(copiedPath, path);
}
```

----------------------------------------

TITLE: Rendering Multiple Videos from Dataset (TypeScript)
DESCRIPTION: This snippet demonstrates how to iterate over a dataset, select a Remotion composition for each entry, and render a video. It uses `selectComposition` to fetch composition metadata and `renderMedia` to output the video, passing data as `inputProps`.
SOURCE: https://github.com/remotion-dev/remotion/blob/main/packages/docs/docs/dataset-render.mdx#_snippet_8

LANGUAGE: TypeScript
CODE:
```
// @filename: dataset.ts
export const data = [
  {
    name: 'React',
    repo: 'facebook/react',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/a/a7/React-icon.svg'
  },
  {
    name: 'Remotion',
    repo: 'remotion-dev/remotion',
    logo: 'https://github.com/remotion-dev/logo/raw/main/withouttitle/element-0.png'
  }
];

// @filename: render.ts
const compositionId = 'MyComp';
const bundleLocation = 'xxx';
// ---cut---
import {renderMedia, selectComposition} from '@remotion/renderer';
import {data} from './dataset';

for (const entry of data) {
  const composition = await selectComposition({
    serveUrl: bundleLocation,
    id: compositionId,
    inputProps: entry
  });

  await renderMedia({
    composition,
    serveUrl: bundleLocation,
    codec: 'h264',
    outputLocation: `out/${entry.name}.mp4`,
    inputProps: entry
  });
}
```

----------------------------------------

TITLE: Interpolating Spring Value for X-axis Animation (Remotion, TypeScript)
DESCRIPTION: This snippet demonstrates how to use the `interpolate()` function to map the output of a `spring` animation (which goes from 0 to 1) to a desired range, in this case, 0 to 200 pixels for `marginLeft`. This allows for smooth, spring-driven movement of an element.
SOURCE: https://github.com/remotion-dev/remotion/blob/main/packages/docs/docs/interpolate.mdx#_snippet_3

LANGUAGE: ts
CODE:
```
import {useCurrentFrame, interpolate, spring, useVideoConfig} from 'remotion';

const frame = useCurrentFrame();
const {fps} = useVideoConfig();
const driver = spring({
  frame,
  fps
});
const marginLeft = interpolate(driver, [0, 1], [0, 200]);
```

----------------------------------------

TITLE: Configuring Remotion Lambda appRouterWebhook in Next.js App Router (TypeScript)
DESCRIPTION: This TypeScript code snippet demonstrates how to configure the `appRouterWebhook` function from `@remotion/lambda/client` within a Next.js App Router `route.ts` file. It exports a `POST` handler that sets up a webhook endpoint, specifying a secret, enabling testing, adding custom headers, and defining callback functions for success, error, and timeout events. This setup allows the endpoint `mydomain.com/api` to listen for Remotion Lambda webhook events.
SOURCE: https://github.com/remotion-dev/remotion/blob/main/packages/docs/docs/lambda/approuterwebhook.mdx#_snippet_0

LANGUAGE: tsx
CODE:
```
import {appRouterWebhook} from '@remotion/lambda/client';

export const POST = appRouterWebhook({
  secret: 'mysecret',
  testing: true,
  extraHeaders: {
    region: 'south-asia',
  },
  onSuccess: () => console.log('Rendering Completed Successfully'),
  onError: () => console.log('Something went wrong while rendering'),
  onTimeout: () => console.log('Timeout occured while rendering'),
});

export const OPTIONS = POST;
```

----------------------------------------

TITLE: Rendering a Video or Audio with Remotion CLI
DESCRIPTION: This command initiates the rendering process for a Remotion video or audio. It requires an optional entry point or serve URL, a composition ID, and an output location. If the composition ID or output location are omitted, Remotion will prompt for selection or use a default 'out' folder respectively.
SOURCE: https://github.com/remotion-dev/remotion/blob/main/packages/docs/docs/cli/render.mdx#_snippet_0

LANGUAGE: bash
CODE:
```
npx remotion render <entry-point|serve-url>? <composition-id> <output-location>
```

----------------------------------------

TITLE: Registering a Basic Composition in Remotion
DESCRIPTION: This snippet demonstrates the fundamental usage of the `<Composition>` component to register a video. It defines a placeholder component and then uses `<Composition>` to specify its rendering properties like duration, dimensions, FPS, and a unique ID, making it available for rendering in Remotion.
SOURCE: https://github.com/remotion-dev/remotion/blob/main/packages/docs/docs/composition.mdx#_snippet_0

LANGUAGE: tsx
CODE:
```
const Component: React.FC = () => null;

import { Composition } from "remotion";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        component={Component}
        durationInFrames={300}
        width={1080}
        height={1080}
        fps={30}
        id="test-render"
        defaultProps={{}}
      />
      {/* Additional compositions can be rendered */}
    </>
  );
};
```

----------------------------------------

TITLE: Converting OpenAI Whisper API Output to Remotion Captions (TypeScript)
DESCRIPTION: This snippet demonstrates how to use `openAiWhisperApiToCaptions` to convert a verbose JSON transcription from OpenAI's Whisper API into an array of Remotion `Caption` objects. It shows the setup of the OpenAI client, reading an audio file, performing the transcription with `verbose_json` and `timestamp_granularities: ['word']`, and then processing the result to get captions. It requires the `fs`, `openai`, and `@remotion/openai-whisper` packages.
SOURCE: https://github.com/remotion-dev/remotion/blob/main/packages/docs/docs/openai-whisper/openai-whisper-api-to-captions.mdx#_snippet_0

LANGUAGE: TypeScript
CODE:
```
import fs from 'fs';
import {OpenAI} from 'openai';
import {openAiWhisperApiToCaptions} from '@remotion/openai-whisper';

const openai = new OpenAI();

const transcription = await openai.audio.transcriptions.create({
  file: fs.createReadStream('audio.mp3'),
  model: 'whisper-1',
  response_format: 'verbose_json',
  prompt: 'Hello, welcome to my lecture.',
  timestamp_granularities: ['word'],
});

const {captions} = openAiWhisperApiToCaptions({transcription});
```

----------------------------------------

TITLE: Full Remotion Video Rendering Script (TypeScript)
DESCRIPTION: This comprehensive script bundles the Remotion entry point, then iterates through a dataset to select a composition and render a video for each entry. It includes a `webpackOverride` placeholder and demonstrates the full workflow from bundling to rendering.
SOURCE: https://github.com/remotion-dev/remotion/blob/main/packages/docs/docs/dataset-render.mdx#_snippet_9

LANGUAGE: TypeScript
CODE:
```
// @filename: dataset.ts
export const data = [
  {
    name: 'React',
    repo: 'facebook/react',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/a/a7/React-icon.svg'
  },
  {
    name: 'Remotion',
    repo: 'remotion-dev/remotion',
    logo: 'https://github.com/remotion-dev/logo/raw/main/withouttitle/element-0.png'
  }
];

// @filename: webpack-override.ts
import type {WebpackOverrideFn} from '@remotion/bundler';
export const webpackOverride: WebpackOverrideFn = (f) => f;

// @filename: render.ts
// ---cut---
import {selectComposition, renderMedia} from '@remotion/renderer';
import {webpackOverride} from './webpack-override';
import {bundle} from '@remotion/bundler';
import {data} from './dataset';

const compositionId = 'MyComp';

const bundleLocation = await bundle({
  entryPoint: './src/index.ts',
  // If you have a webpack override in remotion.config.ts, pass it here as well.
  webpackOverride: webpackOverride
});

for (const entry of data) {
  const composition = await selectComposition({
    serveUrl: bundleLocation,
    id: compositionId,
    inputProps: entry
  });

  await renderMedia({
    composition,
    serveUrl: bundleLocation,
    codec: 'h264',
    outputLocation: `out/${entry.name}.mp4`,
    inputProps: entry
  });
}
```

----------------------------------------

TITLE: Rendering Remotion Video - Console
DESCRIPTION: This command uses 'npx' to execute the Remotion CLI and render the video composition. It compiles the Remotion project into a final video file, typically in a specified output format.
SOURCE: https://github.com/remotion-dev/remotion/blob/main/packages/template-blank/README.md#_snippet_2

LANGUAGE: console
CODE:
```
npx remotion render
```

----------------------------------------

TITLE: Generating Presigned S3 Upload URL in Next.js API Route (TypeScript)
DESCRIPTION: This Next.js API route (`api/upload/route.ts`) handles `POST` requests to generate a presigned URL for uploading files to AWS S3. It validates input parameters like file size and content type, uses `@remotion/lambda/client` to get an S3 client, and creates a `PutObjectCommand` to obtain a temporary URL for direct S3 upload. Environment variables `REMOTION_AWS_BUCKET_NAME` and `REMOTION_AWS_REGION` are required.
SOURCE: https://github.com/remotion-dev/remotion/blob/main/packages/docs/docs/presigned-urls.mdx#_snippet_4

LANGUAGE: tsx
CODE:
```
import {NextResponse} from 'next/server';
import {getSignedUrl} from '@aws-sdk/s3-request-presigner';
import {AwsRegion, getAwsClient} from '@remotion/lambda/client';

const generatePresignedUrl = async ({contentType, contentLength, expiresIn, bucketName, region}: {contentType: string; contentLength: number; expiresIn: number; bucketName: string; region: AwsRegion}): Promise<{presignedUrl: string; readUrl: string}> => {
  if (contentLength > 1024 * 1024 * 200) {
    throw new Error(`File may not be over 200MB. Yours is ${contentLength} bytes.`);
  }

  const {client, sdk} = getAwsClient({
    region: process.env.REMOTION_AWS_REGION as AwsRegion,
    service: 's3',
  });

  const key = crypto.randomUUID();

  const command = new sdk.PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    ACL: 'public-read',
    ContentLength: contentLength,
    ContentType: contentType,
  });

  const presignedUrl = await getSignedUrl(client, command, {
    expiresIn,
  });

  // The location of the asset after the upload
  const readUrl = `https://${bucketName}.s3.${region}.amazonaws.com/${key}`;

  return {presignedUrl, readUrl};
};

export const POST = async (request: Request) => {
  if (!process.env.REMOTION_AWS_BUCKET_NAME) {
    throw new Error('REMOTION_AWS_BUCKET_NAME is not set');
  }

  if (!process.env.REMOTION_AWS_REGION) {
    throw new Error('REMOTION_AWS_REGION is not set');
  }

  const json = await request.json();
  if (!Number.isFinite(json.size)) {
    throw new Error('size is not a number');
  }
  if (typeof json.contentType !== 'string') {
    throw new Error('contentType is not a string');
  }

  const {presignedUrl, readUrl} = await generatePresignedUrl({
    contentType: json.contentType,
    contentLength: json.size,
    expiresIn: 60 * 60 * 24 * 7,
    bucketName: process.env.REMOTION_AWS_BUCKET_NAME as string,
    region: process.env.REMOTION_AWS_REGION as AwsRegion,
  });

  return NextResponse.json({presignedUrl, readUrl});
};
```

----------------------------------------

TITLE: Avoiding Player Re-renders - Better Pattern - TypeScript
DESCRIPTION: This code illustrates a more performant approach to handling Remotion Player updates. By separating the Player rendering into a `PlayerOnly` component and the controls/UI into a `ControlsOnly` component, and passing a ref to the Player, only the `ControlsOnly` component re-renders on `timeupdate`. This significantly reduces unnecessary re-renders of the Player, improving performance.
SOURCE: https://github.com/remotion-dev/remotion/blob/main/packages/docs/docs/player/best-practices.mdx#_snippet_1

LANGUAGE: TypeScript
CODE:
```
// @allowUmdGlobalAccess
// @filename: ./remotion/MyVideo.tsx
export const MyVideo = () => <></>;

// @filename: index.tsx
const otherProps = {
  durationInFrames: 120,
  compositionWidth: 1920,
  compositionHeight: 1080,
  fps: 30,
} as const;
import {Player, PlayerRef} from '@remotion/player';
import {useEffect, useRef, useState} from 'react';
import {MyVideo} from './remotion/MyVideo';

// ---cut---
const PlayerOnly: React.FC<{
  playerRef: React.RefObject<PlayerRef | null>;
}> = ({playerRef}) => {
  return <Player ref={playerRef} component={MyVideo} {...otherProps} />;
};

const ControlsOnly: React.FC<{
  playerRef: React.RefObject<PlayerRef | null>;
}> = ({playerRef}) => {
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    playerRef.current?.addEventListener('timeupdate', (e) => {
      setCurrentTime(e.detail.frame);
    });
  }, []);

  return <div>Current time: {currentTime}</div>;
};

export const App: React.FC = () => {
  const playerRef = useRef<PlayerRef>(null);

  return (
    <>
      <PlayerOnly playerRef={playerRef} />
      <ControlsOnly playerRef={playerRef} />
    </>
  );
};
```

----------------------------------------

TITLE: Defining a Remotion Composition in React/TypeScript
DESCRIPTION: This snippet defines a React functional component that renders a Remotion 'Composition'. It configures essential video properties like ID, component to render, dimensions (width, height), frames per second (fps), and total duration in frames. It also demonstrates how to link a schema ('schemaTestSchema') and provide 'defaultProps' for the composition, including a string and a Date object.
SOURCE: https://github.com/remotion-dev/remotion/blob/main/packages/studio-server/src/test/snapshots/fixed.txt#_snippet_0

LANGUAGE: TypeScript
CODE:
```
export const Index: React.FC = () => {
	return (
		<>
			<Composition
				id="schema-test"
				component={SchemaTest}
				width={1200}
				height={630}
				fps={30}
				durationInFrames={150}
				schema={schemaTestSchema}
				defaultProps={{abc: 'def', newDate: new Date('2022-01-02')}}
			/>
		</>
	);
};
```

----------------------------------------

TITLE: Calculating Opacity for Fade-in Effect (Remotion, TypeScript)
DESCRIPTION: This snippet demonstrates how to use `interpolate()` to create a simple fade-in effect. It calculates the opacity of an element based on the current frame, transitioning from 0 at frame 0 to 1 at frame 20. It requires `interpolate` and `useCurrentFrame` from 'remotion'.
SOURCE: https://github.com/remotion-dev/remotion/blob/main/packages/docs/docs/interpolate.mdx#_snippet_0

LANGUAGE: ts
CODE:
```
import { interpolate, useCurrentFrame } from "remotion";

const frame = useCurrentFrame();
const opacity = interpolate(frame, [0, 20], [0, 1]);
```

----------------------------------------

TITLE: Using Remotion's Easing API with `interpolate()`
DESCRIPTION: This TypeScript snippet demonstrates how to use Remotion's `interpolate()` function in conjunction with the `Easing` API. It applies a custom Bezier easing curve to an animation based on the current frame, clamping the extrapolation behavior to ensure values stay within the defined range.
SOURCE: https://github.com/remotion-dev/remotion/blob/main/packages/docs/blog/2021-02-15-remotion-1-3.mdx#_snippet_3

LANGUAGE: TypeScript
CODE:
```
import { Easing, interpolate } from "remotion";

interpolate(frame, [0, 100], {
  easing: Easing.bezier(0.8, 0.22, 0.96, 0.65),
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp"
});
```

----------------------------------------

TITLE: Installing Remotion Player with npm
DESCRIPTION: This command installs the `@remotion/player` package into your React project using npm, making the Remotion Player components available for use.
SOURCE: https://github.com/remotion-dev/remotion/blob/main/packages/docs/docs/player/installation.mdx#_snippet_0

LANGUAGE: shell
CODE:
```
npm install @remotion/player
```

----------------------------------------

TITLE: Using useCurrentFrame in Remotion (TSX)
DESCRIPTION: This snippet demonstrates how to import and use the `useCurrentFrame` hook from Remotion within a TSX component. It shows a basic usage to retrieve the current frame number, which is essential for animations and time-based logic in Remotion compositions. The `twoslash` annotation indicates that the code is type-checked.
SOURCE: https://github.com/remotion-dev/remotion/blob/main/packages/docs/new-docs/new-doc.mdx#_snippet_0

LANGUAGE: tsx
CODE:
```
import {useCurrentFrame} from 'remotion';

const frame = useCurrentFrame();
```

----------------------------------------

TITLE: Registering a Remotion Composition in Root File (TypeScript)
DESCRIPTION: This `Root` component registers a Remotion composition using the `<Composition>` component. It links the `VideosInSequence` component and its `calculateMetadata` function, sets default video sources (including remote and local files), and defines the composition's dimensions and unique ID for rendering.
SOURCE: https://github.com/remotion-dev/remotion/blob/main/packages/docs/docs/videos/sequence.mdx#_snippet_2

LANGUAGE: tsx
CODE:
```
import React from 'react';
import {Composition, staticFile} from 'remotion';
import {VideosInSequence, calculateMetadata} from './VideosInSequence';

export const Root: React.FC = () => {
  return (
    <Composition
      id="VideosInSequence"
      component={VideosInSequence}
      width={1920}
      height={1080}
      defaultProps={{
        videos: [
          {
            durationInFrames: null,
            src: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
          },
          {
            durationInFrames: null,
            src: staticFile('localvideo.mp4'),
          },
        ],
      }}
      calculateMetadata={calculateMetadata}
    />
  );
};
```

----------------------------------------

TITLE: Defining Styles for AbsoluteFill (TypeScript)
DESCRIPTION: This snippet defines the core CSS properties that the `<AbsoluteFill>` component applies. It sets the element to `position: 'absolute'` and spans it across the entire width and height of its parent, using `top`, `left`, `right`, `bottom`, `width`, and `height` properties. It also configures `display: 'flex'` with `flexDirection: 'column'` for internal layout.
SOURCE: https://github.com/remotion-dev/remotion/blob/main/packages/docs/docs/absolute-fill.mdx#_snippet_0

LANGUAGE: TypeScript
CODE:
```
const style: React.CSSProperties = {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  width: '100%',
  height: '100%',
  display: 'flex',
  flexDirection: 'column'
};
```

----------------------------------------

TITLE: Accessing Absolute Timeline Frame within a Sequence in Remotion (TypeScript)
DESCRIPTION: This example illustrates how to pass the absolute timeline frame into a component nested within a <Sequence />. By retrieving useCurrentFrame() at the top-level component and passing it as a prop, you can access the global timeline frame even when useCurrentFrame() inside the sequence returns a relative frame. This is useful for scenarios requiring the global time context.
SOURCE: https://github.com/remotion-dev/remotion/blob/main/packages/docs/docs/use-current-frame.mdx#_snippet_1

LANGUAGE: TypeScript
CODE:
```
import { Sequence, useCurrentFrame } from "remotion";

// ---cut---

const Subtitle: React.FC<{ absoluteFrame: number }> = ({ absoluteFrame }) => {
  console.log(useCurrentFrame()); // 15
  console.log(absoluteFrame); // 25

  return null;
};

const MyVideo = () => {
  const frame = useCurrentFrame(); // 25

  return (
    <Sequence from={10}>
      <Subtitle absoluteFrame={frame} />
    </Sequence>
  );
};
```

----------------------------------------

TITLE: Registering a Remotion Composition in Root.tsx
DESCRIPTION: This snippet demonstrates how to register a renderable video composition in Remotion's `src/Root.tsx` file using the `<Composition>` component. It defines key video metadata including `id`, `durationInFrames`, `fps`, `width`, and `height`, and links it to a specific React component (`MyComposition`) for rendering.
SOURCE: https://github.com/remotion-dev/remotion/blob/main/packages/docs/docs/the-fundamentals.mdx#_snippet_2

LANGUAGE: tsx
CODE:
```
import {Composition} from 'remotion';
// @include: example-MyComposition
// ---cut---

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="MyComposition"
      durationInFrames={150}
      fps={30}
      width={1920}
      height={1080}
      component={MyComposition}
    />
  );
};
```

----------------------------------------

TITLE: Playing Video Segments at Different Speeds in Remotion (TSX)
DESCRIPTION: This snippet demonstrates how to play different segments of a video at varying speeds using Remotion's OffthreadVideo and Sequence components. It includes an accumulateSegments utility function to pre-calculate the start time, end time, and video playback time for each segment based on its duration and desired speed. The SpeedSegments component then uses useCurrentFrame to determine the current segment and renders the video with the appropriate startFrom and playbackRate.
SOURCE: https://github.com/remotion-dev/remotion/blob/main/packages/docs/docs/miscellaneous/snippets/different-segments-at-different-speeds.mdx#_snippet_0

LANGUAGE: TSX
CODE:
```
import {OffthreadVideo, Sequence, staticFile, useCurrentFrame} from 'remotion';

const segments = [
  {
    duration: 100,
    speed: 0.5,
  },
  {
    duration: 100,
    speed: 1,
  },
  {
    duration: 200,
    speed: 2,
  },
  {
    duration: 400,
    speed: 4,
  },
];

type AccumulatedSegment = {
  start: number;
  passedVideoTime: number;
  end: number;
  speed: number;
};

export const accumulateSegments = () => {
  const accumulatedSegments: AccumulatedSegment[] = [];
  let accumulatedDuration = 0;
  let accumulatedPassedVideoTime = 0;

  for (const segment of segments) {
    const duration = segment.duration / segment.speed;
    accumulatedSegments.push({
      end: accumulatedDuration + duration,
      speed: segment.speed,
      start: accumulatedDuration,
      passedVideoTime: accumulatedPassedVideoTime,
    });

    accumulatedPassedVideoTime += segment.duration;
    accumulatedDuration += duration;
  }

  return accumulatedSegments;
};

export const SpeedSegments = () => {
  const frame = useCurrentFrame();
  const accumulated = accumulateSegments();

  const currentSegment = accumulated.find(
    (segment) => frame > segment.start && frame <= segment.end,
  );

  if (!currentSegment) {
    return;
  }

  return (
    <Sequence from={currentSegment.start}>
      <OffthreadVideo
        pauseWhenBuffering
        startFrom={currentSegment.passedVideoTime}
        // Remotion will automatically add a time fragment to the end of the video URL
        // based on `startFrom`. Opt out of this by adding one yourself.
        // https://www.remotion.dev/docs/media-fragments
        src={`${staticFile('bigbuckbunny.mp4')}#t=0,`}
        playbackRate={currentSegment.speed}
      />
    </Sequence>
  );
};
```

----------------------------------------

TITLE: Implementing Optimistic Video Updates with Remotion Player in TypeScript
DESCRIPTION: This RemotionPlayer component implements optimistic updates for video uploads, providing immediate visual feedback to the user. Upon file selection, it first creates a local blobUrl using URL.createObjectURL to instantly display the video. Concurrently, the file is uploaded to the cloud via the upload function. Once the cloud URL is obtained, the component updates its state to use the remote URL, and the blobUrl is revoked to free memory. The Player component dynamically renders the video using the current videoState.url.
SOURCE: https://github.com/remotion-dev/remotion/blob/main/packages/docs/docs/video-uploads.mdx#_snippet_2

LANGUAGE: tsx
CODE:
```
const MyComposition: React.FC<{videoUrl: string}> = ({videoUrl}) => {
  return null;
};

const upload = async (file: File) => {
  return 'https://example.com';
};
import {Player} from '@remotion/player';
import {useCallback, useState} from 'react';

type VideoState =
  | {
      type: 'empty';
    }
  | {
      type: 'blob' | 'cloud';
      url: string;
    };

export const RemotionPlayer: React.FC = () => {
  const [videoState, setVideoState] = useState<VideoState>({
    type: 'empty',
  });

  const handleChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files === null) {
      return;
    }

    const file = event.target.files[0];
    const blobUrl = URL.createObjectURL(file);
    setVideoState({type: 'blob', url: blobUrl});
    const cloudUrl = await upload(file);
    setVideoState({type: 'cloud', url: cloudUrl});
    URL.revokeObjectURL(blobUrl);
  }, []);

  return (
    <div>
      {videoState.type !== 'empty' ? <Player component={MyComposition} durationInFrames={120} compositionWidth={1920} compositionHeight={1080} fps={30} inputProps={{videoUrl: videoState.url}} /> : null}
      <input type="file" onChange={handleChange} />
    </div>
  );
};
```

----------------------------------------

TITLE: Scaffolding a new Remotion project with npm
DESCRIPTION: This command uses `npx` to execute the `create-video` package, scaffolding a new Remotion project using npm as the package manager. It initializes the project structure and installs necessary dependencies.
SOURCE: https://github.com/remotion-dev/remotion/blob/main/packages/docs/docs/getting-started.mdx#_snippet_0

LANGUAGE: bash
CODE:
```
npx create-video@latest
```

----------------------------------------

TITLE: Initializing a Remotion Project with npm
DESCRIPTION: This command initializes a new Remotion video project using npm, selecting the blank template for a clean start. It's the first step to set up the development environment.
SOURCE: https://github.com/remotion-dev/remotion/blob/main/packages/docs/learn/2022-12-22-apple-wow.mdx#_snippet_0

LANGUAGE: bash
CODE:
```
npm init video --blank
```

----------------------------------------

TITLE: Integrating Remotion Timeline Components in React (TSX)
DESCRIPTION: This snippet demonstrates the recommended structure for integrating Remotion timeline components into a React application. It showcases the use of `TimelineProvider` for global state management, `TimelineZoomProvider` for zoom functionality, and `TimelineSizeProvider` for responsive sizing, all wrapped within a `TimelineContainer` to ensure proper layout and interaction with a `VideoPreview` and `ActionRow`.
SOURCE: https://github.com/remotion-dev/remotion/blob/main/packages/docs/docs/timeline/usage.mdx#_snippet_0

LANGUAGE: tsx
CODE:
```
import type {PlayerRef} from '@remotion/player';
import {Timeline, TimelineContainer} from './timeline/remotion-timeline/components/timeline';
import {TimelineProvider} from './timeline/remotion-timeline/context/provider';
import {TimelineSizeProvider} from './timeline/remotion-timeline/context/timeline-size-provider';
import {TimelineZoomProvider} from './timeline/remotion-timeline/context/timeline-zoom-provider';
import {PreviewContainer} from './layout';

export const App = () => {
  const playerRef = useRef<PlayerRef>(null);
  const timelineContainerRef = useRef<HTMLDivElement>(null);
  const timelineContainerSize = useElementSize(timelineContainerRef);
  const timelineContainerWidth = timelineContainerSize?.width;

  return (
    <TimelineProvider
      onChange={(newState) => {
        console.log('New timeline state:', newState);
      }}
      initialState={initialState}
    >
      <TimelineZoomProvider initialZoom={1}>
        <PreviewContainer>
          <VideoPreview loop playerRef={playerRef} />
          <ActionRow playerRef={playerRef} />
        </PreviewContainer>

        <TimelineContainer timelineContainerRef={timelineContainerRef}>
          {timelineContainerWidth ? (
            <TimelineSizeProvider containerWidth={timelineContainerWidth}>
              <Timeline playerRef={playerRef} />
            </TimelineSizeProvider>
          ) : null}
        </TimelineContainer>
      </TimelineZoomProvider>
    </TimelineProvider>
  );
};
```

----------------------------------------

TITLE: Initializing Remotion Player State and Derived Values
DESCRIPTION: This snippet initializes the component's state variables using React's useState hook and derives 'width' from 'useElementSize'. It tracks the element size, playback status ('playing'), current frame ('frame'), and the complex 'dragging' state for the scrubber, along with the calculated 'width'.
SOURCE: https://github.com/remotion-dev/remotion/blob/main/packages/docs/docs/player/custom-controls.mdx#_snippet_9

LANGUAGE: TypeScript
CODE:
```
const size = useElementSize(containerRef);
  const [playing, setPlaying] = useState(false);
  const [frame, setFrame] = useState(0);

  const [dragging, setDragging] = useState<
    | {
        dragging: false;
      }
    | {
        dragging: true;
        wasPlaying: boolean;
      }
  >({
    dragging: false,
  });

  const width = size?.width ?? 0;
```

----------------------------------------

TITLE: Dynamically Setting Composition Duration in Remotion (TSX)
DESCRIPTION: This snippet demonstrates how to dynamically set the `durationInFrames` and `fps` of a Remotion composition using the `calculateMetadata` function. It takes `durationInSeconds` from the component's props and calculates `durationInFrames` based on a fixed `fps`, allowing the composition's length to be controlled by input data.
SOURCE: https://github.com/remotion-dev/remotion/blob/main/packages/docs/docs/data-fetching.mdx#_snippet_5

LANGUAGE: TSX
CODE:
```
import { CalculateMetadataFunction } from "remotion";

type MyCompProps = {
  durationInSeconds: number;
};

export const calculateMyCompMetadata: CalculateMetadataFunction<
  MyCompProps
> = ({ props }) => {
  const fps = 30;
  const durationInSeconds = props.durationInSeconds;

  return {
    durationInFrames: durationInSeconds * fps,
    fps,
  };
};
```

----------------------------------------

TITLE: Accessing Video Configuration with useVideoConfig in Remotion (TSX)
DESCRIPTION: This snippet shows how to use the `useVideoConfig()` hook from 'remotion' to access essential composition properties. It retrieves and displays the frames per second (fps), total duration in frames, height, and width of the video composition.
SOURCE: https://github.com/remotion-dev/remotion/blob/main/packages/docs/static/llms.txt#_snippet_16

LANGUAGE: tsx
CODE:
```
import {useVideoConfig} from 'remotion';

export const MyComp: React.FC = () => {
	const {fps, durationInFrames, height, width} = useVideoConfig();
	return (
		<div>
			fps: {fps}
			durationInFrames: {durationInFrames}
			height: {height}
			width: {width}
		</div>
	);
};
```

----------------------------------------

TITLE: Rendering a Remotion Video with SSR APIs (TypeScript)
DESCRIPTION: This script demonstrates the end-to-end process of rendering a Remotion video using the `@remotion/renderer` and `@remotion/bundler` packages in a Node.js or Bun environment. It covers creating a Remotion bundle, selecting a specific composition by ID, and rendering the media to an output file, showcasing how to pass input properties to customize the video.
SOURCE: https://github.com/remotion-dev/remotion/blob/main/packages/docs/docs/ssr-node.mdx#_snippet_0

LANGUAGE: TypeScript
CODE:
```
import {bundle} from '@remotion/bundler';
import {renderMedia, selectComposition} from '@remotion/renderer';
import path from 'path';

// The composition you want to render
const compositionId = 'HelloWorld';

// You only have to create a bundle once, and you may reuse it
// for multiple renders that you can parametrize using input props.
const bundleLocation = await bundle({
  entryPoint: path.resolve('./src/index.ts'),
  // If you have a webpack override in remotion.config.ts, pass it here as well.
  webpackOverride: (config) => config,
});

// Parametrize the video by passing props to your component.
const inputProps = {
  foo: 'bar',
};

// Get the composition you want to render. Pass `inputProps` if you
// want to customize the duration or other metadata.
const composition = await selectComposition({
  serveUrl: bundleLocation,
  id: compositionId,
  inputProps,
});

// Render the video. Pass the same `inputProps` again
// if your video is parametrized with data.
await renderMedia({
  composition,
  serveUrl: bundleLocation,
  codec: 'h264',
  outputLocation: `out/${compositionId}.mp4`,
  inputProps,
});

console.log('Render done!');
```

----------------------------------------

TITLE: Defining Spring Animations for Scale and Translation in Remotion
DESCRIPTION: This snippet demonstrates how to create two independent spring animations using Remotion's `spring` utility: one for vertical translation (`up`) and another for scaling (`scale`). It also uses `interpolate` to map the `up` spring's output to a `translateY` CSS transformation. These animations are designed to simulate a launch and scaling effect for an SVG element.
SOURCE: https://github.com/remotion-dev/remotion/blob/main/packages/docs/docs/figma.mdx#_snippet_1

LANGUAGE: tsx
CODE:
```
import { interpolate, spring } from "remotion";
const fps = 30;
const frame = 0;
// ---cut---
const up = spring({
  fps,
  frame: frame - 20,
  config: {
    damping: 20,
    mass: 15,
  },
});

const scale = spring({
  fps,
  frame,
  config: {
    stiffness: 200,
  },
});

const launch = `translateY(${interpolate(up, [0, 1], [0, -3000])}px)`;
```

----------------------------------------

TITLE: Updating React and React DOM Packages for React 19
DESCRIPTION: This snippet demonstrates the necessary `package.json` dependency updates for `react` and `react-dom` to align with React 19. It shows how to upgrade from React 18 to React 19, which is a prerequisite for using Remotion v4.0.0 and newer features.
SOURCE: https://github.com/remotion-dev/remotion/blob/main/packages/docs/docs/react-19.mdx#_snippet_0

LANGUAGE: diff
CODE:
```
- "react": "18.3.1"
- "react-dom": "18.3.1"
+ "react": "19.0.0"
+ "react-dom": "19.0.0"
```

----------------------------------------

TITLE: Scaffolding New Remotion Video with Tailwind (npm)
DESCRIPTION: This command uses the Remotion CLI to scaffold a new video project, automatically configuring it with TailwindCSS support. It's the recommended way to start a new project with Tailwind using npm.
SOURCE: https://github.com/remotion-dev/remotion/blob/main/packages/docs/docs/tailwind.mdx#_snippet_0

LANGUAGE: bash
CODE:
```
npx create-video@latest
```

----------------------------------------

TITLE: Defining Schema, Component, and Fetcher in Remotion (TSX)
DESCRIPTION: This snippet demonstrates colocating a Zod schema (`myCompSchema`), a React component (`MyComp`), and a metadata calculation function (`calcMyCompMetadata`) within a single file. The `calcMyCompMetadata` function fetches data based on `props.id` and updates the component's props, while `MyComp` renders the fetched data. It uses Zod for schema validation and `CalculateMetadataFunction` for data fetching.
SOURCE: https://github.com/remotion-dev/remotion/blob/main/packages/docs/docs/data-fetching.mdx#_snippet_3

LANGUAGE: TSX
CODE:
```
import { CalculateMetadataFunction } from "remotion";
import { z } from "zod";

const apiResponse = z.object({ title: z.string(), description: z.string() });

export const myCompSchema = z.object({
  id: z.string(),
  data: z.nullable(apiResponse),
});

type Props = z.infer<typeof myCompSchema>;

export const calcMyCompMetadata: CalculateMetadataFunction<Props> = async ({
  props,
}) => {
  const data = await fetch(`https://example.com/api/${props.id}`);
  const json = await data.json();

  return {
    props: {
      ...props,
      data: json,
    },
  };
};

export const MyComp: React.FC<Props> = ({ data }) => {
  if (data === null) {
    throw new Error("Data was not fetched");
  }

  return <div>{data.title}</div>;
};
```

----------------------------------------

TITLE: Rendering Remotion Video from Command Line
DESCRIPTION: This command initiates the rendering process for a Remotion video composition. It uses `npx` to execute the `remotion` CLI tool, producing the final video output based on your project's configuration.
SOURCE: https://github.com/remotion-dev/remotion/blob/main/packages/template-tts-google/README.md#_snippet_4

LANGUAGE: console
CODE:
```
npx remotion render
```

----------------------------------------

TITLE: Scaffolding a new Remotion project with pnpm
DESCRIPTION: This command uses `pnpm` to create a new Remotion video project. It sets up the project structure and installs dependencies using pnpm as the package manager.
SOURCE: https://github.com/remotion-dev/remotion/blob/main/packages/docs/docs/getting-started.mdx#_snippet_1

LANGUAGE: bash
CODE:
```
pnpm create video
```

----------------------------------------

TITLE: Displaying Static Image in Remotion Component (TypeScript)
DESCRIPTION: This TypeScript React snippet shows how to render an image within a Remotion component by referencing a static file from the `public` directory using `staticFile()` and the `Img` component.
SOURCE: https://github.com/remotion-dev/remotion/blob/main/packages/docs/docs/importing-assets.mdx#_snippet_2

LANGUAGE: tsx
CODE:
```
import { Img, staticFile } from "remotion";

export const MyComp: React.FC = () => {
  return <Img src={staticFile("logo.png")} />;
};
```