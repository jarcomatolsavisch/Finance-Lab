'use client';

import { useState } from 'react';
import { Input } from 'antd';
import { formatNumberList, parseNumberList } from '../lib/config';

// Free-text "10,30" style input for Price/MA's M and Bollinger's std. Keeps its own
// raw text so the user can type freely (trailing commas, mid-edit states); only commits
// a parsed number array upstream once the text is valid, otherwise reports the error text
// so the caller can gate "套用" without ever writing an invalid value into draftConfig.
//
// Relies on being remounted (fresh `value`) whenever the draft it belongs to is reset from
// outside — e.g. the Drawer uses `destroyOnClose` so reopening re-derives text from the
// freshly-cloned draftConfig, and toggling a chart off/on unmounts/remounts its panel.
const NumberListInput = ({ value, constraints, placeholder, onChange }) => {
  const [text, setText] = useState(() => formatNumberList(value));

  const handleChange = e => {
    const nextText = e.target.value;
    setText(nextText);

    const { values, error } = parseNumberList(nextText, constraints);
    onChange(values, error);
  };

  return <Input value={text} placeholder={placeholder} onChange={handleChange} style={{ width: '100%' }} />;
};

export default NumberListInput;
