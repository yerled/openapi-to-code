export const PropertyTemplateMap = new Map([
  [
    'string',
    `<ProFormText
      name="title"
      label={'名称'}
      rules={[{ required: true }, FormItemRules.supportedCharacters, FormItemRules.maxLength10]}
    />`,
  ],
  [
    'number',
    `<ProFormDigit
      name="couponAmount"
      label="优惠券金额（单位分）"
      rules={[
        {
          required: true,
        },
      ]}
    />`,
  ],
]);
