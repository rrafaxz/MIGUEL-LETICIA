import { ScrollFrameSequence } from "./ScrollFrameSequence";

export default function InvitationExperiencePage() {
  return (
    <main>
      <ScrollFrameSequence
        frameCount={60}
        framePath="/frames"
        scrollDistance={3000}
      />
    </main>
  );
}
