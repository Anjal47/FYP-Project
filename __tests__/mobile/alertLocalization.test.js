jest.mock("../../src/utils/localization", () => ({
  translateText: jest.fn((value, language) => `${language}:${String(value)}`),
}));

import { translateText } from "../../src/utils/localization";
import { localizeAlertContent } from "../../src/utils/alertLocalization";

describe("localizeAlertContent", () => {
  it("localizes alert title, message, and button labels", () => {
    const result = localizeAlertContent(
      "Warning",
      "Are you sure?",
      [{ text: "OK" }, { text: "Cancel", style: "cancel" }],
      "Nepali"
    );

    expect(translateText).toHaveBeenCalledWith("Warning", "Nepali");
    expect(translateText).toHaveBeenCalledWith("Are you sure?", "Nepali");
    expect(translateText).toHaveBeenCalledWith("OK", "Nepali");
    expect(translateText).toHaveBeenCalledWith("Cancel", "Nepali");
    expect(result).toEqual({
      title: "Nepali:Warning",
      message: "Nepali:Are you sure?",
      buttons: [
        { text: "Nepali:OK" },
        { text: "Nepali:Cancel", style: "cancel" },
      ],
    });
  });

  it("passes through non-array button values", () => {
    const result = localizeAlertContent("Title", "Body", undefined, "English");

    expect(result).toEqual({
      title: "English:Title",
      message: "English:Body",
      buttons: undefined,
    });
  });
});
