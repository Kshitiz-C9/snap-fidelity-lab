import { AbsoluteFill } from "remotion";
import { TransitionSeries, springTiming } from "@remotion/transitions";
import { wipe } from "@remotion/transitions/wipe";
import { fade } from "@remotion/transitions/fade";
import { Background } from "./components/Background";
import { TitleScene } from "./scenes/TitleScene";
import { StepScene } from "./scenes/StepScene";
import { OutroScene } from "./scenes/OutroScene";
import { videoData } from "./data";

export const TITLE_FRAMES = 110;
export const STEP_FRAMES = [140, 130, 150, 130, 150];
export const OUTRO_FRAMES = 100;
export const TRANSITION_FRAMES = 22;

export const TOTAL_FRAMES =
  TITLE_FRAMES +
  STEP_FRAMES.reduce((a, b) => a + b, 0) +
  OUTRO_FRAMES -
  TRANSITION_FRAMES * (STEP_FRAMES.length + 1);

const timing = springTiming({
  config: { damping: 200 },
  durationInFrames: TRANSITION_FRAMES,
});

export const MainVideo: React.FC = () => {
  const { title, summary, steps } = videoData;

  return (
    <AbsoluteFill>
      <Background />
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={TITLE_FRAMES}>
          <TitleScene title={title} summary={summary} />
        </TransitionSeries.Sequence>

        {steps.map((step, i) => (
          <>
            <TransitionSeries.Transition
              key={`t-${i}`}
              presentation={wipe({ direction: i % 2 === 0 ? "from-right" : "from-bottom" })}
              timing={timing}
            />
            <TransitionSeries.Sequence
              key={`s-${i}`}
              durationInFrames={STEP_FRAMES[i] ?? 140}
            >
              <StepScene step={step} index={i} total={steps.length} />
            </TransitionSeries.Sequence>
          </>
        ))}

        <TransitionSeries.Transition presentation={fade()} timing={timing} />
        <TransitionSeries.Sequence durationInFrames={OUTRO_FRAMES}>
          <OutroScene title={title} />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};