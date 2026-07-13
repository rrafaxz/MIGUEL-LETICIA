import { ScrollFrameSequence } from "./ScrollFrameSequence";

export default function InvitationExperiencePage() {
  return (
    <main>
      <ScrollFrameSequence
        frameCount={150}
        framePath="/frames"
        scrollDistance={5200}
      />
    </main>
  );
}
