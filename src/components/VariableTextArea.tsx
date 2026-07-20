import { useRef } from "react";
import { Input } from "@arco-design/web-react";
import { insertVariableToken } from "../domain/manualMessageVariables";
import type { ControlledTemplateVariable } from "../domain/types";
import VariablePicker from "./VariablePicker";

type TextAreaHandle = {
  blur: () => void;
  focus: () => void;
  dom: HTMLTextAreaElement;
};

export default function VariableTextArea({
  value,
  onChange,
  variables,
  ariaLabel,
}: {
  value: string;
  onChange: (value: string) => void;
  variables: ControlledTemplateVariable[];
  ariaLabel: string;
}) {
  const ref = useRef<TextAreaHandle | null>(null);

  const insert = (name: string) => {
    const dom = ref.current?.dom;
    const result = insertVariableToken(
      value,
      name,
      dom?.selectionStart ?? value.length,
      dom?.selectionEnd ?? value.length,
    );
    onChange(result.value);
    requestAnimationFrame(() => {
      ref.current?.focus();
      ref.current?.dom.setSelectionRange(result.cursor, result.cursor);
    });
  };

  return (
    <div className="variable-textarea">
      <div className="variable-textarea-toolbar">
        <VariablePicker variables={variables} onInsert={insert} />
      </div>
      <Input.TextArea
        ref={ref}
        aria-label={ariaLabel}
        value={value}
        onChange={onChange}
      />
    </div>
  );
}
