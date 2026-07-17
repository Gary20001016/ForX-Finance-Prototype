# Withdrawal Operation Cleanup

## Decision

Remove the `地址类型` and `网络拥堵` facts from the withdrawal-entry operation summary. Do not hide them with CSS and do not move them to another summary surface.

## Retained Information

- Address-family validation remains in the address risk row above the operation summary.
- `预计处理` remains as the only operation estimate.
- Gross debit, network fee, received amount, and remaining daily limit remain unchanged.
- Withdrawal validation, review, MFA, submission, and status behavior remain unchanged.

## Layout

The remaining `预计处理` fact spans the full available width. Removing the two facts must not leave empty grid cells or placeholder copy.

## Verification

- The withdrawal-entry screen does not contain the literal labels `地址类型` or `网络拥堵`.
- It continues to contain `预计处理`, address validation, fee, received amount, and daily limit.
- Existing withdrawal interaction and full prototype regression tests continue to pass.
