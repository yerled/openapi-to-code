export const FormItemString = `<ProFormText
    name="{{name}}"
    label=\{{{desc}}\}
    rules={[{{#if required}}{required: true}{{/if}}, FormItemRules.supportedCharacters, FormItemRules.maxLength10]}
  />`;

export const FormItemNumber = `<ProFormDigit
    name="{{name}}"
    label=\{{{desc}}\}
    rules={[{{#if required}}{required: true}{{/if}}]}
  />`;
