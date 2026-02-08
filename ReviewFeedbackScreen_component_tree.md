<ReviewScreen>
  <AnswerReadonlyPanel />
  <FeedbackRegion>
    <ThinkingLoader />                      // shown during thinking_loader
    <AckText />                             // ack_only+
    <PrimaryFocusBlock />                   // focus_revealed+
    <Collapsible title="Why this helps">    // full_feedback_ready, if present
      <WhyThisMattersText />
    </Collapsible>
    <Collapsible title="What I noticed">    // full_feedback_ready, if observations exist
      <ObservationsList />
    </Collapsible>
    <PrimaryActionButton />                 // full_feedback_ready
    <SecondaryTextLink />                   // full_feedback_ready (Stop for now)
  </FeedbackRegion>
</ReviewScreen>