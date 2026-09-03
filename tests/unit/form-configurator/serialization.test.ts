import {serializeFormValues} from "../../../src/modules/form-configurator/core/serialization.ts";
import type {FieldConfig} from "../../../src/modules/form-configurator/core/types.ts";

describe("form-configurator serialization", () => {
  it("preserves the persistence object and excludes textarea", () => {
    const sections: FieldConfig[] = [
      {id: "style", type: "cards", title: "Style", render: true, options: []},
      {
        id: "extras", type: "cards", title: "Extras", render: true, multiple: true, options: [],
      },
      {id: "comment", type: "textarea", title: "Comment", render: true},
      {id: "query", type: "text", title: "Query", render: true},
      {id: "dates", type: "calendar", title: "Dates", render: true},
    ];

    expect(serializeFormValues(sections, {
      style: "calm",
      comment: "private",
      dates: {from: "2026-09-03", to: "2026-09-10"},
    })).toEqual({
      style: "calm",
      extras: [],
      query: "",
      dates: {from: "2026-09-03", to: "2026-09-10"},
    });
  });

  it("keeps the legacy empty calendar serialization shape", () => {
    const sections: FieldConfig[] = [
      {id: "dates", type: "calendar", title: "Dates", render: true},
    ];
    expect(serializeFormValues(sections, {dates: null})).toEqual({dates: ""});
  });
});
