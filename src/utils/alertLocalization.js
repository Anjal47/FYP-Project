import { translateText } from "./localization";

export function localizeAlertContent(title, message, buttons, language) {
  return {
    title: translateText(title, language),
    message: translateText(message, language),
    buttons: Array.isArray(buttons)
      ? buttons.map((button) => ({
          ...button,
          text: translateText(button?.text, language),
        }))
      : buttons,
  };
}
