export function buildScreenRegistry(nodes, timelineConfig) {
  return {
    steps: {
      stepName: "steps",
      node: nodes.stepsScreen,
      elements: [nodes.stepsTitle, ...nodes.stepsCards, nodes.stepsNote, nodes.stepsButton],
      reveal: timelineConfig.stepsScreen,
      animations: [
        {node: nodes.stepsTitle, config: timelineConfig.stepsTitle},
        {node: nodes.stepsCards, config: timelineConfig.stepsCards},
        {node: nodes.stepsNote, config: timelineConfig.stepsNote},
        {node: nodes.stepsButton, config: timelineConfig.stepsButton},
      ],
    },
    styles: {
      stepName: "styles",
      node: nodes.stylesScreen,
      elements: [nodes.stylesTitle, ...nodes.styleCards],
      reveal: timelineConfig.stylesScreen,
      animations: [
        {node: nodes.stylesTitle, config: timelineConfig.stylesTitle},
        {node: nodes.styleCards, config: timelineConfig.styleCards},
      ],
    },
    form: {
      stepName: "capsule",
      node: nodes.formScreen,
      elements: [nodes.formTitle, nodes.formSubtitle, nodes.formAside, nodes.formBody],
      reveal: timelineConfig.formScreen,
      animations: [
        {node: nodes.formTitle, config: timelineConfig.formTitle},
        {node: nodes.formSubtitle, config: timelineConfig.formSubtitle},
        {node: nodes.formAside, config: timelineConfig.formAside},
        {node: nodes.formBody, config: timelineConfig.formBody},
      ],
    },
  };
}
