import {gsap} from "gsap";

function hideScreen(screenNode) {
  gsap.set(screenNode, {
    opacity: 0,
    visibility: "hidden",
    pointerEvents: "none",
  });
}

export function setupInitialScreenState(screenNodes, initial) {
  const {
    stepsScreen,
    stylesScreen,
    formScreen,
    stepsTitle,
    stepsCards,
    stepsNote,
    stepsButton,
    stepsProgress,
    stylesTitle,
    styleCards,
    formTitle,
    formSubtitle,
    formAside,
    formBody,
  } = screenNodes;

  hideScreen(stepsScreen);
  hideScreen(stylesScreen);
  hideScreen(formScreen);

  gsap.set([stepsTitle, ...stepsCards, stepsNote, stepsButton, ...stepsProgress], {
    autoAlpha: 0,
    y: initial.y,
  });

  gsap.set([stylesTitle, ...styleCards], {
    autoAlpha: 0,
    y: initial.y,
  });

  gsap.set([formTitle, formSubtitle, formAside, formBody], {
    autoAlpha: 0,
    y: initial.y,
  });
}
